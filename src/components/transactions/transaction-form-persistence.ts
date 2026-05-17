import type { InstallmentPlanFormSavePayload } from "@/components/transactions/transaction-form-types"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import {
    formatSupabasePostgrestError,
    isPostgrestRpcFunctionNotFoundError,
    isPostgrestSchemaCacheError,
    isWorkspaceInstallmentPlansTableMissingError,
    isTransactionsPaymentColumnsUnsupportedError,
} from "@/lib/supabase-errors"
import { toastError, toastErrorWithDescription, toastSuccess } from "@/lib/toast"
import type { SupabaseClient, User } from "@supabase/supabase-js"

/**
 * Creates an installment plan via RPC, or falls back to direct insert when the RPC is missing.
 * Mirrors the logic previously embedded in `useTransactionsListController`.
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
        const fnMissing = isPostgrestRpcFunctionNotFoundError(rpcError)

        if (!fnMissing) {
            if (isPostgrestSchemaCacheError(rpcError)) {
                const detail =
                    formatSupabasePostgrestError(rpcError) ??
                    "Erro desconhecido da API."
                toastErrorWithDescription(
                    "Parcelamentos: a API ainda não vê a tabela ou colunas.",
                    [
                        "No Supabase: SQL Editor → execute: NOTIFY pgrst, 'reload schema';",
                        "Ou Ajustes do projeto → API → Reload schema.",
                        "Confirme também: supabase db push (migração create_workspace_installment_plan).",
                        "",
                        detail,
                    ].join("\n")
                )
            } else {
                toastError(
                    formatSupabasePostgrestError(rpcError) ??
                        "Não foi possível criar o plano parcelado."
                )
            }
            return false
        }

        const planRow = {
            user_id: user.id,
            workspace_id: workspaceId,
            category_id: payload.categoryId,
            description: payload.description,
            payment_method: payload.paymentMethod,
            payment_credit_card_id: payload.paymentCreditCardId,
            total_installments: payload.totalInstallments,
            generated_count: 0,
            installment_amount: payload.installmentAmount,
            final_installment_amount: payload.finalInstallmentAmount,
            next_billing_date: payload.firstBillingYmd,
            is_active: true,
        }

        const stripPlanPayment = (
            row: typeof planRow
        ): Omit<
            typeof planRow,
            "payment_method" | "payment_credit_card_id"
        > => {
            const { payment_method, payment_credit_card_id, ...rest } = row
            void payment_method
            void payment_credit_card_id
            return rest
        }

        let { error } = await supabase
            .from("workspace_installment_plans")
            .insert(planRow)

        if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
            const retry = await supabase
                .from("workspace_installment_plans")
                .insert(stripPlanPayment(planRow))
            error = retry.error
        }

        if (error) {
            if (isPostgrestSchemaCacheError(error)) {
                const detail =
                    formatSupabasePostgrestError(error) ??
                    "Erro desconhecido da API."
                if (isWorkspaceInstallmentPlansTableMissingError(error)) {
                    toastErrorWithDescription(
                        "Parcelamentos: este projeto Supabase ainda não tem a tabela de planos parcelados.",
                        [
                            "A API não expõe `workspace_installment_plans` (erro PGRST205). Isto costuma significar migrações não aplicadas no mesmo projeto que o `.env.local`, ou schema da API não recarregado.",
                            "No terminal, com o projeto ligado ao Supabase certo: `supabase db push`.",
                            "Inclua pelo menos: `20260404120000_workspace_installment_plans.sql` (tabela) e `20260404130000_installment_charge_step_and_rpc.sql` (RPC).",
                            "Depois: SQL Editor → `NOTIFY pgrst, 'reload schema';` ou Ajustes → API → Reload schema.",
                            "",
                            detail,
                        ].join("\n")
                    )
                } else {
                    toastErrorWithDescription(
                        "Parcelamentos: a API ainda não vê a tabela ou colunas.",
                        [
                            "No Supabase: SQL Editor → execute: NOTIFY pgrst, 'reload schema';",
                            "Ou Ajustes do projeto → API → Reload schema.",
                            "Confirme também: supabase db push (ou migração aplicada no painel).",
                            "",
                            detail,
                        ].join("\n")
                    )
                }
            } else {
                toastError(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível criar o plano parcelado."
                )
            }
            return false
        }

        toastSuccess(
            "Plano parcelado registrado. Aplique a migração mais recente para gerar a 1.ª parcela automaticamente nas datas de cobrança."
        )
        await onAfterSuccess()
        return true
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
