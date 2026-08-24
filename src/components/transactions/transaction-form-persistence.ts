import type { InstallmentPlanFormSavePayload } from "@/components/transactions/transaction-form-types"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { toastError, toastSuccess } from "@/lib/toast"
import type { SupabaseClient, User } from "@supabase/supabase-js"

/**
 * Creates an installment plan via the `create_workspace_installment_plan` RPC
 * (schema guaranteed by migrations — the legacy manual-insert fallback and its
 * migration-troubleshooting toasts were removed in Fase 6).
 */
export async function persistInstallmentPlanCreate(options: {
    supabase: SupabaseClient
    user: User
    workspaceId: string
    payload: InstallmentPlanFormSavePayload
    onAfterSuccess: () => Promise<void>
}): Promise<boolean> {
    const { supabase, user, workspaceId, payload, onAfterSuccess } = options

    const rpcArgs = {
        p_workspace_id: workspaceId,
        p_category_id: payload.categoryId,
        p_description: payload.description,
        p_payment_method: payload.paymentMethod,
        p_payment_credit_card_id: payload.paymentCreditCardId,
        p_total_installments: payload.totalInstallments,
        p_installment_amount: payload.installmentAmount,
        p_final_installment_amount: payload.finalInstallmentAmount,
        p_next_billing_date: payload.firstBillingYmd,
    }

    const { error: rpcError } = await supabase.rpc(
        "create_workspace_installment_plan",
        rpcArgs
    )

    if (rpcError) {
        // O schema é garantido pelas migrações (baseline Fase 3) — sem
        // fallback de insert manual nem instruções de migração em toasts.
        console.error("create_workspace_installment_plan:", rpcError)
        toastError(
            formatSupabasePostgrestError(rpcError) ??
                "Não foi possível criar o plano parcelado."
        )
        return false
    }

    void invokeEdgeJson("evaluate-budgets", {
        body: {
            category_id: payload.categoryId,
            occurred_at: `${payload.firstBillingYmd}T12:00:00.000Z`,
        },
    }).catch(() => {
        /* non-blocking */
    })

    toastSuccess(
        "Compra parcelada registrada. Cada parcela aparece no extrato com o valor da prestação."
    )
    await onAfterSuccess()
    return true
}
