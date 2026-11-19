import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { historicoPorCategoria } from "./use-serie-das-categorias"

const tx = (date: string, amount: number, type: "expense" | "income", category_id: string) => ({
    date,
    amount,
    type,
    category_id,
    payment_method: null,
    payment_credit_card_id: null,
})

describe("historicoPorCategoria", () => {
    it("devolve os 5 meses anteriores, do mais antigo ao mais novo, sem o mês da tela", () => {
        const h = historicoPorCategoria({
            ym: "2026-11",
            txs: [
                tx("2026-06-10T12:00:00.000Z", 100, "expense", "a"),
                tx("2026-10-03T12:00:00.000Z", 50, "expense", "a"),
                tx("2026-09-01T12:00:00.000Z", 300, "income", "r"),
                tx("2026-11-02T12:00:00.000Z", 999, "expense", "a"),
            ],
            creditCards: [],
            categorias: [
                { id: "a", type: "expense" },
                { id: "r", type: "income" },
            ],
        })
        expect(h.a).toEqual([100, 0, 0, 0, 50])
        expect(h.r).toEqual([0, 0, 0, 300, 0])
    })
})
