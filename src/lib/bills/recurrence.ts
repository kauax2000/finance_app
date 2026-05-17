import type { Bill, BillFrequency } from "@/lib/supabase"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"

function daysInMonth(year: number, monthIndex0: number): number {
    return new Date(year, monthIndex0 + 1, 0).getDate()
}

/** Calendar day pinned to noon local for stable comparisons. */
function noonDate(year: number, monthIndex0: number, day: number): Date {
    return new Date(year, monthIndex0, Math.min(day, daysInMonth(year, monthIndex0)), 12, 0, 0, 0)
}

function compareYmd(aYmd: string, bYmd: string): number {
    return aYmd.localeCompare(bYmd)
}

/** First due date ≥ start matching `due_day_of_month` (clamped within month). */
export function computeFirstDueYmd(params: {
    startYmd: string
    dueDayOfMonth: number
}): string {
    const startMid = parseYmdLocal(params.startYmd.slice(0, 10))
    if (!startMid) return params.startYmd.slice(0, 10)
    const startNoon = new Date(
        startMid.getFullYear(),
        startMid.getMonth(),
        startMid.getDate(),
        12,
        0,
        0,
        0,
    )
    const anchor = Math.min(
        Math.max(1, params.dueDayOfMonth),
        31
    )

    let y = startMid.getFullYear()
    let m0 = startMid.getMonth()
    let cand = noonDate(y, m0, anchor)
    while (cand.getTime() < startNoon.getTime()) {
        m0 += 1
        if (m0 > 11) {
            m0 = 0
            y += 1
        }
        cand = noonDate(y, m0, anchor)
    }

    return localYmdFromDate(cand)
}

export function computeNextDueYmd(params: {
    afterDueYmd: string
    frequency: BillFrequency
    dueDayOfMonth: number
}): string | null {
    if (params.frequency === "one_time") return null

    const d = parseYmdLocal(params.afterDueYmd.slice(0, 10))
    if (!d) return null
    const anchor = Math.min(Math.max(1, params.dueDayOfMonth), 31)

    let y = d.getFullYear()
    let m0 = d.getMonth()

    if (params.frequency === "monthly") {
        m0 += 1
    } else if (params.frequency === "bimonthly") {
        m0 += 2
    } else if (params.frequency === "quarterly") {
        m0 += 3
    } else if (params.frequency === "yearly") {
        y += 1
    }

    while (m0 > 11) {
        m0 -= 12
        y += 1
    }

    const next = noonDate(y, m0, anchor)
    return localYmdFromDate(next)
}

/** When creating the next occurrence after paying `paidDueYmd`. */
export function computeNextBillInstanceDueYmd(
    bill: Pick<Bill, "frequency" | "due_day_of_month" | "end_date" | "is_active">,
    paidDueYmd: string
): string | null {
    if (!bill.is_active) return null
    if (bill.frequency === "one_time") return null

    const next = computeNextDueYmd({
        afterDueYmd: paidDueYmd,
        frequency: bill.frequency,
        dueDayOfMonth: bill.due_day_of_month,
    })
    if (!next) return null

    if (bill.end_date) {
        const end = bill.end_date.slice(0, 10)
        if (compareYmd(next, end) > 0) return null
    }

    return next
}

export function billStartYmd(bill: Pick<Bill, "start_date">): string {
    return bill.start_date.slice(0, 10)
}
