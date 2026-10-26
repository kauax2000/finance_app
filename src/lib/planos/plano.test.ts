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
  cartao_final: null,
  reembolsavel_ate: null,
  carencia_ate: null,
  checkout_url: null,
}
const agora = new Date("2026-10-23T15:00:00Z")
// O Intl põe espaço sem quebra depois do R$.
const resumo = (p: Partial<MeuPlano>, papel: "owner" | "member" | "guest" | null = "owner") => {
  const r = resumoDoPlano({ ...base, ...p }, agora, papel)
  return { ...r, linhas: r.linhas.map((l) => l.replace(/\u00a0/g, " ")) }
}
const ativa = { origem: "assinatura", status: "active", periodo_ate: "2027-03-10T15:00:00Z", preco_centavos: PRECO_FAMILIA_CENTAVOS } as const

describe("resumoDoPlano", () => {
  it("livre: tudo liberado até o lançamento", () => {
    expect(resumo({})).toEqual({
      titulo: "Plano Família",
      linhas: ["Tudo liberado até o lançamento da assinatura."],
      acoes: [],
    })
  })

  it("teste: título com a data e assinar", () => {
    const r = resumo({ origem: "teste", teste_ate: "2026-11-05T15:00:00Z" })
    expect(r.titulo).toMatch(/^Teste grátis até 05\/11/)
    expect(r.linhas).toEqual([])
    expect(r.acoes).toEqual(["assinar"])
  })

  it("assinatura: renova em data, 12x do preço contratado", () => {
    const r = resumo({ origem: "assinatura", periodo_ate: "2027-03-10T15:00:00Z", preco_centavos: PRECO_FUNDADOR_CENTAVOS, fundador: true })
    expect(r.titulo).toBe("Plano Família")
    expect(r.linhas[0]).toMatch(/^Renova em 10\/03\/2027: 12x de R\$ 19,90$/)
    expect(r.acoes).toEqual([])
  })

  it("assinatura cancelada: termina na data", () => {
    const r = resumo({ origem: "assinatura", periodo_ate: "2027-03-10T15:00:00Z", cancelar_no_fim: true, preco_centavos: PRECO_FAMILIA_CENTAVOS })
    expect(r.linhas).toEqual(["Termina em 10/03/2027"])
  })

  it("vitalício, convite e nenhuma", () => {
    expect(resumo({ origem: "vitalicio" })).toEqual({ titulo: "Plano Família vitalício", linhas: [], acoes: [] })
    expect(resumo({ origem: "convite" })).toEqual({ titulo: "Coberto pelo plano da família", linhas: [], acoes: [] })
    expect(resumo({ plano: "leitura", origem: "nenhuma" })).toEqual({
      titulo: "Conta em só leitura",
      linhas: ["Tudo continua visível; exportar e apagar seguem liberados."],
      acoes: ["assinar"],
    })
  })

  it("active: cancelar, com o cartão; cancelada: desfazer", () => {
    const r = resumo({ ...ativa, cartao_final: "1234" })
    expect(r.linhas).toEqual(["Renova em 10/03/2027: 12x de R$ 29,90", "Cartão final 1234"])
    expect(r.acoes).toEqual(["cancelar"])
    expect(resumo({ ...ativa, cancelar_no_fim: true }).acoes).toEqual(["desfazer"])
  })

  it("reembolso só dentro dos 7 dias", () => {
    expect(resumo({ ...ativa, reembolsavel_ate: "2026-10-25T15:00:00Z" }).acoes).toEqual(["cancelar", "reembolsar"])
    expect(resumo({ ...ativa, reembolsavel_ate: "2026-10-23T14:59:59Z" }).acoes).toEqual(["cancelar"])
  })

  it("active com carência: renovação em confirmação, sem cancelar", () => {
    const r = resumo({ ...ativa, carencia_ate: "2027-03-17T15:00:00Z" })
    expect(r.linhas).toContain("Renovação em confirmação.")
    expect(r.acoes).toEqual([])
  })

  it("past_due em qualquer origem: atualizar o cartão até a carência", () => {
    for (const origem of ["assinatura", "teste", "convite", "nenhuma"] as const) {
      const r = resumo({ origem, status: "past_due", carencia_ate: "2026-10-30T15:00:00Z" })
      expect(r).toEqual({ titulo: "Não conseguimos renovar", linhas: ["Atualize o cartão até 30/10."], acoes: ["atualizar_cartao", "cancelar"] })
    }
    expect(resumo({ origem: "nenhuma", status: "past_due", cancelar_no_fim: true }).acoes).toEqual(["desfazer"])
  })

  it("pagar_pendente entra primeiro e vence assinar e atualizar_cartao", () => {
    const url = "https://pagamento.exemplo/abc"
    expect(resumo({ origem: "teste", status: "pending", checkout_url: url }).acoes).toEqual(["pagar_pendente"])
    expect(resumo({ origem: "nenhuma", status: "past_due", checkout_url: url }).acoes).toEqual(["pagar_pendente", "cancelar"])
  })

  it("convidado não tem ação nenhuma", () => {
    expect(resumo({ origem: "nenhuma" }, "guest").acoes).toEqual([])
    expect(resumo({ origem: "nenhuma", status: "past_due" }, "guest").acoes).toEqual([])
    expect(resumo({ origem: "nenhuma" }, null).acoes).toEqual(["assinar"])
  })

  it("banco sem a migração: o mesmo resumo do Bloco 4", () => {
    const { cartao_final, reembolsavel_ate, carencia_ate, checkout_url, ...antigo } = base
    void [cartao_final, reembolsavel_ate, carencia_ate, checkout_url]
    const p = { ...antigo, ...ativa } as unknown as MeuPlano
    expect(resumoDoPlano(p, agora, "owner").linhas.map((l) => l.replace(/\u00a0/g, " "))).toEqual(["Renova em 10/03/2027: 12x de R$ 29,90"])
    expect(resumoDoPlano({ ...antigo, origem: "teste" } as unknown as MeuPlano, agora, "owner").acoes).toEqual(["assinar"])
  })
})

describe("precoDoDia", () => {
  it("fundador até o fim de janeiro, depois o preço cheio", () => {
    expect(precoDoDia(new Date("2027-01-31T20:00:00Z"))).toBe(PRECO_FUNDADOR_CENTAVOS)
    expect(precoDoDia(new Date(FIM_FUNDADORES))).toBe(PRECO_FAMILIA_CENTAVOS)
  })
})
