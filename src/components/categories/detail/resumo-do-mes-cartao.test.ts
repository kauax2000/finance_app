import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { ResumoDoMes } from "./resumo-do-mes"

type Props = Parameters<typeof ResumoDoMes>[0]

// O `Intl` escreve "R$ 1.500,00" com espaço não separável; o texto do teste usa o comum.
const texto = (props: Props) =>
    renderToStaticMarkup(h(ResumoDoMes, props))
        .replace(/<[^>]+>/g, "")
        .replace(/[  ]/g, " ")

const base = { tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-27", aberto: true } as const

describe("ResumoDoMes no telefone, num cartão", () => {
    it("sem limite: o peso dá nome à barra, o total ao lado, e o fechamento embaixo", () => {
        const t = texto({ ...base, lancado: 4114.39, previsto: 0, limite: null, pesoNoTotal: 0.26 })
        expect(t).toContain("26% do gasto da carteira")
        expect(t).toContain("de R$ 15.825")
        expect(t).toContain("Deve fechar em R$ 4.114")
        expect(t).toContain("nada mais previsto até o dia 30")
        expect(t).not.toContain("dia 27 de 30")
    })
    it("com limite: a frase do limite em cima, o dia, o fechamento e o peso", () => {
        const t = texto({ ...base, lancado: 1180, previsto: 260, limite: 1500, pesoNoTotal: 0.09 })
        expect(t).toContain("Sobra R$ 320,00 de R$ 1.500,00")
        expect(t).toContain("dia 27 de 30")
        expect(t).toContain("Deve fechar em R$ 1.440")
        expect(t).toContain("cabe no limite")
        expect(t).toContain("9% do gasto da carteira")
    })
    it("o previsto que passa do limite avisa", () => {
        const t = texto({ ...base, lancado: 1380, previsto: 260, limite: 1500, pesoNoTotal: 0.1 })
        expect(t).toContain("Com o previsto, passa R$ 140,00")
    })
    it("passou do limite: a frase forte é Passou", () => {
        expect(texto({ ...base, lancado: 1540, previsto: 0, limite: 1500, pesoNoTotal: 0.1 })).toContain(
            "Passou R$ 40,00 do limite de R$ 1.500,00"
        )
    })
    it("mês fechado: sem dia e sem Deve fechar", () => {
        const t = texto({ ...base, yearMonth: "2026-10", aberto: false, lancado: 3902.1, previsto: 0, limite: 1500, pesoNoTotal: 0.24 })
        expect(t).not.toContain("Deve fechar")
        expect(t).not.toMatch(/dia \d+ de \d+/)
    })
    it("receita fala da receita da carteira", () => {
        expect(texto({ ...base, tipo: "income", lancado: 500, previsto: 0, limite: null, pesoNoTotal: 0.1 })).toContain(
            "10% da receita da carteira"
        )
    })
    it("sem barra e sem fechamento, não desenha nada", () => {
        expect(
            renderToStaticMarkup(
                h(ResumoDoMes, { ...base, aberto: false, yearMonth: "2026-10", lancado: 0, previsto: 0, limite: null, pesoNoTotal: null })
            )
        ).toBe("")
    })
    it("o telefone monta um Card com o header no Progress", () => {
        const fonte = semComentarios(lerFonte("src/components/categories/detail/resumo-do-mes.tsx"))
        const telefone = fonte.slice(fonte.lastIndexOf("return ("))
        expect(telefone).toContain("<Card")
        expect(fonte).toContain("<ProgressHeader")
    })
})
