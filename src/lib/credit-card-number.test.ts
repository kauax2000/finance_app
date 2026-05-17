import { describe, expect, it } from "vitest"
import {
    CREDIT_CARD_BRAND_UNIDENTIFIED,
    brandForDigits,
    detectCreditCardBrand,
    extractLastFour,
    formatCardNumberGroups,
    isValidCardLength,
    normalizeCardDigits,
    passesLuhn,
    resolveCreditCardForSave,
} from "./credit-card-number"

describe("normalizeCardDigits", () => {
    it("strips non-digits and caps at 19", () => {
        expect(normalizeCardDigits("4111 1111 1111 1111")).toBe("4111111111111111")
        expect(normalizeCardDigits("1".repeat(25))).toHaveLength(19)
    })
})

describe("formatCardNumberGroups", () => {
    it("groups digits in fours", () => {
        expect(formatCardNumberGroups("4111111111111111")).toBe("4111 1111 1111 1111")
    })
})

describe("detectCreditCardBrand", () => {
    it("detects Visa", () => {
        expect(detectCreditCardBrand("4111111111111111")).toBe("Visa")
    })

    it("detects Mastercard (51-55)", () => {
        expect(detectCreditCardBrand("5105105105105100")).toBe("Mastercard")
    })

    it("detects Mastercard (2221-2720)", () => {
        expect(detectCreditCardBrand("2221000000000009")).toBe("Mastercard")
    })

    it("detects American Express", () => {
        expect(detectCreditCardBrand("378282246310005")).toBe("American Express")
    })

    it("detects Elo", () => {
        expect(detectCreditCardBrand("6363680000000006")).toBe("Elo")
    })

    it("detects Hipercard", () => {
        expect(detectCreditCardBrand("6062825624254001")).toBe("Hipercard")
    })

    it("detects Discover", () => {
        expect(detectCreditCardBrand("6011111111111117")).toBe("Discover")
    })

    it("detects Diners Club", () => {
        expect(detectCreditCardBrand("3056930009020004")).toBe("Diners Club")
    })

    it("returns null for unknown BIN", () => {
        expect(detectCreditCardBrand("9999999999999999")).toBeNull()
    })
})

describe("brandForDigits", () => {
    it("falls back to unidentified", () => {
        expect(brandForDigits("9999999999999999")).toBe(
            CREDIT_CARD_BRAND_UNIDENTIFIED
        )
    })
})

describe("resolveCreditCardForSave", () => {
    it("create requires valid length", () => {
        const r = resolveCreditCardForSave({ digits: "4111", mode: "create" })
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.message).toContain("número completo")
    })

    it("create extracts last four and brand", () => {
        const r = resolveCreditCardForSave({
            digits: "4111111111111111",
            mode: "create",
        })
        expect(r).toEqual({
            ok: true,
            lastFour: "1111",
            brand: "Visa",
        })
    })

    it("create uses unidentified brand when unknown", () => {
        const r = resolveCreditCardForSave({
            digits: "9999999999999999",
            mode: "create",
        })
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.lastFour).toBe("9999")
            expect(r.brand).toBe(CREDIT_CARD_BRAND_UNIDENTIFIED)
        }
    })

    it("edit with empty digits keeps existing", () => {
        const r = resolveCreditCardForSave({
            digits: "",
            mode: "edit",
            existing: { last_four: "4242", brand: "Visa" },
        })
        expect(r).toEqual({ ok: true, lastFour: "4242", brand: "Visa" })
    })

    it("edit with new digits re-parses", () => {
        const r = resolveCreditCardForSave({
            digits: "5105105105105100",
            mode: "edit",
            existing: { last_four: "4242", brand: "Visa" },
        })
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.lastFour).toBe("5100")
            expect(r.brand).toBe("Mastercard")
        }
    })
})

describe("passesLuhn", () => {
    it("validates known test PAN", () => {
        expect(passesLuhn("4111111111111111")).toBe(true)
    })

    it("rejects invalid checksum", () => {
        expect(passesLuhn("4111111111111112")).toBe(false)
    })
})

describe("extractLastFour", () => {
    it("returns last four digits", () => {
        expect(extractLastFour("4111111111111111")).toBe("1111")
    })
})

describe("isValidCardLength", () => {
    it("accepts 13-19 digits", () => {
        expect(isValidCardLength("4".repeat(13))).toBe(true)
        expect(isValidCardLength("4".repeat(19))).toBe(true)
        expect(isValidCardLength("4".repeat(12))).toBe(false)
    })
})
