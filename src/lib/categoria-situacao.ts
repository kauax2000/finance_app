import { currencyBRL } from "@/lib/formatters"
import { formatMonthShortPtBr } from "@/lib/transaction-date"

export type Variacao =
  | { kind: "up" | "down"; pct: number }
  | { kind: "flat" | "novo" | "nenhum" }

// Valores negativos (estorno maior que a compra) contam como zero.
const zero = (n: number) => Math.max(0, n)

/** Estável: diferença de até 5% em relação ao mês anterior. */
export function isMomFlat(now: number, prev: number): boolean {
  if (prev <= 0) return false
  return Math.abs(now - prev) / prev <= 0.05
}

export function variacaoDoMes(atual: number, anterior: number): Variacao {
  const a = zero(atual)
  const p = zero(anterior)
  if (a === 0 && p === 0) return { kind: "nenhum" }
  if (p === 0) return { kind: "novo" }
  if (isMomFlat(a, p)) return { kind: "flat" }
  const pct = Math.round((Math.abs(a - p) / p) * 100)
  return a > p ? { kind: "up", pct } : { kind: "down", pct }
}

const mesCurto = (ym: string): string => {
  const [y, m] = ym.split("-").map(Number)
  return `${formatMonthShortPtBr(new Date(y, m - 1, 1))}.`
}

export function rotuloDaVariacao(v: Variacao, anteriorYm: string): string | null {
  switch (v.kind) {
    case "up":
      return `↑ ${v.pct}% vs ${mesCurto(anteriorYm)}`
    case "down":
      return `↓ ${v.pct}% vs ${mesCurto(anteriorYm)}`
    case "flat":
      return `= ${mesCurto(anteriorYm)}`
    case "novo":
      return "novo"
    case "nenhum":
      return null
  }
}

/** Quanto do mês já deveria ter sido gasto, em %. Mês futuro não tem ritmo. */
export function ritmoDoMes(ym: string, hojeYmd: string): number | null {
  const [y, m] = ym.split("-").map(Number)
  const [hy, hm, hd] = hojeYmd.split("-").map(Number)
  const ordem = y * 12 + m
  const hoje = hy * 12 + hm
  if (ordem < hoje) return 100
  if (ordem > hoje) return null
  const diasNoMes = new Date(y, m, 0).getDate()
  return Math.round((hd / diasNoMes) * 100)
}

export type Situacao = { texto: string; tom: "neutro" | "aviso" | "perigo" }

export function situacaoDaDespesa(a: {
  total: number; limite: number; totalDoMes: number; ritmo: number | null
}): Situacao {
  const total = zero(a.total)
  const limite = zero(a.limite)
  if (limite === 0) {
    return { texto: participacao(total, a.totalDoMes, "expense"), tom: "neutro" }
  }
  if (total > limite) {
    return {
      texto: `${currencyBRL(total - limite)} acima do limite de ${currencyBRL(limite)}`,
      tom: "perigo",
    }
  }
  const faltam = `Faltam ${currencyBRL(limite - total)} de ${currencyBRL(limite)}`
  if (a.ritmo === null) return { texto: faltam, tom: "neutro" }
  if ((total / limite) * 100 > a.ritmo + 10) return { texto: `${faltam} · acima do ritmo`, tom: "aviso" }
  return { texto: `${faltam} · no ritmo`, tom: "neutro" }
}

export function participacao(total: number, totalDoMes: number, tipo: "expense" | "income"): string {
  const pct = zero(totalDoMes) > 0 ? Math.round((zero(total) / zero(totalDoMes)) * 100) : 0
  return `${pct}% das ${tipo === "expense" ? "despesas" : "receitas"} do mês`
}

export function mediaDosMeses(valores: number[]): number {
  if (valores.length === 0) return 0
  return valores.reduce((soma, v) => soma + zero(v), 0) / valores.length
}

export type CriterioDeOrdem = "maior" | "nome" | "variacao"

/**
 * Por aba: quem teve movimento vai à grade, na ordem escolhida; o resto, ao rodapé.
 * O total de quem chama já vem em centavos (`roundCents`), senão o resto de ponto
 * flutuante (5,55e-17) passa por "maior que zero".
 */
export function dividirDoMes<T extends { nome: string; total: number; anterior: number }>(
  itens: T[],
  criterio: CriterioDeOrdem,
) {
  const comMovimento = ordenarCategorias(
    itens.filter((i) => i.total > 0),
    criterio,
  )
  return {
    comMovimento,
    semMovimento: itens.filter((i) => i.total <= 0),
    totalDoMes: comMovimento.reduce((soma, i) => soma + i.total, 0),
    maiorTotal: Math.max(0, ...comMovimento.map((i) => i.total)),
  }
}

export function ordenarCategorias<T extends { nome: string; total: number; anterior: number }>(
  itens: T[],
  criterio: CriterioDeOrdem,
): T[] {
  const cmp: (a: T, b: T) => number =
    criterio === "maior"
      ? (a, b) => zero(b.total) - zero(a.total)
      : criterio === "nome"
        ? (a, b) => a.nome.localeCompare(b.nome, "pt-BR")
        : (a, b) => (zero(b.total) - zero(b.anterior)) - (zero(a.total) - zero(a.anterior))
  // Array.prototype.sort é estável: empate mantém a ordem de entrada.
  return [...itens].sort(cmp)
}
