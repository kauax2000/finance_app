import { describe, expect, it } from "vitest"
import { formatMoneyBrlInput, normalizeMoneyBrlOnBlur, parseMoneyBrl, roundCents } from "./money-brl"

describe("parseMoneyBrl", () => {
    it("parses plain integers", () => {
        expect(parseMoneyBrl("3000")).toBe(3000)
        expect(parseMoneyBrl("0")).toBe(0)
    })

    it("parses thousands with dot grouping", () => {
        expect(parseMoneyBrl("3.000")).toBe(3000)
        expect(parseMoneyBrl("1.234.567")).toBe(1234567)
    })

    it("parses Brazilian decimal comma", () => {
        expect(parseMoneyBrl("1.234,56")).toBe(1234.56)
        expect(parseMoneyBrl("10,5")).toBe(10.5)
        expect(parseMoneyBrl("3,06")).toBe(3.06)
    })

    it("strips R$ and spaces", () => {
        expect(parseMoneyBrl("R$ 100,00")).toBe(100)
        expect(parseMoneyBrl("r$100,50")).toBe(100.5)
    })

    it("parses US-style decimal when no comma", () => {
        expect(parseMoneyBrl("12.50")).toBe(12.5)
        expect(parseMoneyBrl("0.99")).toBe(0.99)
    })

    it("returns null for invalid", () => {
        expect(parseMoneyBrl("")).toBeNull()
        expect(parseMoneyBrl("abc")).toBeNull()
        expect(parseMoneyBrl("1,2,3")).toBeNull()
    })
})

describe("formatMoneyBrlInput", () => {
    it("formats with pt-BR grouping and two decimals", () => {
        expect(formatMoneyBrlInput(3000)).toBe("3.000,00")
        expect(formatMoneyBrlInput(1234.56)).toBe("1.234,56")
        expect(formatMoneyBrlInput(3.06)).toBe("3,06")
    })

    it("returns empty for non-finite", () => {
        expect(formatMoneyBrlInput(Number.NaN)).toBe("")
    })
})

describe("normalizeMoneyBrlOnBlur", () => {
    it("lê valor posto por código como reais, e não como centavos", () => {
        expect(normalizeMoneyBrlOnBlur("250")).toBe("250,00")
        expect(normalizeMoneyBrlOnBlur("1299.9")).toBe("1.299,90")
        expect(normalizeMoneyBrlOnBlur("12,5")).toBe("12,50")
    })

    it("mantém o que já está na máscara", () => {
        expect(normalizeMoneyBrlOnBlur("10.000,00")).toBe("10.000,00")
        expect(normalizeMoneyBrlOnBlur("0,05")).toBe("0,05")
    })

    it("vazio continua vazio", () => {
        expect(normalizeMoneyBrlOnBlur("")).toBe("")
    })
})

describe("máscara lida como número", () => {
    // parseFloat(x.replace(",", ".")) dava 10 e 1,3 para estes dois.
    it("milhar com ponto e centavos com vírgula", () => {
        expect(parseMoneyBrl("10.000,00")).toBe(10000)
        expect(parseMoneyBrl("1.299,90")).toBe(1299.9)
    })
})

describe("roundCents", () => {
    it("tira o resto do ponto flutuante das somas", () => {
        expect(roundCents(0.1 + 0.2)).toBe(0.3)
        expect(roundCents(19.99 * 3)).toBe(59.97)
        expect(roundCents(-0.1 - 0.2)).toBe(-0.3)
    })
})
