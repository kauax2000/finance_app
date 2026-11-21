import { parseYearMonth } from "@/lib/budget-month"
import { formatMonthLongPtBr, formatMonthShortPtBr, parseYmdLocal } from "@/lib/transaction-date"

/** "novembro", a partir de `YYYY-MM`. */
export function mesPorExtenso(ym: string): string {
    const { y, m } = parseYearMonth(ym)
    return formatMonthLongPtBr(new Date(y, m - 1, 1))
}

/** "9 nov", a partir de `YYYY-MM-DD`. */
export function diaEMes(ymd: string): string {
    const d = parseYmdLocal(ymd.slice(0, 10))
    return d ? `${d.getDate()} ${formatMonthShortPtBr(d)}` : ymd
}
