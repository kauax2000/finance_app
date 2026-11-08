import { describe, expect, it } from "vitest"
import { currencyBRL } from "@/lib/formatters"
import {
    acertoEhMeu,
    emCentavos,
    faltaParaFechar,
    lerParte,
    lerPeso,
    partesFecham,
    pesosDigitados,
    pessoasDoAcerto,
    sugestaoDeAcerto,
    textoDaFalta,
    textoDoSaldo,
} from "@/lib/divisao/partes"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

describe("partesFecham", () => {
    it("33,33 + 33,33 + 33,34 fecha 100,00; 33,33 × 3 não", () => {
        const p = (c: number[]) => c.map((centavos, i) => ({ user_id: `u${i}`, centavos }))
        expect(partesFecham(p([3333, 3333, 3334]), 10000)).toBe(true)
        expect(partesFecham(p([3333, 3333, 3333]), 10000)).toBe(false)
    })

    it("parte negativa, quebrada ou pessoa repetida não fecha", () => {
        expect(partesFecham([{ user_id: "a", centavos: 12000 }, { user_id: "b", centavos: -2000 }], 10000)).toBe(false)
        expect(partesFecham([{ user_id: "a", centavos: 5000.5 }, { user_id: "b", centavos: 4999.5 }], 10000)).toBe(false)
        expect(partesFecham([{ user_id: "a", centavos: 5000 }, { user_id: "a", centavos: 5000 }], 10000)).toBe(false)
        expect(partesFecham([], 0)).toBe(false)
    })

    it("emCentavos lê o numeric do banco sem arredondar errado", () => {
        expect(emCentavos(33.34)).toBe(3334)
        expect(emCentavos("0.1")).toBe(10)
    })
})

describe("textoDoSaldo", () => {
    it("os três sinais, para outra pessoa", () => {
        expect(textoDoSaldo(5000, "Ana", "eu", "ana")).toBe(`Ana tem a receber ${currencyBRL(50)}`)
        expect(textoDoSaldo(-3000, "Ana", "eu", "ana")).toBe(`Ana deve ${currencyBRL(30)}`)
        expect(textoDoSaldo(0, "Ana", "eu", "ana")).toBe("Ana está em dia")
    })

    it("quando é a própria pessoa, Você", () => {
        expect(textoDoSaldo(5000, "Ana", "ana", "ana")).toBe(`Você tem a receber ${currencyBRL(50)}`)
        expect(textoDoSaldo(-3000, "Ana", "ana", "ana")).toBe(`Você deve ${currencyBRL(30)}`)
        expect(textoDoSaldo(0, "Ana", "ana", "ana")).toBe("Você está em dia")
    })
})

describe("sugestaoDeAcerto", () => {
    it("[+50, −30, −20] dá dois pagamentos ao de +50", () => {
        const s = sugestaoDeAcerto([
            { user_id: "a", saldoCentavos: 5000 },
            { user_id: "b", saldoCentavos: -3000 },
            { user_id: "c", saldoCentavos: -2000 },
        ])
        expect(s).toEqual([
            { de: "b", para: "a", centavos: 3000 },
            { de: "c", para: "a", centavos: 2000 },
        ])
    })

    it("do maior para o maior, até zerar", () => {
        const s = sugestaoDeAcerto([
            { user_id: "a", saldoCentavos: 7000 },
            { user_id: "b", saldoCentavos: 1000 },
            { user_id: "c", saldoCentavos: -6000 },
            { user_id: "d", saldoCentavos: -2000 },
        ])
        expect(s).toEqual([
            { de: "c", para: "a", centavos: 6000 },
            { de: "d", para: "a", centavos: 1000 },
            { de: "d", para: "b", centavos: 1000 },
        ])
    })

    it("todos zerados, lista vazia", () => {
        expect(sugestaoDeAcerto([{ user_id: "a", saldoCentavos: 0 }, { user_id: "b", saldoCentavos: 0 }])).toEqual([])
        expect(sugestaoDeAcerto([])).toEqual([])
    })
})

describe("pesos digitados", () => {
    it("lerPeso aceita vírgula e recusa zero, negativo e texto", () => {
        expect(lerPeso("1")).toBe(1)
        expect(lerPeso("1,5")).toBe(1.5)
        expect(lerPeso("0")).toBeNull()
        expect(lerPeso("-1")).toBeNull()
        expect(lerPeso("abc")).toBeNull()
        expect(lerPeso("1,555")).toBeNull()
        expect(lerPeso("10000")).toBeNull()
    })

    it("pesosDigitados: todos valem ou nada", () => {
        expect(pesosDigitados({ a: "2", b: "1" })).toEqual([
            { user_id: "a", weight: 2 },
            { user_id: "b", weight: 1 },
        ])
        expect(pesosDigitados({ a: "2", b: "" })).toBeNull()
        expect(pesosDigitados({})).toBeNull()
    })
})

describe("os erros da divisão em português", () => {
    it("PARTES_NAO_FECHAM e os outros códigos novos", () => {
        const pt = (message: string) => formatSupabasePostgrestError({ message, code: "P0001" })
        expect(pt("PARTES_NAO_FECHAM")).toBe("As partes precisam somar o valor da despesa.")
        for (const c of ["PARTES_INVALIDAS", "PARTES_FORA_DA_DIVISAO", "PESOS_INVALIDOS", "PAGADOR_INVALIDO", "not a workspace adult"]) {
            expect(pt(c), c).toBeTruthy()
        }
    })
})

describe("Ruling 8: o acerto com quem saiu", () => {
    it("pessoasDoAcerto: os adultos e quem saiu mas está no saldo, cada ex-membro com um sufixo", () => {
        const adultos = [{ user_id: "aaaa-1", nome: "Ana" }]
        const saldos = [
            { user_id: "aaaa-1", saiu: false },
            { user_id: "b1b2-9", saiu: true },
            { user_id: "c3c4-9", saiu: true },
        ]
        expect(pessoasDoAcerto(adultos, saldos)).toEqual([
            { user_id: "aaaa-1", nome: "Ana" },
            { user_id: "b1b2-9", nome: "Ex-membro ·b1b2" },
            { user_id: "c3c4-9", nome: "Ex-membro ·c3c4" },
        ])
        expect(pessoasDoAcerto(adultos, [])).toEqual(adultos)
    })

    it("acertoEhMeu: quem grava é uma das duas partes", () => {
        expect(acertoEhMeu("eu", "eu", "ana")).toBe(true)
        expect(acertoEhMeu("eu", "ana", "eu")).toBe(true)
        expect(acertoEhMeu("eu", "ana", "bia")).toBe(false)
    })
})

describe("faltaParaFechar", () => {
    it("o que falta, o zero e os centavos sem erro de ponto flutuante", () => {
        expect(faltaParaFechar({ a: 50, b: 40 }, 100)).toBe(10)
        expect(faltaParaFechar({ a: 60, b: 40 }, 100)).toBe(0)
        expect(faltaParaFechar({ a: 33.33, b: 33.33, c: 33.34 }, 100)).toBe(0)
        expect(faltaParaFechar({ a: 70, b: 40 }, 100)).toBe(-10)
    })

    it("o texto diz faltam ou passam", () => {
        expect(textoDaFalta(12)).toBe(`Faltam ${currencyBRL(12)}`)
        expect(textoDaFalta(-3)).toBe(`Passam ${currencyBRL(3)}`)
        expect(textoDaFalta(0)).toBeNull()
    })
})

describe("lerParte", () => {
    it("vazio é zero; o que não se lê fica NaN e reprova o fechamento", () => {
        expect(lerParte("")).toBe(0)
        expect(lerParte("12,50")).toBe(12.5)
        expect(lerParte("abc")).toBeNaN()
        const partes = [
            { user_id: "a", centavos: emCentavos(lerParte("abc")) },
            { user_id: "b", centavos: emCentavos(lerParte("100,00")) },
        ]
        expect(partesFecham(partes, 10000)).toBe(false)
    })

    it("o detalhe lê as partes por ela, e só zera o NaN para o que falta", async () => {
        const { lerFonte, semComentarios } = await import("@/test/fonte")
        const f = semComentarios(lerFonte("src/components/transactions/partes-da-despesa.tsx"), "tudo")
        expect(f).toContain("lerParte(")
        expect(f).not.toMatch(/parseMoneyBrl\([^)]*\) \?\? 0/)
    })
})

describe("fonte do detalhe", () => {
    it("o detalhe usa as peças do DS, e não os wireframes de divisão e anexos", async () => {
        const { lerFonte, semComentarios } = await import("@/test/fonte")
        const f = semComentarios(lerFonte("src/components/transactions/transaction-detail-sheet.tsx"), "tudo")
        expect(f).not.toContain("PartesDaDespesaWireframe")
        expect(f).not.toContain("AnexosWireframe")
        expect(f).toContain("<PartesDaDespesa transaction={t} />")
        expect(f).toContain("<AnexosDoLancamento")
    })
})
