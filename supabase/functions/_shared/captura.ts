/**
 * A captura sem abrir o app (Edge `capture`), em funções puras: o pedido do
 * Atalho do iPhone vira a linha de `transactions` que a Edge grava como a
 * pessoa. A Edge só faz I/O em volta disto.
 */
import {
  casarCartao,
  interpretarFrase,
  lerNumero,
  normalizarDescricao,
  preencherPeloHistorico,
  type CartaoParaCasar,
  type FormaDePagamento,
  type LinhaHistorico,
} from './frase.ts'
import type { CamposIA } from './ia.ts'
import type { Provedor } from './ia-config.ts'
import { moneyBRL } from './notification-copy.ts'
import { sha256Hex } from './token-hash.ts'

/** 'quick_text' é do formulário do app; de fora só vêm estas três. */
const ORIGENS = ['shortcut', 'apple_pay', 'share'] as const
type Origem = (typeof ORIGENS)[number]

export type PedidoCaptura = {
  id?: string
  text?: string
  amount?: number | string
  merchant?: string
  card?: string
  date?: string
  source?: Origem
  /** O que a IA leu (Decisão 9). Nunca vem do corpo: a Edge o põe depois de chamar a IA. */
  campos?: CamposDaIA
}

export type CamposDaIA = CamposIA & { provedor: Provedor; modelo: string }

type MetaCaptura = { walletCard?: string; texto?: string; ia?: { provedor: Provedor; modelo: string } }

export type LinhaCaptura = {
  workspace_id: string
  user_id: string
  type: 'expense' | 'income'
  amount: number
  description: string
  date: string
  payment_method: string | null
  payment_credit_card_id: string | null
  category_id: string | null
  source: Origem
  needs_review: boolean
  capture_meta: MetaCaptura | null
}

export type ContextoCaptura = {
  userId: string
  carteiraPadrao: string
  carteirasDaPessoa: string[]
  cartoes: CartaoParaCasar[]
  historicoPorCarteira: Record<string, LinhaHistorico[]>
  hoje: string // YYYY-MM-DD, o dia de São Paulo
}

export const ERRO_VALOR = 'Não entendi o valor. Ex.: 42 mercado'
const ERRO_TEXTO = 'Texto acima de 500 caracteres.'
const ERRO_LIMITE = 'Valor acima do limite.'
const MAX_TEXTO = 500
const MAX_VALOR = 1_000_000
const DESCRICAO_PADRAO = 'Lançamento rápido'

/** O `amount` veio? Uma variável vazia do Atalho chega como "" e conta como ausente. */
function temAmount(amount: unknown): boolean {
  return amount != null && !(typeof amount === 'string' && !amount.trim())
}

/** O `amount` do Atalho: 42.9 ou "R$ 42,90" (regras brasileiras); só positivo. */
function valorDoAmount(amount: unknown): number | null {
  let n: number | null = null
  if (typeof amount === 'number') n = Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null
  else if (typeof amount === 'string') n = lerNumero(amount.toLowerCase().replace(/\s+/g, ''))
  return n != null && n > 0 ? n : null
}

/** Com foto (multipart), o texto é opcional: o valor pode vir da imagem. */
export function validarPedido(
  body: unknown,
  comFoto = false,
): { ok: true; pedido: PedidoCaptura } | { ok: false; erro: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, erro: 'Corpo inválido.' }
  const b = body as Record<string, unknown>
  for (const campo of ['text', 'merchant', 'card', 'date'] as const) {
    if (b[campo] != null && typeof b[campo] !== 'string') return { ok: false, erro: 'Corpo inválido.' }
    if (typeof b[campo] === 'string' && (b[campo] as string).length > MAX_TEXTO) return { ok: false, erro: ERRO_TEXTO }
  }
  if (b.id != null && (typeof b.id !== 'string' || !b.id.trim() || b.id.length > 200)) {
    return { ok: false, erro: 'Id inválido.' }
  }
  if (b.source != null && !ORIGENS.includes(b.source as Origem)) return { ok: false, erro: 'Origem inválida.' }
  if (temAmount(b.amount)) {
    if (valorDoAmount(b.amount) == null) return { ok: false, erro: ERRO_VALOR }
  } else if (!comFoto && (typeof b.text !== 'string' || !b.text.trim())) return { ok: false, erro: ERRO_VALOR }
  // Só os campos do contrato: `campos` (a IA) nunca entra pelo corpo.
  const { id, text, amount, merchant, card, date, source } = b as PedidoCaptura
  return { ok: true, pedido: { id, text, amount, merchant, card, date, source } }
}

/**
 * O `client_id` de um pedido com `id`: sha256(token + ':' + id) com os bits de
 * versão e variante do UUID v4. O retry do Atalho com o mesmo `id` cai no
 * mesmo `client_id`, e o insert com `ignoreDuplicates` não duplica.
 */
export async function clientIdDoPedido(tokenId: string, id: string): Promise<string> {
  const h = (await sha256Hex(`${tokenId}:${id}`)).slice(0, 32).split('')
  h[12] = '4'
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)
  const s = h.join('')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
}

/**
 * A frase precisa da IA (Decisão 9)? O parser vem primeiro, e a IA só entra se
 * o valor ficou nulo ou a descrição ficou em dúvida. O Apple Pay nunca.
 */
export function precisaDeIA(pedido: PedidoCaptura, hoje: string): boolean {
  if (temAmount(pedido.amount)) return false
  const f = interpretarFrase(pedido.text ?? '', hoje)
  return f.valor == null || f.duvidas.includes('descricao')
}

/** O tipo do arquivo pelos primeiros bytes; o nome e o Content-Type da parte não contam. */
export function tipoDoArquivo(b: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' | null {
  const ascii = (i: number, s: string) => [...s].every((c, k) => b[i + k] === c.charCodeAt(0))
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && ascii(1, 'PNG')) return 'image/png'
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp'
  // O PDF pode ter bytes antes do cabeçalho (até o byte 1024).
  for (let i = 0; i <= 1020; i++) if (ascii(i, '%PDF')) return 'application/pdf'
  return null
}

/**
 * A parcela é `round(total / N, 2)` e a última fecha a diferença (Decisão 10).
 * Null quando o centavo não divide (a RPC exige as duas positivas).
 */
export function valoresDoPlano(total: number, n: number): { parcela: number; ultima: number } | null {
  const parcela = Math.round((total / n) * 100) / 100
  const ultima = Math.round((total - parcela * (n - 1)) * 100) / 100
  return parcela > 0 && ultima > 0 ? { parcela, ultima } : null
}

/** A forma do parser no vocabulário de `transactions.payment_method`. */
const FORMA_NO_BANCO: Record<FormaDePagamento, string> = {
  pix: 'pix',
  debit: 'debit_card',
  credit_card: 'credit_card',
  cash: 'cash',
}

/**
 * O casamento é completo pelo apelido da Wallet, pelos 4 dígitos ou com toda
 * palavra do nome (3+ letras) no texto; uma palavra só de "Mercado Pago" não é.
 */
function casamentoCompleto(cartao: CartaoParaCasar, cartaoTexto: string, frase: string): boolean {
  if (cartao.wallet_alias != null && normalizarDescricao(cartao.wallet_alias) === normalizarDescricao(cartaoTexto)) {
    return true
  }
  const palavras = normalizarDescricao(frase).split(' ')
  if (cartao.last_four != null && palavras.includes(cartao.last_four)) return true
  return normalizarDescricao(cartao.name)
    .split(' ')
    .filter((p) => p.length >= 3 && !/^\d+$/.test(p))
    .every((p) => palavras.includes(p))
}

/** "R$ 42,00 · Mercado · Nubank"; sem cartão, sem a última parte. */
export function resumoDoLancamento(valor: number, descricao: string, nomeDoCartao?: string | null): string {
  return [moneyBRL(valor), descricao, nomeDoCartao].filter(Boolean).join(' · ')
}

/** "2026-04-08" de um calendário real, ou null. */
function dataValida(s: string | undefined): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T12:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null
}

export function montarLancamento(
  pedido: PedidoCaptura,
  ctx: ContextoCaptura,
): { ok: true; linha: LinhaCaptura; resumo: string; parcelas: number | null } | { ok: false; status: 422; erro: string } {
  let valor: number | null
  let data: string
  let tipo: 'expense' | 'income' = 'expense'
  let descricao: string
  let duvidas: string[]
  let forma: FormaDePagamento | null
  let cartaoTexto: string | null
  let parcelas: number | null = null
  let estorno = false
  const capturaMeta: MetaCaptura = {}
  const c = pedido.campos

  const applePay = temAmount(pedido.amount)
  if (applePay) {
    // Apple Pay: o estabelecimento é a descrição e o cartão da Wallet, o cartão.
    valor = valorDoAmount(pedido.amount)
    duvidas = []
    descricao = pedido.merchant?.trim() || DESCRICAO_PADRAO
    if (descricao === DESCRICAO_PADRAO) duvidas.push('descricao')
    data = dataValida(pedido.date) ?? ctx.hoje
    // Ilegível ou depois de hoje: fica hoje, ou a data dada, mas a conferir.
    if (pedido.date && (data !== pedido.date || data > ctx.hoje)) duvidas.push('data')
    cartaoTexto = pedido.card?.trim() || null
    forma = cartaoTexto ? 'credit_card' : null
  } else {
    const f = interpretarFrase(pedido.text ?? '', ctx.hoje)
    ;({ valor, data, tipo, descricao, forma, cartaoTexto, parcelas, estorno } = f)
    // Regra 1: a dúvida "cartao" só vale no crédito ("30 uber casa" não é cartão).
    duvidas = f.duvidas.filter((d) => d !== 'cartao' || forma === 'credit_card')
    if (c) {
      // Decisão 9: a IA vence e o texto completa, mas o valor que a pessoa
      // escreveu vence o lido. Daqui em diante, o mesmo caminho da frase.
      valor = valor ?? c.valor
      // Sem data lida, a do texto, que sem data dita já é hoje.
      data = c.data ?? data
      tipo = estorno ? 'income' : (c.tipo ?? tipo)
      if (c.descricao) descricao = c.descricao
      duvidas = c.descricao || !duvidas.includes('descricao') ? [] : ['descricao']
      forma = c.forma ?? forma
      // Como no parser (frase.ts): pix, débito ou dinheiro não têm cartão, e um
      // nome de cartão nunca vira crédito por cima da forma dita.
      cartaoTexto = forma == null || forma === 'credit_card' ? (c.cartao ?? cartaoTexto) : null
      parcelas = c.parcelas ?? parcelas
      capturaMeta.ia = { provedor: c.provedor, modelo: c.modelo }
    }
    // Compra depois de hoje (lida pela IA ou dita no texto) fica hoje, a
    // conferir: o plano sempre nasce com a 1ª parcela, que guarda o client_id.
    if (data > ctx.hoje) {
      data = ctx.hoje
      if (!duvidas.includes('data')) duvidas.push('data')
    }
  }

  if (valor == null) return { ok: false, status: 422, erro: ERRO_VALOR }
  if (valor > MAX_VALOR) return { ok: false, status: 422, erro: ERRO_LIMITE }

  // O cartão casado só vale numa carteira da pessoa (Foco 3); senão o
  // lançamento fica na padrão, sem cartão, a conferir.
  const casado = casarCartao(cartaoTexto, ctx.cartoes)
  const cartao = casado && ctx.carteirasDaPessoa.includes(casado.workspace_id) ? casado : null
  // "50 compras no mercado" casa o "Mercado Pago" por uma palavra: sem o
  // crédito dito, o casamento parcial leva à carteira do cartão, mas a conferir.
  // No Apple Pay o crédito é implícito, então o parcial sempre fica a conferir
  // ("Nubank" na Wallet × "Nubank Ultravioleta"), e a frase é o nome da Wallet.
  const frase = applePay || c ? cartaoTexto! : (pedido.text ?? '')
  if (cartao && (applePay || forma !== 'credit_card') && !casamentoCompleto(cartao, cartaoTexto!, frase)) {
    duvidas.push('cartao')
    // O nome da Wallet fica guardado: "Lembrar" o grava como apelido do cartão.
    if (applePay) capturaMeta.walletCard = cartaoTexto!
  }
  let cartaoSemCasar = cartaoTexto != null && cartao == null
  if (cartaoSemCasar) {
    if (applePay) capturaMeta.walletCard = cartaoTexto!
    else {
      // Regra 1: a palavra volta ao fim da descrição.
      descricao = duvidas.includes('descricao')
        ? cartaoTexto!.charAt(0).toUpperCase() + cartaoTexto!.slice(1)
        : `${descricao} ${cartaoTexto}`
      cartaoSemCasar = forma === 'credit_card' || casado != null
    }
  }
  if (cartao) forma = 'credit_card'
  // O estorno abate uma fatura: sem cartão casado, fica a conferir (como no formulário).
  if (estorno && !cartao && !duvidas.includes('cartao')) duvidas.push('cartao')

  const carteira = cartao?.workspace_id ?? ctx.carteiraPadrao
  // Regra 2: sem descrição de verdade, o histórico não tem o que casar.
  const historico = duvidas.includes('descricao')
    ? null
    : preencherPeloHistorico(descricao, tipo, ctx.historicoPorCarteira[carteira] ?? [])

  // Estorno sem cartão não herda a forma do histórico (um pix de lá não é a fatura).
  const paymentMethod = forma
    ? FORMA_NO_BANCO[forma]
    : estorno && !cartao
      ? null
      : (historico?.paymentMethod ?? null)
  let cartaoId = cartao?.id ?? null
  if (!forma && paymentMethod === 'credit_card') {
    // O cartão do histórico só se ainda ativo e da mesma carteira.
    const doHistorico = ctx.cartoes.find(
      (c) => c.id === historico?.creditCardId && c.is_active && c.workspace_id === carteira,
    )
    cartaoId = doHistorico?.id ?? null
  }

  // O plano é de despesa; a RPC acrescenta o "(k/N)" de cada parcela.
  let parcelasDoPlano = tipo === 'expense' && parcelas != null && parcelas > 1 ? parcelas : null
  // O centavo não divide ("0,10 em 6x"): lançamento simples do total, a conferir.
  if (parcelasDoPlano != null && valoresDoPlano(valor, parcelasDoPlano) == null) {
    parcelasDoPlano = null
    duvidas.push('parcelas')
  }
  const categoria = historico?.categoryId ?? null
  // Decisão 2: tudo que passou por IA nasce a conferir.
  const needsReview = duvidas.length > 0 || cartaoSemCasar || categoria == null || parcelasDoPlano != null || c != null
  if (needsReview && !applePay && pedido.text) capturaMeta.texto = pedido.text

  const nomeDoCartao = ctx.cartoes.find((c) => c.id === cartaoId)?.name
  return {
    ok: true,
    linha: {
      workspace_id: carteira,
      user_id: ctx.userId,
      type: tipo,
      amount: valor,
      description: descricao,
      date: `${data}T12:00:00.000Z`,
      payment_method: paymentMethod,
      payment_credit_card_id: cartaoId,
      category_id: categoria,
      source: pedido.source ?? 'shortcut',
      needs_review: needsReview,
      capture_meta: Object.keys(capturaMeta).length ? capturaMeta : null,
    },
    resumo: resumoDoLancamento(valor, descricao, nomeDoCartao),
    parcelas: parcelasDoPlano,
  }
}
