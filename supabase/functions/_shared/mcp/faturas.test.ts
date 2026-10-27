import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { type CardTxRow, statementTotalKey } from '../credit-card-cycle.ts'
import { faturaDoCartao, janelaDasFaturas } from './faturas.ts'

const cartao = { id: 'c1', name: 'Nubank', closing_day: 10, due_day: 17, last_four: '1234' }
const hoje = { y: 2026, m: 10, d: 27 }
const tx = (amount: number, type: string, date: string, card: string): CardTxRow => ({
  amount,
  type,
  date,
  payment_method: 'credit_card',
  payment_credit_card_id: card,
  category_id: null,
})
const linhas = [
  tx(100, 'expense', '2026-10-15', 'c1'),
  tx(40, 'expense', '2026-10-05', 'c1'),
  tx(10, 'income', '2026-10-20', 'c1'),
  tx(999, 'expense', '2026-10-15', 'c2'),
]

Deno.test('mcp: fatura aberta e última fechada', () => {
  const f = faturaDoCartao(cartao, linhas, new Map(), hoje)
  assertEquals(f.final, '1234')
  assertEquals({ ...f.aberta, total: f.aberta.total.valor }, {
    inicio: '2026-10-11',
    fim: '2026-11-10',
    vencimento: '2026-11-17',
    total: 90,
  })
  assertEquals({ ...f.ultima_fechada, total: f.ultima_fechada.total.valor }, {
    inicio: '2026-09-11',
    fechamento: '2026-10-10',
    vencimento: '2026-10-17',
    total: 40,
    do_banco: false,
  })
})

Deno.test('mcp: total do banco vale na fechada', () => {
  const f = faturaDoCartao(cartao, linhas, new Map([[statementTotalKey('c1', '2026-10-10'), '45.30']]), hoje)
  assertEquals(f.ultima_fechada.total.valor, 45.3)
  assertEquals(f.ultima_fechada.do_banco, true)
})

Deno.test('mcp: janela das faturas', () => {
  assertEquals(janelaDasFaturas([cartao], hoje), { inicio: '2026-09-11', fim: '2026-11-10' })
})
