import type {
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import { localYmdFromDate, parseYmdLocal, transactionCalendarParts } from "@/lib/transaction-date"
import { periodBoundsFromYearMonth } from "@/lib/budget-month"
import {
    buildGlobalInstallmentDedupeKeys,
    expandRemainingInstallmentCharges,
    isProjectedChargeAlreadyPosted,
} from "@/lib/credit-card-installment-projection"

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

function addMonths(d: Date, n: number): Date {
    const y = d.getFullYear()
    const m0 = d.getMonth()
    const day = d.getDate()
    const t = new Date(y, m0 + n, 1, 12, 0, 0, 0)
    const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
    t.setDate(Math.min(day, dim))
    return t
}

function addDays(d: Date, n: number): Date {
    const t = new Date(d.getTime())
    t.setDate(t.getDate() + n)
    return t
}

function addYears(d: Date, n: number): Date {
    return addMonths(d, n * 12)
}

function advanceBilling(d: Date, interval: "weekly" | "monthly" | "yearly"): Date {
    if (interval === "weekly") return addDays(d, 7)
    if (interval === "monthly") return addMonths(d, 1)
    return addYears(d, 1)
}

function rewindBilling(d: Date, interval: "weekly" | "monthly" | "yearly"): Date {
    if (interval === "weekly") return addDays(d, -7)
    if (interval === "monthly") return addMonths(d, -1)
    return addYears(d, -1)
}

function subscriptionAnchor(s: WorkspaceSubscription): Date | null {
    if (s.next_billing_date) {
        const d = parseYmdLocal(s.next_billing_date.slice(0, 10))
        return d ?? null
    }
    const d = parseYmdLocal(s.start_date.slice(0, 10))
    return d ?? null
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
    >[]
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
}): CategoryCommitmentsById {
    const { period_start, period_end } = periodBoundsFromYearMonth(args.yearMonth)
    const out: CategoryCommitmentsById = {}

    // Posted totals (this month only, by category).
    for (const t of args.transactions) {
        if (t.type !== "expense") continue
        const categoryId = t.category_id
        if (!categoryId) continue
        const ymd = transactionLocalYmd(t as Pick<Transaction, "date">)
        if (!ymd || ymd < period_start || ymd > period_end) continue
        const b = ensureBucket(out, categoryId)
        b.postedTotal += Number(t.amount) || 0
    }

    // Dedupe helpers.
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

    // Projected installments (remaining only), bucketed by category_id.
    for (const p of args.installmentPlans) {
        if (!p.is_active) continue
        const categoryId = p.category_id
        if (!categoryId) continue
        for (const charge of expandRemainingInstallmentCharges(p)) {
            const ymd = localYmdFromDate(charge.chargeDate)
            if (ymd < period_start || ymd > period_end) continue
            if (isProjectedChargeAlreadyPosted(charge, installmentDedupe)) continue
            const b = ensureBucket(out, categoryId)
            b.projectedInstallmentsTotal += Number(charge.amount) || 0
        }
    }

    // Projected subscriptions (within month), bucketed by category_id.
    for (const s of args.subscriptions) {
        if (!s.is_active) continue
        const categoryId = s.category_id
        if (!categoryId) continue
        const anchor = subscriptionAnchor(s)
        if (!anchor) continue

        let cur = new Date(anchor.getTime())
        let guard = 0
        while (localYmdFromDate(cur) > period_end && guard < 500) {
            cur = rewindBilling(cur, s.billing_interval)
            guard++
        }
        guard = 0
        while (localYmdFromDate(cur) < period_start && guard < 500) {
            cur = advanceBilling(cur, s.billing_interval)
            guard++
        }
        guard = 0
        while (localYmdFromDate(cur) <= period_end && guard < 500) {
            const ymd = localYmdFromDate(cur)
            if (ymd >= period_start) {
                if (!postedBySubscriptionDay.has(`${s.id}:${ymd}`)) {
                    const b = ensureBucket(out, categoryId)
                    b.projectedSubscriptionsTotal += Number(s.amount) || 0
                }
            }
            cur = advanceBilling(cur, s.billing_interval)
            guard++
        }
    }

    // Final committed totals.
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

