import { describe, expect, it } from "vitest"
import {
    buscaPronta,
    parseBuscaTransacoes as parse,
    verTodasHref,
} from "./transaction-search"

const hoje = new Date(2026, 9, 16)

describe("parseBuscaTransacoes", () => {
    it("texto puro", () => {
        expect(parse("mercado", hoje)).toEqual({ texto: "mercado", valor: null, periodo: null })
        expect(parse("  uber   eats ", hoje).texto).toBe("uber eats")
    })

    it("valor", () => {
        expect(parse("150", hoje).valor).toEqual({ min: 150, max: 151, exato: false })
        expect(parse("150,50", hoje).valor).toEqual({ min: 150.5, max: 150.5, exato: true })
        expect(parse("R$ 1.234,56", hoje).valor).toEqual({ min: 1234.56, max: 1234.56, exato: true })
        expect(parse("2026", hoje)).toMatchObject({ valor: { min: 2026, max: 2027, exato: false }, periodo: null })
    })

    it("mês, com ou sem acento e ano", () => {
        const marco = { de: "2026-03-01", ate: "2026-03-31" }
        expect(parse("março", hoje).periodo).toEqual(marco)
        expect(parse("marco", hoje).periodo).toEqual(marco)
        expect(parse("mar/26", hoje).periodo).toEqual(marco)
        expect(parse("dezembro", hoje).periodo).toEqual({ de: "2025-12-01", ate: "2025-12-31" })
        expect(parse("fev 2024", hoje).periodo).toEqual({ de: "2024-02-01", ate: "2024-02-29" })
        expect(parse("03/2025", hoje).periodo).toEqual({ de: "2025-03-01", ate: "2025-03-31" })
    })

    it("dia", () => {
        expect(parse("15/03", hoje).periodo).toEqual({ de: "2026-03-15", ate: "2026-03-15" })
        expect(parse("20/11", hoje).periodo).toEqual({ de: "2025-11-20", ate: "2025-11-20" })
        expect(parse("15/03/2025", hoje).periodo).toEqual({ de: "2025-03-15", ate: "2025-03-15" })
        expect(parse("31/02/2025", hoje).periodo).toBeNull()
    })

    it("junta texto, período e valor", () => {
        expect(parse("mercado março 150", hoje)).toMatchObject({
            texto: "mercado",
            valor: { min: 150 },
            periodo: { de: "2026-03-01" },
        })
    })
})

describe("buscaPronta", () => {
    it("pede 2+ letras, valor ou período", () => {
        expect(buscaPronta(parse("a", hoje))).toBe(false)
        expect(buscaPronta(parse("   ", hoje))).toBe(false)
        expect(buscaPronta(parse("R$", hoje))).toBe(false)
        expect(buscaPronta(parse("ub", hoje))).toBe(true)
        expect(buscaPronta(parse("9", hoje))).toBe(true)
    })
})

describe("verTodasHref", () => {
    it("só leva o que existe", () => {
        expect(verTodasHref(parse("mercado março 150", hoje))).toBe(
            "/transactions?q=mercado&from=2026-03-01&to=2026-03-31&min=150&max=150%2C99",
        )
        expect(verTodasHref(parse("150,50", hoje))).toBe("/transactions?min=150%2C50&max=150%2C50")
    })
})
