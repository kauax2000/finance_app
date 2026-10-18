/**
 * Paridade de calendário (edge) contra os vetores dourados compartilhados
 * (src/lib/fixtures/billing-calendar-vectors.json). Ver também o teste Vitest
 * do cliente e o pgTAP de next_subscription_billing_date.
 */
import { assertEquals, assertMatch } from 'jsr:@std/assert@1.0.19'
import {
  addCalendarDays,
  appTodayYmd,
  estimatedDueYmdForClose,
  formatYmd,
  isoPrefixYmd,
  nextCloseAfter,
  nextPaymentDueCycleOnOrAfter,
  sumCardExpensesInWindow,
  type Ymd,
} from './credit-card-cycle.ts'

const vectors = JSON.parse(
  await Deno.readTextFile(
    new URL('../../../src/lib/fixtures/billing-calendar-vectors.json', import.meta.url)
  )
)

function ymd(s: string): Ymd {
  const v = isoPrefixYmd(`${s}T12:00:00.000Z`)
  if (!v) throw new Error(`bad ymd: ${s}`)
  return v
}

/** Primeiro fechamento >= purchase (inclusivo no dia do fechamento). */
function firstCloseOnOrAfter(purchase: Ymd, closingDay: number): Ymd {
  return nextCloseAfter(addCalendarDays(purchase, -1), closingDay)
}

Deno.test('statement close for purchase matches golden vectors', () => {
  for (const v of vectors.statement_close_for_purchase) {
    const close = firstCloseOnOrAfter(ymd(v.purchase), v.closing_day)
    assertEquals(
      formatYmd(close),
      v.expected_close,
      `purchase=${v.purchase} closing=${v.closing_day}`
    )
  }
})

Deno.test('estimated due for close matches golden vectors', () => {
  for (const v of vectors.estimated_due_for_close) {
    const due = estimatedDueYmdForClose(ymd(v.close), v.due_day)
    assertEquals(formatYmd(due), v.expected_due, `close=${v.close} due_day=${v.due_day}`)
  }
})

Deno.test('appTodayYmd uses the America/Sao_Paulo calendar day', () => {
  // 2026-08-25T01:00Z = 2026-08-24 22:00 BRT — ainda dia 24 no Brasil.
  const lateNightUtc = new Date('2026-08-25T01:00:00Z')
  assertEquals(formatYmd(appTodayYmd(lateNightUtc)), '2026-08-24')

  // 2026-08-25T12:00Z = 09:00 BRT — dia 25 nas duas zonas.
  const midday = new Date('2026-08-25T12:00:00Z')
  assertEquals(formatYmd(appTodayYmd(midday)), '2026-08-25')

  assertMatch(formatYmd(appTodayYmd()), /^\d{4}-\d{2}-\d{2}$/)
})

Deno.test('nextPaymentDueCycleOnOrAfter devolve o vencimento e a fatura que ele paga', () => {
  // Fecha dia 3, vence dia 10: em 05/11 o próximo vencimento é 10/11, da fatura de 03/10.
  const r = nextPaymentDueCycleOnOrAfter(ymd('2026-11-05'), 3, 10)
  assertEquals([formatYmd(r.close), formatYmd(r.due)], ['2026-10-03', '2026-11-10'])
  // Passado o vencimento, a próxima é a fatura de 03/11.
  const s = nextPaymentDueCycleOnOrAfter(ymd('2026-11-11'), 3, 10)
  assertEquals([formatYmd(s.close), formatYmd(s.due)], ['2026-11-03', '2026-12-10'])
  // Fecha 25, vence 5: em 26/10 vence 05/11, da fatura de 25/10.
  const t = nextPaymentDueCycleOnOrAfter(ymd('2026-10-26'), 25, 5)
  assertEquals([formatYmd(t.close), formatYmd(t.due)], ['2026-10-25', '2026-11-05'])
})

Deno.test('sumCardExpensesInWindow soma em centavos só as despesas do cartão na janela', () => {
  const row = (date: string, amount: number, extra: Record<string, unknown> = {}) => ({
    amount, type: 'expense', date: `${date}T12:00:00.000Z`, payment_method: 'credit_card',
    payment_credit_card_id: 'c1', category_id: null, ...extra,
  })
  const rows = [
    row('2026-10-04', 0.1),
    row('2026-10-20', 0.2),
    row('2026-11-03', 10),
    row('2026-11-04', 99), // fora: já é a fatura seguinte
    row('2026-10-10', 50, { payment_credit_card_id: 'c2' }),
    row('2026-10-10', 50, { type: 'income' }),
    row('2026-10-10', 7, { category_id: 'cat' }),
  ]
  const win = { start: ymd('2026-10-04'), end: ymd('2026-11-03') }
  assertEquals(sumCardExpensesInWindow(rows, 'c1', win), 17.3)
  assertEquals(sumCardExpensesInWindow(rows, 'c1', win, 'cat'), 7)
  assertEquals(sumCardExpensesInWindow(rows, 'c1', win, null), 10.3)
})
