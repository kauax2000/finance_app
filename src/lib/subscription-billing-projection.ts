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

/**
 * Soma meses mantendo o dia-âncora, cortado no último dia do mês de destino.
 *
 * Sem âncora vale o dia de `d`, que é a regra antiga (os vetores dourados). Com
 * âncora, uma cobrança do dia 31 passa por 28/02 e **volta** a 31/03 — é a mesma
 * regra de `public.next_subscription_billing_date(from, interval, anchor_day)`.
 */
function addMonths(d: Date, n: number, anchorDay?: number | null): Date {
    const t = new Date(d.getFullYear(), d.getMonth() + n, 1, 12, 0, 0, 0)
    const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
    t.setDate(Math.min(anchorDay ?? d.getDate(), dim))
    return t
}

function addDays(d: Date, n: number): Date {
    const t = new Date(d.getTime())
    t.setDate(t.getDate() + n)
    return t
}

function monthsFor(interval: SubscriptionBillingInterval): number {
    if (interval === "monthly") return 1
    if (interval === "bimonthly") return 2
    return 12
}

export function advanceBilling(
    d: Date,
    interval: SubscriptionBillingInterval,
    anchorDay?: number | null,
): Date {
    if (interval === "weekly") return addDays(d, 7)
    return addMonths(d, monthsFor(interval), anchorDay)
}

export function rewindBilling(
    d: Date,
    interval: SubscriptionBillingInterval,
    anchorDay?: number | null,
): Date {
    if (interval === "weekly") return addDays(d, -7)
    return addMonths(d, -monthsFor(interval), anchorDay)
}

/** Dia-âncora da assinatura: a coluna, ou o dia da referência para linhas antigas. */
export function subscriptionAnchorDay(
    s: Pick<WorkspaceSubscription, "billing_anchor_day" | "next_billing_date" | "start_date">,
): number | null {
    if (s.billing_anchor_day != null) return s.billing_anchor_day
    return subscriptionAnchor(s)?.getDate() ?? null
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
    const anchorDay = subscriptionAnchorDay(sub)

    const out: SubscriptionCharge[] = []
    let cur = new Date(anchor.getTime())
    let guard = 0
    while (compareYmd(localYmdFromDate(cur), rangeEndYmd) > 0 && guard < 500) {
        cur = rewindBilling(cur, sub.billing_interval, anchorDay)
        guard++
    }
    guard = 0
    while (compareYmd(localYmdFromDate(cur), rangeStartYmd) < 0 && guard < 500) {
        cur = advanceBilling(cur, sub.billing_interval, anchorDay)
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
        cur = advanceBilling(cur, sub.billing_interval, anchorDay)
        guard++
    }
    return out
}
