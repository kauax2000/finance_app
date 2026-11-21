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

/** "9 de novembro", a partir de `YYYY-MM-DD`. */
export function diaDeMesPorExtenso(ymd: string): string {
    const d = parseYmdLocal(ymd.slice(0, 10))
    return d ? `${d.getDate()} de ${formatMonthLongPtBr(d)}` : ymd
}

/** "nov", a partir de `YYYY-MM`: o eixo curto do gráfico (a série tem no máximo 12 meses, então o mês não se repete). */
export function mesCurto(ym: string): string {
    const { y, m } = parseYearMonth(ym)
    return formatMonthShortPtBr(new Date(y, m - 1, 1))
}

const DIAS_POR_EXTENSO: Record<string, string> = {
    Seg: "segunda",
    Ter: "terça",
    Qua: "quarta",
    Qui: "quinta",
    Sex: "sexta",
    Sáb: "sábado",
    Dom: "domingo",
}

/** "segunda", a partir do nome curto do `porDiaDaSemana` ("Seg"). */
export function diaPorExtenso(curto: unknown): string {
    return DIAS_POR_EXTENSO[String(curto)] ?? String(curto)
}
