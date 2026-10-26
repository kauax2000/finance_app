import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", () => ({ default: (p: Record<string, unknown>) => h("a", p) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
const { ExpenseCategoryCard } = await import("./expense-category-card")

// O estorno no cartão maior que as compras deixa o gasto do mês negativo.
function cartao(p: { spent: number; previousSpent: number; limit: number }) {
    return renderToStaticMarkup(
        h(ExpenseCategoryCard, {
            category: { id: "mercado", name: "Mercado", icon: null, color: null },
            posted: p.spent,
            projectedInstallments: 0,
            projectedSubscriptions: 0,
            totalMonthSpend: 400,
            spendRank: 2,
            categoriesWithPositiveSpend: 2,
            href: "/categories/mercado",
            ...p,
        }),
    )
}

describe("ExpenseCategoryCard com o gasto negativo", () => {
    it("nenhum percentual sai negativo nem passa de −100%", () => {
        for (const html of [
            cartao({ spent: -30, previousSpent: 100, limit: 500 }),
            cartao({ spent: -30, previousSpent: 100, limit: 0 }),
        ]) {
            expect(html).not.toMatch(/-\d+%/)
            // Acima de 100% de queda: 101% a 199% e de 200% em diante.
            expect(html).not.toMatch(/−(1\d[1-9]|1[1-9]\d|[2-9]\d\d|\d{4,})%/)
            expect(html).toContain("0% das despesas do mês")
            expect(html).toContain("−100%")
        }
    })
})
