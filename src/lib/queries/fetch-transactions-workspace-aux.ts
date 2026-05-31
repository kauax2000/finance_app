import type { PostgrestError } from "@supabase/supabase-js"
import { supabase, type CreditCardInvoicePayment } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isPostgrestRelationMissingError,
    isWorkspaceInstallmentPlansTableMissingError,
} from "@/lib/supabase-errors"
import { isPostgrestTransientNetworkError } from "@/lib/transient-network-retry"
import { toastError } from "@/lib/toast"

export type TransactionsWorkspaceAux = {
    workspaceHasTransactions: boolean
    installmentPlans: { id: string; description: string | null }[]
    subscriptions: { id: string; name: string }[]
    invoicePayments: Pick<
        CreditCardInvoicePayment,
        "credit_card_id" | "statement_close_date" | "status"
    >[]
}

type SupabaseResult<T> = {
    data: T
    error: PostgrestError | null
    count?: number | null
}

async function withTransientRetry<T>(
    run: () => Promise<SupabaseResult<T>>,
): Promise<SupabaseResult<T>> {
    let result = await run()
    if (result.error && isPostgrestTransientNetworkError(result.error)) {
        result = await run()
    }
    return result
}

function maybeToastAuxError(
    error: PostgrestError,
    fallbackMessage: string,
): void {
    if (isPostgrestTransientNetworkError(error)) return
    toastError(formatSupabasePostgrestError(error) ?? fallbackMessage)
}

export async function fetchTransactionsWorkspaceAux(
    workspaceId: string,
): Promise<TransactionsWorkspaceAux> {
    const [anyTxRes, plansRes, subsRes, invoicePayRes] = await Promise.all([
        withTransientRetry(async () =>
            supabase
                .from("transactions")
                .select("id", { count: "exact", head: true })
                .eq("workspace_id", workspaceId),
        ),
        withTransientRetry(async () =>
            supabase
                .from("workspace_installment_plans")
                .select("id,description")
                .eq("workspace_id", workspaceId)
                .order("description"),
        ),
        withTransientRetry(async () =>
            supabase
                .from("workspace_subscriptions")
                .select("id,name")
                .eq("workspace_id", workspaceId)
                .order("name"),
        ),
        withTransientRetry(async () =>
            supabase
                .from("credit_card_invoice_payments")
                .select("credit_card_id,statement_close_date,status")
                .eq("workspace_id", workspaceId)
                .order("statement_close_date", { ascending: false }),
        ),
    ])

    let workspaceHasTransactions = false
    if (anyTxRes.error) {
        maybeToastAuxError(
            anyTxRes.error,
            "Não foi possível verificar transações.",
        )
        workspaceHasTransactions = false
    } else {
        workspaceHasTransactions = (anyTxRes.count ?? 0) > 0
    }

    let installmentPlans: { id: string; description: string | null }[] = []
    if (plansRes.error) {
        if (!isWorkspaceInstallmentPlansTableMissingError(plansRes.error)) {
            if (!isPostgrestRelationMissingError(plansRes.error)) {
                maybeToastAuxError(
                    plansRes.error,
                    "Não foi possível carregar os planos parcelados.",
                )
            }
        }
        installmentPlans = []
    } else {
        installmentPlans =
            (plansRes.data as { id: string; description: string | null }[]) ?? []
    }

    let subscriptions: { id: string; name: string }[] = []
    if (subsRes.error) {
        if (!isPostgrestRelationMissingError(subsRes.error)) {
            maybeToastAuxError(
                subsRes.error,
                "Não foi possível carregar as assinaturas.",
            )
        }
        subscriptions = []
    } else {
        subscriptions = (subsRes.data as { id: string; name: string }[]) ?? []
    }

    let invoicePayments: Pick<
        CreditCardInvoicePayment,
        "credit_card_id" | "statement_close_date" | "status"
    >[] = []
    if (invoicePayRes.error) {
        if (!isPostgrestRelationMissingError(invoicePayRes.error)) {
            maybeToastAuxError(
                invoicePayRes.error,
                "Não foi possível carregar pagamentos de fatura.",
            )
        }
        invoicePayments = []
    } else {
        invoicePayments =
            (invoicePayRes.data as Pick<
                CreditCardInvoicePayment,
                "credit_card_id" | "statement_close_date" | "status"
            >[]) ?? []
    }

    return {
        workspaceHasTransactions,
        installmentPlans,
        subscriptions,
        invoicePayments,
    }
}
