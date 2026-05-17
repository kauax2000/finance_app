/**
 * Brazilian-style credit card billing cycles from calendar `closing_day` / `due_day`.
 * Uses the browser/workspace-local calendar (consistent with `transaction-date.ts`).
 *
 * Assumptions (documented for users in UI copy):
 * - Statement closes on `min(closing_day, daysInMonth)` each month.
 * - Purchases from the day after the previous close through the close date (inclusive) belong to that invoice.
 * - Due dates are estimates; issuers vary (same month vs next, business days).
 */

import {
    expandAllPlanCharges,
    sumProjectedCreditCardInstallmentsInWindow,
} from "@/lib/credit-card-installment-projection"
import {
    localYmdFromDate,
    transactionCalendarParts,
} from "@/lib/transaction-date"
import type { Transaction, WorkspaceInstallmentPlan } from "@/lib/supabase"

export type CreditCardInvoiceSlot = "open" | "last_closed" | "older"

const MS_DAY = 86_400_000

function daysInMonth(year: number, monthIndex0: number): number {
    return new Date(year, monthIndex0 + 1, 0).getDate()
}

/** Local calendar date at noon (stable ordering, matches transaction storage). */
export function localNoonDate(y: number, monthIndex0: number, day: number): Date {
    return new Date(y, monthIndex0, day, 12, 0, 0, 0)
}

function clampClosingDay(year: number, monthIndex0: number, closingDay: number): number {
    return Math.min(closingDay, daysInMonth(year, monthIndex0))
}

/** Statement close calendar date in the given month. */
export function statementCloseInMonth(
    year: number,
    monthIndex0: number,
    closingDay: number
): Date {
    const d = clampClosingDay(year, monthIndex0, closingDay)
    return localNoonDate(year, monthIndex0, d)
}

function ymdFromDate(d: Date): { y: number; m0: number; d: number } {
    return {
        y: d.getFullYear(),
        m0: d.getMonth(),
        d: d.getDate(),
    }
}

/** Compare calendar dates only (local). */
export function compareCalendarDates(a: Date, b: Date): number {
    const A = ymdFromDate(a)
    const B = ymdFromDate(b)
    if (A.y !== B.y) return A.y - B.y
    if (A.m0 !== B.m0) return A.m0 - B.m0
    return A.d - B.d
}

/**
 * Latest statement close on or before `ref` (calendar day in ref's timezone).
 */
export function statementCloseOnOrBefore(ref: Date, closingDay: number): Date {
    let y = ref.getFullYear()
    let m0 = ref.getMonth()
    for (let i = 0; i < 240; i++) {
        const close = statementCloseInMonth(y, m0, closingDay)
        if (compareCalendarDates(close, ref) <= 0) {
            return close
        }
        m0 -= 1
        if (m0 < 0) {
            m0 = 11
            y -= 1
        }
    }
    throw new Error("statementCloseOnOrBefore: could not find close within range")
}

/**
 * Earliest statement close strictly after `ref`.
 */
export function nextCloseAfter(ref: Date, closingDay: number): Date {
    let y = ref.getFullYear()
    let m0 = ref.getMonth()
    for (let i = 0; i < 240; i++) {
        const close = statementCloseInMonth(y, m0, closingDay)
        if (compareCalendarDates(close, ref) > 0) {
            return close
        }
        m0 += 1
        if (m0 > 11) {
            m0 = 0
            y += 1
        }
    }
    throw new Error("nextCloseAfter: could not find close within range")
}

/**
 * Previous statement close strictly before `closeDate` (another close date).
 */
export function previousStatementCloseBefore(closeDate: Date, closingDay: number): Date {
    const prev = new Date(closeDate.getTime() - MS_DAY)
    return statementCloseOnOrBefore(prev, closingDay)
}

/**
 * Invoice window containing `purchase`: inclusive end on statement close.
 */
export function invoiceWindowForPurchaseDate(
    purchase: Date,
    closingDay: number
): { start: Date; end: Date } {
    const end = firstCloseOnOrAfter(purchase, closingDay)
    const prevClose = previousStatementCloseBefore(end, closingDay)
    const start = new Date(prevClose.getTime() + MS_DAY)
    return { start, end }
}

/**
 * YYYY-MM-DD (local calendar) of the statement close for the invoice window
 * that contains this purchase — matches `credit_card_invoice_payments.statement_close_date`.
 */
export function statementCloseYmdForPurchaseDate(
    transactionIsoDate: string,
    closingDay: number
): string | null {
    const purchase = transactionLocalNoon(transactionIsoDate)
    if (!purchase) return null
    const { end } = invoiceWindowForPurchaseDate(purchase, closingDay)
    return localYmdFromDate(end)
}

/** Smallest statement close date >= purchase (calendar). */
export function firstCloseOnOrAfter(purchase: Date, closingDay: number): Date {
    let y = purchase.getFullYear()
    let m0 = purchase.getMonth()
    for (let i = 0; i < 240; i++) {
        const close = statementCloseInMonth(y, m0, closingDay)
        if (compareCalendarDates(close, purchase) >= 0) {
            return close
        }
        m0 += 1
        if (m0 > 11) {
            m0 = 0
            y += 1
        }
    }
    throw new Error("firstCloseOnOrAfter: could not find close within range")
}

/**
 * Classify a purchase date vs "today" into open cycle, last closed cycle, or older.
 */
export function classifyPurchaseVsToday(
    purchase: Date,
    closingDay: number,
    today: Date
): CreditCardInvoiceSlot {
    const lastClose = statementCloseOnOrBefore(today, closingDay)
    const nextClose = nextCloseAfter(lastClose, closingDay)
    const prevClose = previousStatementCloseBefore(lastClose, closingDay)

    if (
        compareCalendarDates(purchase, lastClose) > 0 &&
        compareCalendarDates(purchase, nextClose) <= 0
    ) {
        return "open"
    }
    if (
        compareCalendarDates(purchase, prevClose) > 0 &&
        compareCalendarDates(purchase, lastClose) <= 0
    ) {
        return "last_closed"
    }
    return "older"
}

export function creditCardInvoiceSlotLabelPt(slot: CreditCardInvoiceSlot): string {
    switch (slot) {
        case "open":
            return "Fatura aberta"
        case "last_closed":
            return "Fatura fechada"
        case "older":
            return "Fatura anterior"
        default:
            return slot
    }
}

/**
 * Estimated due date for the invoice that closed on `closeDate`.
 * Heuristic: due in the month after the close month, on min(dueDay, daysInMonth).
 */
export function estimatedDueDateForClose(closeDate: Date, dueDay: number): Date {
    const y = closeDate.getFullYear()
    const m0 = closeDate.getMonth()
    let dueM0 = m0 + 1
    let dueY = y
    if (dueM0 > 11) {
        dueM0 = 0
        dueY += 1
    }
    const day = Math.min(dueDay, daysInMonth(dueY, dueM0))
    return localNoonDate(dueY, dueM0, day)
}

function startOfLocalDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** True when `today`'s local calendar date is strictly after the estimated due date. */
export function isEstimatedDuePastForClose(
    closeDate: Date,
    dueDay: number,
    today: Date = new Date()
): boolean {
    const due = estimatedDueDateForClose(closeDate, dueDay)
    const t0 = startOfLocalDay(today).getTime()
    const d0 = startOfLocalDay(due).getTime()
    return t0 > d0
}

export function formatDatePtBr(d: Date): string {
    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

function transactionLocalNoon(isoOrString: string): Date | null {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return null
    return localNoonDate(p.y, p.mo - 1, p.d)
}

function isDateInInclusiveRange(d: Date, start: Date, end: Date): boolean {
    return compareCalendarDates(d, start) >= 0 && compareCalendarDates(d, end) <= 0
}

/**
 * Rows linked to `workspace_installment_plans` post each parcel with `installment_sequence` >= 1.
 * A duplicate **anchor** row (same plan, no sequence / legacy full purchase) must not inflate fatura
 * totals once real parcel rows exist for that plan.
 */
export type CreditCardInvoiceSumTx = Pick<
    Transaction,
    | "type"
    | "amount"
    | "date"
    | "payment_method"
    | "payment_credit_card_id"
    | "installment_plan_id"
    | "installment_sequence"
>

export function shouldCountCreditCardExpenseForInvoiceSum(
    t: Pick<
        Transaction,
        | "type"
        | "payment_method"
        | "payment_credit_card_id"
        | "installment_plan_id"
        | "installment_sequence"
    >,
    cardId: string,
    allTransactions: Pick<
        Transaction,
        | "type"
        | "payment_method"
        | "payment_credit_card_id"
        | "installment_plan_id"
        | "installment_sequence"
    >[]
): boolean {
    if (t.type !== "expense") return false
    if (t.payment_method !== "credit_card") return false
    if (t.payment_credit_card_id !== cardId) return false
    const pid = t.installment_plan_id
    if (!pid) return true
    const seq = t.installment_sequence
    if (seq != null && seq >= 1) return true
    const planHasParcelRows = allTransactions.some(
        (x) =>
            x.type === "expense" &&
            x.payment_method === "credit_card" &&
            x.installment_plan_id === pid &&
            x.installment_sequence != null &&
            x.installment_sequence >= 1
    )
    return !planHasParcelRows
}

/** Sum credit-card expenses for a card whose transaction date falls in [start, end] (calendar inclusive). */
export function sumCreditCardExpensesInWindow(
    transactions: CreditCardInvoiceSumTx[],
    cardId: string,
    start: Date,
    end: Date
): number {
    let sum = 0
    const included: {
        amount: number
        date: string
        installment_plan_id: string | null
        installment_sequence: number | null
    }[] = []
    for (const t of transactions) {
        if (t.type !== "expense") continue
        if (t.payment_method !== "credit_card") continue
        if (t.payment_credit_card_id !== cardId) continue
        if (!shouldCountCreditCardExpenseForInvoiceSum(t, cardId, transactions)) {
            continue
        }
        const td = transactionLocalNoon(t.date)
        if (!td) continue
        if (!isDateInInclusiveRange(td, start, end)) continue
        sum += Number(t.amount)
        included.push({
            amount: Number(t.amount),
            date: t.date,
            installment_plan_id: t.installment_plan_id ?? null,
            installment_sequence: t.installment_sequence ?? null,
        })
    }
    return sum
}

export type CardCycleSnapshot = {
    lastClose: Date
    nextClose: Date
    prevClose: Date
    openWindow: { start: Date; end: Date }
    lastClosedWindow: { start: Date; end: Date }
    /** Sum of posted credit-card expenses in the open invoice window. */
    openTotal: number
    /**
     * Remaining parcelas from `workspace_installment_plans` whose charge date falls in the open
     * window, excluding charges already posted as transactions.
     */
    projectedOpenInstallmentsTotal: number
    /** openTotal + projectedOpenInstallmentsTotal (full picture for planning). */
    committedOpenTotal: number
    lastClosedTotal: number
    /**
     * Parcelas expected to be charged in the last closed window, but not yet present as posted
     * transactions (backfill / missing rows).
     */
    projectedLastClosedInstallmentsTotal: number
    /** lastClosedTotal + projectedLastClosedInstallmentsTotal (full picture for planning). */
    committedLastClosedTotal: number
    estimatedDueLastClose: Date
}

export type CardMonthlyInvoiceStatus = "closed" | "open" | "not_open"

export type CardMonthlyInvoiceSnapshot = {
    /** Statement close date for the selected month. */
    close: Date
    /** Invoice window that ends on `close`. */
    window: { start: Date; end: Date }
    /** Estimated due date for this statement. */
    dueEstimate: Date
    /** Sum of posted credit-card expenses in the selected invoice window. */
    postedTotal: number
    /**
     * Remaining parcelas from `workspace_installment_plans` whose charge date falls in the selected
     * window, excluding charges already posted as transactions.
     */
    projectedInstallmentsTotal: number
    /** postedTotal + projectedInstallmentsTotal (full picture for planning). */
    committedTotal: number
    status: CardMonthlyInvoiceStatus
}

function parseYearMonth(ym: string): { y: number; m0: number } | null {
    const t = ym.trim()
    if (!/^\d{4}-\d{2}$/.test(t)) return null
    const [ys, ms] = t.split("-")
    const y = Number(ys)
    const m = Number(ms)
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null
    return { y, m0: m - 1 }
}

export function buildCardMonthlyInvoiceSnapshot(
    card: { id: string; closing_day: number; due_day: number },
    transactions: Pick<
        Transaction,
        | "type"
        | "amount"
        | "date"
        | "payment_method"
        | "payment_credit_card_id"
        | "installment_plan_id"
        | "installment_sequence"
    >[],
    yearMonth: string,
    today: Date = new Date(),
    opts?: { installmentPlans?: WorkspaceInstallmentPlan[] }
): CardMonthlyInvoiceSnapshot {
    const parsed = parseYearMonth(yearMonth)
    if (!parsed) {
        throw new Error(`buildCardMonthlyInvoiceSnapshot: invalid yearMonth ${yearMonth}`)
    }
    const close = statementCloseInMonth(parsed.y, parsed.m0, card.closing_day)
    const prevClose = previousStatementCloseBefore(close, card.closing_day)
    const start = new Date(prevClose.getTime() + MS_DAY)
    const end = close

    const postedTotal = sumCreditCardExpensesInWindow(transactions, card.id, start, end)
    const projectedInstallmentsTotal =
        opts?.installmentPlans != null && opts.installmentPlans.length > 0
            ? sumProjectedCreditCardInstallmentsInWindow(
                  card.id,
                  start,
                  end,
                  opts.installmentPlans,
                  transactions
              )
            : 0

    const committedTotal = postedTotal + projectedInstallmentsTotal
    const dueEstimate = estimatedDueDateForClose(close, card.due_day)

    const status: CardMonthlyInvoiceStatus =
        compareCalendarDates(close, today) < 0
            ? "closed"
            : compareCalendarDates(today, start) >= 0 && compareCalendarDates(today, end) <= 0
              ? "open"
              : "not_open"

    return {
        close,
        window: { start, end },
        dueEstimate,
        postedTotal,
        projectedInstallmentsTotal,
        committedTotal,
        status,
    }
}

/** When `closingDay` is set, classifies the transaction date into open / last_closed / older. */
export function classifyTransactionInvoiceSlot(
    transactionIsoDate: string,
    closingDay: number | null | undefined,
    today: Date = new Date()
): CreditCardInvoiceSlot | null {
    if (closingDay == null || closingDay < 1 || closingDay > 31) return null
    const purchase = transactionLocalNoon(transactionIsoDate)
    if (!purchase) return null
    return classifyPurchaseVsToday(purchase, closingDay, today)
}

/** Hint for expense form: which statement a purchase falls into (estimated due date). */
export function creditCardInvoiceHintForPurchase(
    transactionIsoDate: string,
    card: { closing_day: number; due_day: number },
    today: Date = new Date()
):
    | {
          slot: CreditCardInvoiceSlot
          slotLabel: string
          statementClose: Date
          dueEstimate: Date
      }
    | null {
    const purchase = transactionLocalNoon(transactionIsoDate)
    if (!purchase) return null
    const { end } = invoiceWindowForPurchaseDate(purchase, card.closing_day)
    const dueEstimate = estimatedDueDateForClose(end, card.due_day)
    const slot = classifyPurchaseVsToday(purchase, card.closing_day, today)
    return {
        slot,
        slotLabel: creditCardInvoiceSlotLabelPt(slot),
        statementClose: end,
        dueEstimate,
    }
}

/**
 * Shift the reference "today" passed to {@link buildCardCycleSnapshot} by whole billing cycles.
 * - `offset > 0`: future cycles (ref lands just after the target statement close).
 * - `offset < 0`: past cycles (ref is on the target statement close).
 */
export function shiftRefDateByCycles(
    card: { closing_day: number },
    today: Date,
    offset: number
): Date {
    const cd = card.closing_day
    if (offset === 0) return new Date(today.getTime())
    if (offset > 0) {
        let L = statementCloseOnOrBefore(today, cd)
        for (let i = 0; i < offset; i++) {
            L = nextCloseAfter(L, cd)
        }
        return new Date(L.getTime() + MS_DAY)
    }
    let L = statementCloseOnOrBefore(today, cd)
    for (let i = 0; i < -offset; i++) {
        L = previousStatementCloseBefore(L, cd)
    }
    return new Date(L.getTime())
}

/**
 * Allowed range of cycle offsets for the invoice month switcher (negative = past, positive = future).
 * Anchors on the **open** invoice's statement close (`nextClose` in {@link buildCardCycleSnapshot} at
 * offset 0), not `lastClose`, so bounds stay aligned with {@link shiftRefDateByCycles}.
 *
 * Past bound uses the oldest posted credit-card expense (or stays at 0 if none).
 * Future bound uses the latest projected parcela date from installment plans, else `max = 1`.
 * If there is no expense and no plan for the card, returns `{ min: 0, max: 0 }`.
 */
export function cycleOffsetBoundsForCard(
    card: { id: string; closing_day: number },
    transactions: Pick<
        Transaction,
        "type" | "date" | "payment_method" | "payment_credit_card_id"
    >[],
    plans: WorkspaceInstallmentPlan[],
    today: Date
): { min: number; max: number } {
    const cd = card.closing_day

    let oldest: Date | null = null
    for (const t of transactions) {
        if (t.type !== "expense") continue
        if (t.payment_method !== "credit_card") continue
        if (t.payment_credit_card_id !== card.id) continue
        const d = transactionLocalNoon(t.date)
        if (!d) continue
        if (!oldest || compareCalendarDates(d, oldest) < 0) oldest = d
    }

    const cardPlans = plans.filter(
        (p) => p.is_active && p.payment_credit_card_id === card.id
    )
    let maxCharge: Date | null = null
    for (const p of cardPlans) {
        for (const c of expandAllPlanCharges(p)) {
            if (
                !maxCharge ||
                compareCalendarDates(c.chargeDate, maxCharge) > 0
            ) {
                maxCharge = c.chargeDate
            }
        }
    }

    if (!oldest && !maxCharge) {
        return { min: 0, max: 0 }
    }

    const lastClose = statementCloseOnOrBefore(today, cd)
    /** Statement close of the open invoice (matches `snapshot.nextClose` at cycle offset 0). */
    const L_open_close = nextCloseAfter(lastClose, cd)

    let min = 0
    if (oldest) {
        const L_min = firstCloseOnOrAfter(oldest, cd)
        let L = L_open_close
        let n = 0
        while (compareCalendarDates(L, L_min) > 0) {
            L = previousStatementCloseBefore(L, cd)
            n += 1
            if (n > 500) break
        }
        min = n > 0 ? -n : 0
    }

    let max = 0
    if (maxCharge) {
        const L_furthest = firstCloseOnOrAfter(maxCharge, cd)
        let L = L_open_close
        let n = 0
        while (compareCalendarDates(L, L_furthest) < 0) {
            L = nextCloseAfter(L, cd)
            n += 1
            if (n > 500) break
        }
        max = n
    } else {
        max = 1
    }

    if (min > 0) min = 0
    if (max < 0) max = 0
    if (min > max) {
        return { min: 0, max: 0 }
    }

    return { min, max }
}

export function buildCardCycleSnapshot(
    card: { id: string; closing_day: number; due_day: number },
    transactions: Pick<
        Transaction,
        | "type"
        | "amount"
        | "date"
        | "payment_method"
        | "payment_credit_card_id"
        | "installment_plan_id"
        | "installment_sequence"
    >[],
    today: Date = new Date(),
    opts?: { installmentPlans?: WorkspaceInstallmentPlan[] }
): CardCycleSnapshot {
    const lastClose = statementCloseOnOrBefore(today, card.closing_day)
    const nextClose = nextCloseAfter(lastClose, card.closing_day)
    const prevClose = previousStatementCloseBefore(lastClose, card.closing_day)
    const openStart = new Date(lastClose.getTime() + MS_DAY)
    const openEnd = nextClose
    const lastClosedStart = new Date(prevClose.getTime() + MS_DAY)
    const lastClosedEnd = lastClose
    const openTotal = sumCreditCardExpensesInWindow(
        transactions,
        card.id,
        openStart,
        openEnd
    )
    const projectedOpenInstallmentsTotal =
        opts?.installmentPlans != null && opts.installmentPlans.length > 0
            ? sumProjectedCreditCardInstallmentsInWindow(
                  card.id,
                  openStart,
                  openEnd,
                  opts.installmentPlans,
                  transactions
              )
            : 0
    const committedOpenTotal = openTotal + projectedOpenInstallmentsTotal
    const lastClosedTotal = sumCreditCardExpensesInWindow(
        transactions,
        card.id,
        lastClosedStart,
        lastClosedEnd
    )
    const projectedLastClosedInstallmentsTotal =
        opts?.installmentPlans != null && opts.installmentPlans.length > 0
            ? sumProjectedCreditCardInstallmentsInWindow(
                  card.id,
                  lastClosedStart,
                  lastClosedEnd,
                  opts.installmentPlans,
                  transactions
              )
            : 0
    const committedLastClosedTotal =
        lastClosedTotal + projectedLastClosedInstallmentsTotal
    return {
        lastClose,
        nextClose,
        prevClose,
        openWindow: { start: openStart, end: openEnd },
        lastClosedWindow: { start: lastClosedStart, end: lastClosedEnd },
        openTotal,
        projectedOpenInstallmentsTotal,
        committedOpenTotal,
        lastClosedTotal,
        projectedLastClosedInstallmentsTotal,
        committedLastClosedTotal,
        estimatedDueLastClose: estimatedDueDateForClose(lastClose, card.due_day),
    }
}
