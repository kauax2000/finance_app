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

export function previousStatementCloseBefore(closeYmd: Ymd, closingDay: number): Ymd {
  const t = ymdToUtcNoon(closeYmd) - MS_DAY
  return statementCloseOnOrBefore(utcNoonToYmd(t), closingDay)
}

export function addCalendarDays(ymd: Ymd, delta: number): Ymd {
  const t = ymdToUtcNoon(ymd) + delta * MS_DAY
  return utcNoonToYmd(t)
}

export type OpenWindow = { start: Ymd; end: Ymd }

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

/** Estimated due for the invoice that closed on `closeYmd` (month after close, clamped due day). */
export function estimatedDueYmdForClose(closeYmd: Ymd, dueDay: number): Ymd {
  let y = closeYmd.y
  let m = closeYmd.m + 1
  if (m > 12) {
    m = 1
    y += 1
  }
  const d = Math.min(dueDay, daysInMonth(y, m))
  return { y, m, d }
}

export function diffCalendarDays(from: Ymd, to: Ymd): number {
  return Math.round((ymdToUtcNoon(to) - ymdToUtcNoon(from)) / MS_DAY)
}

export function utcTodayYmd(): Ymd {
  const d = new Date()
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
  }
}

/** Next payment due date on or after `today` (estimated from closing schedule). */
export function nextPaymentDueOnOrAfter(
  today: Ymd,
  closingDay: number,
  dueDay: number
): Ymd {
  let close = statementCloseOnOrBefore(today, closingDay)
  for (let i = 0; i < 36; i++) {
    const due = estimatedDueYmdForClose(close, dueDay)
    if (compareYmd(due, today) >= 0) return due
    close = nextCloseAfter(close, closingDay)
  }
  throw new Error('nextPaymentDueOnOrAfter: range exceeded')
}
