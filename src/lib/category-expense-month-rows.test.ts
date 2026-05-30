import { describe, expect, it } from "vitest"
import {
    buildCategoryEmbeddedExpenseRows,
    buildProjectedCategoryExpenseRows,
    mergeCategoryExpenseMonthRows,
} from "./category-expense-month-rows"

const creditCards = [{ id: "card1", closing_day: 28 }]

describe("category-expense-month-rows", () => {
    it("includes CC purchase in June when charge date is May 29", () => {
        const posted = [
            {
                id: "tx1",
                user_id: "u",
                workspace_id: "w",
                category_id: "c1",
                type: "expense" as const,
                amount: 100,
                description: "Loja",
                date: "2026-05-29T12:00:00.000Z",
                is_recurring: false,
                recurring_interval: null,
                payment_method: "credit_card" as const,
                payment_credit_card_id: "card1",
                installment_plan_id: null,
                installment_sequence: null,
                subscription_id: null,
                created_at: "",
                updated_at: "",
            },
        ]
        const merged = mergeCategoryExpenseMonthRows({
            posted,
            projected: [],
            yearMonth: "2026-06",
            creditCards,
            categoryType: "expense",
            filters: {
                filterType: "expense",
                filterCreditCardIds: [],
                filterPaymentMethods: [],
                filterAmountMin: "",
                filterAmountMax: "",
                filterDescriptionQuery: "",
                filterInstallmentsOnly: false,
                filterInstallmentPlanId: null,
                filterSubscriptionId: null,
            },
            sortKey: "date",
            sortDir: "desc",
        })
        expect(merged).toHaveLength(1)
        expect(merged[0]?.id).toBe("tx1")
    })


    it("excludes CC purchase from May when charge date is May 29", () => {
        const posted = [
            {
                id: "tx1",
                user_id: "u",
                workspace_id: "w",
                category_id: "c1",
                type: "expense" as const,
                amount: 100,
                description: "Yoga",
                date: "2026-05-29T12:00:00.000Z",
                is_recurring: false,
                recurring_interval: null,
                payment_method: "credit_card" as const,
                payment_credit_card_id: "card1",
                installment_plan_id: null,
                installment_sequence: null,
                subscription_id: null,
                created_at: "",
                updated_at: "",
            },
        ]
        const merged = mergeCategoryExpenseMonthRows({
            posted,
            projected: [],
            yearMonth: "2026-05",
            creditCards,
            categoryType: "expense",
            filters: {
                filterType: "expense",
                filterCreditCardIds: [],
                filterPaymentMethods: [],
                filterAmountMin: "",
                filterAmountMax: "",
                filterDescriptionQuery: "",
                filterInstallmentsOnly: false,
                filterInstallmentPlanId: null,
                filterSubscriptionId: null,
            },
            sortKey: "date",
            sortDir: "desc",
        })
        expect(merged).toHaveLength(0)
    })

    it("builds embedded expense rows from bundle posted without refiltering posted", () => {
        const posted = [
            {
                id: "tx1",
                user_id: "u",
                workspace_id: "w",
                category_id: "c1",
                type: "expense" as const,
                amount: 100,
                description: "Yoga",
                date: "2026-05-29T12:00:00.000Z",
                is_recurring: false,
                recurring_interval: null,
                payment_method: "credit_card" as const,
                payment_credit_card_id: "card1",
                installment_plan_id: null,
                installment_sequence: null,
                subscription_id: null,
                created_at: "",
                updated_at: "",
            },
        ]
        const rows = buildCategoryEmbeddedExpenseRows({
            category: {
                id: "c1",
                workspace_id: "w",
                user_id: "u",
                name: "Renata",
                type: "expense",
                color: "#000",
                icon: null,
                created_at: "",
                updated_at: "",
            },
            yearMonth: "2026-06",
            posted,
            installmentPlans: [],
            subscriptions: [],
            creditCards,
        })
        expect(rows).toHaveLength(1)
        expect(rows[0]?.id).toBe("tx1")
    })

    it("builds projected CC subscription row for June expense month", () => {
        const projected = buildProjectedCategoryExpenseRows({
            categoryId: "c1",
            yearMonth: "2026-06",
            installmentPlans: [],
            subscriptions: [
                {
                    id: "s1",
                    workspace_id: "w",
                    user_id: "u",
                    name: "Streaming",
                    amount: 49.9,
                    billing_interval: "monthly",
                    currency: "BRL",
                    start_date: "2026-01-01",
                    next_billing_date: "2026-05-29",
                    day_of_month: null,
                    category_id: "c1",
                    notes: null,
                    payment_method: "credit_card",
                    payment_credit_card_id: "card1",
                    is_active: true,
                    created_at: "",
                    updated_at: "",
                },
            ],
            postedTransactions: [],
            creditCards,
            categories: [
                {
                    id: "c1",
                    workspace_id: "w",
                    user_id: "u",
                    name: "Lazer",
                    type: "expense",
                    color: "#000",
                    icon: null,
                    created_at: "",
                    updated_at: "",
                },
            ],
        })
        expect(projected).toHaveLength(1)
        expect(projected[0]?.id).toContain("__projected:sub:s1:")
        expect(Number(projected[0]?.amount)).toBeCloseTo(49.9)
    })
})
