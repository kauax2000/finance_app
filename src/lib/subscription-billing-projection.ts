import type {
    SubscriptionBillingInterval,
    WorkspaceSubscription,
} from "@/lib/supabase"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"

export type SubscriptionCharge = {
    subscriptionId: string
    chargeDate: Date
    chargeYmd: string
    amount: number
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

export function advanceBilling(
    d: Date,
    interval: SubscriptionBillingInterval,
): Date {
    if (interval === "weekly") return addDays(d, 7)
    if (interval === "monthly") return addMonths(d, 1)
    return addYears(d, 1)
}

export function rewindBilling(
    d: Date,
    interval: SubscriptionBillingInterval,
): Date {
    if (interval === "weekly") return addDays(d, -7)
    if (interval === "monthly") return addMonths(d, -1)
    return addYears(d, -1)
}

export function subscriptionAnchor(
    s: Pick<WorkspaceSubscription, "next_billing_date" | "start_date">,
): Date | null {
    if (s.next_billing_date) {
        const d = parseYmdLocal(s.next_billing_date.slice(0, 10))
        return d ?? null
    }
    const d = parseYmdLocal(s.start_date.slice(0, 10))
    return d ?? null
}

function compareYmd(a: string, b: string): number {
    return a.localeCompare(b)
}

/** All billing charges with `chargeYmd` in `[rangeStartYmd, rangeEndYmd]` (inclusive). */
export function expandSubscriptionChargesInYmdRange(
    sub: WorkspaceSubscription,
    rangeStartYmd: string,
    rangeEndYmd: string,
): SubscriptionCharge[] {
    if (!sub.is_active) return []
    const anchor = subscriptionAnchor(sub)
    if (!anchor) return []

    const out: SubscriptionCharge[] = []
    let cur = new Date(anchor.getTime())
    let guard = 0
    while (compareYmd(localYmdFromDate(cur), rangeEndYmd) > 0 && guard < 500) {
        cur = rewindBilling(cur, sub.billing_interval)
        guard++
    }
    guard = 0
    while (compareYmd(localYmdFromDate(cur), rangeStartYmd) < 0 && guard < 500) {
        cur = advanceBilling(cur, sub.billing_interval)
        guard++
    }
    guard = 0
    while (compareYmd(localYmdFromDate(cur), rangeEndYmd) <= 0 && guard < 500) {
        const ymd = localYmdFromDate(cur)
        if (compareYmd(ymd, rangeStartYmd) >= 0) {
            out.push({
                subscriptionId: sub.id,
                chargeDate: new Date(cur.getTime()),
                chargeYmd: ymd,
                amount: Number(sub.amount) || 0,
            })
        }
        cur = advanceBilling(cur, sub.billing_interval)
        guard++
    }
    return out
}
