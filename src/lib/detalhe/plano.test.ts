import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import type { InstallmentScheduleRow } from "@/lib/installment-schedule-rows"

import { estadoDoPlano, fimDoPlano, linhasDoPlano } from "./plano"

const row = (
  slot: number,
  status: "posted" | "pending",
  date: string | null,
  parcelAmount = 100
): InstallmentScheduleRow => ({
  slot,
  transactionId: status === "posted" ? `t${slot}` : null,
  date,
  parcelAmount,
  status,
  invoicePaid: false,
})

const rows = [
  row(1, "posted", "2026-10-11T12:00:00Z"),
  row(2, "posted", "2026-11-11T12:00:00Z"),
  row(3, "pending", null),
  row(4, "pending", null, 120),
]

describe("estadoDoPlano", () => {
  it("separa ativo, quitado e encerrado", () => {
    expect(estadoDoPlano({ is_active: true, generated_count: 5, total_installments: 12 })).toBe("ativo")
    expect(estadoDoPlano({ is_active: false, generated_count: 12, total_installments: 12 })).toBe("quitado")
    expect(estadoDoPlano({ is_active: false, generated_count: 5, total_installments: 12 })).toBe("encerrado")
  })
})

describe("linhasDoPlano", () => {
  const ativo = { is_active: true, generated_count: 2, total_installments: 4, next_billing_date: "2026-12-11" }

  it("plano ativo prevê as pendentes mês a mês", () => {
    const l = linhasDoPlano(ativo, rows)
    expect(l.map((x) => [x.estado, x.data, x.valor])).toEqual([
      ["lancada", "2026-10-11", 100],
      ["lancada", "2026-11-11", 100],
      ["prevista", "2026-12-11", 100],
      ["prevista", "2027-01-11", 120],
    ])
    expect(fimDoPlano(l)).toBe("2027-01-11")
  })

  it("plano encerrado não lança as pendentes", () => {
    const l = linhasDoPlano({ ...ativo, is_active: false }, rows)
    expect(l.slice(2).map((x) => [x.estado, x.data])).toEqual([
      ["nao-sera-lancada", null],
      ["nao-sera-lancada", null],
    ])
    expect(fimDoPlano(l)).toBe("2026-11-11")
  })

  it("dia 31 cai no fim do mês curto", () => {
    const l = linhasDoPlano({ ...ativo, next_billing_date: "2027-01-31" }, [row(3, "pending", null), row(4, "pending", null)])
    expect(l.map((x) => x.data)).toEqual(["2027-01-31", "2027-02-28"])
  })

  it("ativo sem data: prevista sem data", () => {
    const l = linhasDoPlano({ ...ativo, next_billing_date: null }, [row(3, "pending", null)])
    expect(l[0]).toMatchObject({ estado: "prevista", data: null })
  })
})

describe("encerrarInstallmentPlan", () => {
  it("existe e desativa o plano", () => {
    const src = readFileSync("src/lib/transactions/mutations.ts", "utf8")
    expect(src).toContain("export async function encerrarInstallmentPlan")
    expect(src).toContain("is_active: false")
  })
})
