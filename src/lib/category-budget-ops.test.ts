import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))
import { buildBudgetRow } from "@/lib/category-budget-ops"

const base = {
    userId: "u1",
    workspaceId: "w1",
    categoryId: "c1",
    yearMonth: "2026-10",
    amount: 500,
}

describe("buildBudgetRow", () => {
    it("valor mudou: zera os três avisos para rearmar", () => {
        expect(buildBudgetRow({ ...base, previousAmount: 400 })).toMatchObject({
            threshold_80_sent_at: null,
            threshold_100_sent_at: null,
            threshold_over_sent_at: null,
        })
    })

    it("mesmo valor ou sem valor anterior: não mexe nos avisos", () => {
        for (const previousAmount of [500, undefined, null]) {
            const row = buildBudgetRow({ ...base, previousAmount })
            expect(row).not.toHaveProperty("threshold_80_sent_at")
            expect(row).not.toHaveProperty("threshold_100_sent_at")
            expect(row).not.toHaveProperty("threshold_over_sent_at")
        }
    })
})
