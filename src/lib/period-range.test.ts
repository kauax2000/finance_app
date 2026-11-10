import { describe, expect, it } from "vitest"
import {
  classifyPeriod,
  monthRangeYmd,
  periodLabel,
  periodSummary,
  wholeYears,
  yearRangeYmd,
} from "./period-range"
import { formatDateLongPtBr, formatTransactionCompactPtBr } from "./transaction-date"

describe("period-range", () => {
  it("classifyPeriod", () => {
    expect(classifyPeriod("2025-01-01", "2025-12-31")).toEqual({ kind: "year", year: 2025 })
    expect(classifyPeriod("2026-11-01", "2026-11-30")).toEqual({
      kind: "months",
      from: { year: 2026, month: 10 },
      to: { year: 2026, month: 10 },
    })
    expect(classifyPeriod("2025-11-01", "2026-02-28")).toEqual({
      kind: "months",
      from: { year: 2025, month: 10 },
      to: { year: 2026, month: 1 },
    })
    expect(classifyPeriod("2024-02-01", "2024-02-29").kind).toBe("months")
    expect(classifyPeriod("2026-02-01", "2026-02-27").kind).toBe("days")
    expect(classifyPeriod("2026-08-01", "2026-10-15").kind).toBe("days")
  })

  it("range helpers", () => {
    expect(monthRangeYmd({ year: 2026, month: 9 }, { year: 2026, month: 7 })).toEqual({
      from: "2026-08-01",
      to: "2026-10-31",
    })
    expect(yearRangeYmd(2025)).toEqual({ from: "2025-01-01", to: "2025-12-31" })
  })

  it("periodLabel", () => {
    expect(periodLabel("2026-11-01", "2026-11-30")).toMatchObject({
      rotulo: "nov 2026",
      falado: "novembro de 2026",
      operador: "é",
    })
    expect(periodLabel("2026-08-01", "2026-10-31")).toMatchObject({
      rotulo: "ago – out 2026",
      falado: "agosto a outubro de 2026",
      operador: "é",
    })
    expect(periodLabel("2025-11-01", "2026-02-28")).toMatchObject({
      rotulo: "nov 2025 – fev 2026",
      falado: "novembro de 2025 a fevereiro de 2026",
      operador: "é",
    })
    expect(periodLabel("2025-01-01", "2025-12-31")).toMatchObject({ rotulo: "2025", falado: "2025" })
    expect(periodLabel("2026-11-08", "2026-11-08")).toEqual({
      rotulo: formatTransactionCompactPtBr("2026-11-08"),
      falado: formatDateLongPtBr("2026-11-08"),
      operador: "é",
    })
    expect(periodLabel("2026-08-01", "2026-08-15")).toEqual({
      rotulo: `${formatTransactionCompactPtBr("2026-08-01")} e ${formatTransactionCompactPtBr("2026-08-15")}`,
      falado: `${formatDateLongPtBr("2026-08-01")} e ${formatDateLongPtBr("2026-08-15")}`,
      operador: "entre",
    })
  })

  it("periodSummary", () => {
    expect(periodSummary("2026-08-01", "2026-10-31")).toBe("1 ago – 31 out · 3 meses")
    expect(periodSummary("2026-11-01", "2026-11-30")).toBe("1 nov – 30 nov · 1 mês")
    expect(periodSummary("2025-01-01", "2025-12-31")).toBe("2025 · ano inteiro")
    expect(periodSummary("2026-11-02", "2026-11-08")).toBe("2 nov – 8 nov · 7 dias")
    expect(periodSummary("2026-11-08", "2026-11-08")).toBe("8 nov · 1 dia")
    expect(periodSummary("2025-12-20", "2026-01-10")).toBe("20 dez 2025 – 10 jan 2026 · 22 dias")
  })

  it("wholeYears", () => {
    expect(wholeYears("2024-01-01", "2026-12-31")).toEqual({ from: 2024, to: 2026 })
    expect(wholeYears("2025-01-01", "2025-12-31")).toEqual({ from: 2025, to: 2025 })
    expect(wholeYears("2024-02-01", "2026-12-31")).toBeNull()
    expect(wholeYears("2024-01-01", "2026-11-30")).toBeNull()
  })

  it("intervalo de anos no rótulo e no resumo", () => {
    expect(periodLabel("2024-01-01", "2026-12-31")).toEqual({ rotulo: "2024 – 2026", falado: "de 2024 a 2026", operador: "é" })
    expect(periodSummary("2024-01-01", "2026-12-31")).toBe("2024 – 2026 · 3 anos")
    // Um ano só segue como antes.
    expect(periodLabel("2025-01-01", "2025-12-31").rotulo).toBe("2025")
    expect(periodSummary("2025-01-01", "2025-12-31")).toBe("2025 · ano inteiro")
  })
})
