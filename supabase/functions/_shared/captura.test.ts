import { assert, assertEquals, assertMatch, assertNotEquals } from 'jsr:@std/assert@1.0.19'
import {
  ERRO_APPLE_PAY_SEM_VALOR,
  ERRO_VALOR,
  erroDoApplePaySemValor,
  aplicarCategoriaDaIA,
  clientIdDoPedido,
  montarLancamento,
  opcoesDoFormulario,
  precisaDeIA,
  resolverOpcao,
  resumoDaNotificacao,
  resumoDoErro,
  resumoDoLancamento,
  tipoDoArquivo,
  usoDoToken,
  validarPedido,
  valoresDoPlano,
  type CamposDaIA,
  type ContextoCaptura,
} from './captura.ts'
import type { CartaoParaCasar, CategoriaParaCasar, LinhaHistorico } from './frase.ts'

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

const cat = (id: string, name: string, type: 'expense' | 'income' = 'expense'): CategoriaParaCasar => ({ id, name, type })

/**
 * Sem `categoriasPorCarteira`, as categorias são as do histórico de cada
 * carteira (a Edge sempre as lê), com um nome que não casa descrição nenhuma.
 */
function ctx(over: Partial<ContextoCaptura> = {}): ContextoCaptura {
  const historicoPorCarteira = over.historicoPorCarteira ?? {}
  const categoriasPorCarteira = Object.fromEntries(
    Object.entries(historicoPorCarteira).map(([w, linhas]) => [
      w,
      linhas.filter((l) => l.category_id).map((l) => cat(l.category_id!, '-', l.type)),
    ]),
  )
  return {
    userId: 'u1',
    carteiraPadrao: PADRAO,
    carteirasDaPessoa: [PADRAO, OUTRA],
    cartoes: [],
    historicoPorCarteira,
    categoriasPorCarteira,
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
      codigo: 'sem_valor',
    })
  }
  assert(validarPedido({ amount: 'R$ 42,90', merchant: 'Mercado' }).ok)
  assert(validarPedido({ amount: 42.9, merchant: 'Mercado' }).ok)
})

Deno.test('validarPedido: sem texto e sem valor, corpo que não é objeto', () => {
  assertEquals(validarPedido({}), { ok: false, erro: 'Não entendi o valor. Ex.: 42 mercado', codigo: 'sem_valor' })
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
  assertEquals(r.linha.capture_meta, { categoria: 'historico' })
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
    codigo: 'sem_valor',
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
  assertEquals(r.linha.capture_meta, { texto: '42 mercado nubank', categoria: 'aprendido' })
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
  assertEquals(r.linha.capture_meta, { texto: '50 compras no mercado', categoria: 'historico' })
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
  assertEquals(r.linha.capture_meta, { walletCard: 'Visa Gold', categoria: 'historico' })
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
  assertEquals(r.linha.capture_meta, { categoria: 'historico' })
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
  assertEquals(r.linha.capture_meta, { ia: { provedor: 'groq', modelo: 'm1' }, categoria: 'historico' })
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
  assertEquals(r, { ok: false, status: 422, erro: 'Não entendi o valor. Ex.: 42 mercado', codigo: 'sem_valor' })
})

Deno.test('IA com parcelas leva o N ao plano', () => {
  assertEquals(ok(montarLancamento({ campos: ia({ valor: 300, parcelas: 3 }) }, ctx())).parcelas, 3)
  // Receita não vira plano (o plano é de despesa).
  assertEquals(ok(montarLancamento({ campos: ia({ tipo: 'income', parcelas: 3 }) }, ctx())).parcelas, null)
})

Deno.test('Foco 5: precisaDeIA só sem valor ou com dúvida de descrição, e nunca no Apple Pay', () => {
  assertEquals(precisaDeIA({ text: '42 mercado' }, HOJE, []), false)
  assertEquals(precisaDeIA({ text: 'paguei o almoço' }, HOJE, []), true)
  assertEquals(precisaDeIA({ text: '42' }, HOJE, []), true)
  assertEquals(precisaDeIA({ amount: 42, merchant: 'Café' }, HOJE, []), false)
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

Deno.test('a notificação do iPhone confirma o lançamento e avisa o erro', () => {
  assertEquals(resumoDaNotificacao('R$ 42,00 · Mercado · Nubank', 'expense', false), 'Gasto lançado: R$ 42,00 · Mercado · Nubank')
  assertEquals(resumoDaNotificacao('R$ 3.000,00 · Salário', 'income', false), 'Receita lançada: R$ 3.000,00 · Salário')
  assertEquals(resumoDaNotificacao('R$ 42,00 · Mercado', 'expense', true), 'Gasto lançado: R$ 42,00 · Mercado · a conferir')
  assertEquals(resumoDoErro('Não entendi o valor. Ex.: 42 mercado'), 'Não lançado: Não entendi o valor. Ex.: 42 mercado')
})

// --- Formulário do atalho (v2) ---------------------------------------------

const OPCOES = opcoesDoFormulario(
  [
    { id: 'a', name: 'Mercado' },
    { id: 'b', name: 'Mercado' },
    { id: 'c', name: 'Água' },
  ],
  [{ id: 'k', name: 'Nubank' }],
)

Deno.test('opcoesDoFormulario: topo fixo, ordem alfabética e sufixo nos repetidos', () => {
  assertEquals(OPCOES.categorias.map((c) => c.nome), ['Sem categoria', 'Água', 'Mercado', 'Mercado (2)'])
  assertEquals(OPCOES.pagamentos.map((p) => p.nome), ['Não informar', 'Nubank', 'Pix', 'Débito', 'Dinheiro'])
  assertEquals(OPCOES.categorias[0].id, null)
  assertEquals(OPCOES.categorias.map((c) => c.id), [null, 'c', 'a', 'b'])
  assertEquals(OPCOES.pagamentos[0], { nome: 'Não informar', forma: null, cartaoId: null })
})

Deno.test('opcoesDoFormulario: repetido só na caixa ou no acento também ganha sufixo', () => {
  const o = opcoesDoFormulario([{ id: 'x', name: 'Agua' }, { id: 'y', name: 'água' }], [{ id: 'p', name: 'pix' }])
  assertEquals(o.categorias.map((c) => c.nome), ['Sem categoria', 'Agua', 'água (2)'])
  assertEquals(o.pagamentos.map((p) => p.nome), ['Não informar', 'pix', 'Pix (2)', 'Débito', 'Dinheiro'])
})

Deno.test('resolverOpcao: sem acento, sem caixa e aparando espaços', () => {
  assertEquals(resolverOpcao(OPCOES.categorias, ' agua ')?.id, 'c')
  assertEquals(resolverOpcao(OPCOES.categorias, 'MERCADO (2)')?.id, 'b')
  assertEquals(resolverOpcao(OPCOES.categorias, 'Feira'), null)
  assertEquals(resolverOpcao(OPCOES.categorias, undefined), null)
})

Deno.test('validarPedido: category e payment são texto curto', () => {
  assert(validarPedido({ amount: '42,90', category: 'Mercado', payment: 'Pix' }).ok)
  assertEquals(validarPedido({ amount: '42,90', category: 5 }), { ok: false, erro: 'Corpo inválido.' })
  assertEquals(validarPedido({ amount: '42,90', payment: 'x'.repeat(501) }).ok, false)
})

const formulario = (pedido: Parameters<typeof montarLancamento>[0]) =>
  montarLancamento(pedido, ctx({ cartoes: [cartao('k', 'Nubank', PADRAO)], formulario: OPCOES }))

Deno.test('montarLancamento (formulário): despesa sem dúvidas, descrição pela categoria', () => {
  const r = ok(formulario({ amount: '42,90', merchant: '', category: 'Mercado', payment: 'Pix' }))
  assertEquals(r.linha.description, 'Mercado')
  assertEquals(r.linha.category_id, 'a')
  assertEquals(r.linha.payment_method, 'pix')
  assertEquals(r.linha.payment_credit_card_id, null)
  assertEquals(r.linha.needs_review, false)
  assertEquals(r.linha.type, 'expense')
  assertEquals(r.linha.amount, 42.9)
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.date, `${HOJE}T12:00:00.000Z`)
  assertEquals(r.linha.source, 'shortcut')
  assertEquals(r.linha.capture_meta, null)
  assertEquals(r.parcelas, null)
})

Deno.test('montarLancamento (formulário): "Mercado (2)" e descrição dada', () => {
  const r = ok(formulario({ amount: 10, merchant: ' Feira do bairro ', category: 'mercado (2)', payment: 'Dinheiro', date: '2026-04-02' }))
  assertEquals(r.linha.category_id, 'b')
  assertEquals(r.linha.description, 'Feira do bairro')
  assertEquals(r.linha.payment_method, 'cash')
  assertEquals(r.linha.date, '2026-04-02T12:00:00.000Z')
})

Deno.test('montarLancamento (formulário): "Sem categoria" sem descrição vira "Gasto"', () => {
  const r = ok(formulario({ amount: '5', category: 'Sem categoria', payment: 'Não informar' }))
  assertEquals(r.linha.description, 'Gasto')
  assertEquals(r.linha.category_id, null)
  assertEquals(r.linha.payment_method, null)
  assertEquals(r.linha.needs_review, false)
})

Deno.test('montarLancamento (formulário): cartão da lista', () => {
  const r = ok(formulario({ amount: '42,90', category: 'Água', payment: 'nubank' }))
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, 'k')
  assertEquals(r.resumo, resumoDoLancamento(42.9, 'Água', 'Nubank'))
})

Deno.test('montarLancamento (formulário): valor zero ou negativo é sem_valor', () => {
  for (const amount of ['0', '-3', 0]) {
    assertEquals(formulario({ amount, category: 'Mercado', payment: 'Pix' }), {
      ok: false,
      status: 422,
      erro: 'Não entendi o valor. Ex.: 42 mercado',
      codigo: 'sem_valor',
    })
  }
})

Deno.test('montarLancamento (formulário): opção fora da lista é opcao_invalida', () => {
  const invalida = { ok: false, status: 422, erro: 'Escolha uma opção da lista.', codigo: 'opcao_invalida' } as const
  assertEquals(formulario({ amount: '42,90', category: 'Feira', payment: 'Pix' }), invalida)
  assertEquals(formulario({ amount: '42,90', category: 'Mercado', payment: 'Itaú' }), invalida)
  // Sem as opções lidas pela Edge, nada se resolve.
  assertEquals(montarLancamento({ amount: '1', category: 'Mercado' }, ctx()), invalida)
})

Deno.test('usoDoToken: versão e gatilho só entram com cabeçalho válido; sem eles, as colunas ficam como estão', () => {
  const AGORA = '2026-04-10T15:00:00.000Z'
  assertEquals(usoDoToken('2', null, AGORA), { last_used_at: AGORA, atalho_versao: 2 })
  assertEquals(usoDoToken(' 99 ', null, AGORA), { last_used_at: AGORA, atalho_versao: 99 })
  for (const h of [null, '', '0', '100', '02', '2.5', 'v2', '-1']) assertEquals(usoDoToken(h, null, AGORA), { last_used_at: AGORA })
  assertEquals(usoDoToken('2', ' toque ', AGORA), { last_used_at: AGORA, atalho_versao: 2, atalho_gatilho: 'toque' })
  for (const g of ['siri', 'acao', 'toque', 'bloqueio', 'inicio'])
    assertEquals(usoDoToken(null, g, AGORA), { last_used_at: AGORA, atalho_gatilho: g })
  for (const g of [null, '', 'Siri', 'toque2', 'apple_pay']) assertEquals(usoDoToken(null, g, AGORA), { last_used_at: AGORA })
})

// --- Paridade com o app: categoria e cartão como na frase do formulário -----

Deno.test('paridade: "42 mercado" sem histórico pega a categoria Mercado escrita na frase', () => {
  const r = ok(montarLancamento({ text: '42 mercado' }, ctx({ categoriasPorCarteira: { [PADRAO]: [cat('mercado', 'Mercado')] } })))
  assertEquals(r.linha.category_id, 'mercado')
  assertEquals(r.linha.capture_meta?.categoria, 'dita')
  assertEquals(r.linha.needs_review, false)
  assertEquals(r.semCategoria, false)
})

Deno.test('paridade: "50 gasolina" cai em Transporte pela palavra comum, a conferir', () => {
  const r = ok(
    montarLancamento({ text: '50 gasolina' }, ctx({ categoriasPorCarteira: { [PADRAO]: [cat('transporte', 'Transporte')] } })),
  )
  assertEquals(r.linha.category_id, 'transporte')
  assertEquals(r.linha.needs_review, true)
  assertEquals(r.linha.capture_meta?.categoria, 'comum')
})

Deno.test('paridade: "30 no crédito" usa o cartão do último crédito do histórico', () => {
  const credito = (id: string, date: string) =>
    hist('Algo', 'cat-x', { payment_method: 'credit_card', payment_credit_card_id: id, date })
  const r = ok(
    montarLancamento(
      { text: '30 no crédito' },
      ctx({
        cartoes: [
          cartao('c-nu', 'Nubank', PADRAO),
          cartao('c-inter', 'Inter', PADRAO),
          cartao('c-velho', 'Velho', PADRAO, { is_active: false }),
          cartao('c-outra', 'Itaú', OUTRA),
        ],
        historicoPorCarteira: {
          [PADRAO]: [
            credito('c-nu', '2026-04-01T12:00:00.000Z'),
            credito('c-inter', '2026-04-05T12:00:00.000Z'),
            // Mais recentes, mas de um cartão inativo e de um de outra carteira.
            credito('c-velho', '2026-04-08T12:00:00.000Z'),
            credito('c-outra', '2026-04-09T12:00:00.000Z'),
          ],
        },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, 'c-inter')
})

Deno.test('paridade: parcelas sem forma dita vão ao cartão do último crédito', () => {
  const r = ok(
    montarLancamento(
      { text: '300 geladeira em 3x' },
      ctx({
        cartoes: [cartao('c-nu', 'Nubank', PADRAO)],
        historicoPorCarteira: { [PADRAO]: [hist('Algo', 'cat-x', { payment_method: 'credit_card', payment_credit_card_id: 'c-nu' })] },
      }),
    ),
  )
  assertEquals(r.parcelas, 3)
  assertEquals(r.linha.payment_method, 'credit_card')
  assertEquals(r.linha.payment_credit_card_id, 'c-nu')
})

Deno.test('paridade: a palavra que não é cartão volta com acento', () => {
  assertEquals(ok(montarLancamento({ text: '80 farmácia' }, ctx())).linha.description, 'Farmácia')
  assertEquals(ok(montarLancamento({ text: '80 no crédito farmácia' }, ctx())).linha.description, 'Farmácia')
  assertEquals(ok(montarLancamento({ text: '80 remédio no crédito farmácia' }, ctx())).linha.description, 'Remédio farmácia')
})

Deno.test('paridade: categoria de outra carteira não vale', () => {
  const r = ok(
    montarLancamento(
      { text: '42 mercado' },
      ctx({
        historicoPorCarteira: { [OUTRA]: [hist('Mercado', 'cat-b')] },
        categoriasPorCarteira: { [OUTRA]: [cat('cat-b', 'Mercado')] },
      }),
    ),
  )
  assertEquals(r.linha.workspace_id, PADRAO)
  assertEquals(r.linha.category_id, null)
  assertEquals(r.semCategoria, true)
})

Deno.test('paridade: receita não pega categoria de despesa', () => {
  const r = ok(
    montarLancamento({ text: 'recebi 200 reembolso' }, ctx({ categoriasPorCarteira: { [PADRAO]: [cat('reemb', 'Reembolso')] } })),
  )
  assertEquals(r.linha.type, 'income')
  assertEquals(r.linha.category_id, null)
})

Deno.test('paridade: "30 no crédito" com um só cartão ativo e sem histórico usa esse cartão', () => {
  const c = ctx({
    cartoes: [
      cartao('c-nu', 'Nubank', PADRAO),
      cartao('c-velho', 'Velho', PADRAO, { is_active: false }),
      cartao('c-outra', 'Itaú', OUTRA),
    ],
  })
  for (const text of ['30 no crédito', '300 tv em 3x']) {
    const r = ok(montarLancamento({ text }, c))
    assertEquals(r.linha.payment_method, 'credit_card', text)
    assertEquals(r.linha.payment_credit_card_id, 'c-nu', text)
  }
  // Dois ativos e sem histórico: nenhum palpite.
  const dois = ok(
    montarLancamento({ text: '30 no crédito' }, ctx({ cartoes: [cartao('c-nu', 'Nubank', PADRAO), cartao('c-inter', 'Inter', PADRAO)] })),
  )
  assertEquals(dois.linha.payment_credit_card_id, null)
})

// --- A IA escolhe o que ainda sobrar ---------------------------------------

const CATEGORIAS_DA_IA = [cat('carro', 'Carro'), cat('salario', 'Salário', 'income')]
const semCategoriaNaPadrao = (text: string) =>
  ok(montarLancamento({ text }, ctx({ categoriasPorCarteira: { [PADRAO]: CATEGORIAS_DA_IA } })))

Deno.test('ia: a sugestão vira a categoria e deixa a conferir', () => {
  const r = semCategoriaNaPadrao('45 zxqw')
  assertEquals(r.semCategoria, true)
  const linha = aplicarCategoriaDaIA(r.linha, ' carro ', CATEGORIAS_DA_IA)
  assertEquals(linha.category_id, 'carro')
  assertEquals(linha.needs_review, true)
  assertEquals(linha.capture_meta?.categoria, 'ia')
  // O resto do que a frase leu fica.
  assertEquals(linha.capture_meta?.texto, '45 zxqw')
})

Deno.test('ia: nome que não existe na carteira é ignorado', () => {
  const r = semCategoriaNaPadrao('45 zxqw')
  assertEquals(aplicarCategoriaDaIA(r.linha, 'Viagem', CATEGORIAS_DA_IA), r.linha)
})

Deno.test('ia: sugestão de despesa numa receita é ignorada', () => {
  const r = semCategoriaNaPadrao('recebi 200 zxqw')
  assertEquals(r.linha.type, 'income')
  assertEquals(aplicarCategoriaDaIA(r.linha, 'Carro', CATEGORIAS_DA_IA), r.linha)
  assertEquals(aplicarCategoriaDaIA(r.linha, 'Salário', CATEGORIAS_DA_IA).category_id, 'salario')
})

Deno.test('ia: sem IA a linha grava igual', () => {
  const r = semCategoriaNaPadrao('45 zxqw')
  const linha = aplicarCategoriaDaIA(r.linha, null, CATEGORIAS_DA_IA)
  assertEquals(linha, r.linha)
  assertEquals(linha.category_id, null)
  assertEquals(linha.needs_review, true)
})

// --- Revisão final -------------------------------------------------------------

Deno.test('"crédito" sem nome com dois cartões ativos: o palpite do último crédito, a conferir', () => {
  const nu = cartao('nu', 'Nubank', PADRAO)
  const itau = cartao('itau', 'Itaú', PADRAO)
  const r = ok(
    montarLancamento(
      { text: '45 mercado no crédito' },
      ctx({
        cartoes: [nu, itau],
        historicoPorCarteira: {
          [PADRAO]: [
            hist('Farmácia', 'c1', { payment_method: 'credit_card', payment_credit_card_id: 'nu', date: '2026-03-01T12:00:00.000Z' }),
            hist('Posto', 'c1', { payment_method: 'credit_card', payment_credit_card_id: 'itau', date: '2026-04-05T12:00:00.000Z' }),
          ],
        },
        categoriasPorCarteira: { [PADRAO]: [cat('c-merc', 'Mercado')] },
      }),
    ),
  )
  assertEquals([r.linha.payment_credit_card_id, r.linha.payment_method, r.linha.needs_review], ['itau', 'credit_card', true])
})

Deno.test('categoria pelo nome: limpa só quando o nome cobre a descrição', () => {
  const comCats = (cats: CategoriaParaCasar[]) => ctx({ categoriasPorCarteira: { [PADRAO]: cats } })
  const limpa = ok(montarLancamento({ text: '42 mercado' }, comCats([cat('c-merc', 'Mercado')])))
  assertEquals([limpa.linha.category_id, limpa.linha.needs_review], ['c-merc', false])
  const casa = ok(
    montarLancamento({ amount: 18, merchant: 'Casa do Pão de Queijo', source: 'apple_pay' }, comCats([cat('c-casa', 'Casa')])),
  )
  assertEquals([casa.linha.category_id, casa.linha.needs_review], ['c-casa', true])
  const livre = ok(montarLancamento({ text: '120 Mercado Livre' }, comCats([cat('c-merc', 'Mercado')])))
  assertEquals([livre.linha.category_id, livre.linha.needs_review], ['c-merc', true])
})

// --- A categoria dita na frase sai da descrição ------------------------------

Deno.test('dita: "pão mercado" grava Pão em Mercado, sem conferir', () => {
  const comCats = ctx({ categoriasPorCarteira: { [PADRAO]: [cat('c-merc', 'Mercado'), cat('c-alim', 'Alimentação')] } })
  const r = ok(montarLancamento({ text: 'pão mercado 12' }, comCats))
  assertEquals(
    [r.linha.description, r.linha.category_id, r.linha.needs_review, r.linha.capture_meta?.categoria, r.semCategoria],
    ['Pão', 'c-merc', false, 'dita', false],
  )
  const repetida = ok(montarLancamento({ text: '42 mercado mercado' }, comCats))
  assertEquals([repetida.linha.description, repetida.linha.category_id, repetida.linha.needs_review], ['Mercado', 'c-merc', false])
})

Deno.test('dita: o histórico e a IA veem a descrição já limpa', () => {
  // O histórico de "Pão" diz pix: a forma vem pela descrição limpa.
  const r = ok(
    montarLancamento(
      { text: 'pão mercado 12' },
      ctx({
        historicoPorCarteira: { [PADRAO]: [hist('Pão', 'c-merc', { payment_method: 'debit_card' })] },
        categoriasPorCarteira: { [PADRAO]: [cat('c-merc', 'Mercado')] },
      }),
    ),
  )
  assertEquals([r.linha.description, r.linha.payment_method], ['Pão', 'debit_card'])
  // A descrição lida pela IA também perde a categoria dita.
  const lida = ok(
    montarLancamento(
      { text: 'paguei o pão do mercado', campos: ia({ descricao: 'Pão mercado', valor: 12 }) },
      ctx({ categoriasPorCarteira: { [PADRAO]: [cat('c-merc', 'Mercado')] } }),
    ),
  )
  assertEquals([lida.linha.description, lida.linha.category_id, lida.linha.capture_meta?.categoria], ['Pão', 'c-merc', 'dita'])
})

Deno.test('dita: o estabelecimento do Apple Pay não é frase, e "Mercado Livre" segue o nome', () => {
  const comCats = ctx({ categoriasPorCarteira: { [PADRAO]: [cat('c-merc', 'Mercado')] } })
  const pay = ok(montarLancamento({ amount: 30, merchant: 'Pão mercado', source: 'apple_pay' }, comCats))
  assertEquals([pay.linha.description, pay.linha.capture_meta?.categoria], ['Pão mercado', 'nome'])
  const livre = ok(montarLancamento({ text: '80 Mercado Livre' }, comCats))
  assertEquals([livre.linha.description, livre.linha.capture_meta?.categoria, livre.linha.needs_review], ['Mercado Livre', 'nome', true])
})

Deno.test('dita: a descrição lida da foto não perde a categoria, nem com texto junto', () => {
  const comCats = ctx({ categoriasPorCarteira: { [PADRAO]: [cat('c-merc', 'Mercado')] } })
  const foto = ok(montarLancamento({ campos: ia({ descricao: 'Pão mercado', daFoto: true }) }, comCats))
  assertEquals([foto.linha.description, foto.linha.capture_meta?.categoria], ['Pão mercado', 'nome'])
  const comTexto = ok(montarLancamento({ text: 'recibo', campos: ia({ descricao: 'Pão mercado', daFoto: true }) }, comCats))
  assertEquals([comTexto.linha.description, comTexto.linha.capture_meta?.categoria], ['Pão mercado', 'nome'])
  // Sem descrição na foto, a do texto da pessoa vale, e ela tem categoria dita.
  const doTexto = ok(montarLancamento({ text: 'pão mercado', campos: ia({ descricao: null, daFoto: true }) }, comCats))
  assertEquals([doTexto.linha.description, doTexto.linha.capture_meta?.categoria], ['Pão', 'dita'])
})

Deno.test('dita: depois de um conectivo é fraca, a conferir, e o histórico vence', () => {
  const lugares = ['Casa', 'Transporte', 'Trabalho', 'Mercado', 'Saúde', 'Água', 'Pet', 'Filhos'].map((n) =>
    cat(n.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase(), n),
  )
  const sem = ctx({ categoriasPorCarteira: { [PADRAO]: lugares } })
  const linha = (text: string, c = sem) => {
    const l = ok(montarLancamento({ text }, c)).linha
    return [l.description, l.category_id, l.capture_meta?.categoria, l.needs_review]
  }
  const uber = ctx({
    historicoPorCarteira: { [PADRAO]: [hist('Uber', 'transporte'), hist('Uber', 'transporte'), hist('Uber', 'transporte')] },
    categoriasPorCarteira: { [PADRAO]: lugares },
  })
  assertEquals(linha('uber pra casa 25', uber), ['Uber pra casa', 'transporte', 'historico', false])
  assertEquals(linha('uber para casa 25', uber), ['Uber para casa', 'transporte', 'historico', false])
  // Sem histórico, a dita fraca fica, mas a conferir: nada a grava limpa.
  assertEquals(linha('uber pra casa 25'), ['Uber', 'casa', 'dita', true])
  assertEquals(linha('12 pão no mercado'), ['Pão', 'mercado', 'dita', true])
  assertEquals(linha('plano de saúde 300'), ['Plano de saúde', 'saude', 'dita', true])
  assertEquals(linha('brinquedo para o pet 40'), ['Brinquedo', 'pet', 'dita', true])
  assertEquals(linha('escola dos filhos 500'), ['Escola dos filhos', 'filhos', 'dita', true])
  // A forte segue limpa.
  assertEquals(linha('pão mercado 12'), ['Pão', 'mercado', 'dita', false])
})

Deno.test('dita: a fraca com o histórico conferido que concorda fica limpa', () => {
  const cats = [cat('luz', 'Luz'), cat('casa', 'Casa')]
  const com = (linhas: LinhaHistorico[]) => ctx({ historicoPorCarteira: { [PADRAO]: linhas }, categoriasPorCarteira: { [PADRAO]: cats } })
  const linha = (text: string, c: ContextoCaptura) => {
    const l = ok(montarLancamento({ text }, c)).linha
    return [l.description, l.category_id, l.capture_meta?.categoria, l.needs_review]
  }
  const luz = Array.from({ length: 5 }, () => hist('Conta de luz', 'luz'))
  assertEquals(linha('conta de luz 150', com(luz)), ['Conta de luz', 'luz', 'dita', false])
  const lanche = Array.from({ length: 5 }, () => hist('Lanche', 'casa'))
  assertEquals(linha('lanche em casa 20', com(lanche)), ['Lanche', 'casa', 'dita', false])
  assertEquals(linha('conta de luz 150', com([])), ['Conta de luz', 'luz', 'dita', true])
})

Deno.test('Apple Pay só com texto sem valor pede o atalho novo e mostra o que chegou', () => {
  const r = montarLancamento({ text: 'Padaria Real', source: 'apple_pay' }, ctx())
  assertEquals(r.ok, false)
  if (r.ok) return
  assertEquals(r.status, 422)
  assertEquals(r.codigo, 'sem_valor')
  assertEquals(r.erro, `${ERRO_APPLE_PAY_SEM_VALOR} Chegou: "Padaria Real"`)
})

Deno.test('Apple Pay com propriedades vazias lança pelo texto', () => {
  const l = ok(montarLancamento({ amount: '', merchant: '', card: '', text: 'Padaria Real 42,90', source: 'apple_pay' }, ctx()))
  assertEquals(l.linha.amount, 42.9)
  assertEquals(l.linha.source, 'apple_pay')
  assertEquals(l.linha.needs_review, true)
})

Deno.test('Apple Pay com milhar no valor', () => {
  const l = ok(montarLancamento({ amount: 'R$ 1.234,56', merchant: 'Loja', source: 'apple_pay' }, ctx()))
  assertEquals(l.linha.amount, 1234.56)
})

Deno.test('Apple Pay: o valor com a sigla da moeda ou no formato americano', () => {
  for (const [amount, esperado] of [
    ['BRL 42,90', 42.9],
    ['42,90 BRL', 42.9],
    ['$42.90', 42.9],
    ['US$ 42.90', 42.9],
    ['1,234.56', 1234.56],
    ['R$ 42,90', 42.9],
    ['R$\u00a042,90', 42.9],
    ['R$\u202f42,90', 42.9],
    ['42,90 R$', 42.9],
    ['R$ 42', 42],
    ['42.90', 42.9],
  ] as const) {
    const l = ok(montarLancamento({ amount, merchant: 'Loja', source: 'apple_pay' }, ctx()))
    assertEquals(l.linha.amount, esperado, amount)
  }
  assertEquals(validarPedido({ amount: '-BRL 10,00', merchant: 'Loja', source: 'apple_pay' }).ok, false)
  assertEquals(validarPedido({ amount: '−R$ 10,00', merchant: 'Loja', source: 'apple_pay' }).ok, false)
})

Deno.test('Apple Pay: o pedido do atalho v4, com o valor da transação em texto, lança', () => {
  const l = ok(
    montarLancamento(
      { amount: 'R$ 42,90', merchant: 'PADARIA REAL', card: 'Nubank', text: 'Padaria Real', source: 'apple_pay' },
      ctx(),
    ),
  )
  assertEquals([l.linha.amount, l.linha.description, l.linha.payment_method], [42.9, 'Padaria Real', 'credit_card'])
})

Deno.test('Apple Pay: o nome da loja em maiúsculas vira nome próprio', () => {
  const caixa = (merchant: string) =>
    ok(montarLancamento({ amount: 10, merchant, card: 'Visa', source: 'apple_pay' }, ctx())).linha.description
  assertEquals(caixa('PADARIA REAL'), 'Padaria Real')
  assertEquals(caixa('POSTO DE GASOLINA DA ESQUINA'), 'Posto de Gasolina da Esquina')
  assertEquals(caixa('DROGARIA SÃO PAULO'), 'Drogaria São Paulo')
  assertEquals(caixa('iFood'), 'iFood')
  assertEquals(caixa('Outback Steakhouse'), 'Outback Steakhouse')
})

Deno.test('Apple Pay: cartão de débito é débito, sem cartão de crédito', () => {
  const c = ctx({ cartoes: [cartao('k-itau', 'Itaú', PADRAO)] })
  for (const card of ['Itaú Débito', 'Itau debito', 'Nubank Debit']) {
    const l = ok(montarLancamento({ amount: 30, merchant: 'Drogasil', card, source: 'apple_pay' }, c))
    assertEquals([l.linha.payment_method, l.linha.payment_credit_card_id, l.linha.capture_meta?.walletCard], ['debit_card', null, undefined], card)
  }
  const cred = ok(montarLancamento({ amount: 30, merchant: 'Drogasil', card: 'Itaú', source: 'apple_pay' }, c))
  assertEquals([cred.linha.payment_method, cred.linha.payment_credit_card_id], ['credit_card', 'k-itau'])
})

Deno.test('Apple Pay: estorno não lança', () => {
  const v = validarPedido({ amount: '-R$ 10,00', merchant: 'Loja', source: 'apple_pay' })
  assertEquals(v, { ok: false, erro: ERRO_VALOR, codigo: 'sem_valor' })
})

Deno.test('Apple Pay sem valor e sem texto pede o atalho novo, não "Ex.: 42 mercado"', () => {
  const esperado = { ok: false as const, erro: ERRO_APPLE_PAY_SEM_VALOR, codigo: 'sem_valor' as const }
  assertEquals(validarPedido({ text: '', source: 'apple_pay' }), esperado)
  assertEquals(validarPedido({ source: 'apple_pay' }), esperado)
})

Deno.test('Apple Pay com valor e texto longo demais passa, e o texto fica no teto', () => {
  const v = validarPedido({ amount: 42, merchant: 'Loja', text: 'x'.repeat(600), source: 'apple_pay' })
  assert(v.ok)
  if (!v.ok) return
  assertEquals(v.pedido.text?.length, 500)
  assertEquals(ok(montarLancamento(v.pedido, ctx())).linha.amount, 42)
  // Os outros campos e a frase de outras origens seguem com o teto.
  assertEquals(validarPedido({ amount: 42, merchant: 'x'.repeat(600), source: 'apple_pay' }).ok, false)
  assertEquals(validarPedido({ text: 'x'.repeat(600), source: 'share' }).ok, false)
})

Deno.test('Apple Pay com o valor lido do texto fica a conferir', () => {
  // Com o histórico que limparia a frase, o valor do texto ainda é palpite.
  const cats = [cat('pad', 'Padaria')]
  const hs = Array.from({ length: 5 }, () => hist('Padaria Real', 'pad'))
  const c = ctx({ historicoPorCarteira: { [PADRAO]: hs }, categoriasPorCarteira: { [PADRAO]: cats } })
  assertEquals(ok(montarLancamento({ text: 'Padaria Real 42,90' }, c)).linha.needs_review, false)
  const l = ok(montarLancamento({ text: 'Padaria Real 42,90', source: 'apple_pay' }, c))
  assertEquals(l.linha.amount, 42.9)
  assertEquals(l.linha.needs_review, true)
})

Deno.test('erroDoApplePaySemValor corta o eco em 60 caracteres', () => {
  assertEquals(erroDoApplePaySemValor(undefined), ERRO_APPLE_PAY_SEM_VALOR)
  assertEquals(erroDoApplePaySemValor('   '), ERRO_APPLE_PAY_SEM_VALOR)
  assertEquals(erroDoApplePaySemValor('a'.repeat(80)), `${ERRO_APPLE_PAY_SEM_VALOR} Chegou: "${'a'.repeat(60)}…"`)
})

Deno.test('precisaDeIA: o Apple Pay nunca, nem só com texto', () => {
  assertEquals(precisaDeIA({ text: 'Padaria Real', source: 'apple_pay' }, '2026-11-23', []), false)
})

Deno.test('frase do atalho sem valor continua com o erro de sempre', () => {
  const r = montarLancamento({ text: 'mercado', source: 'shortcut' }, ctx())
  assertEquals(r.ok === false && r.erro, ERRO_VALOR)
})
