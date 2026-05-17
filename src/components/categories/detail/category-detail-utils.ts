import type { Transaction } from "@/lib/supabase"
import { formatYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"

export function hexToRgba(hex: string, alpha: number) {
    const raw = hex.replace("#", "").trim()
    if (raw.length !== 6) return `rgba(0,0,0,${alpha})`
    const r = parseInt(raw.slice(0, 2), 16)
    const g = parseInt(raw.slice(2, 4), 16)
    const b = parseInt(raw.slice(4, 6), 16)
    if (![r, g, b].every(Number.isFinite)) return `rgba(0,0,0,${alpha})`
    return `rgba(${r},${g},${b},${alpha})`
}

export function formatCurrencyBRL(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function monthKeyFromDateISO(date: string) {
    const prefix = date.slice(0, 10)
    const parts = prefix.split("-").map(Number)
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null
    const [y, m] = parts
    return `${y}-${String(m).padStart(2, "0")}`
}

export function monthLabelPt(ym: string) {
    const [y, m] = ym.split("-").map(Number)
    if (!y || !m) return ym
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
    })
}

export function addMonths(ym: string, delta: number) {
    const [y, m] = ym.split("-").map(Number)
    if (!y || !m) return ym
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    return formatYearMonth(d)
}

export function buildDailySeries(
    yearMonth: string,
    txs: Pick<Transaction, "date" | "amount" | "type" | "category_id">[],
    categoryId: string,
    typeFilter: "income" | "expense" | null,
) {
    const { period_start, period_end } = periodBoundsFromYearMonth(yearMonth)
    const start = new Date(`${period_start}T00:00:00.000Z`)
    const end = new Date(`${period_end}T00:00:00.000Z`)

    const byDay: Record<string, number> = {}
    for (const t of txs) {
        if (t.category_id !== categoryId) continue
        if (typeFilter && t.type !== typeFilter) continue
        const day = t.date.slice(0, 10)
        byDay[day] = (byDay[day] ?? 0) + Number(t.amount)
    }

    const out: { day: string; total: number }[] = []
    for (let d = start; d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
        const iso = d.toISOString().slice(0, 10)
        const label = iso.slice(8, 10)
        out.push({ day: label, total: byDay[iso] ?? 0 })
    }
    return out
}

export function buildMonthlySeries(
    baseYm: string,
    txs: Pick<Transaction, "date" | "amount" | "type" | "category_id">[],
    categoryId: string,
    typeFilter: "income" | "expense" | null,
    monthsBack: number,
) {
    const months = Array.from({ length: monthsBack }, (_, i) =>
        addMonths(baseYm, -(monthsBack - 1 - i)),
    )
    const totals: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]))

    for (const t of txs) {
        if (t.category_id !== categoryId) continue
        if (typeFilter && t.type !== typeFilter) continue
        const mk = monthKeyFromDateISO(t.date)
        if (!mk) continue
        if (totals[mk] === undefined) continue
        totals[mk] += Number(t.amount)
    }

    return months.map((ym) => ({ name: monthLabelPt(ym), total: totals[ym] ?? 0 }))
}

export function computeAmountStats(amounts: number[]) {
    const n = amounts.length
    if (n === 0) {
        return { count: 0, avg: 0, max: 0, min: 0 }
    }
    const sum = amounts.reduce((a, b) => a + b, 0)
    return {
        count: n,
        avg: sum / n,
        max: Math.max(...amounts),
        min: Math.min(...amounts),
    }
}

export function sumWorkspaceMonthByType(
    rows: { amount: number | string; type: string }[] | null,
): { income: number; expense: number } {
    let income = 0
    let expense = 0
    for (const r of rows ?? []) {
        const v = Number(r.amount)
        if (!Number.isFinite(v)) continue
        if (r.type === "income") income += v
        else if (r.type === "expense") expense += v
    }
    return { income, expense }
}
