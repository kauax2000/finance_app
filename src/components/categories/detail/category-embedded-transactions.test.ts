import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const src = semComentarios(lerFonte("src/components/categories/detail/category-embedded-transactions.tsx"))

describe("CategoryEmbeddedTransactions", () => {
    it("usa a TransacoesTabela e nenhuma peça antiga", () => {
        expect(src).toMatch(/<TransacoesTabela/)
        for (const velho of ["TransactionsTable", "TransactionsToolbar", "TransactionsActiveFiltersChips", "forma"])
            expect(src).not.toMatch(new RegExp(`\\b${velho}\\b`))
    })

    it("a barra fica à vista e o vazio do mês é do bloco", () => {
        expect(src).toMatch(/filtroNaBarra/)
        expect(src).toMatch(/semCategoria/)
        expect(src).toMatch(/Nenhum lançamento em/)
    })
})
