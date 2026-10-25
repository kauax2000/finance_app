import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { addCalendarDays, formatYmd, statementCloseYmdForPurchaseYmd } from './credit-card-cycle.ts'
import { gastoDaPessoaNoMes, type LancamentoDaPessoa, mesDaCompra, nivelDoLimite } from './limite-pessoa.ts'

Deno.test('nivelDoLimite: 80 a partir de 80%, 100 a partir de 100%', () => {
  assertEquals(nivelDoLimite(79_99, 100_00), 0)
  assertEquals(nivelDoLimite(80_00, 100_00), 80)
  assertEquals(nivelDoLimite(100_00, 100_00), 100)
  assertEquals(nivelDoLimite(150_00, 100_00), 100)
  assertEquals(nivelDoLimite(10, 0), 0)
})

const lanc = (p: Partial<LancamentoDaPessoa>): LancamentoDaPessoa => ({
  user_id: 'ana',
  type: 'expense',
  amount: 10,
  date: '2026-10-10T12:00:00.000Z',
  payment_method: 'pix',
  card: null,
  ...p,
})

Deno.test('gastoDaPessoaNoMes: o crédito de 28/10 num cartão que fecha no 25 conta em novembro', () => {
  const credito = lanc({ amount: 200, date: '2026-10-28T12:00:00.000Z', payment_method: 'credit_card', card: { closing_day: 25 } })
  assertEquals(gastoDaPessoaNoMes([credito], 'ana', '2026-10'), 0)
  assertEquals(gastoDaPessoaNoMes([credito], 'ana', '2026-11'), 200_00)
})

Deno.test('gastoDaPessoaNoMes: só as despesas da pessoa', () => {
  const lancs = [
    lanc({ amount: 12.34 }),
    lanc({ amount: 50, user_id: 'bia' }),
    lanc({ amount: 900, type: 'income' }),
    // O cartão só vale no crédito: um Pix com cartão anotado conta pelo dia.
    lanc({ amount: 1, date: '2026-10-28T12:00:00.000Z', card: { closing_day: 25 } }),
  ]
  assertEquals(gastoDaPessoaNoMes(lancs, 'ana', '2026-10'), 12_34 + 1_00)
})

Deno.test('mesDaCompra: o mesmo mês que statementCloseYmdForPurchaseYmd, todo dia de 2026 e todo fechamento', () => {
  for (let cd = 1; cd <= 31; cd++) {
    let dia = { y: 2026, m: 1, d: 1 }
    for (let i = 0; i < 366; i++) {
      const esperado = formatYmd(statementCloseYmdForPurchaseYmd(dia, cd)).slice(0, 7)
      assertEquals(mesDaCompra(`${formatYmd(dia)}T12:00:00.000Z`, cd), esperado, `${formatYmd(dia)} fecha ${cd}`)
      dia = addCalendarDays(dia, 1)
    }
  }
  assertEquals(mesDaCompra('2026-12-28', 25), '2027-01')
  assertEquals(mesDaCompra('2026-10-28', null), '2026-10')
  assertEquals(mesDaCompra('lixo', 25), null)
})
