import {
  daysBetweenYmd,
  formatDateLongPtBr,
  formatMonthLongPtBr,
  formatMonthShortPtBr,
  formatTransactionCompactPtBr,
  localYmdFromDate,
  parseYmdLocal,
} from "./transaction-date"

type YearMonth = { year: number; month: number } // month 0–11

export type PeriodKind =
  | { kind: "year"; year: number }
  | { kind: "months"; from: YearMonth; to: YearMonth }
  | { kind: "days" }

function ymdParts(ymd: string) {
  const d = parseYmdLocal(ymd)
  return d ? { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() } : undefined
}

function lastDay(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function classifyPeriod(from: string, to: string): PeriodKind {
  const a = ymdParts(from)
  const b = ymdParts(to)
  if (!a || !b || from > to || a.d !== 1 || b.d !== lastDay(b.y, b.m)) return { kind: "days" }
  if (a.y === b.y && a.m === 0 && b.m === 11) return { kind: "year", year: a.y }
  return { kind: "months", from: { year: a.y, month: a.m }, to: { year: b.y, month: b.m } }
}

export function monthRangeYmd(a: YearMonth, b: YearMonth) {
  const [ini, fim] = a.year * 12 + a.month <= b.year * 12 + b.month ? [a, b] : [b, a]
  return {
    from: localYmdFromDate(new Date(ini.year, ini.month, 1)),
    to: localYmdFromDate(new Date(fim.year, fim.month + 1, 0)),
  }
}

export function yearRangeYmd(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

const curto = (ym: YearMonth) => formatMonthShortPtBr(new Date(ym.year, ym.month, 1)).toLowerCase()
const longo = (ym: YearMonth) => formatMonthLongPtBr(new Date(ym.year, ym.month, 1)).toLowerCase()

export function periodLabel(
  from: string,
  to: string
): { rotulo: string; falado: string; operador: "é" | "entre" } {
  const p = classifyPeriod(from, to)
  if (p.kind === "year") return { rotulo: String(p.year), falado: String(p.year), operador: "é" }
  if (p.kind === "months") {
    const { from: a, to: b } = p
    const mesmoMes = a.year === b.year && a.month === b.month
    if (mesmoMes) {
      return { rotulo: `${curto(a)} ${a.year}`, falado: `${longo(a)} de ${a.year}`, operador: "é" }
    }
    if (a.year === b.year) {
      return {
        rotulo: `${curto(a)} – ${curto(b)} ${a.year}`,
        falado: `${longo(a)} a ${longo(b)} de ${a.year}`,
        operador: "é",
      }
    }
    return {
      rotulo: `${curto(a)} ${a.year} – ${curto(b)} ${b.year}`,
      falado: `${longo(a)} de ${a.year} a ${longo(b)} de ${b.year}`,
      operador: "é",
    }
  }
  if (from === to) {
    return {
      rotulo: formatTransactionCompactPtBr(from),
      falado: formatDateLongPtBr(from),
      operador: "é",
    }
  }
  return {
    rotulo: `${formatTransactionCompactPtBr(from)} e ${formatTransactionCompactPtBr(to)}`,
    falado: `${formatDateLongPtBr(from)} e ${formatDateLongPtBr(to)}`,
    operador: "entre",
  }
}

export function periodSummary(from: string, to: string): string {
  const p = classifyPeriod(from, to)
  if (p.kind === "year") return `${p.year} · ano inteiro`
  const a = ymdParts(from)
  const b = ymdParts(to)
  if (!a || !b) return ""
  const ponta = (x: NonNullable<typeof a>, comAno: boolean) =>
    `${x.d} ${curto({ year: x.y, month: x.m })}${comAno ? ` ${x.y}` : ""}`
  const comAno = a.y !== b.y
  const intervalo = from === to ? ponta(a, false) : `${ponta(a, comAno)} – ${ponta(b, comAno)}`
  if (p.kind === "months") {
    const n = (p.to.year - p.from.year) * 12 + p.to.month - p.from.month + 1
    return `${intervalo} · ${n} ${n === 1 ? "mês" : "meses"}`
  }
  const n = (daysBetweenYmd(from, to) ?? 0) + 1
  return `${intervalo} · ${n} ${n === 1 ? "dia" : "dias"}`
}
