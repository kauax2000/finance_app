import type { PostgrestError } from "@supabase/supabase-js"
import {
    supabase,
    type Category,
    type CreditCard,
    type CreditCardInvoicePayment,
    type Transaction,
    type WorkspaceInstallmentPlan,
} from "@/lib/supabase"
import { isTransactionsSubscriptionBillingColumnsMissingError } from "@/lib/supabase-errors"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"
import { localYmdFromDate } from "@/lib/transaction-date"

type SupabaseBrowserClient = typeof supabase

export type CcCategoryEmbed = {
    id: string
    name: string
    color: string | null
    icon: string | null
}

export type CcTxRow = Pick<
    Transaction,
    | "id"
    | "type"
    | "amount"
    | "date"
    | "description"
    | "payment_method"
    | "payment_credit_card_id"
    | "installment_plan_id"
    | "installment_sequence"
    | "category_id"
> & {
    category?: { name: string } | null
}

/** Detail + analytics: extra fields for invoice breakdown. */
export type CcTxAnalyticsRow = Pick<
    Transaction,
    | "id"
    | "type"
    | "amount"
    | "date"
    | "description"
    | "payment_method"
    | "payment_credit_card_id"
    | "installment_sequence"
    | "category_id"
    | "subscription_id"
    | "installment_plan_id"
> & {
    user_id?: string
    category?: CcCategoryEmbed | null
}

/** Shared PostgREST select for workspace credit-card expense rows. */
export const CREDIT_CARD_EXPENSE_SELECT =
    "id,type,amount,date,description,payment_method,payment_credit_card_id,installment_plan_id,installment_sequence,category_id,category:categories(name)"

/** Card detail analytics: full category embed + subscription / installment links. */
export const CREDIT_CARD_ANALYTICS_SELECT =
    "id,user_id,type,amount,date,description,payment_method,payment_credit_card_id,installment_sequence,category_id,subscription_id,installment_plan_id,category:categories(id,name,color,icon)"

/** Same as analytics select when `subscription_id` / `installment_plan_id` columns are absent. */
export const CREDIT_CARD_ANALYTICS_SELECT_COMPAT =
    "id,user_id,type,amount,date,description,payment_method,payment_credit_card_id,installment_sequence,category_id,category:categories(id,name,color,icon)"

export const RECENT_CC_TX_CAP = 20

/** Máximo de despesas postadas exibidas na lista da fatura (detalhe do cartão). */
export const INVOICE_POSTED_TX_DISPLAY_CAP = 50

export const CC_DETAIL_INVOICE_POSTED_EMPTY_MESSAGE =
    "Nenhuma despesa nesta fatura neste período."

export function formatCcDetailInvoicePostedShowingFooter(
    displayedCount: number,
    totalInPeriod: number
): string {
    return `Mostrando ${displayedCount} de ${totalInPeriod} lançamentos nesta fatura.`
}

export type CreditCardDetailRecentTx = {
    id: string
    type: "income" | "expense"
    amount: number
    date: string
    description: string | null
    installment_sequence?: number | null
    category?: { name: string } | null
}

function normalizeCcCategory(
    category: { name: string } | { name: string }[] | null | undefined
): { name: string } | null {
    if (category == null) return null
    if (Array.isArray(category)) return category[0] ?? null
    return category
}

export function normalizeCcTxRow(raw: unknown): CcTxRow {
    const r = raw as CcTxRow & {
        category?: { name: string } | { name: string }[] | null
    }
    return {
        ...r,
        category: normalizeCcCategory(r.category),
    }
}

function normalizeCcCategoryFull(
    category:
        | CcCategoryEmbed
        | CcCategoryEmbed[]
        | null
        | undefined
): CcCategoryEmbed | null {
    if (category == null) return null
    if (Array.isArray(category)) return category[0] ?? null
    return category
}

export function normalizeCcTxAnalyticsRow(raw: unknown): CcTxAnalyticsRow {
    const r = raw as CcTxAnalyticsRow & {
        category?: CcCategoryEmbed | CcCategoryEmbed[] | null
    }
    return {
        ...r,
        category: normalizeCcCategoryFull(r.category),
    }
}

function ccCategoryEmbedToCategory(
    embed: CcCategoryEmbed | null | undefined,
    categoryId: string | null
): Category | undefined {
    if (!embed) return undefined
    return {
        id: embed.id,
        name: embed.name,
        color: embed.color,
        icon: embed.icon,
        type: "expense",
        user_id: "",
        workspace_id: null,
        created_at: "",
        updated_at: "",
    }
}

/** Map analytics rows to list/detail `Transaction` shape (with payment card attached). */
export function ccAnalyticsRowsToListTransactions(
    rows: CcTxAnalyticsRow[],
    card: CreditCard
): Transaction[] {
    const mapped: Transaction[] = rows.map((row) => ({
        id: row.id,
        user_id: row.user_id ?? "",
        category_id: row.category_id,
        type: row.type,
        amount: row.amount,
        description: row.description,
        date: row.date,
        is_recurring: false,
        recurring_interval: null,
        payment_method: row.payment_method ?? "credit_card",
        payment_credit_card_id: row.payment_credit_card_id,
        subscription_id: row.subscription_id ?? null,
        installment_plan_id: row.installment_plan_id ?? null,
        installment_sequence: row.installment_sequence ?? null,
        created_at: row.date,
        updated_at: row.date,
        category: ccCategoryEmbedToCategory(row.category, row.category_id),
    }))
    return attachPaymentCards(mapped, [card])
}

/**
 * Rolling ~12 months of credit-card expenses in the workspace (for tiles + detail).
 * Cycle snapshots only sum rows that fall in current billing windows.
 */
export async function fetchCreditCardExpenseRows(
    client: SupabaseBrowserClient,
    workspaceId: string
): Promise<{ rows: CcTxRow[]; error: PostgrestError | null }> {
    const since = new Date()
    since.setMonth(since.getMonth() - 11)
    const sinceYmd = localYmdFromDate(since)

    const { data, error } = await client
        .from("transactions")
        .select(CREDIT_CARD_EXPENSE_SELECT)
        .eq("workspace_id", workspaceId)
        .eq("payment_method", "credit_card")
        .not("payment_credit_card_id", "is", null)
        .gte("date", `${sinceYmd}T00:00:00.000Z`)

    if (error) {
        return { rows: [], error }
    }
    return { rows: (data ?? []).map(normalizeCcTxRow), error: null }
}

/**
 * Rolling ~12 months of credit-card expenses for a single card (detail analytics).
 */
export async function fetchCreditCardExpenseRowsForCard(
    client: SupabaseBrowserClient,
    workspaceId: string,
    cardId: string
): Promise<{ rows: CcTxAnalyticsRow[]; error: PostgrestError | null }> {
    const since = new Date()
    since.setMonth(since.getMonth() - 11)
    const sinceYmd = localYmdFromDate(since)

    const first = await client
        .from("transactions")
        .select(CREDIT_CARD_ANALYTICS_SELECT)
        .eq("workspace_id", workspaceId)
        .eq("payment_method", "credit_card")
        .eq("payment_credit_card_id", cardId)
        .gte("date", `${sinceYmd}T00:00:00.000Z`)
    let data: unknown[] | null = (first.data as unknown[] | null) ?? null
    let error: PostgrestError | null = first.error

    if (error && isTransactionsSubscriptionBillingColumnsMissingError(error)) {
        const second = await client
            .from("transactions")
            .select(CREDIT_CARD_ANALYTICS_SELECT_COMPAT)
            .eq("workspace_id", workspaceId)
            .eq("payment_method", "credit_card")
            .eq("payment_credit_card_id", cardId)
            .gte("date", `${sinceYmd}T00:00:00.000Z`)
        data = (second.data as unknown[] | null) ?? null
        error = second.error
    }

    if (error) {
        return { rows: [], error }
    }
    return { rows: (data ?? []).map(normalizeCcTxAnalyticsRow), error: null }
}

export async function fetchCreditCardInvoicePaymentsForCard(
    client: SupabaseBrowserClient,
    workspaceId: string,
    cardId: string
): Promise<{ payments: CreditCardInvoicePayment[]; error: PostgrestError | null }> {
    const { data, error } = await client
        .from("credit_card_invoice_payments")
        .select(
            "id,workspace_id,credit_card_id,statement_close_date,status,paid_at,created_by,created_at,updated_at"
        )
        .eq("workspace_id", workspaceId)
        .eq("credit_card_id", cardId)
        .order("statement_close_date", { ascending: false })

    if (error) {
        return { payments: [], error }
    }
    return { payments: (data ?? []) as CreditCardInvoicePayment[], error: null }
}

export async function fetchWorkspaceInstallmentPlansForCard(
    client: SupabaseBrowserClient,
    workspaceId: string,
    cardId: string
): Promise<{ plans: WorkspaceInstallmentPlan[]; error: PostgrestError | null }> {
    const { data, error } = await client
        .from("workspace_installment_plans")
        .select(
            "id,workspace_id,user_id,category_id,description,payment_method,payment_credit_card_id,total_installments,generated_count,installment_amount,final_installment_amount,next_billing_date,is_active,created_at,updated_at"
        )
        .eq("workspace_id", workspaceId)
        // Back-compat: older installment plans may have NULL card id even when charges are posted to a card.
        // We include them here and let projection logic infer membership from posted transactions.
        .or(`payment_credit_card_id.eq.${cardId},payment_credit_card_id.is.null`)
        .eq("payment_method", "credit_card")
        .order("next_billing_date", { ascending: true })

    if (error) {
        return { plans: [], error }
    }
    return { plans: (data ?? []) as WorkspaceInstallmentPlan[], error: null }
}

export function recentDetailTransactionsForCard(
    ccTransactions: (CcTxRow | CcTxAnalyticsRow)[],
    cardId: string,
    cap: number = RECENT_CC_TX_CAP
): CreditCardDetailRecentTx[] {
    const rows = ccTransactions.filter(
        (t) => t.payment_credit_card_id === cardId && t.type === "expense"
    )
    return [...rows]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, cap)
        .map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            date: t.date,
            description: t.description ?? null,
            installment_sequence: t.installment_sequence,
            category: t.category ? { name: t.category.name } : null,
        }))
}

/** Prefer parcel 1, otherwise earliest dated row for this plan. */
export function transactionIdForInstallmentPlan(
    rows: CcTxAnalyticsRow[],
    planId: string
): string | null {
    const matches = rows.filter((r) => r.installment_plan_id === planId)
    if (!matches.length) return null
    const seq1 = matches.find((r) => r.installment_sequence === 1)
    if (seq1) return seq1.id
    const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
    return sorted[0]?.id ?? null
}
