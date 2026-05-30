import type {
    CreditCard,
    SubscriptionBillingInterval,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import type { BillInstanceCalendarRow } from "@/lib/queries/fetch-bills-dashboard"
import {
    buildGlobalInstallmentDedupeKeys,
    expandRemainingInstallmentCharges,
    isProjectedChargeAlreadyPosted,
    type ProjectedInstallmentCharge,
} from "@/lib/credit-card-installment-projection"
import {
    estimatedDueDateForClose,
    statementCloseInMonth,
} from "@/lib/credit-card-billing"
import {
    buildCreditCardClosingLookup,
    projectedChargeCountsInExpenseMonth,
    projectedSubscriptionCountsInExpenseMonth,
    type CreditCardClosingLookup,
} from "@/lib/expense-month-attribution"
import { formatYearMonth, paddedBoundsForYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { expandSubscriptionChargesInYmdRange } from "@/lib/subscription-billing-projection"
import { localYmdFromDate, parseYmdLocal, transactionCalendarParts } from "@/lib/transaction-date"

export type PaymentEventKind =
    | "subscription"
    | "installment"
    | "card_close"
    | "card_due"
    | "bill_due"
    | "posted_income"
    | "posted_expense"

export type PaymentEventStatus = "past" | "today" | "future"

/** Chip de meta: planejados (sub, parcela prevista, cartão, conta) ou parcela já lançada (`installmentPlanId`). */
export function paymentEventHasMetaBadge(input: {
    kind: PaymentEventKind
    installmentPlanId?: string | null
}): boolean {
    const { kind, installmentPlanId } = input
    if (kind === "posted_income" || kind === "posted_expense") {
        return Boolean(installmentPlanId?.trim())
    }
    return (
        kind === "subscription" ||
        kind === "installment" ||
        kind === "card_close" ||
        kind === "card_due" ||
        kind === "bill_due"
    )
}

export type PaymentEvent = {
    id: string
    dateYmd: string
    kind: PaymentEventKind
    title: string
    amount: number | null
    sourceHref: string | null
    status: PaymentEventStatus
    /** Optional: subscription / plan id for links */
    metaId?: string
    /** For `posted_income` / `posted_expense`: real `transactions.id` */
    transactionId?: string
    /** When posted row is a compra parcelada slice — drives Parcelada chip. */
    installmentPlanId?: string | null
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

function advanceBilling(
    d: Date,
    interval: SubscriptionBillingInterval
): Date {
    if (interval === "weekly") return addDays(d, 7)
    if (interval === "monthly") return addMonths(d, 1)
    return addYears(d, 1)
}

function rewindBilling(
    d: Date,
    interval: SubscriptionBillingInterval
): Date {
    if (interval === "weekly") return addDays(d, -7)
    if (interval === "monthly") return addMonths(d, -1)
    return addYears(d, -1)
}

function monthBounds(ym: string): { start: Date; end: Date } | null {
    const [ys, ms] = ym.split("-")
    const y = Number(ys)
    const m = Number(ms)
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12)
        return null
    const start = new Date(y, m - 1, 1, 12, 0, 0, 0)
    const end = new Date(y, m, 0, 12, 0, 0, 0)
    return { start, end }
}

function compareYmd(a: string, b: string): number {
    return a.localeCompare(b)
}

function eventStatus(dateYmd: string, todayYmd: string): PaymentEventStatus {
    const c = compareYmd(dateYmd, todayYmd)
    if (c < 0) return "past"
    if (c > 0) return "future"
    return "today"
}

function subscriptionAnchor(s: WorkspaceSubscription): Date | null {
    if (s.next_billing_date) {
        const d = parseYmdLocal(s.next_billing_date.slice(0, 10))
        return d ?? null
    }
    const d = parseYmdLocal(s.start_date.slice(0, 10))
    return d ?? null
}

const kindSortOrder: Record<PaymentEventKind, number> = {
    card_close: 0,
    card_due: 1,
    bill_due: 2,
    subscription: 3,
    installment: 4,
    posted_expense: 5,
    posted_income: 6,
}

/** Whether a projected sub/installment event counts toward expense month `ym`. */
export function paymentEventCountsInExpenseMonth(
    e: PaymentEvent,
    ym: string,
    args: {
        subscriptions: WorkspaceSubscription[]
        installmentPlans: WorkspaceInstallmentPlan[]
        closingLookup: CreditCardClosingLookup
    },
): boolean {
    if (e.kind !== "subscription" && e.kind !== "installment") return true
    const chargeDate = parseYmdLocal(e.dateYmd)
    if (!chargeDate) return false

    if (e.kind === "subscription") {
        const sub = args.subscriptions.find((s) => s.id === e.metaId)
        if (!sub) return false
        if (sub.payment_method === "credit_card" && sub.payment_credit_card_id) {
            return projectedSubscriptionCountsInExpenseMonth(
                chargeDate,
                sub,
                ym,
                args.closingLookup,
            )
        }
        const { period_start, period_end } = periodBoundsFromYearMonth(ym)
        return e.dateYmd >= period_start && e.dateYmd <= period_end
    }

    const plan = args.installmentPlans.find((p) => p.id === e.metaId)
    if (!plan) return false
    if (plan.payment_method === "credit_card" && plan.payment_credit_card_id) {
        return projectedChargeCountsInExpenseMonth(
            chargeDate,
            plan,
            ym,
            args.closingLookup,
        )
    }
    const { period_start, period_end } = periodBoundsFromYearMonth(ym)
    return e.dateYmd >= period_start && e.dateYmd <= period_end
}

/** All payment / calendar events for a visible month (`YYYY-MM`). */
export function buildPaymentEventsForMonth(
    ym: string,
    args: {
        todayYmd: string
        subscriptions: WorkspaceSubscription[]
        installmentPlans: WorkspaceInstallmentPlan[]
        creditCards: CreditCard[]
        transactions: Transaction[]
        pendingBillInstances?: BillInstanceCalendarRow[]
    }
): PaymentEvent[] {
    const bounds = monthBounds(ym)
    if (!bounds) return []
    const monthStartYmd = localYmdFromDate(bounds.start)
    const monthEndYmd = localYmdFromDate(bounds.end)
    const { todayYmd } = args
    const installmentDedupe = buildGlobalInstallmentDedupeKeys(args.transactions)
    const closingLookup = buildCreditCardClosingLookup(args.creditCards)
    const { padStart, padEnd } = paddedBoundsForYearMonth(ym)
    const out: PaymentEvent[] = []
    const postedBySubscriptionDay = new Set<string>()
    for (const t of args.transactions) {
        if (t.type !== "expense") continue
        const sid = t.subscription_id
        if (!sid) continue
        const p = transactionCalendarParts(t.date)
        if (!p) continue
        const ymd = `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
        postedBySubscriptionDay.add(`${sid}:${ymd}`)
    }

    for (const s of args.subscriptions) {
        if (!s.is_active) continue
        const isCc = s.payment_method === "credit_card" && s.payment_credit_card_id
        const rangeStart = isCc ? padStart : monthStartYmd
        const rangeEnd = isCc ? padEnd : monthEndYmd
        for (const charge of expandSubscriptionChargesInYmdRange(s, rangeStart, rangeEnd)) {
            if (isCc) {
                if (
                    !projectedSubscriptionCountsInExpenseMonth(
                        charge.chargeDate,
                        s,
                        ym,
                        closingLookup,
                    )
                ) {
                    continue
                }
            } else if (
                compareYmd(charge.chargeYmd, monthStartYmd) < 0 ||
                compareYmd(charge.chargeYmd, monthEndYmd) > 0
            ) {
                continue
            }
            if (postedBySubscriptionDay.has(`${s.id}:${charge.chargeYmd}`)) continue
            out.push({
                id: `sub-${s.id}-${charge.chargeYmd}`,
                dateYmd: charge.chargeYmd,
                kind: "subscription",
                title: s.name,
                amount: charge.amount,
                sourceHref: `/transactions?sub=${encodeURIComponent(s.id)}`,
                status: eventStatus(charge.chargeYmd, todayYmd),
                metaId: s.id,
            })
        }
    }

    for (const p of args.installmentPlans) {
        if (!p.is_active) continue
        const isCc = p.payment_method === "credit_card" && p.payment_credit_card_id
        for (const charge of expandRemainingInstallmentCharges(p)) {
            const ymd = localYmdFromDate(charge.chargeDate)
            const inVisibleMonth = isCc
                ? projectedChargeCountsInExpenseMonth(
                      charge.chargeDate,
                      p,
                      ym,
                      closingLookup,
                  )
                : compareYmd(ymd, monthStartYmd) >= 0 &&
                  compareYmd(ymd, monthEndYmd) <= 0
            if (!inVisibleMonth) continue
            const projected: ProjectedInstallmentCharge = {
                planId: p.id,
                chargeDate: charge.chargeDate,
                amount: charge.amount,
                installmentSequence: charge.installmentSequence,
            }
            if (!isProjectedChargeAlreadyPosted(projected, installmentDedupe)) {
                out.push({
                    id: `inst-${p.id}-${ymd}`,
                    dateYmd: ymd,
                    kind: "installment",
                    title: p.description?.trim() || "Parcelada",
                    amount: charge.amount,
                    sourceHref: `/transactions?plan=${encodeURIComponent(p.id)}`,
                    status: eventStatus(ymd, todayYmd),
                    metaId: p.id,
                })
            }
        }
    }

    const [yStr, mStr] = ym.split("-")
    const y = Number(yStr)
    const m0 = Number(mStr) - 1
    if (Number.isFinite(y) && m0 >= 0 && m0 <= 11) {
        for (const card of args.creditCards) {
            if (!card.is_active) continue
            const close = statementCloseInMonth(y, m0, card.closing_day)
            const closeYmd = localYmdFromDate(close)
            out.push({
                id: `close-${card.id}-${closeYmd}`,
                dateYmd: closeYmd,
                kind: "card_close",
                title: `Fechamento · ${card.name}`,
                amount: null,
                sourceHref: `/credit-cards/${encodeURIComponent(card.id)}`,
                status: eventStatus(closeYmd, todayYmd),
                metaId: card.id,
            })
            const due = estimatedDueDateForClose(close, card.due_day)
            const dueYmd = localYmdFromDate(due)
            if (
                compareYmd(dueYmd, monthStartYmd) >= 0 &&
                compareYmd(dueYmd, monthEndYmd) <= 0
            ) {
                out.push({
                    id: `due-${card.id}-${dueYmd}`,
                    dateYmd: dueYmd,
                    kind: "card_due",
                    title: `Vencimento · ${card.name}`,
                    amount: null,
                    sourceHref: `/credit-cards/${encodeURIComponent(card.id)}`,
                    status: eventStatus(dueYmd, todayYmd),
                    metaId: card.id,
                })
            }
        }
    }

    for (const row of args.pendingBillInstances ?? []) {
        if (row.status !== "pending") continue
        const b = row.bill
        if (!b || !b.is_active) continue
        const ymd = row.due_date.slice(0, 10)
        if (compareYmd(ymd, monthStartYmd) < 0 || compareYmd(ymd, monthEndYmd) > 0)
            continue
        const amt =
            b.amount_estimated != null && Number.isFinite(Number(b.amount_estimated))
                ? Number(b.amount_estimated)
                : null
        out.push({
            id: `bill-${row.bill_id}-${ymd}`,
            dateYmd: ymd,
            kind: "bill_due",
            title: b.name,
            amount: amt,
            sourceHref: `/bills?detail=${encodeURIComponent(row.bill_id)}`,
            status: eventStatus(ymd, todayYmd),
            metaId: row.bill_id,
        })
    }

    for (const t of args.transactions) {
        const p = transactionCalendarParts(t.date)
        if (!p) continue
        const ymd = `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
        if (compareYmd(ymd, monthStartYmd) < 0 || compareYmd(ymd, monthEndYmd) > 0) continue
        const desc =
            t.description?.trim() ||
            t.category?.name ||
            (t.type === "income" ? "Receita" : "Despesa")
        const planId = t.installment_plan_id?.trim() || null
        out.push({
            id: `tx-${t.id}`,
            dateYmd: ymd,
            kind: t.type === "income" ? "posted_income" : "posted_expense",
            title: desc,
            amount: Number(t.amount),
            sourceHref: "/transactions",
            status: eventStatus(ymd, todayYmd),
            transactionId: t.id,
            ...(planId ? { installmentPlanId: planId } : {}),
        })
    }

    out.sort((a, b) => {
        const d = a.dateYmd.localeCompare(b.dateYmd)
        if (d !== 0) return d
        return kindSortOrder[a.kind] - kindSortOrder[b.kind]
    })

    return out
}

export type UpcomingPaymentRow = {
    id: string
    dateYmd: string
    kind: PaymentEventKind
    title: string
    amount: number | null
    sourceHref: string | null
    daysUntil: number
    metaId?: string
    installmentPlanId?: string | null
}

/** Next N rows from today onward (incl. hoje), excluding past-only posted noise for calendar; we skip pure posted_* here. */
export function buildUpcomingPayments(
    events: PaymentEvent[],
    todayYmd: string,
    limit: number = 12
): UpcomingPaymentRow[] {
    const today = parseYmdLocal(todayYmd)
    if (!today) return []
    const rows: UpcomingPaymentRow[] = []
    const seen = new Set<string>()
    for (const e of events) {
        if (e.kind === "posted_income" || e.kind === "posted_expense") continue
        if (e.status === "past") continue
        if (seen.has(e.id)) continue
        seen.add(e.id)
        const d = parseYmdLocal(e.dateYmd)
        if (!d) continue
        const t0 = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        )
        const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const daysUntil = Math.round((d0.getTime() - t0.getTime()) / 86_400_000)
        if (daysUntil < 0) continue
        rows.push({
            id: e.id,
            dateYmd: e.dateYmd,
            kind: e.kind,
            title: e.title,
            amount: e.amount,
            sourceHref: e.sourceHref,
            daysUntil,
            metaId: e.metaId,
            installmentPlanId: e.installmentPlanId,
        })
    }
    rows.sort((a, b) => a.dateYmd.localeCompare(b.dateYmd))
    return rows.slice(0, limit)
}

function pickEarlierPaymentEvent(a: PaymentEvent, b: PaymentEvent): PaymentEvent {
    const d = compareYmd(a.dateYmd, b.dateYmd)
    if (d < 0) return a
    if (d > 0) return b
    return kindSortOrder[a.kind] <= kindSortOrder[b.kind] ? a : b
}

/** Sidebar list for the visible calendar month only: today onward, one row per subscription/installment source. */
export function buildUpcomingPaymentsForVisibleMonth(
    calendarMonthEvents: PaymentEvent[],
    todayYmd: string
): UpcomingPaymentRow[] {
    const today = parseYmdLocal(todayYmd)
    if (!today) return []

    const eligible = calendarMonthEvents.filter((e) => {
        if (
            e.kind !== "subscription" &&
            e.kind !== "installment" &&
            e.kind !== "card_close" &&
            e.kind !== "card_due" &&
            e.kind !== "bill_due"
        ) {
            return false
        }
        return compareYmd(e.dateYmd, todayYmd) >= 0
    })

    const byKey = new Map<string, PaymentEvent>()
    for (const e of eligible) {
        if (
            e.kind === "subscription" ||
            e.kind === "installment" ||
            e.kind === "bill_due"
        ) {
            const key = `${e.kind}:${e.metaId ?? e.id}`
            const prev = byKey.get(key)
            byKey.set(key, prev ? pickEarlierPaymentEvent(prev, e) : e)
        } else {
            byKey.set(e.id, e)
        }
    }

    const merged = [...byKey.values()]
    merged.sort((a, b) => {
        const d = a.dateYmd.localeCompare(b.dateYmd)
        if (d !== 0) return d
        return kindSortOrder[a.kind] - kindSortOrder[b.kind]
    })

    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const rows: UpcomingPaymentRow[] = []
    for (const e of merged) {
        const d = parseYmdLocal(e.dateYmd)
        if (!d) continue
        const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const daysUntil = Math.round((d0.getTime() - t0.getTime()) / 86_400_000)
        rows.push({
            id: e.id,
            dateYmd: e.dateYmd,
            kind: e.kind,
            title: e.title,
            amount: e.amount,
            sourceHref: e.sourceHref,
            daysUntil,
            metaId: e.metaId,
            installmentPlanId: e.installmentPlanId,
        })
    }
    return rows
}

/** Merge events for several months (e.g. current + next) for upcoming list. */
export function buildPaymentEventsForMonths(
    yms: string[],
    args: Omit<Parameters<typeof buildPaymentEventsForMonth>[1], never>
): PaymentEvent[] {
    const map = new Map<string, PaymentEvent>()
    for (const ym of yms) {
        for (const e of buildPaymentEventsForMonth(ym, args)) {
            map.set(e.id, e)
        }
    }
    return [...map.values()].sort((a, b) => {
        const d = a.dateYmd.localeCompare(b.dateYmd)
        if (d !== 0) return d
        return a.id.localeCompare(b.id)
    })
}

export function calendarMonthKeysAround(
    centerYm: string,
    extraMonths: number
): string[] {
    const keys: string[] = []
    const [y, m] = centerYm.split("-").map(Number)
    if (!y || !m) return [centerYm]
    for (let i = -extraMonths; i <= extraMonths; i++) {
        const d = new Date(y, m - 1 + i, 1)
        keys.push(formatYearMonth(d))
    }
    return keys
}

/** Today + next months (same day-of-month anchor), for upcoming-payment projection. */
export function forwardMonthKeysFromToday(inclusiveMonths: number = 6): string[] {
    const d = new Date()
    const keys: string[] = []
    for (let i = 0; i < inclusiveMonths; i++) {
        keys.push(formatYearMonth(new Date(d.getFullYear(), d.getMonth() + i, 1)))
    }
    return keys
}
