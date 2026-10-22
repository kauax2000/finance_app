import { assert, assertEquals, assertMatch, assertNotEquals } from 'jsr:@std/assert@1.0.19'
import { clientIdDoPedido, montarLancamento, validarPedido, type ContextoCaptura } from './captura.ts'
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
  assertNotEquals(r.linha.category_id, 'cat-alheia')
  assertEquals(r.linha.needs_review, true)
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

Deno.test('parcelas > 1 vira lançamento simples com "(1/N)" e a conferir', () => {
  const r = ok(
    montarLancamento(
      { text: '300 geladeira nubank em 3x' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', PADRAO)],
        historicoPorCarteira: { [PADRAO]: [hist('Geladeira', 'cat-casa')] },
      }),
    ),
  )
  assertEquals(r.linha.description, 'Geladeira (1/3)')
  assertEquals(r.linha.amount, 300)
  assertEquals(r.linha.needs_review, true)
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
})
