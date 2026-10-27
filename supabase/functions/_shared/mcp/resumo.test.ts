import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { type LinhaLancamento, orcamentosDoMes, resumoDoMes } from './resumo.ts'

const cats = [
  { id: 'A', name: 'A', type: 'expense' as const },
  { id: 'B', name: 'B', type: 'expense' as const },
  { id: 'S', name: 'S', type: 'income' as const },
]
const l = (p: Partial<LinhaLancamento>): LinhaLancamento => ({
  amount: 0, type: 'expense', date: '2026-10-05', category_id: null,
  payment_method: null, payment_credit_card_id: null, ...p,
})
const linhas = [
  l({ amount: 1000, type: 'income', category_id: 'S', payment_method: 'pix' }),
  l({ amount: '200', category_id: 'A' }),
  l({ amount: '50.50', category_id: 'B' }),
  l({ amount: 20, type: 'income', category_id: 'A', payment_method: 'credit_card', payment_credit_card_id: 'c1' }),
  l({ amount: 10 }),
]

Deno.test('mcp: resumo do mês', () => {
  const r = resumoDoMes(linhas, [], cats)
  assertEquals(r.receitas.valor, 1000)
  assertEquals(r.despesas.valor, 240.5)
  assertEquals(r.saldo.valor, 759.5)
  assertEquals(
    r.por_categoria.map((c) => [c.categoria_id, c.nome, c.total.valor]),
    [['A', 'A', 180], ['B', 'B', 50.5], [null, 'Sem categoria', 10]],
  )
  assertEquals([r.mes_anterior.receitas.valor, r.mes_anterior.despesas.valor, r.mes_anterior.saldo.valor], [0, 0, 0])
})

Deno.test('mcp: orçamentos do mês', () => {
  const r = orcamentosDoMes([{ category_id: 'A', amount: '300' }], linhas, cats)
  assertEquals(r.length, 1)
  assertEquals([r[0].categoria_id, r[0].nome, r[0].orcado.valor, r[0].gasto.valor, r[0].percentual], ['A', 'A', 300, 180, 60])
  assertEquals(orcamentosDoMes([], [], []), [])
})
