import { scheduleEvaluateCreditCardAlerts } from "@/lib/credit-card-notifications"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { supabase } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isTransactionsPaymentColumnsUnsupportedError,
} from "@/lib/supabase-errors"
import type { OfflineMutation } from "@/lib/offline/types"
import { deleteById, updateById } from "@/lib/offline/handlers/by-id"
import type { TransactionPaymentMethod } from "@/lib/supabase"
import { scheduleNotifyTransactionCreated } from "@/lib/transaction-notifications"

function stripPaymentColumns<T extends Record<string, unknown>>(row: T) {
    const next = { ...row } as Record<string, unknown>
    delete next.payment_method
    delete next.payment_credit_card_id
    return next
}

export async function syncTransactionMutation(
    mutation: OfflineMutation
): Promise<{ ok: true } | { ok: false; error: string }> {
    const { operation, payload } = mutation

    if (operation === "delete") {
        const cascadePlanId = payload.cascadeInstallmentPlanId
        if (cascadePlanId != null && String(cascadePlanId).length > 0) {
            const { error } = await supabase.rpc(
                "delete_workspace_installment_plan_cascade",
                { p_plan_id: String(cascadePlanId) }
            )
            if (error) {
                return {
                    ok: false,
                    error: formatSupabasePostgrestError(error) ?? error.message,
                }
            }
            return { ok: true }
        }

        return deleteById("transactions", mutation)
    }

    if (operation !== "insert") {
        return updateById("transactions", mutation, (row, error) =>
            isTransactionsPaymentColumnsUnsupportedError(error) ? stripPaymentColumns(row) : null
        )
    }

    const row = { ...payload } as Record<string, unknown>
    const clientId = (row.client_id as string | undefined) ?? mutation.idempotencyKey
    row.client_id = clientId

    let { data: inserted, error } = await supabase.from("transactions").upsert(row, {
        onConflict: "workspace_id,client_id",
        ignoreDuplicates: false,
    }).select("id, type, subscription_id, installment_plan_id").single()

    if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
        const retry = await supabase
            .from("transactions")
            .upsert(stripPaymentColumns(row), { onConflict: "workspace_id,client_id" })
            .select("id, type, subscription_id, installment_plan_id")
            .single()
        inserted = retry.data
        error = retry.error
    }

    if (error) {
        return {
            ok: false,
            error: formatSupabasePostgrestError(error) ?? error.message,
        }
    }

    if (
        inserted?.id &&
        inserted.type === "expense" &&
        !inserted.subscription_id &&
        !inserted.installment_plan_id
    ) {
        scheduleNotifyTransactionCreated(String(inserted.id))
    }

    // O lançamento feito offline também passa pelos alertas, como o online:
    // sem isto, orçamento e limite de cartão estouravam calados.
    if (inserted?.type === "expense") {
        const dateIso = String(row.date ?? "")
        void invokeEdgeJson("evaluate-budgets", {
            body: { category_id: row.category_id ?? null, occurred_at: dateIso },
        }).catch(() => {})
        scheduleEvaluateCreditCardAlerts({
            workspaceId: mutation.workspaceId,
            type: "expense",
            paymentMethod: (row.payment_method as TransactionPaymentMethod | null) ?? null,
            paymentCreditCardId: (row.payment_credit_card_id as string | null) ?? null,
            categoryId: (row.category_id as string | null) ?? null,
            dateIso,
        })
    }

    return { ok: true }
}
