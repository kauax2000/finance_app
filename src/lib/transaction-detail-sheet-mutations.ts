import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
import { scheduleEvaluateCreditCardAlerts } from "@/lib/credit-card-notifications"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { isOnline } from "@/lib/offline/connectivity"
import {
    deleteInstallmentPlanCascade,
    deletePlainTransactionById,
    saveTransaction,
    updateInstallmentPlan,
} from "@/lib/transactions/mutations"
import {
    partitionTransactionDeletes,
    type TransactionDeleteRow,
} from "@/lib/transactions/delete-transactions"
import type { Transaction } from "@/lib/supabase"
import { toastError, toastSuccess } from "@/lib/toast"
import type { SupabaseClient, User } from "@supabase/supabase-js"

type DbClient = SupabaseClient

export type DeleteTransactionsOptions = {
    rows?: TransactionDeleteRow[]
}

export async function persistTransactionSave(options: {
    supabase: DbClient
    user: User
    workspaceId: string
    payload: TransactionFormSavePayload
    resolveEditingTransaction: (editingId: string) => Transaction | null
    onAfterSuccess: () => Promise<void>
}): Promise<boolean> {
    const {
        supabase,
        user,
        workspaceId,
        payload,
        resolveEditingTransaction,
        onAfterSuccess,
    } = options

    void supabase
    void resolveEditingTransaction

    const editing = payload.editingId
        ? resolveEditingTransaction(payload.editingId)
        : null

    const result = await saveTransaction(
        {
            userId: user.id,
            workspaceId,
            editingTransactionId: payload.editingId,
        },
        payload
    )

    if (!result.ok) {
        toastError(result.errorMessage)
        return false
    }

    const offline = !isOnline()

    if (editing) {
        toastSuccess(
            offline
                ? "Transação atualizada offline. Será sincronizada quando houver conexão."
                : "Transação atualizada."
        )
        if (payload.type === "expense" && isOnline()) {
            scheduleEvaluateCreditCardAlerts({
                workspaceId,
                type: payload.type,
                paymentMethod: payload.paymentMethod,
                paymentCreditCardId: payload.paymentCreditCardId,
                categoryId: payload.categoryId,
                dateIso: payload.dateIso,
            })
        }
    } else {
        if (payload.type === "expense" && isOnline()) {
            void invokeEdgeJson("evaluate-budgets", {
                body: {
                    category_id: payload.categoryId,
                    occurred_at: payload.dateIso,
                },
            }).catch(() => {
                /* non-blocking */
            })
            scheduleEvaluateCreditCardAlerts({
                workspaceId,
                type: payload.type,
                paymentMethod: payload.paymentMethod,
                paymentCreditCardId: payload.paymentCreditCardId,
                categoryId: payload.categoryId,
                dateIso: payload.dateIso,
            })
        }

        toastSuccess(
            offline
                ? "Transação salva offline. Será sincronizada quando houver conexão."
                : "Transação criada."
        )
    }

    await onAfterSuccess()
    return true
}

export async function persistInstallmentPlanUpdate(options: {
    supabase: DbClient
    planId: string
    payload: InstallmentPlanUpdatePayload
    onAfterSuccess: () => Promise<void>
}): Promise<boolean> {
    const { planId, payload, onAfterSuccess } = options

    const result = await updateInstallmentPlan(planId, payload)

    if (!result.ok) {
        toastError(result.errorMessage)
        return false
    }

    toastSuccess("Plano da compra atualizado.")
    await onAfterSuccess()
    return true
}

async function resolveTransactionDeleteRows(
    supabase: DbClient,
    ids: string[],
    workspaceId: string,
    rows?: TransactionDeleteRow[]
): Promise<
    { ok: true; rows: TransactionDeleteRow[] } | { ok: false; errorMessage: string }
> {
    if (rows != null && rows.length > 0) {
        const byId = new Map(rows.map((row) => [row.id, row]))
        return {
            ok: true,
            rows: ids.map((id) => byId.get(id) ?? { id, installment_plan_id: null }),
        }
    }

    const { data, error } = await supabase
        .from("transactions")
        .select("id, installment_plan_id")
        .eq("workspace_id", workspaceId)
        .in("id", ids)

    if (error) {
        return {
            ok: false,
            errorMessage: "Não foi possível carregar as transações para exclusão.",
        }
    }

    const byId = new Map(
        (data ?? []).map((row) => [
            String(row.id),
            {
                id: String(row.id),
                installment_plan_id:
                    row.installment_plan_id != null
                        ? String(row.installment_plan_id)
                        : null,
            },
        ])
    )

    return {
        ok: true,
        rows: ids.map((id) => byId.get(id) ?? { id, installment_plan_id: null }),
    }
}

export async function deleteTransactionsByIds(
    supabase: DbClient,
    ids: string[],
    workspaceId: string,
    options?: DeleteTransactionsOptions
): Promise<boolean> {
    if (!ids.length) return false

    const resolved = await resolveTransactionDeleteRows(
        supabase,
        ids,
        workspaceId,
        options?.rows
    )
    if (!resolved.ok) {
        toastError(resolved.errorMessage)
        return false
    }

    const { planIds, plainTransactionIds } = partitionTransactionDeletes(resolved.rows)

    for (const planId of planIds) {
        const result = await deleteInstallmentPlanCascade(planId, workspaceId)
        if (!result.ok) {
            toastError(result.errorMessage)
            return false
        }
    }

    for (const id of plainTransactionIds) {
        const result = await deletePlainTransactionById(id, workspaceId)
        if (!result.ok) {
            toastError(result.errorMessage)
            return false
        }
    }

    const offline = !isOnline()
    const installmentOnly =
        planIds.length > 0 && plainTransactionIds.length === 0

    if (offline) {
        toastSuccess(
            installmentOnly
                ? planIds.length === 1
                    ? "Cancelamento enfileirado. Sincroniza ao voltar online."
                    : `${planIds.length.toLocaleString("pt-BR")} cancelamentos enfileirados.`
                : ids.length === 1
                  ? "Exclusão enfileirada. Sincroniza ao voltar online."
                  : `${ids.length.toLocaleString("pt-BR")} exclusões enfileiradas.`
        )
        return true
    }

    if (installmentOnly) {
        toastSuccess(
            planIds.length === 1
                ? "Compra parcelada cancelada."
                : `${planIds.length.toLocaleString("pt-BR")} compras parceladas canceladas.`
        )
        return true
    }

    toastSuccess(
        ids.length === 1
            ? "Transação excluída."
            : `${ids.length.toLocaleString("pt-BR")} transações excluídas.`
    )
    return true
}
