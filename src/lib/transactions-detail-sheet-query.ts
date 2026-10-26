import type { CreditCard, Transaction } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import type { SupabaseClient } from "@supabase/supabase-js"

export const INSTALLMENT_PLAN_LIST_EMBED =
    "installment_plan:workspace_installment_plans!installment_plan_id(id,total_installments,installment_amount,final_installment_amount,generated_count,is_active,next_billing_date,description,category_id,payment_method,payment_credit_card_id)"

/** Same embed shape as the transactions list — used by `TransactionDetailSheet`. */
export const TRANSACTION_DETAIL_SHEET_SELECT =
    "*, category:categories(*), subscription:workspace_subscriptions!subscription_id(id,name), " +
    INSTALLMENT_PLAN_LIST_EMBED

/** Avoid PostgREST embed on `credit_cards` (fails without FK/migration); join client-side. */
export function attachPaymentCards(
    rows: Transaction[] | null | undefined,
    cards: CreditCard[]
): Transaction[] {
    if (!rows?.length) return rows ?? []
    return rows.map((t) => ({
        ...t,
        payment_card: t.payment_credit_card_id
            ? cards.find((c) => c.id === t.payment_credit_card_id) ?? null
            : null,
    }))
}

export async function fetchTransactionForDetailSheet(
    client: SupabaseClient,
    args: {
        transactionId: string
        workspaceId: string
        creditCards: CreditCard[]
    }
): Promise<{ transaction: Transaction | null; errorMessage: string | null }> {
    const { data, error } = await client
        .from("transactions")
        .select(TRANSACTION_DETAIL_SHEET_SELECT)
        .eq("id", args.transactionId)
        .eq("workspace_id", args.workspaceId)
        .maybeSingle()

    if (error) {
        return {
            transaction: null,
            errorMessage:
                formatSupabasePostgrestError(error) ??
                "Não foi possível carregar a transação.",
        }
    }
    if (!data) {
        return { transaction: null, errorMessage: null }
    }
    const row = data as unknown as Transaction
    const [withCard] = attachPaymentCards([row], args.creditCards)
    return { transaction: withCard ?? null, errorMessage: null }
}

type InstallmentPlanOriginRow = {
    id: string
    installment_sequence: number | null
    date: string
}

/** Prefer parcel 1; otherwise earliest dated row for this plan. */
export function pickOriginTransactionIdForInstallmentPlan(
    rows: InstallmentPlanOriginRow[],
): string | null {
    if (!rows.length) return null
    const seq1 = rows.find((r) => r.installment_sequence === 1)
    if (seq1) return seq1.id
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
    return sorted[0]?.id ?? null
}

export async function fetchOriginTransactionIdForInstallmentPlan(
    client: SupabaseClient,
    args: { planId: string; workspaceId: string },
): Promise<{ transactionId: string | null; errorMessage: string | null }> {
    const { data, error } = await client
        .from("transactions")
        .select("id, installment_sequence, date")
        .eq("workspace_id", args.workspaceId)
        .eq("installment_plan_id", args.planId)

    if (error) {
        return {
            transactionId: null,
            errorMessage:
                formatSupabasePostgrestError(error) ??
                "Não foi possível localizar a transação de origem.",
        }
    }
    const rows = (data ?? []) as InstallmentPlanOriginRow[]
    return {
        transactionId: pickOriginTransactionIdForInstallmentPlan(rows),
        errorMessage: null,
    }
}
