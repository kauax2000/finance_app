/**
 * Paridade de calendário (edge) contra os vetores dourados compartilhados
 * (src/lib/fixtures/billing-calendar-vectors.json). Ver também o teste Vitest
 * do cliente e o pgTAP de next_subscription_billing_date.
 */
import { assertEquals, assertMatch } from 'jsr:@std/assert'
import {
  addCalendarDays,
  appTodayYmd,
  estimatedDueYmdForClose,
  formatYmd,
  isoPrefixYmd,
  nextCloseAfter,
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
