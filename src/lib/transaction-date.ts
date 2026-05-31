/**
 * Transaction `date` is stored as timestamptz. Calendar days from the UI must not
 * use `new Date("YYYY-MM-DD")` (UTC midnight) — that shifts "today" for TZs west of UTC.
 * We store noon UTC for the chosen calendar day so the date part is stable for display.
 */
export function parseYmdLocal(ymd: string): Date | undefined {
    if (!ymd) return undefined
    const parts = ymd.split("-").map((p) => parseInt(p, 10))
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined
    const [y, m, d] = parts
    return new Date(y, m - 1, d)
}

export function localYmdFromDate(d: Date): string {
    const y = d.getFullYear()
    const mo = d.getMonth() + 1
    const day = d.getDate()
    return `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function calendarYmdToStorageIso(ymd: string): string {
    return `${ymd}T12:00:00.000Z`
}

function pad2(n: number): string {
    return String(n).padStart(2, "0")
}

/**
 * Calendar Y-M-D from stored transaction `date` (timestamptz / ISO string).
 * Prefer leading `YYYY-MM-DD` when present (stable calendar day); otherwise local calendar from parsed instant.
 */
export function transactionCalendarParts(
    isoOrString: string
): { y: number; mo: number; d: number } | null {
    const s = isoOrString.trim()
    const prefix = s.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) {
        const [y, mo, d] = prefix.split("-").map(Number)
        if ([y, mo, d].some((n) => Number.isNaN(n))) return null
        return { y, mo, d }
    }
    const parsed = new Date(s)
    if (Number.isNaN(parsed.getTime())) return null
    const ymd = localYmdFromDate(parsed)
    const [y, mo, d] = ymd.split("-").map(Number)
    return { y, mo, d }
}

/** dd/mm (no year) — listagens e colunas compactas. */
export function formatTransactionDayMonthPtBr(isoOrString: string): string {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return isoOrString.trim()
    return `${pad2(p.d)}/${pad2(p.mo)}`
}

/** dd/mm/aaaa — quando o ano deve aparecer. */
export function formatTransactionDmyPtBr(isoOrString: string): string {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return isoOrString.trim()
    return `${pad2(p.d)}/${pad2(p.mo)}/${p.y}`
}

/** dd/mm no ano corrente; dd/mm/aa caso contrário — rótulos compactos (ex.: próxima cobrança). */
export function formatTransactionCompactPtBr(isoOrString: string): string {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return isoOrString.trim()
    const currentYear = new Date().getFullYear()
    if (p.y === currentYear) {
        return `${pad2(p.d)}/${pad2(p.mo)}`
    }
    return `${pad2(p.d)}/${pad2(p.mo)}/${String(p.y).slice(-2)}`
}

/** Inclusive range bounds for filtering timestamptz by calendar Y-M-D. */
export function filterRangeStartIso(ymd: string): string {
    return `${ymd}T00:00:00.000Z`
}

export function filterRangeEndIso(ymd: string): string {
    return `${ymd}T23:59:59.999Z`
}

/** dd/mm — alias; sempre dia antes do mês (sem depender de locale do navegador). */
export function formatTransactionDayPtBr(isoOrString: string): string {
    return formatTransactionDayMonthPtBr(isoOrString)
}

/** Stable `YYYY-MM` for grouping (calendar day from stored value, UTC). */
export function monthYearKeyFromTransactionDate(isoOrString: string): string {
    const s = isoOrString.trim()
    const prefix = s.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) {
        return prefix.slice(0, 7)
    }
    const parsed = new Date(s)
    if (Number.isNaN(parsed.getTime())) return ""
    const ymd = localYmdFromDate(parsed)
    return ymd.slice(0, 7)
}

/**
 * Calendar date from `YYYY-MM-DD` or ISO string — short pt-BR (dd/mm/aaaa) via local calendar.
 * Use for subscription charge dates and plain date columns.
 */
export function formatDatePtBr(iso: string | null | undefined): string {
  if (!iso) return "—"
  const head = iso.trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) {
    const [y, m, d] = head.split("-").map(Number)
    if (!y || !m || !d) return iso.trim()
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR")
  }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso.trim()
  return parsed.toLocaleDateString("pt-BR")
}

/** e.g. "15 de maio de 2025" — from transaction / ISO date. */
export function formatDateLongPtBr(isoOrString: string): string {
  const p = transactionCalendarParts(isoOrString)
  if (!p) return isoOrString.trim()
  const d = new Date(p.y, p.mo - 1, p.d)
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const rtf =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })
    : null

/** Approximate relative label (day granularity) from calendar Y-M-D or ISO. */
export function formatRelativeDayPtBr(isoOrString: string): string {
  if (!rtf) return formatTransactionDmyPtBr(isoOrString)
  const p = transactionCalendarParts(isoOrString)
  if (!p) return isoOrString.trim()
  const target = new Date(p.y, p.mo - 1, p.d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  return rtf.format(diffDays, "day")
}

/** Long month + year in pt-BR for table section headers. */
export function formatTransactionMonthYearPtBr(isoOrString: string): string {
    const s = isoOrString.trim()
    const prefix = s.slice(0, 10)
    let y: number
    let mo: number
    if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) {
        ;[y, mo] = prefix.split("-").map(Number)
    } else {
        const parsed = new Date(s)
        if (Number.isNaN(parsed.getTime())) return s
        y = parsed.getFullYear()
        mo = parsed.getMonth() + 1
    }
    const utc = new Date(Date.UTC(y, mo - 1, 1))
    return utc.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    })
}
