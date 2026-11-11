import { currencyBRL } from "@/lib/formatters"

/** Minúscula, sem acento, sem "(k/n)" no fim, espaços colapsados. */
export function normalizarDescricao(s: string): string {
  return s
    .replace(/\s*\(\d+\/\d+\)\s*$/, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function projecaoDoMes(gastoAteHoje: number, hoje: Date): number {
  const dias = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  return Math.round((gastoAteHoje / hoje.getDate()) * dias * 100) / 100
}

type Despesa = { id: string; description: string | null; amount: number; date: string }
export type Historico = {
  vezes: number
  total: number
  media: number
  barras: { valor: number; atual: boolean }[]
}

export function historicoDe(alvo: Despesa, despesas90: Despesa[]): Historico | null {
  const chave = normalizarDescricao(alvo.description ?? "")
  const mesmas = despesas90
    .filter(
      (d) =>
        d.id === alvo.id ||
        (normalizarDescricao(d.description ?? "") === chave && d.date <= alvo.date)
    )
    .sort((a, b) => a.date.localeCompare(b.date))
  if (mesmas.length < 3) return null
  const total = mesmas.reduce((s, d) => s + d.amount, 0)
  const outras = mesmas.filter((d) => d.id !== alvo.id)
  return {
    vezes: mesmas.length,
    total,
    media: outras.reduce((s, d) => s + d.amount, 0) / outras.length,
    barras: mesmas.slice(-8).map((d) => ({ valor: d.amount, atual: d.id === alvo.id })),
  }
}

export type EntradaDaManchete = {
  mesCorrente: boolean
  hoje: Date
  categoria?: { nome: string; mes: string; gasto: number; orcamento: number | null }
  historico?: { nome: string; valor: number; media: number } | null
  parcela?: { ultimaNoMes: string; ultimaEhEsteOuProximo: boolean; valorParcela: number } | null
}
export type Manchete = { tom: "warning" | "info" | "success"; texto: string }

const pct = (n: number) => `${Math.round(n * 100)}%`

export function escolherManchete(e: EntradaDaManchete): Manchete | null {
  const c = e.categoria
  if (c && c.orcamento) {
    if (!e.mesCorrente && c.gasto > c.orcamento) {
      return {
        tom: "warning",
        texto: `${c.nome} fechou ${c.mes} em ${currencyBRL(c.gasto)}, ${pct(c.gasto / c.orcamento - 1)} acima do orçamento.`,
      }
    }
    if (e.mesCorrente && c.gasto > c.orcamento) {
      return {
        tom: "warning",
        texto: `${c.nome} passou do orçamento de ${c.mes} em ${currencyBRL(c.gasto - c.orcamento)}.`,
      }
    }
    if (e.mesCorrente && e.hoje.getDate() >= 5) {
      const proj = projecaoDoMes(c.gasto, e.hoje)
      if (proj > c.orcamento) {
        return {
          tom: "warning",
          texto: `No ritmo de agora, ${c.nome} fecha ${c.mes} em ${currencyBRL(proj)}, ${currencyBRL(proj - c.orcamento)} acima do orçamento.`,
        }
      }
    }
  }
  const h = e.historico
  if (h && h.media > 0 && h.valor / h.media - 1 >= 0.3) {
    return {
      tom: "info",
      texto: `Este ${h.nome} custou ${pct(h.valor / h.media - 1)} mais que a sua média (${currencyBRL(h.media)}).`,
    }
  }
  const p = e.parcela
  if (p?.ultimaEhEsteOuProximo) {
    return {
      tom: "success",
      texto: `Última parcela em ${p.ultimaNoMes}. Depois, ${currencyBRL(p.valorParcela)} a mais por mês.`,
    }
  }
  return null
}
