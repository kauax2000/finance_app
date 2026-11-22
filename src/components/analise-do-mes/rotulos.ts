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

/**
 * A data de um grupo na lista do mês: "23 nov", "4 vezes · última 23 nov". A compra no cartão
 * que caiu na fatura deste mês mas foi feita em outro diz isso: "30 out · fatura de nov".
 */
export function dataDoGrupo(ultimaYmd: string, vezes: number, yearMonth: string): string {
    const dia = diaEMes(ultimaYmd)
    const base = vezes > 1 ? `${vezes} vezes · última ${dia}` : dia
    return ultimaYmd.slice(0, 7) === yearMonth ? base : `${base} · fatura de ${mesCurto(yearMonth)}`
}
