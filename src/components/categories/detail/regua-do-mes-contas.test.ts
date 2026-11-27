import { describe, expect, it } from "vitest"
import { diaDoMes, escalaDaRegua, fraseDaComparacao, fraseDoFechamento, vereditoDaMedia } from "./regua-do-mes-contas"

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
            texto: "que no mesmo dia de outubro",
            anterior: "R$\u00a03.734",
        })
    })
    it("texto e anterior separam o chip do topo", () => {
        const f = fraseDaComparacao({ tipo: "expense", comparacao: comparacao() })!
        expect(f.texto).toBe("que no mesmo dia de outubro")
        expect(f.anterior.replace(/\u00a0/g, " ")).toBe("R$ 3.734")
        expect(f.resto.replace(/\u00a0/g, " ")).toBe("que no mesmo dia de outubro (R$ 3.734)")
        expect(fraseDaComparacao({ tipo: "expense", comparacao: comparacao({ mesmoPonto: false }) })!.texto).toBe("que em outubro")
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

describe("fraseDoFechamento", () => {
    const sp = (s: string) => s.replace(/\s/g, " ")
    it("soma o lançado e o previsto", () => {
        const f = fraseDoFechamento({ yearMonth: "2026-11", lancado: 1000, previsto: 500, limite: null })
        expect(sp(f.valor)).toBe("R$ 1.500")
        expect(f.fim).toEqual([])
    })
    it("sem previsto, diz até o último dia do mês", () => {
        expect(fraseDoFechamento({ yearMonth: "2026-11", lancado: 3062.54, previsto: 0, limite: null }).fim).toEqual([
            "nada mais previsto até o dia 30",
        ])
    })
    it("com limite, acima ou cabe", () => {
        expect(sp(fraseDoFechamento({ yearMonth: "2026-02", lancado: 900, previsto: 300, limite: 1000 }).fim.join())).toBe("R$ 200 acima do limite")
        expect(fraseDoFechamento({ yearMonth: "2026-02", lancado: 900, previsto: 0, limite: 1000 }).fim).toEqual([
            "nada mais previsto até o dia 28",
            "cabe no limite",
        ])
    })
})

describe("diaDoMes", () => {
    it("o dia de hoje contra os dias do mês", () => {
        expect(diaDoMes("2026-11", "2026-11-27")).toBe("dia 27 de 30")
        expect(diaDoMes("2026-02", "2026-02-03")).toBe("dia 3 de 28")
    })
})
