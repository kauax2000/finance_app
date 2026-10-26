import { assert, assertEquals, assertMatch, assertNotEquals } from 'jsr:@std/assert@1.0.19'
import {
  clientIdDoPedido,
  montarLancamento,
  precisaDeIA,
  tipoDoArquivo,
  validarPedido,
  valoresDoPlano,
  type CamposDaIA,
  type ContextoCaptura,
} from './captura.ts'
import type { CartaoParaCasar, LinhaHistorico } from './frase.ts'

const HOJE = '2026-04-10'
const PADRAO = 'w-padrao'
const OUTRA = 'w-outra'
const ALHEIA = 'w-alheia'

const cartao = (id: string, name: string, workspace_id: string, extra: Partial<CartaoParaCasar> = {}): CartaoParaCasar => ({
  id,
  name,
  wallet_alias: null,
  last_four: null,
  workspace_id,
  is_active: true,
  ...extra,
})

const hist = (description: string, category_id: string, extra: Partial<LinhaHistorico> = {}): LinhaHistorico => ({
  description,
  category_id,
  payment_method: 'pix',
  payment_credit_card_id: null,
  date: '2026-04-01T12:00:00.000Z',
  type: 'expense',
  ...extra,
})

function ctx(over: Partial<ContextoCaptura> = {}): ContextoCaptura {
  return {
    userId: 'u1',
    carteiraPadrao: PADRAO,
    carteirasDaPessoa: [PADRAO, OUTRA],
    cartoes: [],
    historicoPorCarteira: {},
    hoje: HOJE,
    ...over,
  }
}

function ok(r: ReturnType<typeof montarLancamento>) {
  if (!r.ok) throw new Error(`esperava ok, veio ${r.erro}`)
  return r
}

// --- Foco 1: retry com o mesmo id ------------------------------------------

Deno.test('clientIdDoPedido: estável, com forma de UUID v4, e outro id dá outro', async () => {
  const a = await clientIdDoPedido('t1', 'abc')
  assertEquals(a, await clientIdDoPedido('t1', 'abc'))
  assertMatch(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assertNotEquals(a, await clientIdDoPedido('t1', 'abd'))
  // O mesmo id noutro token não colide.
  assertNotEquals(a, await clientIdDoPedido('t2', 'abc'))
})

// --- validarPedido -----------------------------------------------------------

Deno.test('validarPedido: texto acima de 500 caracteres', () => {
  assertEquals(validarPedido({ text: 'a'.repeat(501) }), { ok: false, erro: 'Texto acima de 500 caracteres.' })
  assert(validarPedido({ text: '42 ' + 'a'.repeat(497) }).ok)
})

Deno.test('validarPedido: amount negativo, zero ou ilegível é recusado', () => {
  for (const amount of [-5, 0, '-5', 'abc', Number.NaN]) {
    assertEquals(validarPedido({ amount, merchant: 'Mercado' }), {
      ok: false,
      erro: 'Não entendi o valor. Ex.: 42 mercado',
    })
  }
  assert(validarPedido({ amount: 'R$ 42,90', merchant: 'Mercado' }).ok)
  assert(validarPedido({ amount: 42.9, merchant: 'Mercado' }).ok)
})

Deno.test('validarPedido: sem texto e sem valor, corpo que não é objeto', () => {
  assertEquals(validarPedido({}), { ok: false, erro: 'Não entendi o valor. Ex.: 42 mercado' })
  assertEquals(validarPedido(null).ok, false)
  assertEquals(validarPedido([]).ok, false)
  assertEquals(validarPedido({ text: 42 }).ok, false)
})

Deno.test('validarPedido: só shortcut, apple_pay e share vêm de fora', () => {
  assert(validarPedido({ text: '42 mercado', source: 'share' }).ok)
  assertEquals(validarPedido({ text: '42 mercado', source: 'quick_text' }), { ok: false, erro: 'Origem inválida.' })
  assertEquals(validarPedido({ text: '42 mercado', source: 'app' }).ok, false)
})

Deno.test('validarPedido: id precisa ser texto curto', () => {
  assert(validarPedido({ text: '42 mercado', id: 'abc' }).ok)
  assertEquals(validarPedido({ text: '42 mercado', id: 7 }).ok, false)
  assertEquals(validarPedido({ text: '42 mercado', id: 'x'.repeat(201) }).ok, false)
})

// --- montarLancamento: frase ------------------------------------------------

Deno.test('montarLancamento: "42 mercado" sem histórico fica a conferir, sem categoria', () => {
  const r = ok(montarLancamento({ text: '42 mercado' }, ctx()))
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.linha.category_id, null)
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.user_id, 'u1')
  assertEquals(r.linha.amount, 42)
  assertEquals(r.linha.type, 'expense')
  assertEquals(r.linha.description, 'Mercado')
  assertEquals(r.linha.date, '2026-04-10T12:00:00.000Z')
  assertEquals(r.linha.source, 'shortcut')
  assertEquals(r.linha.capture_meta, { texto: '42 mercado' })
  assertEquals(r.resumo, 'R$ 42,00 · Mercado')
})

Deno.test('montarLancamento: com histórico pega categoria e forma, e não fica a conferir', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado' },
      ctx({ historicoPorCarteira: { [PADRAO]: [hist('Mercado', 'cat-mercado', { payment_method: 'debit_card' })] } }),
    ),
  )
  assertEquals(r.linha.category_id, 'cat-mercado')
  assertEquals(r.linha.payment_method, 'debit_card')
  assertEquals(r.linha.needs_review, false)
  assertEquals(r.linha.capture_meta, null)
})

Deno.test('estorno sem cartão fica a conferir e não herda a forma do histórico', () => {
  const r = ok(
    montarLancamento(
      { text: 'estorno 30 uber' },
      ctx({ historicoPorCarteira: { [PADRAO]: [hist('Uber', 'cat-reemb', { type: 'income', payment_method: 'pix' })] } }),
    ),
  )
  assertEquals(r.linha.type, 'income')
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.linha.payment_method, null)
  assertEquals(r.linha.payment_credit_card_id, null)
})

Deno.test('estorno no cartão preenche a categoria pelo histórico de despesa', () => {
  const r = ok(
    montarLancamento(
      { text: 'estorno 30 mercado nubank' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', PADRAO)],
        historicoPorCarteira: {
          [PADRAO]: [
            hist('Mercado', 'cat-mercado', { payment_method: 'credit_card', payment_credit_card_id: 'c-nu' }),
            hist('Mercado', 'cat-reemb', { type: 'income', date: '2026-04-05T12:00:00.000Z' }),
          ],
        },
      }),
    ),
  )
  assertEquals(r.linha.type, 'income')
  assertEquals(r.linha.payment_credit_card_id, 'c-nu')
  assertEquals(r.linha.category_id, 'cat-mercado')
})

Deno.test('montarLancamento: sem valor devolve 422 com a mensagem exata', () => {
  assertEquals(montarLancamento({ text: 'mercado nubank' }, ctx()), {
    ok: false,
    status: 422,
    erro: 'Não entendi o valor. Ex.: 42 mercado',
  })
})

Deno.test('montarLancamento: valor acima de 1.000.000 devolve 422', () => {
  assertEquals(montarLancamento({ text: '1.000.001 casa' }, ctx()), {
    ok: false,
    status: 422,
    erro: 'Valor acima do limite.',
  })
  assertEquals(montarLancamento({ amount: 2_000_000, merchant: 'Casa' }, ctx()).ok, false)
  assert(montarLancamento({ text: '1.000.000 casa' }, ctx()).ok)
})

Deno.test('montarLancamento: cartão casado vai à carteira dele e usa o histórico dela', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado nubank' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', OUTRA)],
        historicoPorCarteira: {
          [PADRAO]: [hist('Mercado', 'cat-padrao')],
          [OUTRA]: [hist('Mercado', 'cat-outra')],
        },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, OUTRA)
  assertEquals(r.linha.category_id, 'cat-outra')
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, 'c-nu')
  assertEquals(r.linha.needs_review, false)
  assertEquals(r.resumo, 'R$ 42,00 · Mercado · Nubank')
})

Deno.test('Foco 3: cartão de carteira alheia não é usado; fica na padrão, sem cartão, a conferir', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado nubank' },
      ctx({
        cartoes: [cartao('c-alheio', 'Nubank', ALHEIA)],
        historicoPorCarteira: { [PADRAO]: [hist('Mercado', 'cat-padrao')], [ALHEIA]: [hist('Mercado', 'cat-alheia')] },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.payment_credit_card_id, null)
  // O histórico é o da padrão, e a palavra do cartão volta à descrição.
  assertEquals(r.linha.category_id, 'cat-padrao')
  assertEquals(r.linha.description, 'Mercado nubank')
  assertEquals(r.linha.capture_meta, { texto: '42 mercado nubank' })
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.resumo, 'R$\u00a042,00 · Mercado nubank')
})

Deno.test('Foco 3: cartão casado pelo apelido da Wallet numa carteira alheia também fica fora', () => {
  const r = ok(
    montarLancamento(
      { amount: 42, merchant: 'Mercado', card: 'Roxinho', source: 'apple_pay' },
      ctx({ cartoes: [cartao('c-alheio', 'Nubank', ALHEIA, { wallet_alias: 'Roxinho' })] }),
    ),
  )
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.payment_credit_card_id, null)
  assertEquals(r.linha.needs_review, true)
})

Deno.test('regra 1: cartão não casado volta ao fim da descrição; sem crédito, sem dúvida "cartao"', () => {
  const r = ok(
    montarLancamento(
      { text: '30 uber casa' },
      ctx({ historicoPorCarteira: { [PADRAO]: [hist('Uber', 'cat-uber')] } }),
    ),
  )
  assertEquals(r.linha.description, 'Uber casa')
  assertEquals(r.linha.category_id, 'cat-uber')
  assertEquals(r.linha.needs_review, false)
})

Deno.test('regra 1: no crédito, cartão citado e não casado fica a conferir', () => {
  const r = ok(
    montarLancamento(
      { text: '30 uber no crédito xpto' },
      ctx({ historicoPorCarteira: { [PADRAO]: [hist('Uber', 'cat-uber')] } }),
    ),
  )
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, null)
  assertEquals(r.linha.needs_review, true)
})

Deno.test('o histórico não pega cartão de outra carteira nem cartão inativo', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado' },
      ctx({
        cartoes: [cartao('c-velho', 'Velho', PADRAO, { is_active: false })],
        historicoPorCarteira: {
          [PADRAO]: [hist('Mercado', 'cat-mercado', { payment_method: 'credit_card', payment_credit_card_id: 'c-velho' })],
        },
      }),
    ),
  )
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, null)
})

Deno.test('o histórico não pega cartão que mora noutra carteira', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado' },
      ctx({
        cartoes: [cartao('c-outra', 'Inter', OUTRA)],
        historicoPorCarteira: {
          [PADRAO]: [hist('Mercado', 'cat-mercado', { payment_method: 'credit_card', payment_credit_card_id: 'c-outra' })],
        },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, null)
})

Deno.test('casamento parcial do nome ("mercado" × "Mercado Pago") fica a conferir', () => {
  const r = ok(
    montarLancamento(
      { text: '50 compras no mercado' },
      ctx({
        cartoes: [cartao('c-mp', 'Mercado Pago', OUTRA)],
        historicoPorCarteira: { [OUTRA]: [hist('Compras', 'cat-compras')] },
      }),
    ),
  )
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.linha.capture_meta, { texto: '50 compras no mercado' })
})

// Os 4 dígitos numa frase o parser ainda não separa como cartão (minor da Tarefa 2).
Deno.test('casamento completo: o nome inteiro, ou o crédito dito', () => {
  const c = ctx({
    cartoes: [cartao('c-mp', 'Mercado Pago', OUTRA)],
    historicoPorCarteira: { [OUTRA]: [hist('Lanche', 'cat-lanche')] },
  })
  for (const text of ['50 lanche mercado pago', '50 lanche no crédito mercado']) {
    const r = ok(montarLancamento({ text }, c))
    assertEquals(r.linha.payment_credit_card_id, 'c-mp', text)
    assertEquals(r.linha.needs_review, false, text)
  }
})

Deno.test('o histórico preenche o cartão quando a frase não diz a forma', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', PADRAO)],
        historicoPorCarteira: {
          [PADRAO]: [hist('Mercado', 'cat-mercado', { payment_method: 'credit_card', payment_credit_card_id: 'c-nu' })],
        },
      }),
    ),
  )
  assertEquals(r.linha.payment_credit_card_id, 'c-nu')
  assertEquals(r.resumo, 'R$ 42,00 · Mercado · Nubank')
})

Deno.test('a forma dita na frase vence a do histórico; débito vira debit_card', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado no débito' },
      ctx({ historicoPorCarteira: { [PADRAO]: [hist('Mercado', 'cat-mercado', { payment_method: 'pix' })] } }),
    ),
  )
  assertEquals(r.linha.payment_method, 'debit_card')
})

Deno.test('com dúvida "descricao" o histórico não é consultado', () => {
  const r = ok(
    montarLancamento(
      { text: '42' },
      ctx({ historicoPorCarteira: { [PADRAO]: [hist('Lançamento rápido', 'cat-x')] } }),
    ),
  )
  assertEquals(r.linha.category_id, null)
  assertEquals(r.linha.needs_review, true)
})

Deno.test('parcelas > 1 sai sem "(1/N)" e com o N para o plano (Decisão 10)', () => {
  const r = ok(
    montarLancamento(
      { text: '300 geladeira nubank em 3x' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', PADRAO)],
        historicoPorCarteira: { [PADRAO]: [hist('Geladeira', 'cat-casa')] },
      }),
    ),
  )
  assertEquals(r.linha.description, 'Geladeira')
  assertEquals(r.linha.amount, 300)
  assertEquals(r.parcelas, 3)
  assertEquals(r.linha.needs_review, true)
  assertEquals(ok(montarLancamento({ text: '42 mercado' }, ctx())).parcelas, null)
})

Deno.test('valoresDoPlano: round(total/N) e a última fecha a diferença; centavo que não divide fica de fora', () => {
  assertEquals(valoresDoPlano(100, 3), { parcela: 33.33, ultima: 33.34 })
  assertEquals(valoresDoPlano(300, 3), { parcela: 100, ultima: 100 })
  assertEquals(valoresDoPlano(10, 6), { parcela: 1.67, ultima: 1.65 })
  assertEquals(valoresDoPlano(0.1, 6), null)
  assertEquals(valoresDoPlano(0.01, 3), null)
})

Deno.test('receita da frase vai como income', () => {
  const r = ok(montarLancamento({ text: 'recebi 100 freela' }, ctx()))
  assertEquals(r.linha.type, 'income')
})

Deno.test('source do pedido é gravada', () => {
  assertEquals(ok(montarLancamento({ text: '42 mercado', source: 'share' }, ctx())).linha.source, 'share')
})

// --- montarLancamento: Apple Pay --------------------------------------------

Deno.test('Apple Pay sem casamento grava capture_meta.walletCard, crédito sem cartão, a conferir', () => {
  const r = ok(
    montarLancamento(
      { amount: 'R$ 42,90', merchant: 'Padaria Real', card: 'Visa Gold', source: 'apple_pay' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', PADRAO)],
        historicoPorCarteira: { [PADRAO]: [hist('Padaria Real', 'cat-padaria')] },
      }),
    ),
  )
  assertEquals(r.linha.amount, 42.9)
  assertEquals(r.linha.description, 'Padaria Real')
  assertEquals(r.linha.capture_meta, { walletCard: 'Visa Gold' })
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, null)
  assertEquals(r.linha.category_id, 'cat-padaria')
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.linha.source, 'apple_pay')
})

Deno.test('Apple Pay casa pelo wallet_alias e aceita amount numérico', () => {
  const r = ok(
    montarLancamento(
      { amount: 42.9, merchant: 'Padaria Real', card: 'Roxinho', source: 'apple_pay' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', OUTRA, { wallet_alias: 'Roxinho' })],
        historicoPorCarteira: { [OUTRA]: [hist('Padaria Real', 'cat-padaria')] },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, OUTRA)
  assertEquals(r.linha.payment_credit_card_id, 'c-nu')
  assertEquals(r.linha.capture_meta, null)
  assertEquals(r.linha.needs_review, false)
  assertEquals(r.resumo, 'R$ 42,90 · Padaria Real · Nubank')
})

Deno.test('Apple Pay usa a data do pedido; data ilegível cai em hoje e fica a conferir', () => {
  const base = { amount: 10, merchant: 'Café' }
  const c = ctx({ historicoPorCarteira: { [PADRAO]: [hist('Café', 'cat-cafe')] } })
  const comData = ok(montarLancamento({ ...base, date: '2026-04-08' }, c))
  assertEquals(comData.linha.date, '2026-04-08T12:00:00.000Z')
  assertEquals(comData.linha.needs_review, false)
  const ruim = ok(montarLancamento({ ...base, date: '08/04/2026' }, c))
  assertEquals(ruim.linha.date, '2026-04-10T12:00:00.000Z')
  assertEquals(ruim.linha.needs_review, true)
  const futura = ok(montarLancamento({ ...base, date: '2099-12-31' }, c))
  assertEquals(futura.linha.date, '2099-12-31T12:00:00.000Z')
  assertEquals(futura.linha.needs_review, true)
})

Deno.test('amount vazio (variável do Atalho sem valor) conta como ausente', () => {
  for (const amount of ['', '   ']) {
    assert(validarPedido({ text: '42 mercado', amount }).ok)
    const r = ok(montarLancamento({ text: '42 mercado', amount }, ctx()))
    assertEquals(r.linha.amount, 42)
    assertEquals(r.linha.description, 'Mercado')
  }
  assertEquals(validarPedido({ amount: '' }).ok, false)
})

Deno.test('Apple Pay com casamento parcial mantém o cartão, mas fica a conferir', () => {
  const r = ok(
    montarLancamento(
      { amount: 42, merchant: 'Padaria Real', card: 'Nubank', source: 'apple_pay' },
      ctx({
        cartoes: [cartao('c-uv', 'Nubank Ultravioleta', OUTRA)],
        historicoPorCarteira: { [OUTRA]: [hist('Padaria Real', 'cat-padaria')] },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, OUTRA)
  assertEquals(r.linha.payment_credit_card_id, 'c-uv')
  assertEquals(r.linha.category_id, 'cat-padaria')
  assertEquals(r.linha.needs_review, true)
})

Deno.test('Apple Pay com casamento parcial guarda o nome da Wallet para o "Lembrar"', () => {
  const r = ok(
    montarLancamento(
      { amount: 42, merchant: 'Padaria Real', card: 'Nubank', source: 'apple_pay' },
      ctx({ cartoes: [cartao('c-uv', 'Nubank Ultravioleta', OUTRA)] }),
    ),
  )
  assertEquals(r.linha.payment_credit_card_id, 'c-uv')
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.linha.capture_meta?.walletCard, 'Nubank')
})

Deno.test('Apple Pay com casamento completo pelo nome não fica a conferir', () => {
  const r = ok(
    montarLancamento(
      { amount: 42, merchant: 'Padaria Real', card: 'Nubank Ultravioleta', source: 'apple_pay' },
      ctx({
        cartoes: [cartao('c-uv', 'Nubank Ultravioleta', OUTRA)],
        historicoPorCarteira: { [OUTRA]: [hist('Padaria Real', 'cat-padaria')] },
      }),
    ),
  )
  assertEquals(r.linha.payment_credit_card_id, 'c-uv')
  assertEquals(r.linha.needs_review, false)
})

// --- IA (Decisões 2 e 9) ----------------------------------------------------

const ia = (over: Partial<CamposDaIA> = {}): CamposDaIA => ({
  valor: 42,
  data: '2026-04-08',
  descricao: 'Padaria Real',
  tipo: 'expense',
  parcelas: null,
  forma: null,
  cartao: null,
  provedor: 'groq',
  modelo: 'm1',
  ...over,
})

Deno.test('Foco 1: campos da IA sempre a conferir, mesmo com histórico e cartão casado; capture_meta.ia', () => {
  const r = ok(
    montarLancamento(
      { campos: ia({ cartao: 'Nubank', forma: 'credit_card' }) },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', OUTRA)],
        historicoPorCarteira: { [OUTRA]: [hist('Padaria Real', 'cat-padaria')] },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, OUTRA)
  assertEquals(r.linha.payment_credit_card_id, 'c-nu')
  assertEquals(r.linha.category_id, 'cat-padaria')
  assertEquals(r.linha.amount, 42)
  assertEquals(r.linha.description, 'Padaria Real')
  assertEquals(r.linha.date, '2026-04-08T12:00:00.000Z')
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.linha.capture_meta, { ia: { provedor: 'groq', modelo: 'm1' } })
})

Deno.test('IA: cartão de carteira alheia continua bloqueado (Foco 3)', () => {
  const r = ok(
    montarLancamento(
      { campos: ia({ cartao: 'Nubank', forma: 'credit_card' }) },
      ctx({ cartoes: [cartao('c-alheio', 'Nubank', ALHEIA)] }),
    ),
  )
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.payment_credit_card_id, null)
  assertEquals(r.linha.needs_review, true)
})

Deno.test('IA: o valor escrito no texto vence o lido; data nula vira hoje; forma vai ao banco', () => {
  const r = ok(
    montarLancamento(
      { text: '55 almoço', campos: ia({ valor: 42, data: null, forma: 'debit', descricao: null }) },
      ctx(),
    ),
  )
  assertEquals(r.linha.amount, 55)
  assertEquals(r.linha.date, '2026-04-10T12:00:00.000Z')
  assertEquals(r.linha.payment_method, 'debit_card')
  assertEquals(r.linha.description, 'Almoço')
  assertEquals(r.linha.capture_meta, { ia: { provedor: 'groq', modelo: 'm1' }, texto: '55 almoço' })
})

Deno.test('IA sem data: vale a data dita no texto ("ontem")', () => {
  const r = ok(montarLancamento({ text: 'ontem almoço', campos: ia({ data: null }) }, ctx()))
  assertEquals(r.linha.date, '2026-04-09T12:00:00.000Z')
})

Deno.test('IA sem valor e sem texto com valor: 422 do valor', () => {
  const r = montarLancamento({ campos: ia({ valor: null }) }, ctx())
  assertEquals(r, { ok: false, status: 422, erro: 'Não entendi o valor. Ex.: 42 mercado' })
})

Deno.test('IA com parcelas leva o N ao plano', () => {
  assertEquals(ok(montarLancamento({ campos: ia({ valor: 300, parcelas: 3 }) }, ctx())).parcelas, 3)
  // Receita não vira plano (o plano é de despesa).
  assertEquals(ok(montarLancamento({ campos: ia({ tipo: 'income', parcelas: 3 }) }, ctx())).parcelas, null)
})

Deno.test('Foco 5: precisaDeIA só sem valor ou com dúvida de descrição, e nunca no Apple Pay', () => {
  assertEquals(precisaDeIA({ text: '42 mercado' }, HOJE), false)
  assertEquals(precisaDeIA({ text: 'paguei o almoço' }, HOJE), true)
  assertEquals(precisaDeIA({ text: '42' }, HOJE), true)
  assertEquals(precisaDeIA({ amount: 42, merchant: 'Café' }, HOJE), false)
})

Deno.test('validarPedido: com foto o texto é opcional; campos da IA não entram pelo corpo', () => {
  assert(validarPedido({}, true).ok)
  assertEquals(validarPedido({}).ok, false)
  const v = validarPedido({ text: '42 mercado', campos: ia() })
  assert(v.ok && v.pedido.campos === undefined)
})

Deno.test('tipoDoArquivo: pelos bytes, não pelo nome', () => {
  const b = (...xs: (number | string)[]) =>
    new Uint8Array(xs.flatMap((x) => (typeof x === 'string' ? [...x].map((c) => c.charCodeAt(0)) : [x])))
  assertEquals(tipoDoArquivo(b(0xff, 0xd8, 0xff, 0xe0)), 'image/jpeg')
  assertEquals(tipoDoArquivo(b(0x89, 'PNG', 0x0d, 0x0a)), 'image/png')
  assertEquals(tipoDoArquivo(b('RIFF', 0, 0, 0, 0, 'WEBPVP8 ')), 'image/webp')
  assertEquals(tipoDoArquivo(b('%PDF-1.7')), 'application/pdf')
  // HEIC: "ftypheic" no byte 4.
  assertEquals(tipoDoArquivo(b(0, 0, 0, 0x18, 'ftypheic')), null)
  assertEquals(tipoDoArquivo(new Uint8Array()), null)
})

Deno.test('data depois de hoje (da IA) fica hoje e a conferir', () => {
  const c = ctx({ historicoPorCarteira: { [PADRAO]: [hist('Padaria Real', 'cat-padaria')] } })
  const r = ok(montarLancamento({ campos: ia({ data: '2026-04-11' }) }, c))
  assertEquals(r.linha.date, '2026-04-10T12:00:00.000Z')
  assertEquals(r.linha.needs_review, true)
})

Deno.test('com parcelas > 1, a 1ª cobrança do plano (p_next_billing_date) nunca passa de hoje', () => {
  const r = ok(montarLancamento({ campos: ia({ valor: 300, parcelas: 3, data: '2026-04-11' }) }, ctx()))
  assertEquals(r.parcelas, 3)
  // A Edge manda `linha.date.slice(0, 10)` como p_next_billing_date.
  assert(r.linha.date.slice(0, 10) <= HOJE)
})

// --- fix round 1 ------------------------------------------------------------

Deno.test('I2: IA com débito e nome de cartão não vai ao cartão; a forma dita vence', () => {
  const r = ok(
    montarLancamento(
      { campos: ia({ forma: 'debit', cartao: 'Nubank' }) },
      ctx({ cartoes: [cartao('c-nu', 'Nubank', PADRAO)] }),
    ),
  )
  assertEquals(r.linha.payment_credit_card_id, null)
  assertEquals(r.linha.payment_method, 'debit_card')
  assertEquals(r.linha.description, 'Padaria Real')
  for (const forma of ['pix', 'cash'] as const) {
    const o = ok(montarLancamento({ campos: ia({ forma, cartao: 'Nubank' }) }, ctx({ cartoes: [cartao('c-nu', 'Nubank', PADRAO)] })))
    assertEquals(o.linha.payment_credit_card_id, null)
  }
})

Deno.test('parcelas que o centavo não divide: lançamento simples, sem plano, a conferir', () => {
  const r = ok(
    montarLancamento(
      { text: '0,10 cafe em 6x' },
      ctx({ historicoPorCarteira: { [PADRAO]: [hist('Cafe', 'cat-cafe')] } }),
    ),
  )
  assertEquals(r.parcelas, null)
  assertEquals(r.linha.amount, 0.1)
  assertEquals(r.linha.needs_review, true)
})

Deno.test('tipoDoArquivo: PDF com lixo antes do %PDF (até 1024 bytes) ainda é PDF', () => {
  const lixo = new Uint8Array(1030)
  lixo.set([...'%PDF-1.4'].map((c) => c.charCodeAt(0)), 500)
  assertEquals(tipoDoArquivo(lixo), 'application/pdf')
  const longe = new Uint8Array(1100)
  longe.set([...'%PDF-1.4'].map((c) => c.charCodeAt(0)), 1050)
  assertEquals(tipoDoArquivo(longe), null)
})
