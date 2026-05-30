import type { PaymentMethod } from "@/lib/payment-methods"
import type { TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import {
    buildCreditCardClosingLookup,
    chargeDateToExpenseIso,
    projectedChargeCountsInExpenseMonth,
    projectedSubscriptionCountsInExpenseMonth,
    transactionCountsInExpenseMonth,
} from "@/lib/expense-month-attribution"
import {
    buildGlobalInstallmentDedupeKeys,
    expandRemainingInstallmentCharges,
    isProjectedChargeAlreadyPosted,
} from "@/lib/credit-card-installment-projection"
import { expandSubscriptionChargesInYmdRange } from "@/lib/subscription-billing-projection"
import { paddedBoundsForYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import type {
    Category,
    CreditCard,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import { localYmdFromDate, transactionCalendarParts } from "@/lib/transaction-date"

export const PROJECTED_TRANSACTION_ID_PREFIX = "__projected:"

export function isProjectedTransactionRow(t: Pick<Transaction, "id">): boolean {
    return t.id.startsWith(PROJECTED_TRANSACTION_ID_PREFIX)
}

function transactionLocalYmd(t: Pick<Transaction, "date">): string | null {
    const p = transactionCalendarParts(t.date)
    if (!p) return null
    return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
}

function parseAmountFilter(raw: string): number | null {
    const t = raw.trim().replace(/\s/g, "")
    if (!t) return null
    const normalized = t.replace(/\./g, "").replace(",", ".")
    const n = Number(normalized)
    return Number.isFinite(n) ? n : null
}

function syntheticTransaction(
    partial: Pick<
        Transaction,
        | "id"
        | "type"
        | "amount"
        | "date"
        | "description"
        | "category_id"
        | "payment_method"
        | "payment_credit_card_id"
        | "subscription_id"
        | "installment_plan_id"
        | "installment_sequence"
    > & { category?: Category | null },
): Transaction {
    return {
        id: partial.id,
        user_id: "",
        workspace_id: "",
        category_id: partial.category_id,
        type: partial.type,
        amount: partial.amount,
        description: partial.description,
        date: partial.date,
        is_recurring: false,
        recurring_interval: null,
        payment_method: partial.payment_method,
        payment_credit_card_id: partial.payment_credit_card_id,
        installment_plan_id: partial.installment_plan_id ?? null,
        installment_sequence: partial.installment_sequence ?? null,
        subscription_id: partial.subscription_id ?? null,
        created_at: "",
        updated_at: "",
        category: partial.category ?? null,
    }
}

export function buildProjectedCategoryExpenseRows(args: {
    categoryId: string
    yearMonth: string
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
    postedTransactions: Pick<
        Transaction,
        | "type"
        | "date"
        | "subscription_id"
        | "installment_plan_id"
        | "installment_sequence"
    >[]
    creditCards: Pick<CreditCard, "id" | "closing_day">[]
    categories: Category[]
}): Transaction[] {
    const {
        categoryId,
        yearMonth,
        installmentPlans,
        subscriptions,
        postedTransactions,
        creditCards,
        categories,
    } = args
    const category = categories.find((c) => c.id === categoryId) ?? null
    const closingLookup = buildCreditCardClosingLookup(creditCards)
    const { padStart, padEnd } = paddedBoundsForYearMonth(yearMonth)
    const { period_start, period_end } = periodBoundsFromYearMonth(yearMonth)

    const installmentDedupe = buildGlobalInstallmentDedupeKeys(postedTransactions)
    const postedBySubscriptionDay = new Set<string>()
    for (const t of postedTransactions) {
        if (t.type !== "expense") continue
        const sid = t.subscription_id
        if (!sid) continue
        const ymd = transactionLocalYmd(t)
        if (!ymd) continue
        postedBySubscriptionDay.add(`${sid}:${ymd}`)
    }

    const out: Transaction[] = []

    for (const p of installmentPlans) {
        if (!p.is_active) continue
        if (p.category_id !== categoryId) continue
        for (const charge of expandRemainingInstallmentCharges(p)) {
            const inMonth =
                p.payment_method === "credit_card" && p.payment_credit_card_id
                    ? projectedChargeCountsInExpenseMonth(
                          charge.chargeDate,
                          p,
                          yearMonth,
                          closingLookup,
                      )
                    : (() => {
                          const ymd = localYmdFromDate(charge.chargeDate)
                          return ymd >= period_start && ymd <= period_end
                      })()
            if (!inMonth) continue
            if (isProjectedChargeAlreadyPosted(charge, installmentDedupe)) continue
            const ymd = localYmdFromDate(charge.chargeDate)
            out.push(
                syntheticTransaction({
                    id: `${PROJECTED_TRANSACTION_ID_PREFIX}inst:${p.id}:${charge.installmentSequence}:${ymd}`,
                    type: "expense",
                    amount: charge.amount,
                    date: chargeDateToExpenseIso(charge.chargeDate),
                    description: p.description?.trim()
                        ? `${p.description.trim()} (${charge.installmentSequence}/${p.total_installments})`
                        : `Parcela ${charge.installmentSequence}/${p.total_installments}`,
                    category_id: categoryId,
                    payment_method: p.payment_method,
                    payment_credit_card_id: p.payment_credit_card_id,
                    installment_plan_id: p.id,
                    installment_sequence: charge.installmentSequence,
                    category,
                }),
            )
        }
    }

    for (const s of subscriptions) {
        if (!s.is_active) continue
        if (s.category_id !== categoryId) continue
        const isCc = s.payment_method === "credit_card" && s.payment_credit_card_id
        const rangeStart = isCc ? padStart : period_start
        const rangeEnd = isCc ? padEnd : period_end
        for (const charge of expandSubscriptionChargesInYmdRange(s, rangeStart, rangeEnd)) {
            const inMonth = isCc
                ? projectedSubscriptionCountsInExpenseMonth(
                      charge.chargeDate,
                      s,
                      yearMonth,
                      closingLookup,
                  )
                : charge.chargeYmd >= period_start && charge.chargeYmd <= period_end
            if (!inMonth) continue
            if (postedBySubscriptionDay.has(`${s.id}:${charge.chargeYmd}`)) continue
            out.push(
                syntheticTransaction({
                    id: `${PROJECTED_TRANSACTION_ID_PREFIX}sub:${s.id}:${charge.chargeYmd}`,
                    type: "expense",
                    amount: charge.amount,
                    date: chargeDateToExpenseIso(charge.chargeDate),
                    description: s.name,
                    category_id: categoryId,
                    payment_method: s.payment_method,
                    payment_credit_card_id: s.payment_credit_card_id,
                    subscription_id: s.id,
                    category,
                }),
            )
        }
    }

    return out
}

export function filterPostedForExpenseMonth(
    transactions: Transaction[],
    yearMonth: string,
    creditCards: Pick<CreditCard, "id" | "closing_day">[],
    categoryType: "income" | "expense" | null,
): Transaction[] {
    const closingLookup = buildCreditCardClosingLookup(creditCards)
    return transactions.filter((t) => {
        if (categoryType === "income") {
            return (
                t.type === "income" &&
                transactionCountsInExpenseMonth(t, yearMonth, closingLookup)
            )
        }
        if (categoryType === "expense") {
            return (
                t.type === "expense" &&
                transactionCountsInExpenseMonth(t, yearMonth, closingLookup)
            )
        }
        return transactionCountsInExpenseMonth(t, yearMonth, closingLookup)
    })
}

export type CategoryTransactionListFilters = {
    filterType: TransactionFilterType
    filterCreditCardIds: string[]
    filterPaymentMethods: PaymentMethod[]
    filterAmountMin: string
    filterAmountMax: string
    filterDescriptionQuery: string
    filterInstallmentsOnly: boolean
    filterInstallmentPlanId: string | null
    filterSubscriptionId: string | null
}

export function applyCategoryTransactionListFilters(
    transactions: Transaction[],
    filters: CategoryTransactionListFilters,
): Transaction[] {
    let rows = transactions

    if (filters.filterType !== "all") {
        rows = rows.filter((t) => t.type === filters.filterType)
    }

    if (
        filters.filterPaymentMethods.includes("credit_card") &&
        filters.filterCreditCardIds.length > 0
    ) {
        rows = rows.filter(
            (t) =>
                t.payment_credit_card_id != null &&
                filters.filterCreditCardIds.includes(t.payment_credit_card_id),
        )
    } else if (filters.filterPaymentMethods.length > 0) {
        rows = rows.filter(
            (t) =>
                t.payment_method != null &&
                filters.filterPaymentMethods.includes(t.payment_method),
        )
    }

    const minA = parseAmountFilter(filters.filterAmountMin)
    if (minA != null) {
        rows = rows.filter((t) => Number(t.amount) >= minA)
    }
    const maxA = parseAmountFilter(filters.filterAmountMax)
    if (maxA != null) {
        rows = rows.filter((t) => Number(t.amount) <= maxA)
    }

    const dq = filters.filterDescriptionQuery.trim()
    if (dq) {
        const q = dq.toLowerCase()
        rows = rows.filter((t) => (t.description ?? "").toLowerCase().includes(q))
    }

    if (filters.filterInstallmentsOnly) {
        rows = rows.filter((t) => t.installment_plan_id != null)
    }

    if (filters.filterInstallmentPlanId) {
        rows = rows.filter(
            (t) => t.installment_plan_id === filters.filterInstallmentPlanId,
        )
    }

    if (filters.filterSubscriptionId) {
        rows = rows.filter((t) => t.subscription_id === filters.filterSubscriptionId)
    }

    return rows
}

export function sortCategoryExpenseMonthRows(
    transactions: Transaction[],
    sortKey: "date" | "amount",
    sortDir: "asc" | "desc",
): Transaction[] {
    const dir = sortDir === "asc" ? 1 : -1
    return [...transactions].sort((a, b) => {
        if (sortKey === "amount") {
            const d = (Number(a.amount) - Number(b.amount)) * dir
            if (d !== 0) return d
        } else {
            const d = a.date.localeCompare(b.date) * dir
            if (d !== 0) return d
        }
        return a.id.localeCompare(b.id) * dir
    })
}

export function mergeCategoryExpenseMonthRows(args: {
    posted: Transaction[]
    projected: Transaction[]
    yearMonth: string
    creditCards: Pick<CreditCard, "id" | "closing_day">[]
    categoryType: "income" | "expense" | null
    filters: CategoryTransactionListFilters
    sortKey: "date" | "amount"
    sortDir: "asc" | "desc"
}): Transaction[] {
    const filteredPosted = filterPostedForExpenseMonth(
        args.posted,
        args.yearMonth,
        args.creditCards,
        args.categoryType,
    )
    const merged =
        args.categoryType === "expense"
            ? [...filteredPosted, ...args.projected]
            : filteredPosted
    const filtered = applyCategoryTransactionListFilters(merged, args.filters)
    return sortCategoryExpenseMonthRows(filtered, args.sortKey, args.sortDir)
}
