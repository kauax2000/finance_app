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

/**
 * O mês abreviado em pt-BR, a partir de uma `Date` — "jan", "fev", "mar".
 *
 * Existe para o seletor de mês do `Calendar`, que formatava o nome do mês
 * inline com a API do `Intl`: a regra **I** do auditor, e um ponto a mais em
 * que a língua do app era decidida fora daqui.
 *
 * O ponto final sai. O `Intl` devolve "jan." em pt-BR, e num `<select>` de doze
 * itens a abreviação pontuada só acrescenta ruído — o mesmo motivo pelo qual as
 * outras abreviações deste arquivo também não o trazem.
 */
export function formatMonthShortPtBr(d: Date): string {
    return d
        .toLocaleString("pt-BR", { month: "short" })
        .replace(/\.$/, "")
}

/**
 * "15/05/25 14:30" — data e hora curtas, para o que expira.
 *
 * Ela existe porque seis chamadas escreviam
 * `new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })`
 * à mão, em dois arquivos que dizem a mesma frase sobre o mesmo convite.
 */
export function formatDateTimeShortPtBr(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso.trim()
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

/** "setembro" — o nome do mês por extenso, para o seletor de mês. */
export function formatMonthLongPtBr(d: Date): string {
    return d.toLocaleString("pt-BR", { month: "long" })
}

/**
 * "2026-09-01" → "01/09/2026", sem passar por Date: `new Date("2026-09-01")` é
 * meia-noite UTC, e no Brasil isso é o dia anterior.
 */
export function formatYmdPtBr(ymd: string): string {
    const [y, m, d] = ymd.slice(0, 10).split("-")
    return y && m && d ? `${d}/${m}/${y}` : ymd
}

/** Ordem de dois `YYYY-MM-DD`: a data em texto compara na ordem do calendário. */
export function compareYmd(a: string, b: string): number {
    return a.localeCompare(b)
}

/** `YYYY-MM-DD` deslocado de `days` dias no calendário local. */
export function addDaysYmd(ymd: string, days: number): string {
    const d = parseYmdLocal(ymd.slice(0, 10))
    if (!d) return ymd
    d.setDate(d.getDate() + days)
    return localYmdFromDate(d)
}

/** Dias de `fromYmd` até `toYmd` no calendário local (negativo quando `to` vem antes). */
export function daysBetweenYmd(fromYmd: string, toYmd: string): number | null {
    const a = parseYmdLocal(fromYmd.slice(0, 10))
    const b = parseYmdLocal(toYmd.slice(0, 10))
    if (!a || !b) return null
    return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** `YYYY-MM-DD` do dia-calendário de uma data de lançamento, ou `null` se ilegível. */
export function transactionLocalYmd(isoOrString: string): string | null {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return null
    return `${p.y}-${pad2(p.mo)}-${pad2(p.d)}`
}

/**
 * "2026-09" → "set. de 26", para eixo de gráfico mês a mês. Em UTC de propósito:
 * `new Date(y, m - 1, 1)` local e o `toLocaleDateString` concordam, mas a série
 * das categorias já quebrou uma vez por misturar os dois fusos.
 */
export function formatYearMonthShortPtBr(ym: string): string {
    const [y, m] = ym.split("-").map(Number)
    if (!y || !m) return ym
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
    })
}

/**
 * A distância de calendário **local** entre dois instantes, em dias: 0 é o
 * mesmo dia, −1 é ontem, 1 é amanhã. Não passa por `transactionCalendarParts`
 * de propósito: aquele lê os dez primeiros caracteres do ISO, e num carimbo
 * `2026-04-05T01:12:00Z` isso é o dia em UTC — no Brasil, o anterior.
 */
function diasDeCalendario(de: Date, ate: Date): number {
    const a = new Date(de.getFullYear(), de.getMonth(), de.getDate())
    const b = new Date(ate.getFullYear(), ate.getMonth(), ate.getDate())
    return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/**
 * O tempo relativo de um evento (rodada 227): "Agora", "Há 5 min", "Há 3 h",
 * "Ontem", "Há 3 dias", "Amanhã", "Em 3 dias" — e, a partir de uma semana, a
 * data (dd/mm no ano corrente, dd/mm/aaaa fora dele). `agora` entra como
 * argumento para o `TimelineTime relative` decidir quando recalcular, e para o
 * teste não depender do relógio.
 */
export function formatRelativeTimePtBr(iso: string, agora: number = Date.now()): string {
    const d = new Date(iso)
    const t = d.getTime()
    if (Number.isNaN(t)) return iso.trim()
    const minutos = Math.round((agora - t) / 60_000)
    if (Math.abs(minutos) < 1) return "Agora"
    if (minutos > 0 && minutos < 60) return `Há ${minutos} min`
    if (minutos > 0 && minutos < 24 * 60) return `Há ${Math.floor(minutos / 60)} h`
    if (minutos < 0 && minutos > -60) return `Em ${-minutos} min`
    const dias = diasDeCalendario(new Date(agora), d)
    if (dias === 0) return `Em ${Math.floor(-minutos / 60)} h`
    if (dias === -1) return "Ontem"
    if (dias === 1) return "Amanhã"
    if (dias < 0 && dias > -7) return `Há ${-dias} dias`
    if (dias > 0 && dias < 7) return `Em ${dias} dias`
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    return d.getFullYear() === new Date(agora).getFullYear()
        ? `${dd}/${mm}`
        : `${dd}/${mm}/${d.getFullYear()}`
}

/**
 * O rótulo da faixa de dia de um histórico: "Hoje", "Ontem", "Amanhã",
 * "12 de março" — e com o ano quando não é o corrente.
 */
export function formatDayHeadingPtBr(iso: string, agora: number = Date.now()): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso.trim()
    const dias = diasDeCalendario(new Date(agora), d)
    if (dias === 0) return "Hoje"
    if (dias === -1) return "Ontem"
    if (dias === 1) return "Amanhã"
    return d.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        ...(d.getFullYear() === new Date(agora).getFullYear() ? {} : { year: "numeric" }),
    })
}

/**
 * Agrupa uma lista **já ordenada** pelo dia local de cada item, mantendo a
 * ordem: dois dias iguais separados por outro viram dois grupos, porque a faixa
 * rotula a cronologia e não a reordena. `chave` é o dia em `aaaa-mm-dd`, e
 * `data` é o carimbo do primeiro item, para o rótulo.
 */
export function groupByLocalDay<T>(
    itens: readonly T[],
    dataDe: (item: T) => string
): { chave: string; data: string; itens: T[] }[] {
    const grupos: { chave: string; data: string; itens: T[] }[] = []
    for (const item of itens) {
        const data = dataDe(item)
        const d = new Date(data)
        const chave = Number.isNaN(d.getTime()) ? data : localYmdFromDate(d)
        const ultimo = grupos.at(-1)
        if (ultimo?.chave === chave) ultimo.itens.push(item)
        else grupos.push({ chave, data, itens: [item] })
    }
    return grupos
}
