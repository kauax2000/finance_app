/**
 * Calendar helpers for credit card cycles — mirrors app `credit-card-billing.ts`
 * using Y-M-D from ISO date string prefix (same as `transactionCalendarParts`).
 */

export type Ymd = { y: number; m: number; d: number }

const MS_DAY = 86_400_000

export function isoPrefixYmd(iso: string): Ymd | null {
  const s = iso.trim()
  const prefix = s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return null
  const [y, m, d] = prefix.split('-').map(Number)
  if ([y, m, d].some((n) => Number.isNaN(n))) return null
  return { y, m, d }
}

export function ymdKey(x: Ymd): number {
  return x.y * 10_000 + x.m * 100 + x.d
}

export function compareYmd(a: Ymd, b: Ymd): number {
  return ymdKey(a) - ymdKey(b)
}

export function ymdToUtcNoon(x: Ymd): number {
  return Date.UTC(x.y, x.m - 1, x.d, 12, 0, 0, 0)
}

export function utcNoonToYmd(t: number): Ymd {
  const d = new Date(t)
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
  }
}

export function formatYmd(x: Ymd): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${x.y}-${p(x.m)}-${p(x.d)}`
}

export function daysInMonth(y: number, month: number): number {
  return new Date(Date.UTC(y, month, 0)).getUTCDate()
}

function clampClosingDay(y: number, month: number, closingDay: number): number {
  return Math.min(closingDay, daysInMonth(y, month))
}

/** Statement close calendar day in the given month (month 1–12). */
export function statementCloseYmd(y: number, month: number, closingDay: number): Ymd {
  const d = clampClosingDay(y, month, closingDay)
  return { y, m: month, d }
}

export function statementCloseOnOrBefore(ref: Ymd, closingDay: number): Ymd {
  let y = ref.y
  let month = ref.m
  for (let i = 0; i < 240; i++) {
    const close = statementCloseYmd(y, month, closingDay)
    if (compareYmd(close, ref) <= 0) {
      return close
    }
    month -= 1
    if (month < 1) {
      month = 12
      y -= 1
    }
  }
  throw new Error('statementCloseOnOrBefore: range')
}

export function nextCloseAfter(ref: Ymd, closingDay: number): Ymd {
  let y = ref.y
  let month = ref.m
  for (let i = 0; i < 240; i++) {
    const close = statementCloseYmd(y, month, closingDay)
    if (compareYmd(close, ref) > 0) {
      return close
    }
    month += 1
    if (month > 12) {
      month = 1
      y += 1
    }
  }
  throw new Error('nextCloseAfter: range')
}

/**
 * O fechamento da fatura da compra: o primeiro no dia da compra ou depois.
 * Espelha `statementCloseYmdForPurchaseDate` do cliente (`src/lib/credit-card-billing.ts`).
 */
export function statementCloseYmdForPurchaseYmd(purchase: Ymd, closingDay: number): Ymd {
  return nextCloseAfter(addCalendarDays(purchase, -1), closingDay)
}

export function previousStatementCloseBefore(closeYmd: Ymd, closingDay: number): Ymd {
  const t = ymdToUtcNoon(closeYmd) - MS_DAY
  return statementCloseOnOrBefore(utcNoonToYmd(t), closingDay)
}

export function addCalendarDays(ymd: Ymd, delta: number): Ymd {
  const t = ymdToUtcNoon(ymd) + delta * MS_DAY
  return utcNoonToYmd(t)
}

export type OpenWindow = { start: Ymd; end: Ymd }

/** A fatura que fecha em `close`: do dia seguinte ao fechamento anterior até ele. */
export function invoiceWindowEndingAt(close: Ymd, closingDay: number): OpenWindow {
  return { start: addCalendarDays(previousStatementCloseBefore(close, closingDay), 1), end: close }
}

export type CardTxRow = {
  amount: string | number
  type: string
  date: string
  payment_method: string | null
  payment_credit_card_id: string | null
  category_id: string | null
}

/**
 * Despesas no cartão com data em [start, end] (inclusivo), somadas em centavos.
 * `categoryId` undefined soma todas; null, só as sem categoria. Com uma
 * categoria, o estorno no cartão dela abate (o alerta de categoria do ciclo).
 * O estorno sem categoria não abate o balde "sem categoria", de propósito
 * (como `despesaPorCategoria` explica).
 */
export function sumCardExpensesInWindow(
  rows: CardTxRow[],
  cardId: string,
  win: OpenWindow,
  categoryId?: string | null
): number {
  const startK = formatYmd(win.start)
  const endK = formatYmd(win.end)
  let cents = 0
  for (const t of rows) {
    const sinal = typeof categoryId === 'string' ? sinalNaDespesa(t) : t.type === 'expense' ? 1 : 0
    if (!sinal) continue
    if (t.payment_method !== 'credit_card') continue
    if (t.payment_credit_card_id !== cardId) continue
    const ymd = isoPrefixYmd(t.date)
    if (!ymd) continue
    const k = formatYmd(ymd)
    if (k < startK || k > endK) continue
    if (categoryId !== undefined && (t.category_id ?? null) !== categoryId) continue
    cents += sinal * Math.round(Number(t.amount || 0) * 100)
  }
  return cents / 100
}

/**
 * Estornos no cartão (receita com `payment_method = 'credit_card'`) com data em
 * [start, end] (inclusivo), somados em centavos. A fatura é despesas − estornos.
 */
export function sumCardRefundsInWindow(rows: CardTxRow[], cardId: string, win: OpenWindow): number {
  const startK = formatYmd(win.start)
  const endK = formatYmd(win.end)
  let cents = 0
  for (const t of rows) {
    if (t.type !== 'income') continue
    if (t.payment_method !== 'credit_card') continue
    if (t.payment_credit_card_id !== cardId) continue
    const ymd = isoPrefixYmd(t.date)
    if (!ymd) continue
    const k = formatYmd(ymd)
    if (k < startK || k > endK) continue
    cents += Math.round(Number(t.amount || 0) * 100)
  }
  return cents / 100
}

/**
 * O estorno no cartão: a receita no crédito com o cartão. Abate a fatura e o
 * orçamento da categoria dele (uma categoria de despesa), e não é renda.
 */
export function ehEstornoNoCartao(t: {
  type: string
  payment_method?: string | null
  payment_credit_card_id?: string | null
}): boolean {
  return t.type === 'income' && t.payment_method === 'credit_card' && !!t.payment_credit_card_id
}

/**
 * O peso da linha na despesa de uma categoria: a despesa soma (1), o estorno no
 * cartão abate (−1) e o resto fica fora (0). Quem soma decide se a categoria é
 * de despesa (o estorno antigo foi gravado numa de receita).
 */
export function sinalNaDespesa(t: {
  type: string
  payment_method?: string | null
  payment_credit_card_id?: string | null
}): 1 | -1 | 0 {
  if (t.type === 'expense') return 1
  return ehEstornoNoCartao(t) ? -1 : 0
}

/**
 * O tipo da categoria que o lançamento escolhe. O estorno no cartão é uma
 * receita, mas escolhe uma categoria de despesa: ele abate o orçamento dela.
 * `cartaoDoEstorno` é o cartão do estorno, ou null.
 */
export function tipoDaCategoria(
  type: 'income' | 'expense',
  cartaoDoEstorno: string | null,
): 'income' | 'expense' {
  return type === 'income' && cartaoDoEstorno ? 'expense' : type
}

/** Fatura na janela: despesas − estornos, em centavos. Pode ser negativa (saldo credor). */
export function cardInvoiceNetInWindow(rows: CardTxRow[], cardId: string, win: OpenWindow): number {
  const cents =
    Math.round(sumCardExpensesInWindow(rows, cardId, win) * 100) -
    Math.round(sumCardRefundsInWindow(rows, cardId, win) * 100)
  return cents / 100
}

/**
 * Numa fatura fechada, o total que o banco cobrou (`credit_card_statement_totals`)
 * vale sobre o calculado: a regra de `totalComBanco` (src/lib/fatura/total-com-banco.ts).
 */
export function escolherTotal(calculado: number, bancoTotal: number | string | null | undefined): number {
  return bancoTotal == null ? calculado : Number(bancoTotal)
}

/** A chave do total do banco, a mesma do front (`statementTotalKey`): `cartão:fechamento`. */
export function statementTotalKey(cardId: string, closeYmd: string): string {
  return `${cardId}:${closeYmd}`
}

/** Open cycle for `today`: day after lastClose through nextClose (inclusive), same as app `buildCardCycleSnapshot`. */
export function openInvoiceWindow(today: Ymd, closingDay: number): OpenWindow {
  const lastClose = statementCloseOnOrBefore(today, closingDay)
  const nextClose = nextCloseAfter(lastClose, closingDay)
  const start = addCalendarDays(lastClose, 1)
  return { start, end: nextClose }
}

export function filterRangeStartIso(ymd: Ymd): string {
  return `${formatYmd(ymd)}T00:00:00.000Z`
}

export function filterRangeEndIso(ymd: Ymd): string {
  return `${formatYmd(ymd)}T23:59:59.999Z`
}

/**
 * Estimated due for the invoice that closed on `closeYmd`: the first
 * min(dueDay, daysInMonth) strictly after the close — in the close month when
 * it fits, otherwise the next month (clamped). February clamping close and due
 * to the same day sends the due to March. Twin of `estimatedDueDateForClose`
 * in `src/lib/credit-card-billing.ts`.
 */
export function estimatedDueYmdForClose(closeYmd: Ymd, dueDay: number): Ymd {
  const sameMonth = Math.min(dueDay, daysInMonth(closeYmd.y, closeYmd.m))
  if (sameMonth > closeYmd.d) return { y: closeYmd.y, m: closeYmd.m, d: sameMonth }
  let y = closeYmd.y
  let m = closeYmd.m + 1
  if (m > 12) {
    m = 1
    y += 1
  }
  const d = Math.min(dueDay, daysInMonth(y, m))
  return { y, m, d }
}

/** O vencimento da fatura que fechou em `closeYmd`, quando ele cai no mês de `month`; senão `null`. */
export function estimatedDueYmdInMonth(closeYmd: Ymd, dueDay: number, month: Ymd): Ymd | null {
  const due = estimatedDueYmdForClose(closeYmd, dueDay)
  return due.y === month.y && due.m === month.m ? due : null
}

export function diffCalendarDays(from: Ymd, to: Ymd): number {
  return Math.round((ymdToUtcNoon(to) - ymdToUtcNoon(from)) / MS_DAY)
}

/**
 * Dia-calendário de referência do app (America/Sao_Paulo) — espelha
 * `public.app_today()` no Postgres. Entre 21:00 e 23:59 BRT, o dia UTC já é
 * o seguinte; usar UTC fazia alertas/cobranças dispararem "um dia antes".
 */
export function appTodayYmd(now: Date = new Date()): Ymd {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

/**
 * Próximo vencimento em ou depois de `today`, com o fechamento da fatura que ele
 * paga. Começa um ciclo antes do último fechamento: quando o vencimento cai no
 * mês seguinte ao fechamento, entre o fechamento novo e esse vencimento a
 * fatura que vence ainda é a anterior (fecha 28, vence 10: em 01/11 vence
 * 10/11, da fatura de 28/10). Começar no último fechamento pulava esse
 * vencimento. Quando vence depois do fechamento no mesmo mês, o laço anda até
 * ele (fecha 3, vence 10: em 05/11 vence 10/11, da fatura de 03/11).
 */
export function nextPaymentDueCycleOnOrAfter(
  today: Ymd,
  closingDay: number,
  dueDay: number
): { close: Ymd; due: Ymd } {
  let close = previousStatementCloseBefore(statementCloseOnOrBefore(today, closingDay), closingDay)
  for (let i = 0; i < 36; i++) {
    const due = estimatedDueYmdForClose(close, dueDay)
    if (compareYmd(due, today) >= 0) return { close, due }
    close = nextCloseAfter(close, closingDay)
  }
  throw new Error('nextPaymentDueCycleOnOrAfter: range exceeded')
}

/**
 * O próximo vencimento e, se a fatura seguinte vencer no mesmo dia (fecha 30,
 * vence 31 num mês de 30 dias), ela também: cada uma é uma fatura a avisar (#94).
 */
export function dueCyclesOnOrAfter(today: Ymd, closingDay: number, dueDay: number): { close: Ymd; due: Ymd }[] {
  const primeiro = nextPaymentDueCycleOnOrAfter(today, closingDay, dueDay)
  const close = nextCloseAfter(primeiro.close, closingDay)
  const due = estimatedDueYmdForClose(close, dueDay)
  return compareYmd(due, primeiro.due) === 0 ? [primeiro, { close, due }] : [primeiro]
}
