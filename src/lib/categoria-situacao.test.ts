import { describe, expect, it } from "vitest"
import { currencyBRL } from "@/lib/formatters"
import { roundCents } from "@/lib/money-brl"
import {
  dividirDoMes,
  mediaDosMeses,
  ordenarCategorias,
  participacao,
  ritmoDoMes,
  rotuloDaVariacao,
  situacaoDaDespesa,
  variacaoDoMes,
} from "./categoria-situacao"

describe("variacaoDoMes", () => {
  it("sobe e desce com o percentual inteiro", () => {
    expect(variacaoDoMes(1200, 1000)).toEqual({ kind: "up", pct: 20 })
    expect(variacaoDoMes(800, 1000)).toEqual({ kind: "down", pct: 20 })
  })

  it("trata até 5% de diferença como estável", () => {
    expect(variacaoDoMes(1040, 1000)).toEqual({ kind: "flat" })
  })

  it("é novo quando o mês anterior não tem gasto", () => {
    expect(variacaoDoMes(300, 0)).toEqual({ kind: "novo" })
  })

  it("não tem variação quando os dois meses estão zerados", () => {
    expect(variacaoDoMes(0, 0)).toEqual({ kind: "nenhum" })
  })

  it("trata valor negativo como zero", () => {
    expect(variacaoDoMes(-50, 100)).toEqual({ kind: "down", pct: 100 })
  })
})

describe("rotuloDaVariacao", () => {
  const ym = "2026-10"

  it("monta o rótulo com o mês anterior abreviado", () => {
    expect(rotuloDaVariacao({ kind: "up", pct: 20 }, ym)).toBe("↑ 20% vs out.")
    expect(rotuloDaVariacao({ kind: "down", pct: 8 }, ym)).toBe("↓ 8% vs out.")
    expect(rotuloDaVariacao({ kind: "flat" }, ym)).toBe("= out.")
  })

  it("devolve novo ou nulo nos casos sem comparação", () => {
    expect(rotuloDaVariacao({ kind: "novo" }, ym)).toBe("novo")
    expect(rotuloDaVariacao({ kind: "nenhum" }, ym)).toBeNull()
  })
})

describe("ritmoDoMes", () => {
  it("no mês atual é o dia de hoje sobre os dias do mês", () => {
    expect(ritmoDoMes("2026-11", "2026-11-15")).toBe(50)
  })

  it("em mês passado é 100", () => {
    expect(ritmoDoMes("2026-10", "2026-11-15")).toBe(100)
  })

  it("em mês futuro não há ritmo", () => {
    expect(ritmoDoMes("2026-12", "2026-11-15")).toBeNull()
  })
})

describe("situacaoDaDespesa", () => {
  it("passa do limite com tom de perigo", () => {
    expect(situacaoDaDespesa({ total: 1752.78, limite: 1500, totalDoMes: 5000, ritmo: 60 })).toEqual({
      texto: `${currencyBRL(252.78)} acima do limite de ${currencyBRL(1500)}`,
      tom: "perigo",
    })
  })

  it("fica acima do ritmo com tom de aviso", () => {
    expect(situacaoDaDespesa({ total: 900, limite: 1000, totalDoMes: 5000, ritmo: 50 })).toEqual({
      texto: `Faltam ${currencyBRL(100)} de ${currencyBRL(1000)} · acima do ritmo`,
      tom: "aviso",
    })
  })

  it("fica no ritmo com tom neutro", () => {
    expect(situacaoDaDespesa({ total: 550, limite: 1000, totalDoMes: 5000, ritmo: 50 })).toEqual({
      texto: `Faltam ${currencyBRL(450)} de ${currencyBRL(1000)} · no ritmo`,
      tom: "neutro",
    })
  })

  it("sem ritmo mostra só o que falta", () => {
    expect(situacaoDaDespesa({ total: 550, limite: 1000, totalDoMes: 5000, ritmo: null })).toEqual({
      texto: `Faltam ${currencyBRL(450)} de ${currencyBRL(1000)}`,
      tom: "neutro",
    })
  })

  it("sem limite mostra a participação no mês", () => {
    expect(situacaoDaDespesa({ total: 500, limite: 0, totalDoMes: 2000, ritmo: 50 })).toEqual({
      texto: "25% das despesas do mês",
      tom: "neutro",
    })
  })

  it("trata total negativo como zero, sem NaN nem sinal", () => {
    expect(situacaoDaDespesa({ total: -30, limite: 0, totalDoMes: 0, ritmo: null })).toEqual({
      texto: "0% das despesas do mês",
      tom: "neutro",
    })
  })
})

describe("participacao", () => {
  it("com total do mês zero sai 0%", () => {
    expect(participacao(500, 0, "expense")).toBe("0% das despesas do mês")
  })

  it("valor negativo sai 0%", () => {
    expect(participacao(-20, 100, "expense")).toBe("0% das despesas do mês")
  })

  it("fala em receitas quando o tipo é receita", () => {
    expect(participacao(250, 1000, "income")).toBe("25% das receitas do mês")
  })
})

describe("mediaDosMeses", () => {
  it("conta os meses sem gasto como zero", () => {
    expect(mediaDosMeses([100, 0, 200, 0, 200])).toBe(100)
  })

  it("sem meses devolve zero", () => {
    expect(mediaDosMeses([])).toBe(0)
  })
})

describe("ordenarCategorias", () => {
  const itens = [
    { nome: "Banco", total: 100, anterior: 300 },
    { nome: "Água", total: 500, anterior: 450 },
    { nome: "Mercado", total: 300, anterior: 0 },
  ]

  it("maior gasto primeiro", () => {
    expect(ordenarCategorias(itens, "maior").map((i) => i.nome)).toEqual(["Água", "Mercado", "Banco"])
  })

  it("nome em português", () => {
    expect(ordenarCategorias(itens, "nome").map((i) => i.nome)).toEqual(["Água", "Banco", "Mercado"])
  })

  it("variação decrescente (total menos anterior, com sinal)", () => {
    // Mercado +300, Água +50, Banco -200
    expect(ordenarCategorias(itens, "variacao").map((i) => i.nome)).toEqual(["Mercado", "Água", "Banco"])
  })

  it("empate mantém a ordem de entrada", () => {
    const empatados = [
      { nome: "B", total: 100, anterior: 0 },
      { nome: "A", total: 100, anterior: 0 },
    ]
    expect(ordenarCategorias(empatados, "maior").map((i) => i.nome)).toEqual(["B", "A"])
  })

  it("invertida: o menor gasto primeiro, Z→A e quem mais caiu", () => {
    const nomes = (c: Parameters<typeof ordenarCategorias>[1]) =>
      ordenarCategorias(itens, c, true).map((i) => i.nome)
    expect(nomes("maior")).toEqual(["Banco", "Mercado", "Água"])
    expect(nomes("nome")).toEqual(["Mercado", "Banco", "Água"])
    expect(nomes("variacao")).toEqual(["Banco", "Água", "Mercado"])
  })

  it("invertida: o empate mantém a ordem de entrada", () => {
    const empatados = [
      { nome: "B", total: 100, anterior: 0 },
      { nome: "A", total: 100, anterior: 0 },
    ]
    expect(ordenarCategorias(empatados, "maior", true).map((i) => i.nome)).toEqual(["B", "A"])
  })
})

describe("dividirDoMes", () => {
  it("o resto de ponto flutuante, já em centavos, vai ao rodapé", () => {
    const sobra = roundCents(0.1 + 0.2 - 0.3)
    const r = dividirDoMes(
      [
        { nome: "Estornada", total: Math.max(0, sobra), anterior: 0 },
        { nome: "Mercado", total: 50, anterior: 0 },
      ],
      "maior",
    )
    expect(r.semMovimento.map((i) => i.nome)).toEqual(["Estornada"])
    expect(r.comMovimento.map((i) => i.nome)).toEqual(["Mercado"])
  })

  it("invertida: a grade vem do menor para o maior", () => {
    const r = dividirDoMes(
      [
        { nome: "A", total: 10, anterior: 0 },
        { nome: "B", total: 30, anterior: 0 },
        { nome: "C", total: 20, anterior: 0 },
      ],
      "maior",
      true,
    )
    expect(r.comMovimento.map((i) => i.nome)).toEqual(["A", "C", "B"])
  })

  it("sem arredondar, 5,55e-17 passaria na grade (o porquê do roundCents)", () => {
    expect(0.1 + 0.2 - 0.3).toBeGreaterThan(0)
    expect(roundCents(0.1 + 0.2 - 0.3)).toBe(0)
  })
})
