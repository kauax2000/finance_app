import {
    TRANSACTION_SAVE_TOAST_ID,
    type InstallmentPlanUpdatePayload,
    type TransactionFormSavePayload,
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
import { numberBR } from "@/lib/formatters"

type DbClient = SupabaseClient

/** O assunto da exclusão: o "excluída" da nova tentativa toma o lugar do erro. */
const DELETE_TOAST_ID = "excluir-transacoes"

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
        toastError(result.errorMessage, { id: TRANSACTION_SAVE_TOAST_ID })
        return false
    }

    const offline = !isOnline()

    if (editing) {
        toastSuccess(
            offline ? "Transação atualizada offline" : "Transação atualizada",
            {
                id: TRANSACTION_SAVE_TOAST_ID,
                description: offline ? "Sincroniza quando houver conexão." : undefined,
            }
        )
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

        // O `saveTransaction` devolve o id inserido em tempo de execução
        // (`insertedId`), embora o tipo dele não o declare. Offline não há id.
        const insertedId =
            "insertedId" in result && typeof result.insertedId === "string"
                ? result.insertedId
                : null
        toastSuccess(offline ? "Transação salva offline" : "Transação criada", {
            id: TRANSACTION_SAVE_TOAST_ID,
            description: offline ? "Sincroniza quando houver conexão." : undefined,
            action: insertedId
                ? { label: "Ver", href: `/transactions?txn=${insertedId}` }
                : undefined,
        })
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
        toastError(result.errorMessage, { id: TRANSACTION_SAVE_TOAST_ID })
        return false
    }

    toastSuccess("Plano da compra atualizado", { id: TRANSACTION_SAVE_TOAST_ID })
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
        toastError(resolved.errorMessage, { id: DELETE_TOAST_ID })
        return false
    }

    const { planIds, plainTransactionIds } = partitionTransactionDeletes(resolved.rows)

    for (const planId of planIds) {
        const result = await deleteInstallmentPlanCascade(planId, workspaceId)
        if (!result.ok) {
            toastError(result.errorMessage, { id: DELETE_TOAST_ID })
            return false
        }
    }

    for (const id of plainTransactionIds) {
        const result = await deletePlainTransactionById(id, workspaceId)
        if (!result.ok) {
            toastError(result.errorMessage, { id: DELETE_TOAST_ID })
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
                    ? "Cancelamento enfileirado"
                    : `${numberBR(planIds.length)} cancelamentos enfileirados`
                : ids.length === 1
                  ? "Exclusão enfileirada"
                  : `${numberBR(ids.length)} exclusões enfileiradas`,
            { id: DELETE_TOAST_ID, description: "Sincroniza ao voltar online." }
        )
        return true
    }

    if (installmentOnly) {
        toastSuccess(
            planIds.length === 1
                ? "Compra parcelada cancelada"
                : `${numberBR(planIds.length)} compras parceladas canceladas`,
            { id: DELETE_TOAST_ID }
        )
        return true
    }

    toastSuccess(
        ids.length === 1
            ? "Transação excluída"
            : `${numberBR(ids.length)} transações excluídas`,
        { id: DELETE_TOAST_ID }
    )
    return true
}
