import type { FilterValue } from "@/components/ui/filter-bar"
import { serializeFilters } from "@/components/ui/filter-bar"
import { ROUTES } from "@/config/navigation"
import { formatYearMonth, parseYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { sinalNaDespesa } from "@/lib/expense-month-attribution"
import { roundCents } from "@/lib/money-brl"
import {
  formatMonthLongPtBr,
  formatMonthShortPtBr,
  parseYmdLocal,
  transactionLocalYmd,
} from "@/lib/transaction-date"

/** As contas pequenas dos blocos de contexto do detalhe do lançamento. */

export function diasDoMes(ym: string): number {
  const { y, m } = parseYearMonth(ym)
  return new Date(y, m, 0).getDate()
}

/** O traço do ritmo: o dia de hoje sobre os dias do mês, em %. */
export function marcadorDoMes(hoje: Date): number {
  return (hoje.getDate() / diasDoMes(formatYearMonth(hoje))) * 100
}

/** O mesmo dia no mês anterior a `ym`; num mês mais curto, o último dele. */
export function corteDoMesAnterior(ym: string, dia: number): string {
  const ant = shiftYearMonth(ym, -1)
  return `${ant}-${String(Math.min(dia, diasDoMes(ant))).padStart(2, "0")}`
}

/** O gasto até `ateYmd` (inclusive), com o estorno no cartão abatendo. */
export function totalAteODia(
  txs: { type: string; amount: number; date: string; payment_method?: string | null; payment_credit_card_id?: string | null }[],
  ateYmd: string,
): number {
  let soma = 0
  for (const t of txs) {
    const sinal = sinalNaDespesa(t)
    const ymd = transactionLocalYmd(t.date)
    if (!sinal || !ymd || ymd > ateYmd) continue
    soma += sinal * (Number(t.amount) || 0)
  }
  return roundCents(soma)
}

/** "2026-10" → "outubro". */
export function mesPorExtenso(ym: string): string {
  const { y, m } = parseYearMonth(ym)
  return formatMonthLongPtBr(new Date(y, m - 1, 1))
}

/** "2026-12-09" → "9/dez". */
export function diaMesCurto(ymd: string): string {
  const d = parseYmdLocal(ymd.slice(0, 10))
  return d ? `${d.getDate()}/${formatMonthShortPtBr(d)}` : ymd
}

/** "Fatura de dezembro": o mês do vencimento; sem ele, o do fechamento. */
export function tituloDaFatura(dueYmd: string | null, closeYmd: string): string {
  return `Fatura de ${mesPorExtenso((dueYmd ?? closeYmd).slice(0, 7))}`
}

export function descricaoSemParcela(s: string): string {
  return s.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim()
}

/** Transações com os filtros da barra (`f=`) e, se vier, o tipo. */
export function hrefDaLista(filtros: FilterValue[], type?: "income" | "expense"): string {
  const p = new URLSearchParams()
  if (type) p.set("type", type)
  const f = serializeFilters(filtros)
  if (f) p.set("f", f)
  return `${ROUTES.TRANSACTIONS}?${p}`
}

/**
 * A última parcela do plano: a data dela, se já foi lançada; senão a próxima
 * cobrança somada das pendentes que faltam depois dela.
 */
export function ultimaParcela(
  plano: { next_billing_date: string | null; installment_amount: number },
  linhas: { date: string | null; status: "posted" | "pending" }[],
  hoje: Date,
): { ultimaNoMes: string; ultimaEhEsteOuProximo: boolean; valorParcela: number } | null {
  const ultima = linhas.at(-1)
  if (!ultima) return null
  let ym: string | null = null
  if (ultima.date) ym = transactionLocalYmd(ultima.date)?.slice(0, 7) ?? null
  else if (plano.next_billing_date) {
    const pendentes = linhas.filter((l) => l.status === "pending").length
    ym = shiftYearMonth(plano.next_billing_date.slice(0, 7), Math.max(0, pendentes - 1))
  }
  if (!ym) return null
  const agora = formatYearMonth(hoje)
  return {
    ultimaNoMes: mesPorExtenso(ym),
    ultimaEhEsteOuProximo: ym === agora || ym === shiftYearMonth(agora, 1),
    valorParcela: Number(plano.installment_amount),
  }
}
