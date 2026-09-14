import { describe, expect, it } from "vitest"
import { currencyBRL, numberBR, signedCurrencyBRL } from "@/lib/formatters"

const nbsp = (s: string) => s.replace(/ /g, " ")

describe("formatters", () => {
    it("valor que arredonda a zero não ganha sinal", () => {
        expect(nbsp(signedCurrencyBRL(0.001))).toBe("R$ 0,00")
        expect(nbsp(signedCurrencyBRL(-0.004))).toBe("R$ 0,00")
        expect(nbsp(currencyBRL(-0.001))).toBe("R$ 0,00")
    })

    it("sinal continua valendo acima de meio centavo", () => {
        expect(nbsp(signedCurrencyBRL(0.005))).toBe("+R$ 0,01")
        expect(nbsp(signedCurrencyBRL(-12.5))).toBe("−R$ 12,50")
    })

    it("numberBR não escreve NaN", () => {
        expect(numberBR(Number.NaN)).toBe("—")
        expect(numberBR(1234.5)).toBe("1.234,5")
    })
})
