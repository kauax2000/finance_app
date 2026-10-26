import {
    TRANSACTION_SAVE_TOAST_ID,
    type InstallmentPlanFormSavePayload,
    type InstallmentPlanSaveResult,
} from "@/components/transactions/transaction-form-types"
import { scheduleEvaluateCreditCardAlerts } from "@/lib/credit-card-notifications"
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
    onAfterSuccess: (planId?: string) => Promise<void>
}): Promise<InstallmentPlanSaveResult> {
    const { supabase, workspaceId, payload, onAfterSuccess } = options

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

    const { data: planId, error: rpcError } = await supabase.rpc(
        "create_workspace_installment_plan",
        rpcArgs
    )

    if (rpcError) {
        // O schema é garantido pelas migrações (baseline Fase 3) — sem
        // fallback de insert manual nem instruções de migração em toasts.
        console.error("create_workspace_installment_plan:", rpcError)
        toastError(
            formatSupabasePostgrestError(rpcError) ??
                "Não foi possível criar o plano parcelado",
            { id: TRANSACTION_SAVE_TOAST_ID }
        )
        return false
    }

    const id = typeof planId === "string" ? planId : undefined
    // O que a frase ou a IA preencheu fica marcado (Decisão 2): as parcelas
    // que a RPC já lançou levam a origem. Falhando, o plano fica.
    if (id && (payload.source || payload.needsReview != null)) {
        const { error } = await supabase
            .from("transactions")
            .update({
                ...(payload.source ? { source: payload.source } : {}),
                ...(payload.needsReview != null ? { needs_review: payload.needsReview } : {}),
            })
            .eq("installment_plan_id", id)
        if (error) console.error("origem das parcelas:", error)
    }

    // A regra da parcelada mora no plano (Ruling 6): os pesos vão logo depois
    // de criá-lo, e o banco redivide as parcelas já lançadas. Falhando, o plano
    // fica com os pesos da carteira.
    if (id && payload.splitWeights) {
        const { data, error } = await supabase
            .from("workspace_installment_plans")
            .update({ split_weights: payload.splitWeights })
            .eq("id", id)
            .select("id")
        if (error || !data?.length) {
            if (error) console.error("pesos do plano:", error)
            toastError(
                formatSupabasePostgrestError(error) ??
                    "A compra foi registrada, mas os pesos próprios não: ela divide pelos pesos da carteira."
            )
        }
    }

    void invokeEdgeJson("evaluate-budgets", {
        body: {
            category_id: payload.categoryId,
            occurred_at: `${payload.firstBillingYmd}T12:00:00.000Z`,
            payment_method: payload.paymentMethod,
            payment_credit_card_id: payload.paymentCreditCardId,
            // Sem um id só: o limite avaliado é o de quem cria o plano.
            workspace_id: workspaceId,
        },
    }).catch(() => {
        /* non-blocking */
    })
    scheduleEvaluateCreditCardAlerts({
        workspaceId,
        type: "expense",
        paymentMethod: payload.paymentMethod,
        paymentCreditCardId: payload.paymentCreditCardId,
        categoryId: payload.categoryId,
        dateIso: `${payload.firstBillingYmd}T12:00:00.000Z`,
    })

    // A RPC devolve o id do plano; o "Ver" abre a lista filtrada nas parcelas dele.
    toastSuccess("Compra parcelada registrada", {
        id: TRANSACTION_SAVE_TOAST_ID,
        description: "Cada parcela aparece no extrato com o valor da prestação.",
        action: id ? { label: "Ver", href: `/transactions?plan=${id}` } : undefined,
    })
    await onAfterSuccess(id)
    return { planId: id }
}

/**
 * A 1ª parcela já lançada do plano (a que leva a foto do recibo), ou `null`
 * sem parcela. Um erro da consulta é lançado: não é "sem parcela".
 */
export async function primeiraParcelaDoPlano(supabase: SupabaseClient, planId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from("transactions")
        .select("id")
        .eq("installment_plan_id", planId)
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle()
    if (error) throw error
    return (data as { id: string } | null)?.id ?? null
}
