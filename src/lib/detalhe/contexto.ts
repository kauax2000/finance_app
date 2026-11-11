import { currencyBRL } from "@/lib/formatters"
import { daysBetweenYmd, transactionLocalYmd } from "@/lib/transaction-date"

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
  /** Os valores das outras vezes (todas, não só as barras). */
  outros: number[]
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
    outros: outras.map((d) => d.amount),
    barras: mesmas.slice(-8).map((d) => ({ valor: d.amount, atual: d.id === alvo.id })),
  }
}

/** Outra despesa igual (descrição, centavos) a até 2 dias; a mais perto, nunca o próprio id. */
export function duplicadoDe(alvo: Despesa, despesas: Despesa[]): Despesa | null {
  const chave = normalizarDescricao(alvo.description ?? "")
  const centavos = Math.round(alvo.amount * 100)
  const diaAlvo = transactionLocalYmd(alvo.date)
  if (!diaAlvo) return null
  let melhor: Despesa | null = null
  let menor = Infinity
  for (const d of despesas) {
    if (d.id === alvo.id || Math.round(d.amount * 100) !== centavos) continue
    if (normalizarDescricao(d.description ?? "") !== chave) continue
    const dia = transactionLocalYmd(d.date)
    const dist = dia ? daysBetweenYmd(diaAlvo, dia) : null
    if (dist === null || Math.abs(dist) > 2 || Math.abs(dist) >= menor) continue
    melhor = d
    menor = Math.abs(dist)
  }
  return melhor
}

export type Acao = { href: string; label: string }
export type Manchete = {
  tom: "destructive" | "warning" | "info" | "success"
  texto: string
  acao?: Acao
}
export type EntradaDaManchete = {
  mesCorrente: boolean
  hoje: Date
  /** `gasto` é o comprometido (lançado + agendado); `lancado`, só o que já entrou. */
  categoria?: {
    nome: string
    mes: string
    gasto: number
    lancado: number
    orcamento: number | null
    hrefOrcamento: string | null
  }
  /** `outros` são os valores das outras vezes; `href` leva ao bloco Histórico. */
  historico?: { nome: string; valor: number; media: number; outros: number[]; href: string } | null
  /** `dia` ("10 de nov") é do chamador. */
  duplicado?: { nome: string; valor: number; dia: string; href: string } | null
  fatura?: { rotulo: string; total: number; valor: number } | null
  parcela?: {
    ultimaNoMes: string
    ultimaComAno: string
    ultimaEhEsteOuProximo: boolean
    valorParcela: number
    primeira: { n: number } | null
  } | null
  /** Só do mês corrente. */
  receitas?: { mes: string; total: number; esperado: number } | null
}

const pct = (n: number) => `${Math.round(n * 100)}%`

export function escolherManchete(e: EntradaDaManchete): Manchete | null {
  const c = e.categoria
  const verOrcamento: Acao | undefined = c?.hrefOrcamento
    ? { href: c.hrefOrcamento, label: "Ver orçamento" }
    : undefined
  const dup = e.duplicado
  if (dup) {
    return {
      tom: "destructive",
      texto: `Parece repetido: há outro ${dup.nome} de ${currencyBRL(dup.valor)} em ${dup.dia}.`,
      acao: { href: dup.href, label: "Ver os 2" },
    }
  }
  if (c && c.orcamento) {
    if (!e.mesCorrente && c.gasto > c.orcamento) {
      return {
        tom: "warning",
        // Passou por centavos: "0% acima" contradiz a frase, então o piso é 1%.
        texto: `${c.nome} fechou ${c.mes} em ${currencyBRL(c.gasto)}, ${Math.max(1, Math.round((c.gasto / c.orcamento - 1) * 100))}% acima do orçamento.`,
        acao: verOrcamento,
      }
    }
    if (e.mesCorrente && c.gasto > c.orcamento) {
      return {
        tom: "warning",
        texto: `${c.nome} passou do orçamento de ${c.mes} em ${currencyBRL(c.gasto - c.orcamento)}.`,
        acao: verOrcamento,
      }
    }
    if (e.mesCorrente && e.hoje.getDate() >= 5) {
      // O ritmo é do que já entrou; o agendado (parcela, assinatura) entra uma vez, não projetado.
      const proj = Math.round((projecaoDoMes(c.lancado, e.hoje) + c.gasto - c.lancado) * 100) / 100
      if (proj > c.orcamento) {
        return {
          tom: "warning",
          texto: `No ritmo de agora, ${c.nome} fecha ${c.mes} em ${currencyBRL(proj)}, ${currencyBRL(proj - c.orcamento)} acima do orçamento.`,
          acao: verOrcamento,
        }
      }
    }
  }
  const h = e.historico
  // Cobrança fixa que mudou: todas as outras iguais (±1 centavo) e esta maior.
  if (h && h.outros.length > 0) {
    const antes = h.outros[0]
    if (h.outros.every((v) => Math.abs(v - antes) <= 0.01) && h.valor - antes > 0.01) {
      return {
        tom: "warning",
        texto: `${h.nome} subiu de ${currencyBRL(antes)} para ${currencyBRL(h.valor)} (+${pct(h.valor / antes - 1)}).`,
        acao: { href: h.href, label: "Ver cobranças" },
      }
    }
  }
  if (c?.orcamento && e.mesCorrente && c.gasto <= c.orcamento && c.gasto / c.orcamento >= 0.8) {
    return {
      tom: "warning",
      texto: `${c.nome} já usou ${pct(c.gasto / c.orcamento)} do orçamento de ${c.mes}. Restam ${currencyBRL(c.orcamento - c.gasto)}.`,
      acao: verOrcamento,
    }
  }
  if (h && h.media > 0 && h.valor / h.media - 1 >= 0.3) {
    return {
      tom: "info",
      texto: `Este ${h.nome} custou ${pct(h.valor / h.media - 1)} mais que a sua média (${currencyBRL(h.media)}).`,
    }
  }
  const f = e.fatura
  if (f && f.total > 0 && f.valor / f.total >= 0.2) {
    return {
      tom: "info",
      texto: `Esta compra é ${pct(f.valor / f.total)} da ${f.rotulo} (${currencyBRL(f.total)}).`,
    }
  }
  if (h && h.media > 0 && h.valor / h.media - 1 <= -0.3) {
    return {
      tom: "success",
      texto: `Este ${h.nome} saiu ${pct(1 - h.valor / h.media)} mais barato que a sua média (${currencyBRL(h.media)}).`,
    }
  }
  const p = e.parcela
  if (p?.ultimaEhEsteOuProximo) {
    return {
      tom: "success",
      texto: `Última parcela em ${p.ultimaNoMes}. Depois, ${currencyBRL(p.valorParcela)} a mais por mês.`,
    }
  }
  const r = e.receitas
  if (r && r.esperado > 0) {
    return r.total >= r.esperado
      ? { tom: "success", texto: `Com esta, entraram ${currencyBRL(r.total)} — tudo o que era previsto para ${r.mes}.` }
      : { tom: "info", texto: `Com esta, entraram ${currencyBRL(r.total)} de ${currencyBRL(r.esperado)} previstos para ${r.mes}.` }
  }
  if (p?.primeira) {
    return {
      tom: "info",
      texto: `1ª de ${p.primeira.n} parcelas: ${currencyBRL(p.valorParcela)} por mês até ${p.ultimaComAno}.`,
    }
  }
  return null
}
