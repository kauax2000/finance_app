import { describe, expect, it } from "vitest"
import { formatMoneyBrlInput, parseMoneyBrl } from "./money-brl"

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
