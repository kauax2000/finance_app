import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { assinaturasAtivas, contasAPagar } from './compromissos.ts'

const inst = (id: string, due_date: string, amount: number | null, status: 'pending' | 'paid' = 'pending') => ({
  id,
  nome: id,
  due_date,
  amount,
  status,
})

Deno.test('mcp: contas a pagar separa vencidas e a vencer', () => {
  const r = contasAPagar(
    [
      inst('a', '2026-10-20', 100),
      inst('b', '2026-11-05', 50),
      inst('c', '2026-12-30', 70),
      inst('d', '2026-10-25', 30, 'paid'),
      inst('e', '2026-11-01', null),
    ],
    '2026-10-27',
    30,
  )
  assertEquals(r.vencidas.map((i) => i.id), ['a'])
  assertEquals(r.a_vencer.map((i) => i.id), ['e', 'b'])
  assertEquals(r.a_vencer[0].valor, null)
  assertEquals(r.total.valor, 150)
})

Deno.test('mcp: contas a pagar vazia', () => {
  const r = contasAPagar([], '2026-10-27', 30)
  assertEquals([r.vencidas, r.a_vencer, r.total.valor], [[], [], 0])
})

Deno.test('mcp: assinaturas ativas e total mensal', () => {
  const s = (id: string, amount: number, billing_interval: 'weekly' | 'monthly' | 'yearly', is_active = true) => ({
    id,
    name: id,
    amount,
    billing_interval,
    next_billing_date: null,
    is_active,
  })
  const r = assinaturasAtivas([s('m', 39.9, 'monthly'), s('y', 120, 'yearly'), s('w', 10, 'weekly'), s('x', 999, 'monthly', false)])
  assertEquals(r.itens.map((i) => i.id), ['m', 'y', 'w'])
  assertEquals(r.total_mensal.valor, 93.23)
})
