import { describe, expect, it } from "vitest"

import { quemSai } from "./overflow"

describe("quemSai", () => {
  const l = [100, 100, 100, 100]
  it("ninguém sai quando cabe", () => {
    expect(quemSai(l, 400, { ponta: "fim", fixos: new Set(), reserva: 40 })).toEqual([])
  })
  it("as abas saem do fim", () => {
    expect(quemSai(l, 300, { ponta: "fim", fixos: new Set(), reserva: 40 })).toEqual([2, 3])
  })
  it("a fixa (aba ativa) nunca sai: sai a última que cabia", () => {
    expect(quemSai(l, 300, { ponta: "fim", fixos: new Set([3]), reserva: 40 })).toEqual([1, 2])
  })
  it("as ações saem do começo e a última nunca sai", () => {
    expect(quemSai(l, 300, { ponta: "inicio", fixos: new Set([3]), reserva: 40 })).toEqual([0, 1])
  })
  it("respeita quem não pode sair", () => {
    expect(
      quemSai(l, 300, { ponta: "inicio", fixos: new Set([3]), reserva: 40, podeSair: (i) => i !== 0 })
    ).toEqual([1, 2])
  })
  it("conta o gap entre os itens", () => {
    expect(quemSai([100, 100], 205, { ponta: "fim", fixos: new Set(), reserva: 0, gap: 8 })).toEqual([1])
  })
})
