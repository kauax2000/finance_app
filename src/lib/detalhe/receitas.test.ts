import { describe, expect, it } from "vitest"

import { currencyBRL } from "@/lib/formatters"

import {
  legendaDaReceita,
  maximoDaBarra,
  receitasPorMes,
  seloContraOAnterior,
} from "./receitas"

describe("legendaDaReceita", () => {
  it("mês em curso abaixo do esperado diz o que falta", () => {
    expect(
      legendaDaReceita({ valor: 8000, total: 8450, esperado: 9000, mesCorrente: true, mes: "novembro" })
    ).toBe(`faltam ${currencyBRL(550)} para entrar`)
  })
  it("sem previsão, a fatia do que entrou", () => {
    expect(
      legendaDaReceita({ valor: 8000, total: 8450, esperado: 0, mesCorrente: false, mes: "novembro" })
    ).toBe("95% do que entrou em novembro")
    expect(
      legendaDaReceita({ valor: 8000, total: 8000, esperado: 0, mesCorrente: true, mes: "novembro" })
    ).toBe("100% do que entrou em novembro")
  })
  it("previsão já cumprida cai na fatia", () => {
    expect(
      legendaDaReceita({ valor: 8000, total: 9500, esperado: 9000, mesCorrente: true, mes: "novembro" })
    ).toBe("84% do que entrou em novembro")
  })
})

describe("maximoDaBarra", () => {
  it("é o maior entre realizado e esperado", () => {
    expect(maximoDaBarra(8450, 9000)).toBe(9000)
    expect(maximoDaBarra(9500, 9000)).toBe(9500)
  })
})

describe("receitasPorMes", () => {
  it("soma receitas por mês, sem estorno no cartão nem despesa", () => {
    const base = { payment_method: null, payment_credit_card_id: null } as const
    const txs = [
      { ...base, type: "income", amount: 8000, date: "2026-11-05" },
      { ...base, type: "income", amount: 8000, date: "2026-10-05" },
      { type: "income", amount: 100, date: "2026-11-08", payment_method: "credit_card", payment_credit_card_id: "c1" },
      { ...base, type: "expense", amount: 50, date: "2026-11-09" },
    ] as Parameters<typeof receitasPorMes>[0]
    expect(receitasPorMes(txs, ["2026-10", "2026-11"])).toEqual([
      { ym: "2026-10", total: 8000 },
      { ym: "2026-11", total: 8000 },
    ])
  })
})

describe("seloContraOAnterior", () => {
  it("sobe, desce e some sem base", () => {
    expect(seloContraOAnterior(8450, 8000, "outubro")).toEqual({
      texto: `↑ ${currencyBRL(450)} sobre outubro`,
      sobe: true,
    })
    expect(seloContraOAnterior(7000, 8000, "outubro")).toEqual({
      texto: `↓ ${currencyBRL(1000)} abaixo de outubro`,
      sobe: false,
    })
    expect(seloContraOAnterior(8000, 0, "outubro")).toBeNull()
    expect(seloContraOAnterior(8000, 8000, "outubro")).toBeNull()
  })
})
