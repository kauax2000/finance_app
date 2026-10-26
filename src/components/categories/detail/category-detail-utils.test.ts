import { describe, expect, it } from "vitest"

// O defeito só aparece fora de UTC: a série montava a data em UTC e lia em hora local.
process.env.TZ = "America/Sao_Paulo"
const { buildMonthlySeries } = await import("./category-detail-utils")
const { formatYearMonthShortPtBr } = await import("@/lib/transaction-date")

describe("buildMonthlySeries", () => {
    it("termina no mês pedido, e não um mês antes, em São Paulo", () => {
        const series = buildMonthlySeries("2026-09", [], "cat", null, 3)
        expect(series.map((s) => s.name)).toEqual(
            ["2026-07", "2026-08", "2026-09"].map(formatYearMonthShortPtBr)
        )
    })

    it("soma a transação no mês dela", () => {
        const series = buildMonthlySeries(
            "2026-09",
            [{ date: "2026-09-10", amount: 42, type: "income", category_id: "cat", payment_method: null, payment_credit_card_id: null }],
            "cat",
            "income",
            2
        )
        expect(series.at(-1)?.total).toBe(42)
    })

    it("abate o estorno no cartão da categoria de despesa, no mês do fechamento", () => {
        const linha = (type: "income" | "expense", date: string, amount: number) => ({
            date,
            amount,
            type,
            category_id: "cat",
            payment_method: "credit_card" as const,
            payment_credit_card_id: "c1",
        })
        const series = buildMonthlySeries(
            "2026-09",
            [linha("expense", "2026-09-02T12:00:00.000Z", 100), linha("income", "2026-09-04T12:00:00.000Z", 30)],
            "cat",
            "expense",
            2,
            [{ id: "c1", closing_day: 20 }]
        )
        expect(series.at(-1)?.total).toBe(70)
    })
})
