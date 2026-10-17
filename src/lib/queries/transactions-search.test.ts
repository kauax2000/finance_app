import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))
import { filtroOuTransacoes } from "@/lib/queries/use-transactions-search"
import { transactionsSearchKeys } from "@/lib/queries/keys"

describe("filtroOuTransacoes", () => {
    it("descrição, categoria e cartão viram um or= só", () => {
        expect(filtroOuTransacoes("mercado", [], [])).toBe(
            "description.ilike.%mercado%",
        )
        expect(filtroOuTransacoes("mercado", ["c1", "c2"], ["k1"])).toBe(
            "description.ilike.%mercado%,category_id.in.(c1,c2),payment_credit_card_id.in.(k1)",
        )
    })

    it("sem texto não há filtro", () => {
        expect(filtroOuTransacoes("", ["c1"], [])).toBeNull()
    })

    // entre aspas o PostgREST tira uma camada de barras (docs: url_grammar), então a do LIKE dobra
    it("% e _ escapados; vírgula, parênteses e aspas não quebram o or=", () => {
        expect(filtroOuTransacoes("50%", [], [])).toBe(
            'description.ilike."%50\\\\%%"',
        )
        expect(filtroOuTransacoes("a_b", [], [])).toBe(
            "description.ilike.%a\\_b%",
        )
        expect(filtroOuTransacoes("café (padaria), centro", [], [])).toBe(
            'description.ilike."%café (padaria), centro%"',
        )
        expect(filtroOuTransacoes('o "bom"', [], [])).toBe(
            'description.ilike."%o \\"bom\\"%"',
        )
    })
})

describe("transactionsSearchKeys", () => {
    const busca = { texto: "a", valor: null, periodo: null }
    it("a chave muda com a carteira e com o termo partido", () => {
        expect(transactionsSearchKeys.list("w1", busca, [], [])).not.toEqual(
            transactionsSearchKeys.list("w2", busca, [], []),
        )
        expect(transactionsSearchKeys.list("w1", busca, [], [])).not.toEqual(
            transactionsSearchKeys.list("w1", { ...busca, texto: "b" }, [], []),
        )
    })
})
