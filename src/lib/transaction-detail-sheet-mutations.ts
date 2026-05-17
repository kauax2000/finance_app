import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
import { scheduleEvaluateCreditCardAlerts } from "@/lib/credit-card-notifications"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { isOnline } from "@/lib/offline/connectivity"
import {
    deleteTransactionById,
    saveTransaction,
    updateInstallmentPlan,
} from "@/lib/transactions/mutations"
import type { Transaction } from "@/lib/supabase"
import { toastError, toastSuccess } from "@/lib/toast"
import type { SupabaseClient, User } from "@supabase/supabase-js"

type DbClient = SupabaseClient

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

export async function deleteTransactionsByIds(
    _supabase: DbClient,
    ids: string[],
    workspaceId: string
): Promise<boolean> {
    if (!ids.length) return false

    for (const id of ids) {
        const result = await deleteTransactionById(id, workspaceId)
        if (!result.ok) {
            toastError(result.errorMessage)
            return false
        }
    }

    const deletedCount = ids.length
    const offline = !isOnline()
    toastSuccess(
        offline
            ? deletedCount === 1
                ? "Exclusão enfileirada. Sincroniza ao voltar online."
                : `${deletedCount.toLocaleString("pt-BR")} exclusões enfileiradas.`
            : deletedCount === 1
              ? "Transação excluída."
              : `${deletedCount.toLocaleString("pt-BR")} transações excluídas.`
    )
    return true
}
