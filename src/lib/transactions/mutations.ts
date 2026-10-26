import { caminhosDaTransacao, removerObjetos } from "@/lib/anexos"
import { supabase } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isTransactionsPaymentColumnsUnsupportedError,
    NADA_MUDOU,
} from "@/lib/supabase-errors"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
import { executeMutation } from "@/lib/offline/mutation-gateway"
import { retryStableClientId } from "@/lib/offline/retry-client-id"
import { dispatchFinanceTransactionsMutated } from "@/lib/workspace-data-events"

export type SaveTransactionContext = {
    userId: string
    workspaceId: string
    editingTransactionId?: string | null
}

/**
 * @internal Exportada para o teste. Editar e salvar tira a marca de "a
 * conferir" (Decisão 14); a criação só grava `source` e `needs_review` quando
 * vierem, e sem eles valem os padrões do banco.
 */
export function buildTransactionRow(
    ctx: SaveTransactionContext,
    payload: TransactionFormSavePayload,
) {
    const editing = Boolean(payload.editingId ?? ctx.editingTransactionId)
    return {
        ...(editing
            ? { needs_review: false }
            : {
                  ...(payload.source ? { source: payload.source } : {}),
                  ...(payload.needsReview != null ? { needs_review: payload.needsReview } : {}),
              }),
        user_id: ctx.userId,
        workspace_id: ctx.workspaceId,
        category_id: payload.categoryId,
        type: payload.type,
        amount: payload.amount,
        description: payload.description,
        date: payload.dateIso,
        is_recurring: payload.isRecurring,
        recurring_interval: payload.recurringInterval,
        payment_method: payload.paymentMethod,
        payment_credit_card_id: payload.paymentCreditCardId,
        ...(payload.projectId !== undefined ? { project_id: payload.projectId } : {}),
        ...(payload.paidBy !== undefined ? { paid_by: payload.paidBy } : {}),
    }
}

function stripPaymentColumns<T extends Record<string, unknown>>(row: T) {
    const next = { ...row } as Record<string, unknown>
    delete next.payment_method
    delete next.payment_credit_card_id
    return next
}

async function saveTransactionOnline(
    ctx: SaveTransactionContext,
    payload: TransactionFormSavePayload,
    editingId: string | null,
    row: Record<string, unknown>
): Promise<{ ok: true; insertedId?: string } | { ok: false; errorMessage: string }> {
    if (editingId) {
        let { data, error } = await supabase
            .from("transactions")
            .update(row)
            .eq("id", editingId)
            .select("id")

        if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
            const retry = await supabase
                .from("transactions")
                .update(stripPaymentColumns(row))
                .eq("id", editingId)
                .select("id")
            data = retry.data
            error = retry.error
        }

        if (error) {
            return {
                ok: false,
                errorMessage:
                    formatSupabasePostgrestError(error) ??
                    "Não foi possível atualizar a transação.",
            }
        }
        // A RLS filtra sem erro (a linha de outro, para o convidado): 0 linhas não é salvo.
        if (!data?.length) return { ok: false, errorMessage: NADA_MUDOU }

        return { ok: true }
    }

    let { data: inserted, error } = await supabase
        .from("transactions")
        .upsert(row, { onConflict: "workspace_id,client_id" })
        .select("id")
        .single()

    if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
        const retry = await supabase
            .from("transactions")
            .upsert(stripPaymentColumns(row), { onConflict: "workspace_id,client_id" })
            .select("id")
            .single()
        inserted = retry.data
        error = retry.error
    }

    if (error) {
        return {
            ok: false,
            errorMessage:
                formatSupabasePostgrestError(error) ??
                "Não foi possível criar a transação.",
        }
    }

    return { ok: true, insertedId: inserted?.id ? String(inserted.id) : undefined }
}

/** Na criação online, o `id` do lançamento; editando ou na fila offline, sem `id`. */
export async function saveTransaction(
    ctx: SaveTransactionContext,
    payload: TransactionFormSavePayload
): Promise<{ ok: true; id?: string } | { ok: false; errorMessage: string }> {
    const editingId = payload.editingId ?? ctx.editingTransactionId ?? null
    const baseRow = buildTransactionRow(ctx, payload)
    const { clientId, settle } = retryStableClientId(baseRow)
    const row = editingId ? baseRow : { ...baseRow, client_id: clientId }
    const operation = editingId ? "update" : "insert"
    const offlinePayload = editingId
        ? { ...row, serverId: editingId }
        : { ...row, client_id: clientId }

    const gateway = await executeMutation({
        entity: "transaction",
        operation,
        workspaceId: ctx.workspaceId,
        offlinePayload,
        idempotencyKey: clientId,
        onQueued: () => dispatchFinanceTransactionsMutated(),
        onlineFn: async () => {
            const result = await saveTransactionOnline(ctx, payload, editingId, row)
            if (!result.ok) {
                throw new Error(result.errorMessage)
            }
            return result
        },
    })
    if (gateway.ok) settle()

    if (!gateway.ok) {
        return { ok: false, errorMessage: gateway.errorMessage }
    }
    if ("queued" in gateway && gateway.queued) {
        return { ok: true }
    }
    if ("data" in gateway) {
        return { ok: true, id: gateway.data.insertedId }
    }
    return { ok: false, errorMessage: "Resposta inesperada ao salvar transação." }
}

export async function updateInstallmentPlan(
    planId: string,
    payload: InstallmentPlanUpdatePayload
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    const updateRow: Record<string, unknown> = {
        category_id: payload.categoryId,
        description: payload.description,
        payment_method: payload.paymentMethod,
        payment_credit_card_id: payload.paymentCreditCardId,
        total_installments: payload.totalInstallments,
        installment_amount: payload.installmentAmount,
        final_installment_amount: payload.finalInstallmentAmount,
    }
    if (payload.nextBillingYmd != null) {
        updateRow.next_billing_date = payload.nextBillingYmd
    }

    let { error } = await supabase
        .from("workspace_installment_plans")
        .update(updateRow)
        .eq("id", planId)

    if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
        const retry = await supabase
            .from("workspace_installment_plans")
            .update(stripPaymentColumns(updateRow))
            .eq("id", planId)
        error = retry.error
    }

    if (error) {
        return {
            ok: false,
            errorMessage:
                formatSupabasePostgrestError(error) ??
                "Não foi possível atualizar o plano parcelado.",
        }
    }

    return { ok: true }
}

export async function deleteInstallmentPlanCascade(
    planId: string,
    workspaceId: string
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    const gateway = await executeMutation({
        entity: "transaction",
        operation: "delete",
        workspaceId,
        offlinePayload: { cascadeInstallmentPlanId: planId },
        onQueued: () => dispatchFinanceTransactionsMutated(),
        onlineFn: async () => {
            const { error } = await supabase.rpc(
                "delete_workspace_installment_plan_cascade",
                { p_plan_id: planId }
            )
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível cancelar a compra parcelada."
                )
            }
            dispatchFinanceTransactionsMutated()
            return { ok: true as const }
        },
    })

    if (!gateway.ok) {
        return { ok: false, errorMessage: gateway.errorMessage }
    }
    if ("queued" in gateway && gateway.queued) {
        return { ok: true }
    }
    if ("data" in gateway) {
        return gateway.data
    }
    return {
        ok: false,
        errorMessage: "Resposta inesperada ao cancelar compra parcelada.",
    }
}

export async function deletePlainTransactionById(
    id: string,
    workspaceId: string
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    const gateway = await executeMutation({
        entity: "transaction",
        operation: "delete",
        workspaceId,
        offlinePayload: { serverId: id, id },
        onQueued: () => dispatchFinanceTransactionsMutated(),
        onlineFn: async () => {
            // Os caminhos são lidos antes: as linhas dos anexos saem no cascade.
            const anexos = await caminhosDaTransacao(supabase, id)
            const { data, error } = await supabase.from("transactions").delete().eq("id", id).select("id")
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível excluir a transação."
                )
            }
            if (!data?.length) throw new Error(NADA_MUDOU)
            await removerObjetos(supabase, anexos)
            dispatchFinanceTransactionsMutated()
            return { ok: true as const }
        },
    })

    if (!gateway.ok) {
        return { ok: false, errorMessage: gateway.errorMessage }
    }
    if ("queued" in gateway && gateway.queued) {
        return { ok: true }
    }
    if ("data" in gateway) {
        return gateway.data
    }
    return { ok: false, errorMessage: "Resposta inesperada ao salvar transação." }
}

/** Prefer `deleteTransactionsByIds` for installment-aware batch deletes. */
export async function deleteTransactionById(
    id: string,
    workspaceId: string
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    return deletePlainTransactionById(id, workspaceId)
}
