import { describe, expect, it } from "vitest"
import { buildCardCycleSnapshot, localNoonDate } from "./credit-card-billing"
import { buildCreditCardInvoiceAnalytics } from "./credit-card-invoice-analytics"

describe("buildCreditCardInvoiceAnalytics (projected installments)", () => {
    it("includes projected parcelas in totals, slices and categories", () => {
        const today = localNoonDate(2026, 2, 20) // Mar 20
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const plans = [
            {
                id: "plan-bf",
                workspace_id: "w",
                user_id: "u",
                category_id: "cat-1",
                description: "Mesa Sala",
                payment_method: "credit_card" as const,
                payment_credit_card_id: "c1",
                total_installments: 3,
                generated_count: 2,
                installment_amount: 50,
                final_installment_amount: 50,
                next_billing_date: "2026-04-15", // schedule: Feb15, Mar15, Apr15
                is_active: true,
                created_at: "",
                updated_at: "",
            },
        ]
        const posted = [
            {
                id: "tx-1",
                type: "expense" as const,
                amount: 10,
                date: "2026-03-16T12:00:00.000Z",
                description: "Compra avulsa",
                payment_method: "credit_card" as const,
                payment_credit_card_id: "c1",
                installment_sequence: null as number | null,
                category_id: "cat-1" as string | null,
                subscription_id: null as string | null,
                installment_plan_id: null as string | null,
                category: { id: "cat-1", name: "Casa", color: null, icon: null },
            },
        ]
        const snap = buildCardCycleSnapshot(card, posted, today, { installmentPlans: plans })
        const analytics = buildCreditCardInvoiceAnalytics(
            snap,
            "c1",
            posted,
            plans
        )

        // Open window has posted 10 + projected seq2 (50) => 60.
        expect(snap.committedOpenTotal).toBe(60)
        expect(analytics.openTotal).toBe(60)
        expect(analytics.sliceOpen.installments_recurring).toBe(50)

        // Category aggregation includes the projected amount under same category id.
        const cat = analytics.categoryOpen.find((c) => c.categoryId === "cat-1")
        expect(cat?.total).toBe(60)
    })
})

describe("buildCreditCardInvoiceAnalytics (estorno)", () => {
    it("a lista traz o estorno, o total o abate e a categoria segue só com despesas", () => {
        const today = localNoonDate(2026, 2, 20) // Mar 20 → aberta 11/03 a 10/04
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const base = {
            description: null as string | null,
            payment_method: "credit_card" as const,
            payment_credit_card_id: "c1",
            installment_sequence: null as number | null,
            subscription_id: null as string | null,
            installment_plan_id: null as string | null,
            category_id: "cat-1" as string | null,
            category: { id: "cat-1", name: "Casa", color: null, icon: null },
        }
        const rows = [
            { ...base, id: "tx-1", type: "expense" as const, amount: 300, date: "2026-03-15T12:00:00.000Z" },
            { ...base, id: "tx-2", type: "income" as const, amount: 80, date: "2026-03-18T12:00:00.000Z" },
        ]
        const snap = buildCardCycleSnapshot(card, rows, today)
        const analytics = buildCreditCardInvoiceAnalytics(snap, "c1", rows, [])
        expect(analytics.openRows.map((r) => r.id).sort()).toEqual(["tx-1", "tx-2"])
        expect(analytics.openTotal).toBe(220)
        expect(analytics.categoryOpen).toEqual([
            expect.objectContaining({ categoryId: "cat-1", total: 300 }),
        ])
    })
})
