import { describe, expect, it } from "vitest"

import { casarEscopos, ESCOPOS, escopoExato, lerComando } from "./app-search-scopes"

describe("lerComando", () => {
  it("devolve null quando o termo não começa com a barra", () => {
    expect(lerComando("mercado")).toBeNull()
    expect(lerComando("15/03")).toBeNull()
    expect(lerComando(" /membros")).toBeNull()
  })

  it("separa o comando parcial, o fechamento e o resto", () => {
    expect(lerComando("/")).toEqual({ parcial: "", fechado: false, resto: "" })
    expect(lerComando("/tra")).toEqual({ parcial: "tra", fechado: false, resto: "" })
    expect(lerComando("/membros ")).toEqual({ parcial: "membros", fechado: true, resto: "" })
    expect(lerComando("/membros  ana souza")).toEqual({
      parcial: "membros",
      fechado: true,
      resto: "ana souza",
    })
  })
})

describe("casarEscopos", () => {
  it("sem parcial devolve todos, na ordem da tabela", () => {
    expect(casarEscopos("").map((e) => e.id)).toEqual([
      "telas", "acoes", "transacoes", "cartoes", "categorias",
      "parcelas", "assinaturas", "contas", "membros", "carteiras",
    ])
  })

  it("casa prefixo do comando ou de um alias, sem acento nem caixa", () => {
    expect(casarEscopos("tra").map((e) => e.id)).toEqual(["transacoes"])
    expect(casarEscopos("TRANSAÇ").map((e) => e.id)).toEqual(["transacoes"])
    expect(casarEscopos("gas").map((e) => e.id)).toEqual(["transacoes"])
    expect(casarEscopos("ca").map((e) => e.id)).toEqual(["cartoes", "categorias", "carteiras"])
    expect(casarEscopos("xyz")).toEqual([])
  })
})

describe("escopoExato", () => {
  it("casa o comando ou o alias inteiro", () => {
    expect(escopoExato("transações")?.id).toBe("transacoes")
    expect(escopoExato("boletos")?.id).toBe("contas")
    expect(escopoExato("tran")).toBeNull()
  })
})

it("ESCOPOS publica o comando com a barra", () => {
  expect(ESCOPOS.map((e) => e.comando)).toContain("/transacoes")
})
