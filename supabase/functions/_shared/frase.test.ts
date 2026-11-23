import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { appTodayYmd, formatYmd } from './credit-card-cycle.ts'
import { cartaoDoCredito, casarCartao, casarCategoria, conceitoDe, interpretarFrase, preencherPeloHistorico, type LinhaHistorico } from './frase.ts'

const HOJE = '2026-04-10'

Deno.test('frase: sem valor fica em dúvida (a Edge devolve 422)', () => {
  const f = interpretarFrase('mercado nubank', HOJE)
  assertEquals(f.valor, null)
  assertEquals(f.duvidas, ['valor'])
})

Deno.test('frase: os valores difíceis', () => {
  assertEquals(interpretarFrase('1.234,56 geladeira', HOJE).valor, 1234.56)
  assertEquals(interpretarFrase('12.50 café', HOJE).valor, 12.5)
  assertEquals(interpretarFrase('1.234 aluguel', HOJE).valor, 1234)
  assertEquals(interpretarFrase('R$ 42 farmácia', HOJE).valor, 42)
  assertEquals(interpretarFrase('quarenta e dois mercado', HOJE).valor, 42)
})

Deno.test('frase: "dia N" maior que hoje é do mês passado, preso ao último dia', () => {
  assertEquals(interpretarFrase('dia 31 farmácia 20', HOJE).data, '2026-03-31')
  assertEquals(interpretarFrase('dia 25 farmácia 20', HOJE).data, '2026-03-25')
  assertEquals(interpretarFrase('dia 31 farmácia 20', '2026-05-10').data, '2026-04-30')
})

Deno.test('frase: "hoje" às 22h em Brasília (01h UTC) é o dia de Brasília', () => {
  const hoje = formatYmd(appTodayYmd(new Date('2026-04-11T01:00:00Z')))
  assertEquals(interpretarFrase('hoje 20 padaria', hoje).data, '2026-04-10')
})

Deno.test('frase: o exemplo do plano', () => {
  const f = interpretarFrase('42 mercado nubank em 3x', '2026-10-21')
  assertEquals(
    [f.valor, f.parcelas, f.cartaoTexto, f.descricao, f.tipo, f.data],
    [42, 3, 'nubank', 'Mercado', 'expense', '2026-10-21'],
  )
})

Deno.test('casarCartao: só ativos, e empate dá null', () => {
  const base = { wallet_alias: null, last_four: null, workspace_id: 'w', is_active: true }
  const a = { ...base, id: 'a', name: 'Nubank Kaue' }
  const b = { ...base, id: 'b', name: 'Nubank Ana' }
  assertEquals(casarCartao('nubank', [a, b]), null)
  assertEquals(casarCartao('nubank', [a, { ...b, is_active: false }])?.id, 'a')
})

Deno.test('preencherPeloHistorico: a mais recente de mesmo tipo', () => {
  const l = { description: 'Mercado', payment_method: 'pix', payment_credit_card_id: null, type: 'expense' as const }
  const r = preencherPeloHistorico('mercado', 'expense', [
    { ...l, category_id: 'velha', date: '2026-01-01' },
    { ...l, category_id: 'nova', date: '2026-02-01' },
  ])
  assertEquals(r, { categoryId: 'nova', paymentMethod: 'pix', creditCardId: null })
})

Deno.test('frase: "N mil" multiplica e some da descrição', () => {
  const f = interpretarFrase('2 mil tv', HOJE)
  assertEquals([f.valor, f.descricao], [2000, 'Tv'])
  assertEquals(interpretarFrase('1,5 mil reforma', HOJE).valor, 1500)
  assertEquals(interpretarFrase('R$ 2 mil tv', HOJE).valor, 2000)
})

Deno.test('frase: o valor marcado vence; outro número sobrando vira dúvida', () => {
  const marcado = interpretarFrase('mercado 3 itens R$ 40', HOJE)
  assertEquals([marcado.valor, marcado.duvidas], [40, ['valor']])
  const solto = interpretarFrase('3 cafés 15', HOJE)
  assertEquals([solto.valor, solto.duvidas], [3, ['valor']])
  assertEquals(interpretarFrase('42 reais e 90 centavos mercado', HOJE).valor, 42.9)
})

Deno.test('frase: "Nx de V" é o total, com dúvida', () => {
  const f = interpretarFrase('em 10x de 30 tv', HOJE)
  assertEquals([f.valor, f.parcelas, f.duvidas.includes('valor')], [300, 10, true])
})

Deno.test('frase: número por extenso no meio do nome não é valor', () => {
  for (const s of ['padaria dois irmãos', 'loja mil coisas', 'bar sete belo', 'cinema oito e meia']) {
    assertEquals(interpretarFrase(s, HOJE).valor, null, s)
  }
  assertEquals(interpretarFrase('mercado quarenta reais', HOJE).valor, 40)
  const parou = interpretarFrase('quarenta e dois e cinquenta mercado', HOJE)
  assertEquals([parou.valor, parou.duvidas], [42, ['valor']])
})

Deno.test('frase: "dd/mm" depois de hoje é do ano passado', () => {
  assertEquals(interpretarFrase('15/12 x 20', '2026-01-10').data, '2025-12-15')
})

Deno.test('frase: número depois de "R$" é dinheiro, nunca a contagem', () => {
  const f = interpretarFrase('R$ 30 x 2 cafés', HOJE)
  assertEquals([f.valor, f.parcelas, f.duvidas], [30, null, ['valor']])
  assertEquals(interpretarFrase('r$ 15 x 2', HOJE).valor, 15)
  const sem = interpretarFrase('15 x 2', HOJE)
  assertEquals([sem.valor, sem.parcelas, sem.duvidas.includes('valor')], [2, 15, true])
})

Deno.test('frase: "Nx de R$ V" é o total', () => {
  for (const s of ['12x de R$ 99,90', '12x de r$99,90']) {
    const f = interpretarFrase(s, HOJE)
    assertEquals([f.valor, f.parcelas, f.duvidas.includes('valor')], [1198.8, 12, true], s)
  }
  assertEquals(interpretarFrase('2x de R$ 15', HOJE).valor, 30)
})

Deno.test('frase: o "12x" colado vale depois de "R$"; "x" solto fora de números é palavra', () => {
  const f = interpretarFrase('R$ 12x 99,90', HOJE)
  assertEquals([f.valor, f.parcelas, f.duvidas.includes('valor')], [99.9, 12, true])
  const de = interpretarFrase('R$ 2x de 15', HOJE)
  assertEquals([de.valor, de.parcelas, de.duvidas.includes('valor')], [30, 2, true])
  assertEquals(interpretarFrase('raio x 150 clinica', HOJE).descricao, 'Raio x clinica')
})

const CATS = [
  { id: 'c-merc', name: 'Mercado', type: 'expense' as const },
  { id: 'c-alim', name: 'Alimentação', type: 'expense' as const },
  { id: 'c-transp', name: 'Transporte', type: 'expense' as const },
  { id: 'c-rest', name: 'Restaurantes', type: 'expense' as const },
  { id: 'c-sal', name: 'Salário', type: 'income' as const },
]
const lh = (l: Partial<LinhaHistorico>): LinhaHistorico => ({
  description: 'Padaria', category_id: 'c-alim', payment_method: 'pix',
  payment_credit_card_id: null, date: '2026-04-01', type: 'expense', ...l,
})

Deno.test('categoria: histórico exato vence o nome', () => {
  const r = casarCategoria('Mercado', 'expense', CATS, [lh({ description: 'mercado', category_id: 'c-alim' })])
  assertEquals(r, { categoryId: 'c-alim', motivo: 'historico' })
})

Deno.test('categoria: o nome da categoria na descrição, com plural', () => {
  assertEquals(casarCategoria('Mercado extra', 'expense', CATS, []), { categoryId: 'c-merc', motivo: 'nome' })
  assertEquals(casarCategoria('Restaurante japonês', 'expense', CATS, []), { categoryId: 'c-rest', motivo: 'nome' })
})

Deno.test('categoria: a palavra do histórico vem antes da palavra comum', () => {
  const r = casarCategoria('Padaria do zé', 'expense', CATS, [lh({ description: 'Padaria Real' })])
  assertEquals(r, { categoryId: 'c-alim', motivo: 'palavra' })
})

Deno.test('categoria: palavra comum leva à categoria que a abriga', () => {
  assertEquals(casarCategoria('Uber', 'expense', CATS, []), { categoryId: 'c-transp', motivo: 'comum' })
  assertEquals(casarCategoria('Ifood', 'expense', CATS, []), { categoryId: 'c-rest', motivo: 'comum' })
  // Sem "Transporte", "uber" não inventa: nenhuma outra categoria abriga.
  assertEquals(casarCategoria('Uber', 'expense', CATS.filter((c) => c.id !== 'c-transp'), []), null)
})

Deno.test('categoria: só do tipo, e a apagada do histórico não volta', () => {
  assertEquals(casarCategoria('Salário', 'expense', CATS, []), null)
  assertEquals(casarCategoria('Salário', 'income', CATS, []), { categoryId: 'c-sal', motivo: 'nome' })
  assertEquals(casarCategoria('Xyz', 'expense', CATS, [lh({ description: 'Xyz', category_id: 'apagada' })]), null)
})

Deno.test('categoria: empate no nome não escolhe', () => {
  const dois = [{ id: 'a', name: 'Casa', type: 'expense' as const }, { id: 'b', name: 'Praia', type: 'expense' as const }]
  assertEquals(casarCategoria('Praia casa', 'expense', dois, []), null)
})

Deno.test('cartão do crédito: o do formulário, senão o último crédito ativo do histórico', () => {
  const cartao = (id: string, is_active = true) => ({ id, name: id, wallet_alias: null, last_four: null, workspace_id: 'ws', is_active })
  const cartoes = [cartao('nu'), cartao('inter'), cartao('velho', false)]
  const hist = [
    lh({ payment_method: 'credit_card', payment_credit_card_id: 'velho', date: '2026-04-09' }),
    lh({ payment_method: 'credit_card', payment_credit_card_id: 'inter', date: '2026-04-05' }),
    lh({ payment_method: 'credit_card', payment_credit_card_id: 'nu', date: '2026-04-02' }),
  ]
  assertEquals(cartaoDoCredito(cartoes, hist, 'nu')?.id, 'nu')
  assertEquals(cartaoDoCredito(cartoes, hist, null)?.id, 'inter')
  assertEquals(cartaoDoCredito(cartoes, hist, 'velho')?.id, 'inter')
  assertEquals(cartaoDoCredito(cartoes, [], null), null)
})

Deno.test('frase: o valor da parcela vira o total', () => {
  const f = interpretarFrase('Kimono parcela 100 4x Kauã', HOJE)
  assertEquals([f.valor, f.parcelas, f.descricao], [400, 4, 'Kimono'])
  assertEquals(f.cartaoTexto, 'kaua')
  assertEquals(interpretarFrase('tv 10x parcela de R$ 150,50', HOJE).valor, 1505)
  assertEquals(interpretarFrase('tv 120 a parcela em 3x', HOJE).valor, 360)
  assertEquals(interpretarFrase('tv 3x 120 cada', HOJE).valor, 360)
  assertEquals(interpretarFrase('curso 99 por parcela 12x', HOJE).valor, 1188)
  // Sem o número de parcelas, a parcela fica como o valor, a conferir.
  const sem = interpretarFrase('kimono parcela 100', HOJE)
  assertEquals([sem.valor, sem.duvidas.includes('valor')], [100, true])
  // Sem a palavra, o valor segue sendo o total.
  assertEquals(interpretarFrase('kimono 400 4x', HOJE).valor, 400)
})

const HOJE_PARCELAS = '2026-10-29'
const lerParcelas = (s: string) => {
  const f = interpretarFrase(s, HOJE_PARCELAS)
  return [f.valor, f.parcelas, f.descricao]
}

Deno.test('frase: "N parcelas de V" e "N prestações de V" são N × V', () => {
  for (const s of ['tv 4 parcelas de 100', 'tv 4 prestações de 100', 'tv 4 parcelas iguais de 100']) {
    assertEquals(lerParcelas(s), [400, 4, 'Tv'], s)
  }
  assertEquals(interpretarFrase('tv 4 parcelas de 100', HOJE_PARCELAS).motivoDoTipo, '4 parcelas')
})

Deno.test('frase: "N parcelas" sem valor conta as parcelas e pede o valor', () => {
  const f = interpretarFrase('tv 4 parcelas', HOJE_PARCELAS)
  assertEquals([f.valor, f.parcelas, f.descricao, f.duvidas.includes('valor')], [null, 4, 'Tv', true])
})

Deno.test('frase: "V em N parcelas" é o total', () => {
  const f = interpretarFrase('tv 100 em 4 parcelas', HOJE_PARCELAS)
  assertEquals([f.valor, f.parcelas, f.descricao, f.motivoDoTipo], [100, 4, 'Tv', 'em 4 parcelas'])
})

Deno.test('frase: "NxV" colado é como "Nx de V"; "V xN" é o total', () => {
  const colado = interpretarFrase('tv 4x100', HOJE_PARCELAS)
  assertEquals([colado.valor, colado.parcelas, colado.descricao, colado.duvidas.includes('valor')], [400, 4, 'Tv', true])
  assertEquals(lerParcelas('tv 100 x4'), [100, 4, 'Tv'])
})

Deno.test('frase: "mensal", "ao mês", "por mês" e "/mês" dizem que V é a parcela', () => {
  assertEquals(lerParcelas('tv 100 mensais 4x'), [400, 4, 'Tv'])
  assertEquals(lerParcelas('tv 100 mensal em 12x'), [1200, 12, 'Tv'])
  for (const s of ['tv 100 ao mes em 4x', 'tv 100 ao mês em 4x', 'tv 100 por mês em 4x', 'tv 100 por mes em 4x', 'tv 100 /mês em 4x', 'tv 100/mês em 4x']) {
    assertEquals(lerParcelas(s), [400, 4, 'Tv'], s)
  }
  // Sem parcelas, "mensal" não multiplica nada.
  const academia = interpretarFrase('academia 100 mensal', HOJE_PARCELAS)
  assertEquals([academia.valor, academia.parcelas], [100, null])
})

Deno.test('frase: "N meses" com um valor ao lado são parcelas; sozinho, não', () => {
  assertEquals(lerParcelas('tv 100 por mes 4 meses'), [400, 4, 'Tv'])
  assertEquals(lerParcelas('tv 4 meses de 100'), [400, 4, 'Tv'])
  assertEquals(interpretarFrase('academia 3 meses 300', HOJE_PARCELAS).parcelas, null)
})

Deno.test('frase: o total dito junto de "Nx de V" vence, e só confere quando não bate', () => {
  const bate = interpretarFrase('tv 400 em 4x de 100', HOJE_PARCELAS)
  assertEquals([bate.valor, bate.parcelas, bate.descricao, bate.duvidas.includes('valor')], [400, 4, 'Tv', false])
  const naoBate = interpretarFrase('tv 500 em 4x de 100', HOJE_PARCELAS)
  assertEquals([naoBate.valor, naoBate.parcelas, naoBate.descricao, naoBate.duvidas.includes('valor')], [500, 4, 'Tv', true])
})

Deno.test('frase: as formas de parcela que já funcionavam', () => {
  for (const s of [
    'tv em 4 vezes de 100', 'tv 4 x de 100', 'tv total 400 em 4x', 'tv valor da parcela 100 em 4x',
    'tv 100 reais cada parcela 4x', 'tv parcela de 100 em 4 vezes', 'tv 400 em 4 vezes',
  ]) {
    assertEquals(lerParcelas(s), [400, 4, 'Tv'], s)
  }
})

const cat = (id: string, name: string) => ({ id, name, type: 'expense' as const })

Deno.test('conceito: abastecimento, posto, shell e etanol são combustível', () => {
  for (const p of ['abastecimento', 'posto', 'shell', 'etanol', 'postos']) assertEquals(conceitoDe(p), 'combustivel', p)
  assertEquals(conceitoDe('xablau'), null)
})

Deno.test('conceito: combustível prefere Carro a Transporte quando os dois existem', () => {
  const cats = [cat('transporte', 'Transporte'), cat('carro', 'Carro')]
  assertEquals(casarCategoria('Abastecimento', 'expense', cats, []), { categoryId: 'carro', motivo: 'comum' })
})

Deno.test('conceito: uber continua em Transporte', () => {
  const cats = [cat('transporte', 'Transporte'), cat('carro', 'Carro')]
  assertEquals(casarCategoria('Uber', 'expense', cats, []), { categoryId: 'transporte', motivo: 'comum' })
})

Deno.test('conceito: drogaria raia é Saúde e pão de açúcar é Mercado', () => {
  assertEquals(casarCategoria('Drogaria Raia', 'expense', [cat('saude', 'Saúde')], []), { categoryId: 'saude', motivo: 'comum' })
  assertEquals(casarCategoria('Pão de Açúcar', 'expense', [cat('merc', 'Mercado')], []), { categoryId: 'merc', motivo: 'comum' })
})

Deno.test('conceito: palavras genéricas não casam', () => {
  for (const p of ['dia', 'extra', 'ale']) assertEquals(conceitoDe(p), null, p)
  assertEquals(casarCategoria('Almoço do dia', 'expense', [cat('merc', 'Mercado')], []), null)
})

Deno.test('conceito: uber cai em Carro quando não há Transporte', () => {
  assertEquals(casarCategoria('Uber', 'expense', [cat('carro', 'Carro')], []), { categoryId: 'carro', motivo: 'comum' })
})

Deno.test('conceito: estacionamento cai em Combustível quando só ele existe', () => {
  assertEquals(casarCategoria('Estacionamento', 'expense', [cat('comb', 'Combustível')], []), { categoryId: 'comb', motivo: 'comum' })
})

Deno.test('conceito: multa de fatura não vira Carro', () => {
  assertEquals(casarCategoria('Multa atraso fatura', 'expense', [cat('carro', 'Carro')], []), null)
})
