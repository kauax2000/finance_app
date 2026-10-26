import { readFileSync } from "node:fs"

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  ErroDoPlano,
  FALHA_DO_SERVIDOR,
  FIM_FUNDADORES,
  PRECO_FAMILIA_CENTAVOS,
  PRECO_FUNDADOR_CENTAVOS,
  alterarAssinatura,
  assinar,
  buscarMeuPlano,
  precoDoDia,
  resumoDoPlano,
  retornoConcluido,
  type MeuPlano,
} from "./plano"

const { rpc, invokeEdgeJson } = vi.hoisted(() => ({ rpc: vi.fn(), invokeEdgeJson: vi.fn() }))
vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }))
vi.mock("@/lib/edge-invoke", () => ({ invokeEdgeJson }))

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

  it("a data da carência é a de Brasília, qualquer que seja o fuso da máquina", () => {
    // 02:00 UTC do dia 31 ainda é 23:00 do dia 30 em Brasília.
    expect(resumo({ origem: "nenhuma", status: "past_due", carencia_ate: "2026-10-31T02:00:00Z" }).linhas).toEqual(["Atualize o cartão até 30/10."])
  })

  it("pagar_pendente entra primeiro e vence assinar e atualizar_cartao", () => {
    const url = "https://pagamento.exemplo/abc"
    expect(resumo({ origem: "teste", status: "pending", checkout_url: url }).acoes).toEqual(["pagar_pendente"])
    expect(resumo({ origem: "nenhuma", status: "past_due", checkout_url: url }).acoes).toEqual(["pagar_pendente", "cancelar"])
    // past_due cancelado: não há o que continuar pagando.
    expect(resumo({ origem: "nenhuma", status: "past_due", cancelar_no_fim: true, checkout_url: url }).acoes).toEqual(["desfazer"])
  })

  it("convidado não tem ação nenhuma", () => {
    expect(resumo({ origem: "nenhuma" }, "guest").acoes).toEqual([])
    expect(resumo({ origem: "nenhuma", status: "past_due" }, "guest").acoes).toEqual([])
    // Papel ainda carregando: nada de "Assinar" até saber que não é convidado.
    expect(resumo({ origem: "nenhuma" }, null).acoes).toEqual([])
    expect(resumo({ origem: "nenhuma" }, "member").acoes).toEqual(["assinar"])
  })

  it("banco sem a migração: o mesmo resumo do Bloco 4", async () => {
    const antigo = Object.fromEntries(
      Object.entries({ ...base, ...ativa }).filter(([k]) => !["cartao_final", "reembolsavel_ate", "carencia_ate", "checkout_url"].includes(k)),
    )
    rpc.mockResolvedValueOnce({ data: antigo, error: null })
    const p = await buscarMeuPlano()
    expect(p).toEqual({ ...base, ...ativa })
    expect(resumoDoPlano(p, agora, "owner").linhas.map((l) => l.replace(/\u00a0/g, " "))).toEqual(["Renova em 10/03/2027: 12x de R$ 29,90"])
  })
})

describe("retornoConcluido", () => {
  const p = (x: Partial<MeuPlano>) => ({ ...base, ...x })
  it("espera enquanto o status não muda; para quando muda ou já está ativo", () => {
    expect(retornoConcluido(p({ status: "pending" }), p({ status: "pending" }))).toBe(false)
    expect(retornoConcluido(p({ status: "pending" }), p({ status: "active" }))).toBe(true)
    expect(retornoConcluido(p({ status: "past_due" }), p({ status: "past_due" }))).toBe(false)
    expect(retornoConcluido(p({ status: "past_due" }), p({ status: "active", carencia_ate: "2027-01-01T00:00:00Z" }))).toBe(true)
    expect(retornoConcluido(p({ status: "active" }), p({ status: "active" }))).toBe(true)
  })
})

describe("assinar e alterarAssinatura", () => {
  beforeEach(() => invokeEdgeJson.mockReset())

  it("o CPF vai só no corpo do billing-checkout", async () => {
    invokeEdgeJson.mockResolvedValueOnce({ url: "https://pagamento.exemplo/x" })
    await expect(assinar("Ana Souza", "52998224725")).resolves.toBe("https://pagamento.exemplo/x")
    expect(invokeEdgeJson).toHaveBeenCalledWith("billing-checkout", { body: { nome: "Ana Souza", cpf: "52998224725" } })
    expect(invokeEdgeJson.mock.calls[0][0]).not.toContain("52998224725")
  })

  it("200 sem url (ou url que não é https) não navega", async () => {
    for (const data of [null, {}, { url: "javascript:alert(1)" }]) {
      invokeEdgeJson.mockResolvedValueOnce(data)
      await expect(assinar("Ana Souza", "52998224725")).rejects.toThrow("Não foi possível abrir o pagamento. Tente de novo.")
    }
  })

  it("Edge não implantada (404 do gateway) é 'Ainda não disponível.'", async () => {
    invokeEdgeJson.mockRejectedValueOnce(new Error('Edge Function "billing-checkout" não encontrada (404). Implante-a neste projeto.'))
    await expect(assinar("Ana Souza", "52998224725")).rejects.toThrow("Ainda não disponível.")
    invokeEdgeJson.mockRejectedValueOnce(new Error('Edge Function "billing-cancel" não encontrada (404). Implante-a neste projeto.'))
    await expect(alterarAssinatura("cancelar")).rejects.toThrow("Ainda não disponível.")
    // A frase casada acima é a do invokeEdgeJson: trocar lá quebra aqui.
    expect(readFileSync("src/lib/edge-invoke.ts", "utf8")).toContain("não encontrada (404)")
  })

  it("a frase da Edge passa; erro desconhecido vira a falha do servidor", async () => {
    invokeEdgeJson.mockRejectedValueOnce(new Error("O prazo de 7 dias para reembolso terminou."))
    await expect(alterarAssinatura("reembolsar")).rejects.toEqual(new ErroDoPlano("O prazo de 7 dias para reembolso terminou."))
    for (const e of [new TypeError("Cannot read properties of null"), new Error("Edge function failed (oops)"), new Error("Failed to fetch"), "x"]) {
      invokeEdgeJson.mockRejectedValueOnce(e)
      await expect(alterarAssinatura("cancelar")).rejects.toThrow(FALHA_DO_SERVIDOR)
    }
  })

  it("o 202 do reembolso devolve a mensagem; o 200, null", async () => {
    invokeEdgeJson.mockResolvedValueOnce({ ok: true, pendente: true, mensagem: "Pedimos o reembolso ao Asaas." })
    await expect(alterarAssinatura("reembolsar")).resolves.toBe("Pedimos o reembolso ao Asaas.")
    expect(invokeEdgeJson).toHaveBeenCalledWith("billing-cancel", { body: { acao: "reembolsar" } })
    invokeEdgeJson.mockResolvedValueOnce({ ok: true })
    await expect(alterarAssinatura("desfazer")).resolves.toBeNull()
  })
})

describe("precoDoDia", () => {
  it("fundador até o fim de janeiro, depois o preço cheio", () => {
    expect(precoDoDia(new Date("2027-01-31T20:00:00Z"))).toBe(PRECO_FUNDADOR_CENTAVOS)
    expect(precoDoDia(new Date(FIM_FUNDADORES))).toBe(PRECO_FAMILIA_CENTAVOS)
  })
})
