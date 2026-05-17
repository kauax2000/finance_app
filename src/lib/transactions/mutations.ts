import { supabase } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isTransactionsPaymentColumnsUnsupportedError,
} from "@/lib/supabase-errors"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
import { executeMutation } from "@/lib/offline/mutation-gateway"
import { dispatchFinanceTransactionsMutated } from "@/lib/workspace-data-events"

export type SaveTransactionContext = {
    userId: string
    workspaceId: string
    editingTransactionId?: string | null
}

function buildTransactionRow(
    ctx: SaveTransactionContext,
    payload: TransactionFormSavePayload,
    clientId?: string
) {
    return {
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
        ...(clientId ? { client_id: clientId } : {}),
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
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    if (editingId) {
        let { error } = await supabase
            .from("transactions")
            .update(row)
            .eq("id", editingId)

        if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
            const retry = await supabase
                .from("transactions")
                .update(stripPaymentColumns(row))
                .eq("id", editingId)
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

        return { ok: true }
    }

    let { error } = await supabase.from("transactions").insert(row)

    if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
        const retry = await supabase
            .from("transactions")
            .insert(stripPaymentColumns(row))
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

    return { ok: true }
}

export async function saveTransaction(
    ctx: SaveTransactionContext,
    payload: TransactionFormSavePayload
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    const editingId = payload.editingId ?? ctx.editingTransactionId ?? null
    const clientId = crypto.randomUUID()
    const row = buildTransactionRow(ctx, payload, editingId ? undefined : clientId)
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

export async function deleteTransactionById(
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
            const { error } = await supabase.from("transactions").delete().eq("id", id)
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível excluir a transação."
                )
            }
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
