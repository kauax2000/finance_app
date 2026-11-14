import { currencyBRL } from "@/lib/formatters"
import { roundCents } from "@/lib/money-brl"
import type { Transaction } from "@/lib/supabase"
import { ehEstornoNoCartao } from "@/lib/expense-month-attribution"
import { transactionLocalYmd } from "@/lib/transaction-date"

/** O texto depois de "Esta, R$ X · ". */
export function legendaDaReceita(args: {
  valor: number
  total: number
  esperado: number
  mesCorrente: boolean
  mes: string
}): string {
  const { valor, total, esperado, mesCorrente, mes } = args
  // Mês em curso com previsão ainda não cumprida: o que falta importa mais que a fatia.
  if (mesCorrente && esperado > total) {
    return `faltam ${currencyBRL(roundCents(esperado - total))} para entrar`
  }
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return `${pct}% do que entrou em ${mes}`
}

/** A régua da barra: a previsão que passou do realizado não pode estourar a barra. */
export function maximoDaBarra(total: number, esperado: number): number {
  return Math.max(total, esperado)
}

/** Soma de receitas por mês calendário, sem o estorno no cartão (esse é despesa negativa). */
export function receitasPorMes(
  txs: Pick<
    Transaction,
    "type" | "amount" | "date" | "payment_method" | "payment_credit_card_id"
  >[],
  meses: string[]
): Array<{ ym: string; total: number }> {
  const soma = new Map(meses.map((m) => [m, 0]))
  for (const t of txs) {
    if (t.type !== "income" || ehEstornoNoCartao(t)) continue
    const ym = transactionLocalYmd(t.date)?.slice(0, 7)
    if (ym && soma.has(ym)) soma.set(ym, roundCents(soma.get(ym)! + Number(t.amount)))
  }
  return meses.map((ym) => ({ ym, total: soma.get(ym)! }))
}

/** Selo "↑ sobre / ↓ abaixo de" o mês anterior; sem base ou sem diferença, não há selo. */
export function seloContraOAnterior(
  atual: number,
  anterior: number,
  mesAnterior: string
): { texto: string; sobe: boolean } | null {
  if (anterior <= 0) return null
  const dif = roundCents(atual - anterior)
  if (dif === 0) return null
  return dif > 0
    ? { texto: `↑ ${currencyBRL(dif)} sobre ${mesAnterior}`, sobe: true }
    : { texto: `↓ ${currencyBRL(-dif)} abaixo de ${mesAnterior}`, sobe: false }
}
