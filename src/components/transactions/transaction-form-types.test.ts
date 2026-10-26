import { describe, expect, it } from "vitest"
import { categoriaForaDoTipo } from "@/components/transactions/transaction-form-types"
import { tipoDaCategoria } from "@/lib/expense-month-attribution"

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

describe("categoriaForaDoTipo", () => {
    const categorias = [
        { id: "mercado", type: "expense" as const },
        { id: "reembolso", type: "income" as const },
    ]

    it("o estorno com a categoria de receita (o antigo) está fora", () => {
        expect(categoriaForaDoTipo({ type: "income", estornoCartaoId: "c1", categoryId: "reembolso" }, categorias)).toBe(true)
        expect(categoriaForaDoTipo({ type: "income", estornoCartaoId: "c1", categoryId: "mercado" }, categorias)).toBe(false)
    })

    it("sem categoria, ou com uma que a lista não tem, não há o que tirar", () => {
        expect(categoriaForaDoTipo({ type: "income", estornoCartaoId: "c1", categoryId: "" }, categorias)).toBe(false)
        expect(categoriaForaDoTipo({ type: "income", estornoCartaoId: null, categoryId: "sumida" }, categorias)).toBe(false)
    })
})
