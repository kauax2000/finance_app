import { describe, expect, it } from "vitest"
import { PAYMENT_METHOD_VALUES, paymentMethodColor } from "./payment-methods"

describe("paymentMethodColor", () => {
    it("dá uma cor a cada forma e ao sem forma", () => {
        for (const m of [...PAYMENT_METHOD_VALUES, "sem-forma"] as const) {
            expect(paymentMethodColor(m)).toMatch(/^var\(--payment-[a-z]+\)$/)
        }
    })

    it("pinta cada forma com o próprio token", () => {
        expect(paymentMethodColor("credit_card")).toBe("var(--payment-credit)")
        expect(paymentMethodColor("debit_card")).toBe("var(--payment-debit)")
        expect(paymentMethodColor("pix")).toBe("var(--payment-pix)")
        expect(paymentMethodColor("cash")).toBe("var(--payment-cash)")
        expect(paymentMethodColor("ted")).toBe("var(--payment-ted)")
    })

    it("junta outro, sem forma e nulo no cinza", () => {
        for (const m of ["other", "sem-forma", null, undefined, "desconhecida"]) {
            expect(paymentMethodColor(m)).toBe("var(--payment-other)")
        }
    })
})
