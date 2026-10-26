import { describe, expect, it } from "vitest"
import { tipoDaCategoria } from "@/components/transactions/transaction-form-types"

describe("tipoDaCategoria", () => {
    it("o estorno no cartão escolhe uma categoria de despesa", () => {
        expect(tipoDaCategoria("income", "c1")).toBe("expense")
    })

    it("fora do estorno, a categoria é do tipo do lançamento", () => {
        expect(tipoDaCategoria("income", null)).toBe("income")
        expect(tipoDaCategoria("expense", null)).toBe("expense")
        expect(tipoDaCategoria("expense", "c1")).toBe("expense")
    })
})
