import { describe, expect, it } from "vitest"
import { escalaDaRegua, fraseDaComparacao, vereditoDaMedia } from "./regua-do-mes-contas"

const comparacao = (over: Partial<Parameters<typeof fraseDaComparacao>[0]["comparacao"]> = {}) => ({
    mesAnterior: "2026-10",
    anterior: 3734,
    atual: 3062.54,
    variacao: (3062.54 - 3734) / 3734,
    mesmoPonto: true,
    ...over,
})

describe("escalaDaRegua", () => {
    it("cabe a média maior que o lançado, com folga", () => {
        const { max, marcador } = escalaDaRegua({ lancado: 1000, media: 2000, anterior: 500 })
        expect(max).toBeCloseTo(2300)
        expect(marcador).toBeCloseTo((2000 / 2300) * 100)
    })
    it("sem média não há traço", () => {
        expect(escalaDaRegua({ lancado: 100, media: null, anterior: 0 }).marcador).toBeNull()
        expect(escalaDaRegua({ lancado: 0, media: 0, anterior: 0 })).toEqual({ max: 1, marcador: null })
    })
})

describe("vereditoDaMedia", () => {
    it("acima, abaixo e na média", () => {
        expect(vereditoDaMedia(105, 100)).toBe("5% acima da sua média")
        expect(vereditoDaMedia(92, 100)).toBe("8% abaixo da sua média")
        expect(vereditoDaMedia(101, 100)).toBe("na sua média")
    })
    it("sem média, nada", () => {
        expect(vereditoDaMedia(100, 0)).toBeNull()
        expect(vereditoDaMedia(100, null)).toBeNull()
    })
})

describe("fraseDaComparacao", () => {
    it("despesa caindo é bom, no mesmo dia", () => {
        expect(fraseDaComparacao({ tipo: "expense", comparacao: comparacao() })).toEqual({
            seta: "↓",
            percentual: "18%",
            bom: true,
            resto: "que no mesmo dia de outubro (R$\u00a03.734)",
        })
    })
    it("receita caindo não é bom", () => {
        expect(fraseDaComparacao({ tipo: "income", comparacao: comparacao() })?.bom).toBe(false)
    })
    it("mês passado compara o mês inteiro", () => {
        expect(fraseDaComparacao({ tipo: "expense", comparacao: comparacao({ mesmoPonto: false }) })?.resto).toBe(
            "que em outubro (R$\u00a03.734)",
        )
    })
    it("sem mês anterior, sem frase", () => {
        expect(fraseDaComparacao({ tipo: "expense", comparacao: comparacao({ variacao: null }) })).toBeNull()
    })
})
