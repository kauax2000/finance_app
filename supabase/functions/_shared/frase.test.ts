import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { appTodayYmd, formatYmd } from './credit-card-cycle.ts'
import { casarCartao, interpretarFrase, preencherPeloHistorico } from './frase.ts'

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
