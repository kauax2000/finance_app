import { describe, expect, it, vi } from "vitest"

// O RPC v2 devolve o bundle inteiro; a atribuição ao mês é feita no cliente.
const linha = (type: "income" | "expense", date: string, amount: number) => ({
    id: `${type}-${date}`,
    type,
    date,
    amount,
    category_id: "mercado",
    payment_method: "credit_card",
    payment_credit_card_id: "c1",
})
const payload = {
    v: 2,
    category: { id: "mercado", type: "expense", name: "Mercado" },
    budget: null,
    txs_padded: [
        linha("expense", "2026-04-02T12:00:00.000Z", 100),
        linha("income", "2026-04-09T12:00:00.000Z", 30),
        linha("expense", "2026-05-02T12:00:00.000Z", 50),
        linha("income", "2026-05-03T12:00:00.000Z", 10),
    ],
    series_rows: [],
    workspace_padded_rows: [],
    installment_plans: [],
    subscriptions: [],
    credit_cards: [{ id: "c1", closing_day: 20 }],
}
vi.mock("@/lib/supabase", () => ({
    supabase: { rpc: vi.fn(() => Promise.resolve({ data: payload, error: null })) },
}))

const { fetchCategoryDetailBundle } = await import("@/lib/queries/fetch-category-detail-bundle")

describe("fetchCategoryDetailBundle e o estorno no cartão", () => {
    it("o mês anterior da categoria de despesa abate o estorno, e o do mês entra na lista", async () => {
        const b = await fetchCategoryDetailBundle({
            workspaceId: "w",
            userId: "u",
            categoryId: "mercado",
            yearMonth: "2026-05",
        })
        expect(b.prevMonthCategoryTotal).toBe(70)
        expect(b.txs.map((t) => [t.type, Number(t.amount)])).toEqual([
            ["expense", 50],
            ["income", 10],
        ])
    })
})
