import { describe, expect, it } from "vitest"
import { faltaDepoisDaParcela } from "./transaction-installment"

describe("faltaDepoisDaParcela", () => {
    const plano = { total_installments: 3, installment_amount: 120, final_installment_amount: 120.5 }

    it("soma as parcelas que vêm depois, com a última no valor final", () => {
        expect(faltaDepoisDaParcela(plano, 1)).toBe(240.5)
        expect(faltaDepoisDaParcela(plano, 2)).toBe(120.5)
    })

    it("na última parcela (ou além) não falta nada", () => {
        expect(faltaDepoisDaParcela(plano, 3)).toBe(0)
        expect(faltaDepoisDaParcela(plano, 4)).toBe(0)
    })
})
