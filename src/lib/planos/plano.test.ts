import { describe, expect, it, vi } from "vitest"

import { FIM_FUNDADORES, PRECO_FAMILIA_CENTAVOS, PRECO_FUNDADOR_CENTAVOS, precoDoDia, resumoDoPlano, type MeuPlano } from "./plano"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const base: MeuPlano = {
  plano: "familia",
  origem: "livre",
  status: null,
  teste_ate: null,
  periodo_ate: null,
  cancelar_no_fim: false,
  preco_centavos: null,
  fundador: false,
}
const agora = new Date("2026-10-23T15:00:00Z")
// O Intl põe espaço sem quebra depois do R$.
const resumo = (p: Partial<MeuPlano>) => {
  const r = resumoDoPlano({ ...base, ...p }, agora)
  return { ...r, linhas: r.linhas.map((l) => l.replace(/ /g, " ")) }
}

describe("resumoDoPlano", () => {
  it("livre: tudo liberado até o lançamento", () => {
    expect(resumo({})).toEqual({
      titulo: "Plano Família",
      linhas: ["Tudo liberado até o lançamento da assinatura."],
      podeAssinar: false,
    })
  })

  it("teste: título com a data e pode assinar", () => {
    const r = resumo({ origem: "teste", teste_ate: "2026-11-05T15:00:00Z" })
    expect(r.titulo).toMatch(/^Teste grátis até 05\/11/)
    expect(r.linhas).toEqual([])
    expect(r.podeAssinar).toBe(true)
  })

  it("assinatura: renova em data, 12x do preço contratado", () => {
    const r = resumo({ origem: "assinatura", periodo_ate: "2027-03-10T15:00:00Z", preco_centavos: PRECO_FUNDADOR_CENTAVOS, fundador: true })
    expect(r.titulo).toBe("Plano Família")
    expect(r.linhas[0]).toMatch(/^Renova em 10\/03\/2027: 12x de R\$ 19,90$/)
    expect(r.podeAssinar).toBe(false)
  })

  it("assinatura cancelada: termina na data", () => {
    const r = resumo({ origem: "assinatura", periodo_ate: "2027-03-10T15:00:00Z", cancelar_no_fim: true, preco_centavos: PRECO_FAMILIA_CENTAVOS })
    expect(r.linhas).toEqual(["Termina em 10/03/2027"])
  })

  it("vitalício, convite e nenhuma", () => {
    expect(resumo({ origem: "vitalicio" })).toEqual({ titulo: "Plano Família vitalício", linhas: [], podeAssinar: false })
    expect(resumo({ origem: "convite" })).toEqual({ titulo: "Coberto pelo plano da família", linhas: [], podeAssinar: false })
    expect(resumo({ plano: "leitura", origem: "nenhuma" })).toEqual({
      titulo: "Conta em só leitura",
      linhas: ["Tudo continua visível; exportar e apagar seguem liberados."],
      podeAssinar: true,
    })
  })
})

describe("precoDoDia", () => {
  it("fundador até o fim de janeiro, depois o preço cheio", () => {
    expect(precoDoDia(new Date("2027-01-31T20:00:00Z"))).toBe(PRECO_FUNDADOR_CENTAVOS)
    expect(precoDoDia(new Date(FIM_FUNDADORES))).toBe(PRECO_FAMILIA_CENTAVOS)
  })
})
