/** Dashboard period presets (URL `preset=` + derived `from` / `to`). */

import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import {
    shiftYearMonth,
    periodBoundsFromYearMonth,
} from "@/lib/budget-month"

export type DashboardDatePresetKey =
    | "last30"
    | "last90"
    | "thisMonth"
    | "prevMonth"
    | "thisYear"
    | "custom"

function pad2(n: number) {
    return String(n).padStart(2, "0")
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function startOfYear(d: Date): Date {
    return new Date(d.getFullYear(), 0, 1)
}

/** Inclusive range for a preset (local calendar). */
export function getDashboardPresetRange(
    key: Exclude<DashboardDatePresetKey, "custom">,
    now: Date = new Date()
): { from: string; to: string } {
    const to = localYmdFromDate(now)

    if (key === "last30") {
        const s = new Date(now)
        s.setDate(s.getDate() - 29)
        return { from: localYmdFromDate(s), to }
    }
    if (key === "last90") {
        const s = new Date(now)
        s.setDate(s.getDate() - 89)
        return { from: localYmdFromDate(s), to }
    }
    if (key === "thisMonth") {
        const start = startOfMonth(now)
        return { from: localYmdFromDate(start), to }
    }
    if (key === "prevMonth") {
        const firstThis = startOfMonth(now)
        const lastPrev = new Date(firstThis.getTime() - 86_400_000)
        const start = startOfMonth(lastPrev)
        return { from: localYmdFromDate(start), to: localYmdFromDate(endOfMonth(lastPrev)) }
    }
    if (key === "thisYear") {
        return { from: localYmdFromDate(startOfYear(now)), to }
    }
    return { from: to, to }
}

export function dashboardPresetLabel(key: DashboardDatePresetKey): string {
    switch (key) {
        case "last30":
            return "Últimos 30 dias"
        case "last90":
            return "Últimos 90 dias"
        case "thisMonth":
            return "Este mês"
        case "prevMonth":
            return "Mês anterior"
        case "thisYear":
            return "Este ano"
        case "custom":
            return "Personalizado"
        default:
            return key
    }
}

export function isDashboardPresetKey(
    s: string | null
): s is Exclude<DashboardDatePresetKey, "custom"> {
    return (
        s === "last30" ||
        s === "last90" ||
        s === "thisMonth" ||
        s === "prevMonth" ||
        s === "thisYear"
    )
}

/** Same calendar span ending the day before `from`. */
export function previousPeriodRange(
    fromYmd: string,
    toYmd: string
): { from: string; to: string } | null {
    const from = parseYmdLocal(fromYmd)
    const to = parseYmdLocal(toYmd)
    if (!from || !to) return null
    const msDay = 86_400_000
    const days =
        Math.round(
            (stripTime(to).getTime() - stripTime(from).getTime()) / msDay
        ) + 1
    if (days < 1) return null
    const prevEnd = new Date(stripTime(from).getTime() - msDay)
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * msDay)
    return { from: localYmdFromDate(prevStart), to: localYmdFromDate(prevEnd) }
}

/**
 * Previous calendar month capped to the same day-of-month as `effectiveToYmd`.
 * E.g. calendarYm="2026-05", effectiveToYmd="2026-05-13" → Apr 1–13.
 * For a completed month effectiveToYmd equals the last day, so the full
 * previous month is returned.
 */
export function previousMonthSamePeriodRange(
    calendarYm: string,
    effectiveToYmd: string,
): { from: string; to: string } | null {
    const prevYm = shiftYearMonth(calendarYm, -1)
    const prevBounds = periodBoundsFromYearMonth(prevYm)

    const dayPart = parseInt(effectiveToYmd.split("-")[2], 10)
    if (!Number.isFinite(dayPart) || dayPart < 1) return null

    const prevLastDay = parseInt(prevBounds.period_end.split("-")[2], 10)
    const cappedDay = Math.min(dayPart, prevLastDay)

    const prevTo = `${prevYm}-${pad2(cappedDay)}`
    return { from: prevBounds.period_start, to: prevTo }
}

function stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

