/** `YYYY-MM` from a Date (local calendar). */
export function formatYearMonth(d: Date): string {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    return `${y}-${String(m).padStart(2, "0")}`
}

/** First and last calendar dates `YYYY-MM-DD` for a `YYYY-MM` string (local calendar). */
export function periodBoundsFromYearMonth(ym: string): { period_start: string; period_end: string } {
    const [ys, ms] = ym.split("-")
    const y = Number(ys)
    const mo = Number(ms)
    if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) {
        throw new Error(`Invalid year-month: ${ym}`)
    }
    const lastDay = new Date(y, mo, 0).getDate()
    const period_start = `${y}-${String(mo).padStart(2, "0")}-01`
    const period_end = `${y}-${String(mo).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    return { period_start, period_end }
}

export function parseYearMonth(ym: string): { y: number; m: number } {
    const [ys, ms] = ym.split("-")
    return { y: Number(ys), m: Number(ms) }
}

export function shiftYearMonth(ym: string, deltaMonths: number): string {
    const { y, m } = parseYearMonth(ym)
    const d = new Date(y, m - 1 + deltaMonths, 1)
    return formatYearMonth(d)
}

export function labelYearMonthPt(ym: string): string {
    const { y, m } = parseYearMonth(ym)
    if (!Number.isFinite(y) || !Number.isFinite(m)) return ym
    const raw = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
    })
    if (!raw) return raw
    const first = raw[0]
    if (!first) return raw
    return first.toLocaleUpperCase("pt-BR") + raw.slice(1)
}

/** Abbreviated month label: "Mai 2026", "Jan 2025", etc. */
export function shortLabelYearMonthPt(ym: string): string {
    const { y, m } = parseYearMonth(ym)
    if (!Number.isFinite(y) || !Number.isFinite(m)) return ym
    const raw = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
    if (!raw) return ym
    return `${raw.charAt(0).toLocaleUpperCase("pt-BR")}${raw.slice(1)} ${y}`
}
