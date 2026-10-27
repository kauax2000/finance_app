import { casarCartao, type CartaoParaCasar, type LinhaHistorico, normalizarDescricao, preencherPeloHistorico } from '../frase.ts'
import { dataValida } from './periodo.ts'

export type PedidoDaIA = {
  valor: number
  descricao: string
  tipo: 'despesa' | 'receita'
  data?: string
  categoria?: string
  cartao?: string
  forma_de_pagamento?: 'pix' | 'debito' | 'credito' | 'dinheiro' | 'ted' | 'outro'
  parcelas?: number
}

export type ContextoDaIA = {
  userId: string
  carteiraId: string
  hoje: string
  categorias: { id: string; name: string; type: 'income' | 'expense' }[]
  cartoes: CartaoParaCasar[]
  historico: LinhaHistorico[]
  clientId: string | null
}

export type LinhaDaIA = {
  user_id: string
  workspace_id: string
  category_id: string | null
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  payment_method: string | null
  payment_credit_card_id: string | null
  source: 'ia_externa'
  needs_review: true
  capture_meta: { via: 'mcp'; client_id: string | null }
}

// Valores aceitos por transactions_payment_method_check (baseline.sql).
const FORMA: Record<NonNullable<PedidoDaIA['forma_de_pagamento']>, string> = {
  pix: 'pix', debito: 'debit_card', credito: 'credit_card', dinheiro: 'cash', ted: 'ted', outro: 'other',
}

export function montarLancamentoDaIA(p: PedidoDaIA, ctx: ContextoDaIA):
  | { linha: LinhaDaIA; parcelas: null | { total: number; valor_parcela: number; valor_final: number; primeira: string } }
  | { erro: string } {
  if (!(p.valor > 0)) return { erro: 'O valor precisa ser maior que zero.' }
  const data = p.data ?? ctx.hoje
  if (!dataValida(data)) return { erro: 'Data inválida: use AAAA-MM-DD.' }
  const type = p.tipo === 'receita' ? 'income' : 'expense'

  const sugerido = preencherPeloHistorico(p.descricao, type, ctx.historico)
  let categoryId = sugerido.categoryId
  if (p.categoria) {
    const doTipo = ctx.categorias.filter((c) => c.type === type)
    const achada = doTipo.find((c) => normalizarDescricao(c.name) === normalizarDescricao(p.categoria!))
    if (!achada) {
      return { erro: `Categoria "${p.categoria}" não existe nessa carteira. Categorias: ${doTipo.map((c) => c.name).join(', ')}.` }
    }
    categoryId = achada.id
  }

  let paymentMethod = p.forma_de_pagamento ? FORMA[p.forma_de_pagamento] : sugerido.paymentMethod
  let cardId: string | null = null
  if (p.cartao) {
    const c = casarCartao(p.cartao, ctx.cartoes)
    if (!c) {
      const alvo = normalizarDescricao(p.cartao)
      const ativos = ctx.cartoes.filter((x) => x.is_active)
      const parecidos = ativos.filter((x) => normalizarDescricao(x.name).includes(alvo))
      return parecidos.length > 1
        ? { erro: `Mais de um cartão casa com "${p.cartao}": ${parecidos.map((x) => x.name).join(', ')}. Diga o nome exato ou os 4 últimos dígitos.` }
        : { erro: `Cartão "${p.cartao}" não encontrado. Cartões: ${ativos.map((x) => x.name).join(', ')}.` }
    }
    cardId = c.id
    paymentMethod = 'credit_card'
  } else if (paymentMethod === 'credit_card' && !p.forma_de_pagamento) {
    cardId = sugerido.creditCardId
  }

  const total = p.parcelas ?? 1
  let parcelas = null
  if (total > 1) {
    if (!cardId) return { erro: 'Parcelado só no cartão de crédito: diga o cartão.' }
    const centavos = Math.round(p.valor * 100)
    const base = Math.floor(centavos / total)
    if (base === 0) return { erro: `Valor pequeno demais para parcelar em ${total}x.` }
    parcelas = {
      total,
      valor_parcela: base / 100,
      valor_final: (centavos - base * (total - 1)) / 100,
      primeira: data,
    }
  }

  return {
    linha: {
      user_id: ctx.userId, workspace_id: ctx.carteiraId, category_id: categoryId, type, amount: p.valor,
      description: p.descricao, date: data, payment_method: paymentMethod, payment_credit_card_id: cardId,
      source: 'ia_externa', needs_review: true, capture_meta: { via: 'mcp', client_id: ctx.clientId },
    },
    parcelas,
  }
}
