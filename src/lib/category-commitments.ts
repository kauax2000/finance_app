import type {
    CreditCard,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import { localYmdFromDate, transactionCalendarParts } from "@/lib/transaction-date"
import { paddedBoundsForYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import {
    buildCreditCardClosingLookup,
    projectedChargeCountsInExpenseMonth,
    projectedSubscriptionCountsInExpenseMonth,
    transactionCountsInExpenseMonth,
    type CreditCardClosingLookup,
} from "@/lib/expense-month-attribution"
import {
    buildGlobalInstallmentDedupeKeys,
    expandRemainingInstallmentCharges,
    isProjectedChargeAlreadyPosted,
} from "@/lib/credit-card-installment-projection"
import { expandSubscriptionChargesInYmdRange } from "@/lib/subscription-billing-projection"

export type CategoryCommitmentTotals = {
    postedTotal: number
    projectedInstallmentsTotal: number
    projectedSubscriptionsTotal: number
    committedTotal: number
}

export type CategoryCommitmentsById = Record<string, CategoryCommitmentTotals>

function transactionLocalYmd(t: Pick<Transaction, "date">): string | null {
    const p = transactionCalendarParts(t.date)
    if (!p) return null
    return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
}

function ensureBucket(out: CategoryCommitmentsById, categoryId: string): CategoryCommitmentTotals {
    const prev = out[categoryId]
    if (prev) return prev
    const next = {
        postedTotal: 0,
        projectedInstallmentsTotal: 0,
        projectedSubscriptionsTotal: 0,
        committedTotal: 0,
    }
    out[categoryId] = next
    return next
}

function subscriptionChargeInMonth(
    chargeDate: Date,
    sub: WorkspaceSubscription,
    yearMonth: string,
    period_start: string,
    period_end: string,
    closingLookup: CreditCardClosingLookup,
): boolean {
    if (sub.payment_method === "credit_card" && sub.payment_credit_card_id) {
        return projectedSubscriptionCountsInExpenseMonth(
            chargeDate,
            sub,
            yearMonth,
            closingLookup,
        )
    }
    const ymd = localYmdFromDate(chargeDate)
    return ymd >= period_start && ymd <= period_end
}

export function buildCategoryCommitmentsForMonth(args: {
    yearMonth: string
    transactions: Pick<
        Transaction,
        | "type"
        | "amount"
        | "date"
        | "category_id"
        | "subscription_id"
        | "installment_plan_id"
        | "installment_sequence"
        | "payment_method"
        | "payment_credit_card_id"
    >[]
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
    creditCards?: Pick<CreditCard, "id" | "closing_day">[]
}): CategoryCommitmentsById {
    const { period_start, period_end } = periodBoundsFromYearMonth(args.yearMonth)
    const { padStart, padEnd } = paddedBoundsForYearMonth(args.yearMonth)
    const closingLookup: CreditCardClosingLookup = buildCreditCardClosingLookup(
        args.creditCards ?? [],
    )
    const out: CategoryCommitmentsById = {}

    for (const t of args.transactions) {
        if (t.type !== "expense") continue
        const categoryId = t.category_id
        if (!categoryId) continue
        if (!transactionCountsInExpenseMonth(t, args.yearMonth, closingLookup)) continue
        const b = ensureBucket(out, categoryId)
        b.postedTotal += Number(t.amount) || 0
    }

    const installmentDedupe = buildGlobalInstallmentDedupeKeys(args.transactions)
    const postedBySubscriptionDay = new Set<string>()
    for (const t of args.transactions) {
        if (t.type !== "expense") continue
        const sid = t.subscription_id
        if (!sid) continue
        const ymd = transactionLocalYmd(t as Pick<Transaction, "date">)
        if (!ymd) continue
        postedBySubscriptionDay.add(`${sid}:${ymd}`)
    }

    for (const p of args.installmentPlans) {
        if (!p.is_active) continue
        const categoryId = p.category_id
        if (!categoryId) continue
        for (const charge of expandRemainingInstallmentCharges(p)) {
            const inMonth =
                p.payment_method === "credit_card" && p.payment_credit_card_id
                    ? projectedChargeCountsInExpenseMonth(
                          charge.chargeDate,
                          p,
                          args.yearMonth,
                          closingLookup,
                      )
                    : (() => {
                          const ymd = localYmdFromDate(charge.chargeDate)
                          return ymd >= period_start && ymd <= period_end
                      })()
            if (!inMonth) continue
            if (isProjectedChargeAlreadyPosted(charge, installmentDedupe)) continue
            const b = ensureBucket(out, categoryId)
            b.projectedInstallmentsTotal += Number(charge.amount) || 0
        }
    }

    for (const s of args.subscriptions) {
        if (!s.is_active) continue
        const categoryId = s.category_id
        if (!categoryId) continue
        const rangeStart =
            s.payment_method === "credit_card" && s.payment_credit_card_id
                ? padStart
                : period_start
        const rangeEnd =
            s.payment_method === "credit_card" && s.payment_credit_card_id
                ? padEnd
                : period_end
        for (const charge of expandSubscriptionChargesInYmdRange(s, rangeStart, rangeEnd)) {
            if (
                !subscriptionChargeInMonth(
                    charge.chargeDate,
                    s,
                    args.yearMonth,
                    period_start,
                    period_end,
                    closingLookup,
                )
            ) {
                continue
            }
            if (postedBySubscriptionDay.has(`${s.id}:${charge.chargeYmd}`)) continue
            const b = ensureBucket(out, categoryId)
            b.projectedSubscriptionsTotal += charge.amount
        }
    }

    for (const [categoryId, b] of Object.entries(out)) {
        out[categoryId] = {
            ...b,
            committedTotal:
                (Number(b.postedTotal) || 0) +
                (Number(b.projectedInstallmentsTotal) || 0) +
                (Number(b.projectedSubscriptionsTotal) || 0),
        }
    }
    return out
}
