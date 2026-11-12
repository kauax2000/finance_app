import { descricaoSemParcela } from "@/lib/detalhe/blocos"
import { currencyBRL, numberBR } from "@/lib/formatters"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { Transaction } from "@/lib/supabase"
import { formatMonthShortPtBr, parseYmdLocal } from "@/lib/transaction-date"
import { parseInstallmentFromDescription, totalPurchaseFromPlan } from "@/lib/transaction-installment"

/** O que o diálogo de excluir lê de cada linha. */
export type LinhaAExcluir = Pick<
  Transaction,
  "id" | "description" | "date" | "amount" | "installment_plan_id" | "installment_plan" | "payment_method" | "payment_card" | "category"
>

/** Uma linha do cartão: um lançamento comum, ou a compra parcelada inteira (várias parcelas viram uma). */
export type ItemAExcluir = {
  chave: string
  compra: boolean
  linha: LinhaAExcluir
  nome: string
  detalhe: string
  valor: number
  /** Só na compra: quantas parcelas saem (null sem o plano embutido). */
  parcelas: number | null
}

export type TextoDaExclusao = {
  titulo: string
  descricao: string
  acao: string
  itens: ItemAExcluir[]
  nota: string | null
}

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios)

function diaCurto(date: string): string {
  const d = parseYmdLocal(date.slice(0, 10))
  return d ? `${d.getDate()} ${formatMonthShortPtBr(d)}` : date
}

/** A forma, ou o nome do cartão no crédito (como a coluna da tabela). */
function meioDe(t: LinhaAExcluir): string {
  if (t.payment_method === "credit_card" && t.payment_card) return t.payment_card.name
  return paymentMethodLabel(t.payment_method)
}

const comMeio = (antes: string, t: LinhaAExcluir) => {
  const meio = meioDe(t)
  return meio ? `${antes} · ${meio}` : antes
}

function nomeDe(t: LinhaAExcluir, compra: boolean): string {
  const bruto = t.description?.trim() || t.category?.name || ""
  return compra ? descricaoSemParcela(bruto) : bruto
}

function itemDe(t: LinhaAExcluir): ItemAExcluir {
  const valorDaLinha = Number(t.amount)
  if (!t.installment_plan_id) {
    return {
      chave: t.id,
      compra: false,
      linha: t,
      nome: nomeDe(t, false),
      detalhe: comMeio(diaCurto(t.date), t),
      valor: valorDaLinha,
      parcelas: null,
    }
  }
  const plano = t.installment_plan ?? null
  const n = plano?.total_installments ?? parseInstallmentFromDescription(t.description)?.n ?? null
  const parcela = plano ? Number(plano.installment_amount) : valorDaLinha
  return {
    chave: `plano:${t.installment_plan_id}`,
    compra: true,
    linha: t,
    nome: nomeDe(t, true),
    detalhe: comMeio(n ? `${n}× de ${currencyBRL(parcela)}` : "Compra parcelada", t),
    valor: plano ? totalPurchaseFromPlan(plano) : valorDaLinha,
    parcelas: plano?.total_installments ?? null,
  }
}

/** Uma linha por lançamento comum e uma por compra parcelada (as parcelas do mesmo plano contam 1). */
export function itensAExcluir(linhas: LinhaAExcluir[]): ItemAExcluir[] {
  const vistos = new Set<string>()
  const itens: ItemAExcluir[] = []
  for (const t of linhas) {
    const item = itemDe(t)
    if (vistos.has(item.chave)) continue
    vistos.add(item.chave)
    itens.push(item)
  }
  return itens
}

const IRREVERSIVEL = "Não dá para desfazer."

/** "As 3 parcelas saem: 1 lançada e 2 previstas." — omite a parte zerada. */
function descricaoDaCompra(t: LinhaAExcluir): string {
  const plano = t.installment_plan
  if (!plano) return `A compra parcelada inteira sai, com todas as parcelas. ${IRREVERSIVEL}`
  const n = plano.total_installments
  const lancadas = Math.min(Math.max(plano.generated_count, 0), n)
  const previstas = n - lancadas
  const parte = (k: number, um: string, varios: string) => `${numberBR(k)} ${plural(k, um, varios)}`
  if (n === 1) return `A parcela sai. ${IRREVERSIVEL}`
  if (previstas === 0) return `As ${numberBR(n)} parcelas lançadas saem. ${IRREVERSIVEL}`
  if (lancadas === 0) return `As ${numberBR(n)} parcelas previstas saem. ${IRREVERSIVEL}`
  return `As ${numberBR(n)} parcelas saem: ${parte(lancadas, "lançada", "lançadas")} e ${parte(previstas, "prevista", "previstas")}. ${IRREVERSIVEL}`
}

function notaDasCompras(itens: ItemAExcluir[]): string | null {
  const compras = itens.filter((i) => i.compra)
  if (compras.length === 0) return null
  if (compras.length > 1) return `${numberBR(compras.length)} compras parceladas saem inteiras, com todas as parcelas.`
  const [c] = compras
  const nome = c.nome || "compra"
  return c.parcelas != null
    ? `A ${nome} é uma compra parcelada: as ${numberBR(c.parcelas)} parcelas saem juntas.`
    : `A ${nome} é uma compra parcelada: todas as parcelas saem juntas.`
}

/** Título, descrição, rótulo do botão, linhas e nota do diálogo de excluir (versão E1). */
export function textoDaExclusao(linhas: LinhaAExcluir[]): TextoDaExclusao {
  const itens = itensAExcluir(linhas)
  if (itens.length === 1) {
    const [item] = itens
    if (item.compra) {
      return {
        titulo: item.nome ? `Excluir a compra parcelada ${item.nome}?` : "Excluir a compra parcelada?",
        descricao: descricaoDaCompra(item.linha),
        acao: "excluir compra",
        itens,
        nota: null,
      }
    }
    return {
      titulo: item.nome ? `Excluir ${item.nome}?` : "Excluir lançamento?",
      descricao: `Sai do extrato e ${IRREVERSIVEL.toLowerCase()}`,
      acao: "excluir",
      itens,
      nota: null,
    }
  }
  const n = numberBR(itens.length)
  return {
    titulo: `Excluir ${n} itens?`,
    descricao: `Saem do extrato e ${IRREVERSIVEL.toLowerCase()}`,
    acao: `excluir ${n}`,
    itens,
    nota: notaDasCompras(itens),
  }
}
