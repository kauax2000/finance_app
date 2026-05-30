import { supabase, type Transaction } from "@/lib/supabase"
import {
    filterRangeEndIso,
    filterRangeStartIso,
} from "@/lib/transaction-date"
import {
    formatSupabasePostgrestError,
    isTransactionsInstallmentPlanEmbedUnsupportedError,
    isTransactionsSubscriptionEmbedUnsupportedError,
} from "@/lib/supabase-errors"
import { toastError } from "@/lib/toast"
import {
    INSTALLMENT_PLAN_LIST_EMBED,
    TRANSACTION_DETAIL_SHEET_SELECT,
} from "@/lib/transactions-detail-sheet-query"
import { type PaymentMethod } from "@/lib/payment-methods"
import { type TransactionFilterType } from "@/components/transactions/transaction-type-segment"

const PAGE_SIZE = 100

const TRANSACTION_LIST_SELECT = TRANSACTION_DETAIL_SHEET_SELECT

const TRANSACTION_LIST_SELECT_NO_SUBSCRIPTION_EMBED =
    "*, category:categories(*), " + INSTALLMENT_PLAN_LIST_EMBED

const TRANSACTION_LIST_SELECT_NO_INSTALLMENT_EMBED =
    "*, category:categories(*), subscription:workspace_subscriptions!subscription_id(id,name)"

const TRANSACTION_LIST_SELECT_MINIMAL = "*, category:categories(*)"

function parseAmountFilter(raw: string): number | null {
    const t = raw.trim().replace(/\s/g, "")
    if (!t) return null
    const normalized = t.replace(/\./g, "").replace(",", ".")
    const n = Number(normalized)
    return Number.isFinite(n) ? n : null
}

export type FetchTransactionsListPageArgs = {
    workspaceId: string
    pageIndex: number
    filterType: TransactionFilterType
    fullPeriod: boolean
    filterDateFrom: string
    filterDateTo: string
    lockedCategoryId: string | null
    filterCreditCardIds: string[]
    filterPaymentMethods: PaymentMethod[]
    filterCategoryIds: string[]
    filterUncategorizedOnly: boolean
    filterAmountMin: string
    filterAmountMax: string
    filterDescriptionQuery: string
    filterInstallmentsOnly: boolean
    filterInstallmentPlanId: string | null
    filterSubscriptionId: string | null
    sortKey: "date" | "amount"
    sortDir: "asc" | "desc"
    /** When true, returns all rows in the date range (for client-side expense-month merge). */
    fetchAllInRange?: boolean
}

export type FetchTransactionsListPageResult = {
    transactions: Transaction[]
    totalCount: number
}

export async function fetchTransactionsListPage(
    args: FetchTransactionsListPageArgs,
): Promise<FetchTransactionsListPageResult> {
    const {
        workspaceId,
        pageIndex,
        filterType,
        fullPeriod,
        filterDateFrom,
        filterDateTo,
        lockedCategoryId: lockedId,
        filterCreditCardIds,
        filterPaymentMethods,
        filterCategoryIds,
        filterUncategorizedOnly,
        filterAmountMin,
        filterAmountMax,
        filterDescriptionQuery,
        filterInstallmentsOnly,
        filterInstallmentPlanId,
        filterSubscriptionId,
        sortKey,
        sortDir,
        fetchAllInRange,
    } = args

    const buildListQuery = (selectStr: string) => {
        let qb = supabase
            .from("transactions")
            .select(selectStr, {
                count: "exact",
            })
            .eq("workspace_id", workspaceId)

        if (filterType !== "all") {
            qb = qb.eq("type", filterType)
        }

        if (!fullPeriod) {
            if (filterDateFrom) {
                qb = qb.gte("date", filterRangeStartIso(filterDateFrom))
            }
            if (filterDateTo) {
                qb = qb.lte("date", filterRangeEndIso(filterDateTo))
            }
        }

        if (
            filterPaymentMethods.includes("credit_card") &&
            filterCreditCardIds.length > 0
        ) {
            qb = qb.in("payment_credit_card_id", filterCreditCardIds)
        }

        if (filterPaymentMethods.length > 0) {
            qb = qb.in("payment_method", filterPaymentMethods)
        }

        if (lockedId) {
            qb = qb.eq("category_id", lockedId)
        } else if (filterUncategorizedOnly) {
            qb = qb.is("category_id", null)
        } else if (filterCategoryIds.length > 0) {
            qb = qb.in("category_id", filterCategoryIds)
        }

        const minA = parseAmountFilter(filterAmountMin)
        if (minA != null) {
            qb = qb.gte("amount", minA)
        }
        const maxA = parseAmountFilter(filterAmountMax)
        if (maxA != null) {
            qb = qb.lte("amount", maxA)
        }

        const dq = filterDescriptionQuery.trim()
        if (dq) {
            const safe = dq
                .replace(/\\/g, "\\\\")
                .replace(/%/g, "\\%")
                .replace(/_/g, "\\_")
            qb = qb.ilike("description", `%${safe}%`)
        }

        if (filterInstallmentsOnly) {
            qb = qb.not("installment_plan_id", "is", null)
        }

        if (filterInstallmentPlanId) {
            qb = qb.eq("installment_plan_id", filterInstallmentPlanId)
        }

        if (filterSubscriptionId) {
            qb = qb.eq("subscription_id", filterSubscriptionId)
        }

        const orderColumn = sortKey === "date" ? "date" : "amount"
        const ascending = sortDir === "asc"
        qb = qb.order(orderColumn, { ascending })
        if (sortKey === "date") {
            qb = qb.order("created_at", { ascending })
        }

        const from = fetchAllInRange ? 0 : pageIndex * PAGE_SIZE
        const to = fetchAllInRange ? PAGE_SIZE * 50 - 1 : from + PAGE_SIZE - 1
        return qb.range(from, to)
    }

    let selectStr = TRANSACTION_LIST_SELECT
    let { data, error, count } = await buildListQuery(selectStr)

    if (error && isTransactionsSubscriptionEmbedUnsupportedError(error)) {
        selectStr = TRANSACTION_LIST_SELECT_NO_SUBSCRIPTION_EMBED
        const retry = await buildListQuery(selectStr)
        data = retry.data
        error = retry.error
        count = retry.count
    }

    if (error && isTransactionsInstallmentPlanEmbedUnsupportedError(error)) {
        selectStr =
            selectStr === TRANSACTION_LIST_SELECT
                ? TRANSACTION_LIST_SELECT_NO_INSTALLMENT_EMBED
                : TRANSACTION_LIST_SELECT_MINIMAL
        const retry = await buildListQuery(selectStr)
        data = retry.data
        error = retry.error
        count = retry.count
    }

    if (error && isTransactionsSubscriptionEmbedUnsupportedError(error)) {
        const retry = await buildListQuery(TRANSACTION_LIST_SELECT_MINIMAL)
        data = retry.data
        error = retry.error
        count = retry.count
    }

    if (error) {
        toastError(
            formatSupabasePostgrestError(error) ??
                "Não foi possível carregar as transações.",
        )
        throw new Error(
            formatSupabasePostgrestError(error) ??
                "Não foi possível carregar as transações.",
        )
    }

    return {
        transactions: (data ?? []) as unknown as Transaction[],
        totalCount: count ?? 0,
    }
}
