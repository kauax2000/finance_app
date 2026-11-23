/**
 * A captura sem abrir o app (Edge `capture`), em funções puras: o pedido do
 * Atalho do iPhone vira a linha de `transactions` que a Edge grava como a
 * pessoa. A Edge só faz I/O em volta disto.
 */
import {
  cartaoDoCredito,
  casarCartao,
  casarCategoria,
  interpretarFrase,
  lerNumero,
  normalizarDescricao,
  palavrasDosCartoes,
  preencherPeloHistorico,
  type CartaoParaCasar,
  type CategoriaParaCasar,
  type FormaDePagamento,
  type LinhaHistorico,
  type MotivoDaCategoria,
} from './frase.ts'
import { tipoDaCategoria } from './credit-card-cycle.ts'
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
  /** O formulário do atalho v2: os nomes escolhidos nas listas do GET. */
  category?: string
  payment?: string
  /** O que a IA leu (Decisão 9). Nunca vem do corpo: a Edge o põe depois de chamar a IA. */
  campos?: CamposDaIA
}

export type CamposDaIA = CamposIA & { provedor: Provedor; modelo: string }

type MetaCaptura = {
  walletCard?: string
  texto?: string
  ia?: { provedor: Provedor; modelo: string }
  /** De onde veio a categoria escolhida (a medição de quanto o atalho acerta). */
  categoria?: MotivoDaCategoria
}

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
  /** As categorias (despesa e receita) de cada carteira da pessoa. */
  categoriasPorCarteira: Record<string, CategoriaParaCasar[]>
  hoje: string // YYYY-MM-DD, o dia de São Paulo
  /** As listas do GET, lidas da carteira padrão: só o pedido do formulário as usa. */
  formulario?: OpcoesDoFormulario
}

/** O código estável do erro: o atalho abre o formulário com `sem_valor`. */
export type CodigoDoErro = 'sem_valor' | 'opcao_invalida'

type FormaDaOpcao = 'credit_card' | 'pix' | 'debit_card' | 'cash' | null
export type OpcoesDoFormulario = {
  /** `descricao` é o nome de verdade (sem o sufixo de repetido), para a descrição vazia. */
  categorias: { nome: string; id: string | null; descricao?: string }[]
  pagamentos: { nome: string; forma: FormaDaOpcao; cartaoId: string | null }[]
}

const SEM_CATEGORIA = 'Sem categoria'
const NAO_INFORMAR = 'Não informar'

/**
 * As listas do formulário do atalho: "Sem categoria" e "Não informar" no topo,
 * as categorias e os cartões por nome, e as formas fixas no fim. O atalho manda
 * de volta o nome, então cada nome é único na lista pela mesma comparação do
 * `resolverOpcao` (sem acento e sem caixa): o repetido ganha " (2)", " (3)".
 */
export function opcoesDoFormulario(
  categorias: { id: string; name: string }[],
  cartoes: { id: string; name: string }[],
): OpcoesDoFormulario {
  const porNome = <T extends { name: string }>(l: T[]) => [...l].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const unico = (usados: Set<string>) => (nome: string) => {
    let n = 1
    let c = nome
    while (usados.has(normalizarDescricao(c))) c = `${nome} (${++n})`
    usados.add(normalizarDescricao(c))
    return c
  }
  const cat = unico(new Set())
  const pag = unico(new Set())
  return {
    categorias: [
      { nome: cat(SEM_CATEGORIA), id: null },
      ...porNome(categorias).map((c) => ({ nome: cat(c.name), id: c.id, descricao: c.name })),
    ],
    pagamentos: [
      { nome: pag(NAO_INFORMAR), forma: null, cartaoId: null },
      ...porNome(cartoes).map((c) => ({ nome: pag(c.name), forma: 'credit_card' as const, cartaoId: c.id })),
      { nome: pag('Pix'), forma: 'pix', cartaoId: null },
      { nome: pag('Débito'), forma: 'debit_card', cartaoId: null },
      { nome: pag('Dinheiro'), forma: 'cash', cartaoId: null },
    ],
  }
}

/** A opção pelo nome que o atalho devolveu, sem acento, sem caixa e aparando espaços. */
export function resolverOpcao<T extends { nome: string }>(lista: T[], nome: string | undefined): T | null {
  if (nome == null) return null
  const alvo = normalizarDescricao(nome)
  return lista.find((o) => normalizarDescricao(o.nome) === alvo) ?? null
}

export const ERRO_VALOR = 'Não entendi o valor. Ex.: 42 mercado'
const ERRO_OPCAO = 'Escolha uma opção da lista.'
const DESCRICAO_DO_FORMULARIO = 'Gasto'
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
): { ok: true; pedido: PedidoCaptura } | { ok: false; erro: string; codigo?: CodigoDoErro } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, erro: 'Corpo inválido.' }
  const b = body as Record<string, unknown>
  for (const campo of ['text', 'merchant', 'card', 'date', 'category', 'payment'] as const) {
    if (b[campo] != null && typeof b[campo] !== 'string') return { ok: false, erro: 'Corpo inválido.' }
    if (typeof b[campo] === 'string' && (b[campo] as string).length > MAX_TEXTO) return { ok: false, erro: ERRO_TEXTO }
  }
  if (b.id != null && (typeof b.id !== 'string' || !b.id.trim() || b.id.length > 200)) {
    return { ok: false, erro: 'Id inválido.' }
  }
  if (b.source != null && !ORIGENS.includes(b.source as Origem)) return { ok: false, erro: 'Origem inválida.' }
  if (temAmount(b.amount)) {
    if (valorDoAmount(b.amount) == null) return { ok: false, erro: ERRO_VALOR, codigo: 'sem_valor' }
  } else if (!comFoto && (typeof b.text !== 'string' || !b.text.trim())) {
    return { ok: false, erro: ERRO_VALOR, codigo: 'sem_valor' }
  }
  // Só os campos do contrato: `campos` (a IA) nunca entra pelo corpo.
  const { id, text, amount, merchant, card, date, source, category, payment } = b as PedidoCaptura
  return { ok: true, pedido: { id, text, amount, merchant, card, date, source, category, payment } }
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
export function precisaDeIA(pedido: PedidoCaptura, hoje: string, cartoes?: CartaoParaCasar[]): boolean {
  if (temAmount(pedido.amount)) return false
  const f = interpretarFrase(pedido.text ?? '', hoje, cartoes && palavrasDosCartoes(cartoes))
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

/**
 * O texto da notificação do iPhone: o atalho mostra o `resumo` da resposta, então
 * todo lançamento confirma ("Gasto lançado: R$ 42,00 · Mercado · Nubank") e todo
 * erro também avisa ("Não lançado: <motivo>"), em vez de uma notificação vazia.
 */
export function resumoDaNotificacao(resumo: string, tipo: 'expense' | 'income', aConferir: boolean): string {
  return `${tipo === 'income' ? 'Receita lançada' : 'Gasto lançado'}: ${resumo}${aConferir ? ' · a conferir' : ''}`
}

export function resumoDoErro(erro: string): string {
  return `Não lançado: ${erro}`
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
):
  | { ok: true; linha: LinhaCaptura; resumo: string; parcelas: number | null; semCategoria: boolean }
  | { ok: false; status: 422; erro: string; codigo?: CodigoDoErro } {
  if (pedido.category != null || pedido.payment != null) return montarDoFormulario(pedido, ctx)
  let valor: number | null
  let data: string
  let tipo: 'expense' | 'income' = 'expense'
  let descricao: string
  let duvidas: string[]
  let forma: FormaDePagamento | null
  let cartaoTexto: string | null
  let cartaoPalavra: string | null | undefined = null
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
    const f = interpretarFrase(pedido.text ?? '', ctx.hoje, palavrasDosCartoes(ctx.cartoes))
    ;({ valor, data, tipo, descricao, forma, cartaoTexto, cartaoPalavra, parcelas, estorno } = f)
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
      // O nome lido pela IA já vem como foi escrito.
      if (c.cartao) cartaoPalavra = null
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

  if (valor == null) return { ok: false, status: 422, erro: ERRO_VALOR, codigo: 'sem_valor' }
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
      // Regra 1: a palavra volta ao fim da descrição, como foi escrita.
      const palavra = cartaoPalavra || cartaoTexto!
      descricao = duvidas.includes('descricao')
        ? palavra.charAt(0).toUpperCase() + palavra.slice(1)
        : `${descricao} ${palavra}`
      cartaoSemCasar = forma === 'credit_card' || casado != null
    }
  }
  if (cartao) forma = 'credit_card'
  // O estorno abate uma fatura: sem cartão casado, fica a conferir (como no formulário).
  if (estorno && !cartao && !duvidas.includes('cartao')) duvidas.push('cartao')

  const carteira = cartao?.workspace_id ?? ctx.carteiraPadrao
  const historicoDaCarteira = ctx.historicoPorCarteira[carteira] ?? []
  // Regra 2: sem descrição de verdade, o histórico não tem o que casar.
  const semDescricao = duvidas.includes('descricao')
  // O estorno no cartão busca a categoria da compra, no histórico de despesa.
  const tipoCategoria = tipoDaCategoria(tipo, estorno ? (cartao?.id ?? null) : null)
  const historico = semDescricao ? null : preencherPeloHistorico(descricao, tipoCategoria, historicoDaCarteira)
  // Como no app (frase-no-form.ts): só as categorias da carteira de destino, do tipo.
  const categoria = semDescricao
    ? null
    : casarCategoria(descricao, tipoCategoria, ctx.categoriasPorCarteira[carteira] ?? [], historicoDaCarteira)

  // Como no app: "crédito" sem nome, ou parcelas sem forma dita, é o único cartão
  // ativo da carteira, senão o do último crédito. Um nome de cartão que não casou
  // não ganha palpite. O "último escolhido neste aparelho" só existe no app.
  const cartoesDaCarteira = ctx.cartoes.filter((k) => k.workspace_id === carteira)
  const ativos = cartoesDaCarteira.filter((k) => k.is_active)
  const doCredito =
    tipo === 'expense' &&
    !cartao &&
    ((forma === 'credit_card' && !cartaoTexto) || (!forma && !cartaoSemCasar && parcelas != null && parcelas > 1))
      ? cartaoDoCredito(cartoesDaCarteira, historicoDaCarteira, ativos.length === 1 ? ativos[0].id : null)
      : null
  if (doCredito) {
    forma = 'credit_card'
    duvidas = duvidas.filter((d) => d !== 'cartao')
  }

  // Estorno sem cartão não herda a forma do histórico (um pix de lá não é a fatura).
  const paymentMethod = forma
    ? FORMA_NO_BANCO[forma]
    : estorno && !cartao
      ? null
      : (historico?.paymentMethod ?? null)
  let cartaoId = cartao?.id ?? doCredito?.id ?? null
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
  // Decisão 2: tudo que passou por IA nasce a conferir. A palavra comum é um
  // palpite que o atalho não mostra antes de gravar: fica a conferir também.
  const needsReview =
    duvidas.length > 0 ||
    cartaoSemCasar ||
    categoria == null ||
    categoria.motivo === 'comum' ||
    parcelasDoPlano != null ||
    c != null
  if (needsReview && !applePay && pedido.text) capturaMeta.texto = pedido.text
  if (categoria) capturaMeta.categoria = categoria.motivo

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
      category_id: categoria?.categoryId ?? null,
      source: pedido.source ?? 'shortcut',
      needs_review: needsReview,
      capture_meta: Object.keys(capturaMeta).length ? capturaMeta : null,
    },
    resumo: resumoDoLancamento(valor, descricao, nomeDoCartao),
    parcelas: parcelasDoPlano,
    semCategoria: !semDescricao && categoria == null,
  }
}

/**
 * O formulário do atalho v2: a pessoa escolheu tudo, então é despesa, na
 * carteira padrão, sem "a conferir" e sem histórico nem IA. Categoria ou
 * pagamento ausente vale "Sem categoria" / "Não informar"; um nome fora das
 * listas do GET é recusado (a lista mudou entre o GET e o POST).
 */
function montarDoFormulario(
  pedido: PedidoCaptura,
  ctx: ContextoCaptura,
): { ok: true; linha: LinhaCaptura; resumo: string; parcelas: null; semCategoria: false } | { ok: false; status: 422; erro: string; codigo?: CodigoDoErro } {
  const valor = valorDoAmount(pedido.amount)
  if (valor == null) return { ok: false, status: 422, erro: ERRO_VALOR, codigo: 'sem_valor' }
  if (valor > MAX_VALOR) return { ok: false, status: 422, erro: ERRO_LIMITE }
  const opcoes = ctx.formulario
  const escolha = <T extends { nome: string }>(lista: T[] | undefined, nome: string | undefined) =>
    lista ? resolverOpcao(lista, nome?.trim() ? nome : lista[0].nome) : null
  const categoria = escolha(opcoes?.categorias, pedido.category)
  const pagamento = escolha(opcoes?.pagamentos, pedido.payment)
  if (!categoria || !pagamento) return { ok: false, status: 422, erro: ERRO_OPCAO, codigo: 'opcao_invalida' }

  const descricao = pedido.merchant?.trim() || categoria.descricao || DESCRICAO_DO_FORMULARIO
  const data = dataValida(pedido.date) ?? ctx.hoje
  return {
    ok: true,
    linha: {
      workspace_id: ctx.carteiraPadrao,
      user_id: ctx.userId,
      type: 'expense',
      amount: valor,
      description: descricao,
      date: `${data}T12:00:00.000Z`,
      payment_method: pagamento.forma,
      payment_credit_card_id: pagamento.cartaoId,
      category_id: categoria.id,
      source: pedido.source ?? 'shortcut',
      needs_review: false,
      capture_meta: null,
    },
    resumo: resumoDoLancamento(valor, descricao, ctx.cartoes.find((c) => c.id === pagamento.cartaoId)?.name),
    parcelas: null,
    semCategoria: false,
  }
}

export const GATILHOS_DO_ATALHO = ['siri', 'acao', 'toque', 'bloqueio', 'inicio']

/**
 * O update de `capture_tokens` a cada uso válido. `atalho_versao` só entra com
 * `X-Atalho-Versao` válido (1 a 99) e `atalho_gatilho` só com `X-Atalho-Gatilho`
 * conhecido. A automação do Apple Pay roda o mesmo atalho e manda os dois;
 * só a folha de compartilhar do Android (e pedido sem cabeçalho) não os
 * manda e não pode zerar as colunas (nulo = atalho v1, "baixe de novo").
 */
export function usoDoToken(
  versao: string | null,
  gatilho: string | null,
  agora: string,
): { last_used_at: string; atalho_versao?: number; atalho_gatilho?: string } {
  const v = versao?.trim() ?? ''
  const g = gatilho?.trim() ?? ''
  return {
    last_used_at: agora,
    ...(/^[1-9]\d?$/.test(v) && { atalho_versao: Number(v) }),
    ...(GATILHOS_DO_ATALHO.includes(g) && { atalho_gatilho: g }),
  }
}
