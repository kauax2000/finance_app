import { assertEquals } from 'jsr:@std/assert@1.0.19'
import {
  detectarAtipicos,
  detectarDuplicidades,
  detectarParcelasAcabando,
  detectarPrecoDeAssinatura,
  detectarRecorrencias,
  detectarSazonais,
  type Lanc,
  normalizarDescricao,
  resumoDaFatura,
} from './detectores.ts'

const HOJE = '2026-10-25'
let seq = 0
function l(p: Partial<Lanc>): Lanc {
  seq++
  return {
    id: `t${String(seq).padStart(3, '0')}`,
    type: 'expense',
    amount: 100,
    dateYmd: HOJE,
    description: 'Netflix',
    category_id: null,
    payment_method: 'credit_card',
    payment_credit_card_id: 'card-1',
    subscription_id: null,
    installment_plan_id: null,
    ligadoAConta: false,
    needs_review: false,
    ...p,
  }
}

Deno.test('normalizarDescricao: sem acento, dígito, pontuação, domínio nem palavra curta', () => {
  assertEquals(normalizarDescricao('Netflix.com 12/10'), 'netflix')
  assertEquals(normalizarDescricao('NETFLIX'), 'netflix')
  assertEquals(normalizarDescricao('Matrícula da escola - SP'), 'matricula escola')
  assertEquals(normalizarDescricao(null), '')
  assertEquals(normalizarDescricao('12/10'), '')
})

// ── Recorrência ──────────────────────────────────────────────────────────────

Deno.test('recorrência: 3 meses seguidos dentro de ±10% viram assinatura no cartão', () => {
  const ls = [
    l({ dateYmd: '2026-08-05', amount: 39.9, description: 'NETFLIX.COM 08/05' }),
    l({ dateYmd: '2026-09-05', amount: 39.9, description: 'Netflix.com' }),
    l({ dateYmd: '2026-10-05', amount: 41.9, description: 'Netflix', category_id: 'cat-lazer' }),
  ]
  const r = detectarRecorrencias(ls, HOJE, [])
  assertEquals(r.length, 1)
  assertEquals(r[0].chave, 'rec:netflix')
  assertEquals(r[0].nome, 'Netflix')
  assertEquals(r[0].destino, 'assinatura')
  assertEquals(r[0].dia, 5)
  assertEquals(r[0].valorMedio, 40.57)
  assertEquals(r[0].lancamentos, ls.map((x) => x.id))
  assertEquals(r[0].card_id, 'card-1')
  assertEquals(r[0].category_id, 'cat-lazer')
  assertEquals(r[0].payment_method, 'credit_card')
})

Deno.test('recorrência: o mais recente pode ser o mês anterior; Pix vira conta a pagar', () => {
  const ls = [
    l({ dateYmd: '2026-07-10', amount: 180, description: 'Luz', payment_method: 'pix', payment_credit_card_id: null }),
    l({ dateYmd: '2026-08-10', amount: 190, description: 'Luz', payment_method: 'pix', payment_credit_card_id: null }),
    l({ dateYmd: '2026-09-10', amount: 185, description: 'Luz', payment_method: 'pix', payment_credit_card_id: null }),
  ]
  const r = detectarRecorrencias(ls, HOJE, [])
  assertEquals(r.length, 1)
  assertEquals(r[0].destino, 'conta')
  assertEquals(r[0].card_id, null)
})

Deno.test('recorrência: o nome de uma conta ou assinatura ativa não vira recorrência de novo', () => {
  const aluguel = ['2026-08-05', '2026-09-05', '2026-10-05'].map((d) =>
    l({ dateYmd: d, amount: 2000, description: 'Pix Aluguel', payment_method: 'pix', payment_credit_card_id: null }),
  )
  assertEquals(detectarRecorrencias(aluguel, HOJE, []).length, 1)
  // A conta "Aluguel" ativa, paga por Pix sem vínculo.
  assertEquals(detectarRecorrencias(aluguel, HOJE, ['Aluguel']), [])
  // A assinatura "Netflix" ativa, cobrada sem `subscription_id` (importação do banco).
  const netflix = ['2026-08-05', '2026-09-05', '2026-10-05'].map((d) => l({ dateYmd: d, amount: 39.9, description: 'NETFLIX.COM' }))
  assertEquals(detectarRecorrencias(netflix, HOJE, ['Netflix.com']), [])
  // Um nome que só contém parte de outra palavra não esconde ("uber" não é "uberlandia").
  assertEquals(detectarRecorrencias(netflix, HOJE, ['Aluguel', 'Net']).length, 1)
})

Deno.test('recorrência: 3 meses que terminam há dois meses não contam', () => {
  const ls = ['2026-06-10', '2026-07-10', '2026-08-10'].map((d) => l({ dateYmd: d, description: 'Luz' }))
  assertEquals(detectarRecorrencias(ls, HOJE, []), [])
})

Deno.test('recorrência: 2 meses no mesmo dia ±3 casam', () => {
  const ls = [
    l({ dateYmd: '2026-09-12', amount: 50, description: 'Academia', payment_method: 'debit_card' }),
    l({ dateYmd: '2026-10-14', amount: 50, description: 'Academia', payment_method: 'debit_card' }),
  ]
  const r = detectarRecorrencias(ls, HOJE, [])
  assertEquals(r.length, 1)
  assertEquals(r[0].destino, 'assinatura')
  assertEquals(r[0].dia, 14)
})

Deno.test('Foco 2: dois cafés de R$ 8 no mesmo mês não são recorrência', () => {
  const ls = [
    l({ dateYmd: '2026-10-03', amount: 8, description: 'Café' }),
    l({ dateYmd: '2026-10-04', amount: 8, description: 'Café' }),
  ]
  assertEquals(detectarRecorrencias(ls, HOJE, []), [])
})

Deno.test('Foco 2: lançamento já ligado a assinatura, conta ou parcela não entra', () => {
  const datas = ['2026-08-05', '2026-09-05', '2026-10-05']
  const comAssinatura = datas.map((d, i) => l({ dateYmd: d, subscription_id: i === 0 ? 'sub-1' : null }))
  const comConta = datas.map((d, i) => l({ dateYmd: d, ligadoAConta: i === 1 }))
  const comParcela = datas.map((d, i) => l({ dateYmd: d, installment_plan_id: i === 2 ? 'p1' : null }))
  // Sobram dois meses, a ±3 dias: o par casa, mas o ligado nunca vai na lista.
  for (const ls of [comAssinatura, comConta, comParcela]) {
    const r = detectarRecorrencias(ls, HOJE, [])
    const ligado = ls.find((x) => x.subscription_id || x.ligadoAConta || x.installment_plan_id)!
    assertEquals(r.every((x) => !x.lancamentos.includes(ligado.id)), true)
  }
  const tudoLigado = datas.map((d) => l({ dateYmd: d, subscription_id: 'sub-1' }))
  assertEquals(detectarRecorrencias(tudoLigado, HOJE, []), [])
})

Deno.test('Foco 2: o valor que varia 12% não casa', () => {
  const tres = [
    l({ dateYmd: '2026-08-05', amount: 100 }),
    l({ dateYmd: '2026-09-05', amount: 100 }),
    l({ dateYmd: '2026-10-05', amount: 112 }),
  ]
  assertEquals(detectarRecorrencias(tres, HOJE, []), [])
  const dois = [l({ dateYmd: '2026-09-05', amount: 100 }), l({ dateYmd: '2026-10-05', amount: 112 })]
  assertEquals(detectarRecorrencias(dois, HOJE, []), [])
})

Deno.test('Foco 2: o dia 12 contra o 16 não é "mesmo dia ±3"', () => {
  const ls = [l({ dateYmd: '2026-09-12', amount: 50 }), l({ dateYmd: '2026-10-16', amount: 50 })]
  assertEquals(detectarRecorrencias(ls, HOJE, []), [])
})

Deno.test('recorrência: receita e lançamento futuro não entram', () => {
  const ls = [
    l({ dateYmd: '2026-08-05', type: 'income', description: 'Salário' }),
    l({ dateYmd: '2026-09-05', type: 'income', description: 'Salário' }),
    l({ dateYmd: '2026-10-05', type: 'income', description: 'Salário' }),
    l({ dateYmd: '2026-10-28', description: 'Luz' }),
    l({ dateYmd: '2026-11-28', description: 'Luz' }),
  ]
  assertEquals(detectarRecorrencias(ls, HOJE, []), [])
})

// ── Gasto atípico ────────────────────────────────────────────────────────────

Deno.test('atípico: categoria acima de 2× a média dos 3 meses completos anteriores', () => {
  const ls = [
    l({ dateYmd: '2026-07-10', amount: 300, category_id: 'cat-mercado', description: 'Pão' }),
    l({ dateYmd: '2026-08-10', amount: 300, category_id: 'cat-mercado', description: 'Leite' }),
    l({ dateYmd: '2026-09-10', amount: 300, category_id: 'cat-mercado', description: 'Queijo' }),
    l({ dateYmd: '2026-10-10', amount: 601, category_id: 'cat-mercado', description: 'Carne' }),
    // Junho fica fora da média; o futuro fica fora do mês.
    l({ dateYmd: '2026-06-10', amount: 5000, category_id: 'cat-mercado', description: 'Vinho' }),
    l({ dateYmd: '2026-10-30', amount: 5000, category_id: 'cat-mercado', description: 'Uva' }),
  ]
  const r = detectarAtipicos(ls, HOJE, { 'cat-mercado': 'Mercado' })
  assertEquals(r, [
    { chave: 'atip:categoria:Mercado:2026-10', alvo: 'categoria', nome: 'Mercado', mes: 601, media3: 300, categoriaId: 'cat-mercado' },
  ])
})

Deno.test('atípico: por descrição, e exatamente 2× não dispara', () => {
  const base = ['2026-07-03', '2026-08-03', '2026-09-03'].map((d) => l({ dateYmd: d, amount: 40, description: 'Uber' }))
  const igual = [...base, l({ dateYmd: '2026-10-03', amount: 80, description: 'Uber' })]
  assertEquals(detectarAtipicos(igual, HOJE, {}), [])
  const acima = [...base, l({ dateYmd: '2026-10-03', amount: 81, description: 'Uber' }), l({ dateYmd: '2026-10-04', amount: 40, description: 'UBER *TRIP' })]
  const r = detectarAtipicos(acima, HOJE, {})
  assertEquals(r.map((x) => [x.chave, x.mes, x.media3]), [['atip:descricao:uber:2026-10', 81, 40]])
})

Deno.test('nome original: "Conta de Água" no título, a chave sem acento', () => {
  const rec = ['2026-08-10', '2026-09-10', '2026-10-10'].map((d, i) =>
    l({ dateYmd: d, amount: 90, description: i === 2 ? ' Conta de Água ' : 'CONTA DE AGUA 0810', payment_method: 'pix' }),
  )
  const r = detectarRecorrencias(rec, HOJE, [])
  assertEquals([r[0].chave, r[0].nome], ['rec:conta agua', 'Conta de Água'])
  const atip = [
    ...['2026-07-03', '2026-08-03', '2026-09-03'].map((d) => l({ dateYmd: d, amount: 40, description: 'Padaria São João' })),
    l({ dateYmd: '2026-10-03', amount: 90, description: 'Padaria São João' }),
  ]
  const a = detectarAtipicos(atip, HOJE, {})
  assertEquals([a[0].chave, a[0].nome], ['atip:descricao:padaria sao joao:2026-10', 'Padaria São João'])
})

Deno.test('atípico: sem histórico (média zero) não dispara', () => {
  const ls = [l({ dateYmd: '2026-10-10', amount: 900, description: 'Geladeira', category_id: 'cat-casa' })]
  assertEquals(detectarAtipicos(ls, HOJE, { 'cat-casa': 'Casa' }), [])
})

// ── Duplicidade ──────────────────────────────────────────────────────────────

Deno.test('duplicidade: mesmo valor, descrição e dia', () => {
  const a = l({ id: 'b', dateYmd: '2026-10-20', amount: 57.3, description: 'Padaria Real' })
  const b = l({ id: 'a', dateYmd: '2026-10-20', amount: 57.3, description: 'PADARIA REAL 20/10' })
  assertEquals(detectarDuplicidades([a, b]), [
    { chave: 'dup:a:b', ids: ['a', 'b'], valor: 57.3, descricao: 'PADARIA REAL 20/10', dataYmd: '2026-10-20' },
  ])
})

Deno.test('duplicidade: valor ou dia diferente não é', () => {
  const a = l({ dateYmd: '2026-10-20', amount: 57.3 })
  assertEquals(detectarDuplicidades([a, l({ dateYmd: '2026-10-20', amount: 57.31 })]), [])
  assertEquals(detectarDuplicidades([a, l({ dateYmd: '2026-10-21', amount: 57.3 })]), [])
  assertEquals(detectarDuplicidades([l({ description: '123' }), l({ description: '123' })]), [])
})

Deno.test('Foco 3: duas parcelas do mesmo plano não são duplicidade', () => {
  const ls = [
    l({ dateYmd: '2026-10-10', installment_plan_id: 'p1', description: 'TV' }),
    l({ dateYmd: '2026-10-10', installment_plan_id: 'p1', description: 'TV' }),
  ]
  assertEquals(detectarDuplicidades(ls), [])
})

Deno.test('Foco 3: dois lançamentos da mesma assinatura não são duplicidade', () => {
  const mesmoDia = [l({ subscription_id: 's1' }), l({ subscription_id: 's1' })]
  const diasDiferentes = [l({ subscription_id: 's1', dateYmd: '2026-10-01' }), l({ subscription_id: 's1', dateYmd: '2026-10-02' })]
  assertEquals(detectarDuplicidades(mesmoDia), [])
  assertEquals(detectarDuplicidades(diasDiferentes), [])
})

Deno.test('Foco 3: uma despesa e o estorno dela não são duplicidade', () => {
  const ls = [l({ amount: 120, description: 'Loja X' }), l({ amount: 120, description: 'Loja X', type: 'income' })]
  assertEquals(detectarDuplicidades(ls), [])
})

// ── Preço de assinatura ──────────────────────────────────────────────────────

const ASSINATURAS = [
  { id: 'sub-spot', name: 'Spotify', amount: 21.9, is_active: true, kind: 'expense', payment_method: 'credit_card', payment_credit_card_id: 'card-1' },
  { id: 'sub-old', name: 'Deezer', amount: 20, is_active: false, kind: 'expense' },
  { id: 'sub-sal', name: 'Salário', amount: 5000, is_active: true, kind: 'income' },
]

Deno.test('preço: lançamento solto dos últimos 40 dias com outro valor', () => {
  const ls = [l({ id: 'x1', dateYmd: '2026-10-02', amount: 23.9, description: 'SPOTIFY P1234' })]
  assertEquals(detectarPrecoDeAssinatura(ls, ASSINATURAS, HOJE), [
    { chave: 'preco:sub-spot:23.90', assinaturaId: 'sub-spot', nome: 'Spotify', de: 21.9, para: 23.9, lancamentoId: 'x1' },
  ])
})

Deno.test('preço: mesmo valor, ligado, antigo, inativa, receita ou salto de 50% não disparam', () => {
  const ls = [
    l({ dateYmd: '2026-10-02', amount: 21.9, description: 'Spotify' }),
    l({ dateYmd: '2026-10-02', amount: 23.9, description: 'Spotify', subscription_id: 'sub-spot' }),
    l({ dateYmd: '2026-09-10', amount: 23.9, description: 'Spotify' }),
    l({ dateYmd: '2026-10-02', amount: 32.85, description: 'Spotify' }),
    l({ dateYmd: '2026-10-02', amount: 25, description: 'Deezer' }),
    l({ dateYmd: '2026-10-02', amount: 5100, description: 'Salário' }),
  ]
  assertEquals(detectarPrecoDeAssinatura(ls, ASSINATURAS, HOJE), [])
})

Deno.test('preço: nome só contido exige o mesmo método e o mesmo cartão; nome igual basta', () => {
  const amazon = [
    { id: 'sub-amz', name: 'Amazon', amount: 14.9, is_active: true, kind: 'expense', payment_method: 'credit_card', payment_credit_card_id: 'card-1' },
  ]
  const outroCartao = l({ dateYmd: '2026-10-02', amount: 19.9, description: 'Amazon compra', payment_credit_card_id: 'card-2' })
  assertEquals(detectarPrecoDeAssinatura([outroCartao], amazon, HOJE), [])
  const mesmoCartao = l({ id: 'm1', dateYmd: '2026-10-02', amount: 16.9, description: 'Amazon compra' })
  assertEquals(detectarPrecoDeAssinatura([mesmoCartao], amazon, HOJE).map((x) => x.lancamentoId), ['m1'])
  const nomeIgual = l({ id: 'n1', dateYmd: '2026-10-02', amount: 16.9, description: 'amazon', payment_credit_card_id: 'card-2' })
  assertEquals(detectarPrecoDeAssinatura([nomeIgual], amazon, HOJE).map((x) => x.lancamentoId), ['n1'])
})

Deno.test('preço: método nulo dos dois lados casa o nome contido; nulo de um lado só não', () => {
  const sem = [{ id: 'sub-x', name: 'Amazon', amount: 14.9, is_active: true, kind: 'expense', payment_method: null, payment_credit_card_id: null }]
  const nulo = l({ id: 'z1', dateYmd: '2026-10-02', amount: 16.9, description: 'Amazon compra', payment_method: null, payment_credit_card_id: null })
  assertEquals(detectarPrecoDeAssinatura([nulo], sem, HOJE).map((x) => x.lancamentoId), ['z1'])
  const comMetodo = l({ dateYmd: '2026-10-02', amount: 16.9, description: 'Amazon compra', payment_method: 'pix', payment_credit_card_id: null })
  assertEquals(detectarPrecoDeAssinatura([comMetodo], sem, HOJE), [])
  const comSub = [{ ...sem[0], payment_method: 'pix' }]
  assertEquals(detectarPrecoDeAssinatura([nulo], comSub, HOJE), [])
})

// ── Parcelas acabando ────────────────────────────────────────────────────────

const plano = (p: Partial<Parameters<typeof detectarParcelasAcabando>[0][number]>) => ({
  id: 'p1',
  description: 'TV',
  installment_amount: 250,
  total_installments: 10,
  generated_count: 9,
  next_billing_date: '2026-10-15',
  is_active: true,
  ...p,
})

Deno.test('parcelas: o último vencimento no mês corrente ou no seguinte', () => {
  assertEquals(detectarParcelasAcabando([plano({})], HOJE), [
    { chave: 'fim:p1', planoId: 'p1', descricao: 'TV', mesFim: '2026-10', liberaPorMes: 250 },
  ])
  const seguinte = plano({ id: 'p2', generated_count: 8 })
  assertEquals(detectarParcelasAcabando([seguinte], HOJE)[0].mesFim, '2026-11')
})

Deno.test('parcelas: longe, inativo ou já terminado não disparam', () => {
  assertEquals(
    detectarParcelasAcabando(
      [plano({ generated_count: 7 }), plano({ is_active: false }), plano({ generated_count: 10 })],
      HOJE,
    ),
    [],
  )
})

// ── Sazonal ──────────────────────────────────────────────────────────────────

Deno.test('sazonal: no começo do ano, o termo do ano anterior sem conta ativa parecida', () => {
  const ls = [
    l({ dateYmd: '2026-01-20', amount: 1000, description: 'IPVA 2026 1/3' }),
    l({ dateYmd: '2026-02-20', amount: 1000, description: 'IPVA 2026 2/3' }),
    l({ dateYmd: '2026-02-05', amount: 800, description: 'Material escolar' }),
    l({ dateYmd: '2026-01-15', amount: 2500, description: 'IPTU' }),
    l({ dateYmd: '2026-05-10', amount: 300, description: 'Matrícula' }),
  ]
  const r = detectarSazonais(ls, '2027-01-10', ['IPTU da casa'])
  assertEquals(r, [
    { chave: 'saz:ipva:2027', termo: 'ipva', mesAnterior: '2026-01', valor: 1000, category_id: null },
    { chave: 'saz:material escolar:2027', termo: 'material escolar', mesAnterior: '2026-02', valor: 800, category_id: null },
  ])
})

Deno.test('sazonal: guarda a categoria mais frequente do ano passado, ou null', () => {
  const com = [
    l({ dateYmd: '2026-01-10', description: 'IPVA 1/3', category_id: 'carro' }),
    l({ dateYmd: '2026-01-12', description: 'IPVA 2/3', category_id: 'carro' }),
  ]
  assertEquals(detectarSazonais(com, '2027-01-10', [])[0].category_id, 'carro')
  const empate = [
    l({ dateYmd: '2026-01-12', description: 'IPVA', category_id: 'b' }),
    l({ dateYmd: '2026-01-10', description: 'IPVA', category_id: 'a' }),
  ]
  assertEquals(detectarSazonais(empate, '2027-01-10', [])[0].category_id, 'a')
  const sem = [l({ dateYmd: '2026-01-10', description: 'IPVA' })]
  assertEquals(detectarSazonais(sem, '2027-01-10', [])[0].category_id, null)
})

Deno.test('sazonal: fora de 1/jan–15/fev não dispara', () => {
  const ls = [l({ dateYmd: '2026-01-20', amount: 1000, description: 'IPVA' })]
  assertEquals(detectarSazonais(ls, '2027-02-16', []), [])
  assertEquals(detectarSazonais(ls, '2026-12-31', []), [])
  assertEquals(detectarSazonais(ls, '2027-02-15', []).length, 1)
})

// ── Resumo da fatura ─────────────────────────────────────────────────────────

Deno.test('resumoDaFatura: variações com uma casa, 3 categorias, diferença para o banco', () => {
  const p = resumoDaFatura({
    cardId: 'card-1',
    cardNome: 'Nubank',
    closeYmd: '2026-10-24',
    total: 1125,
    fechadasAnteriores: [1160, 1000, 840],
    porCategoria: [
      { nome: 'Lazer', total: 100 },
      { nome: 'Mercado', total: 500 },
      { nome: 'Casa', total: 300 },
      { nome: 'Saúde', total: 225 },
    ],
    maiores: [{ descricao: 'Geladeira', valor: 400 }],
    parcelasNovas: ['Geladeira 1/10'],
    parcelasAcabaram: [],
    estornos: 0,
    bancoTotal: 1130,
  })
  assertEquals(p.contraMedia, 12.5)
  assertEquals(p.contraAnterior, -3)
  assertEquals(p.categorias, ['Mercado', 'Casa', 'Saúde'])
  assertEquals(p.diferencaBanco, -5)
  assertEquals(p.cardId, 'card-1')
})

Deno.test('resumoDaFatura: sem fatura anterior, sem variação; banco nulo, sem diferença', () => {
  const p = resumoDaFatura({
    cardNome: 'Inter',
    closeYmd: '2026-10-24',
    total: 300,
    fechadasAnteriores: [],
    porCategoria: [],
    maiores: [],
    parcelasNovas: [],
    parcelasAcabaram: [],
    estornos: 0,
    bancoTotal: null,
  })
  assertEquals(p.contraMedia, null)
  assertEquals(p.contraAnterior, null)
  assertEquals(p.diferencaBanco, null)
})

Deno.test('duplicidade: o par antes de desdeYmd fica de fora', () => {
  const velho = { dateYmd: '2026-09-20', description: 'Padaria Real', amount: 57.3 }
  const novo = { dateYmd: '2026-10-20', description: 'Padaria Real', amount: 57.3 }
  const ls = [l(velho), l(velho), l(novo), l(novo)]
  const achados = detectarDuplicidades(ls, { desdeYmd: '2026-09-25' })
  assertEquals(achados.map((a) => a.dataYmd), ['2026-10-20'])
  assertEquals(detectarDuplicidades(ls).length, 2)
})

Deno.test('duplicidade: abaixo de valorMinimo (duas passagens de metrô) fica de fora', () => {
  const metro = { dateYmd: '2026-10-20', description: 'Metrô SP', amount: 5.4 }
  assertEquals(detectarDuplicidades([l(metro), l(metro)], { valorMinimo: 10 }), [])
  const dez = { dateYmd: '2026-10-20', description: 'Padaria Real', amount: 10 }
  assertEquals(detectarDuplicidades([l(dez), l(dez)], { valorMinimo: 10 }).length, 1)
})
