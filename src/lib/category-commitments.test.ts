import { describe, expect, it } from "vitest"
import { buildCategoryCommitmentsForMonth } from "./category-commitments"

const creditCards = [{ id: "card", closing_day: 28 }]

describe("buildCategoryCommitmentsForMonth", () => {
    it("sums posted expenses by category within the month", () => {
        const res = buildCategoryCommitmentsForMonth({
            yearMonth: "2026-05",
            transactions: [
                {
                    type: "expense",
                    amount: 10,
                    date: "2026-05-02T12:00:00.000Z",
                    category_id: "c1",
                    subscription_id: null,
                    installment_plan_id: null,
                    installment_sequence: null,
                    payment_method: "pix",
                    payment_credit_card_id: null,
                },
                {
                    type: "expense",
                    amount: 20,
                    date: "2026-05-10T12:00:00.000Z",
                    category_id: "c1",
                    subscription_id: null,
                    installment_plan_id: null,
                    installment_sequence: null,
                    payment_method: "debit_card",
                    payment_credit_card_id: null,
                },
                {
                    type: "expense",
                    amount: 50,
                    date: "2026-04-30T12:00:00.000Z",
                    category_id: "c1",
                    subscription_id: null,
                    installment_plan_id: null,
                    installment_sequence: null,
                    payment_method: "pix",
                    payment_credit_card_id: null,
                },
                {
                    type: "income",
                    amount: 999,
                    date: "2026-05-05T12:00:00.000Z",
                    category_id: "c1",
                    subscription_id: null,
                    installment_plan_id: null,
                    installment_sequence: null,
                    payment_method: null,
                    payment_credit_card_id: null,
                },
            ],
            installmentPlans: [],
            subscriptions: [],
            creditCards,
        })
        expect(res.c1?.postedTotal).toBe(30)
        expect(res.c1?.committedTotal).toBe(30)
    })

    it("assigns credit card purchase on May 29 to June gastos when closing day is 28", () => {
        const res = buildCategoryCommitmentsForMonth({
            yearMonth: "2026-06",
            transactions: [
                {
                    type: "expense",
                    amount: 100,
                    date: "2026-05-29T12:00:00.000Z",
                    category_id: "c1",
                    subscription_id: null,
                    installment_plan_id: null,
                    installment_sequence: null,
                    payment_method: "credit_card",
                    payment_credit_card_id: "card",
                },
            ],
            installmentPlans: [],
            subscriptions: [],
            creditCards,
        })
        expect(res.c1?.postedTotal).toBe(100)
    })

    it("adds projected installment charges for the month when not posted", () => {
        const res = buildCategoryCommitmentsForMonth({
            yearMonth: "2026-05",
            transactions: [],
            installmentPlans: [
                {
                    id: "p1",
                    workspace_id: "w",
                    user_id: "u",
                    category_id: "c1",
                    description: "Compra X",
                    payment_method: "credit_card",
                    payment_credit_card_id: "card",
                    total_installments: 3,
                    generated_count: 0,
                    installment_amount: 100,
                    final_installment_amount: 100,
                    next_billing_date: "2026-05-10",
                    is_active: true,
                    created_at: "",
                    updated_at: "",
                },
            ],
            subscriptions: [],
            creditCards,
        })
        expect(res.c1?.postedTotal).toBe(0)
        expect(res.c1?.projectedInstallmentsTotal).toBe(100)
        expect(res.c1?.committedTotal).toBe(100)
    })

    it("does not double-count projected installments when a posted installment transaction exists", () => {
        const res = buildCategoryCommitmentsForMonth({
            yearMonth: "2026-05",
            transactions: [
                {
                    type: "expense",
                    amount: 100,
                    date: "2026-05-10T12:00:00.000Z",
                    category_id: "c1",
                    subscription_id: null,
                    installment_plan_id: "p1",
                    installment_sequence: 1,
                    payment_method: "credit_card",
                    payment_credit_card_id: "card",
                },
            ],
            installmentPlans: [
                {
                    id: "p1",
                    workspace_id: "w",
                    user_id: "u",
                    category_id: "c1",
                    description: "Compra X",
                    payment_method: "credit_card",
                    payment_credit_card_id: "card",
                    total_installments: 3,
                    generated_count: 0,
                    installment_amount: 100,
                    final_installment_amount: 100,
                    next_billing_date: "2026-05-10",
                    is_active: true,
                    created_at: "",
                    updated_at: "",
                },
            ],
            subscriptions: [],
            creditCards,
        })
        expect(res.c1?.postedTotal).toBe(100)
        expect(res.c1?.projectedInstallmentsTotal).toBe(0)
        expect(res.c1?.committedTotal).toBe(100)
    })

    it("adds projected subscription charges for the month when not posted", () => {
        const res = buildCategoryCommitmentsForMonth({
            yearMonth: "2026-05",
            transactions: [],
            installmentPlans: [],
            subscriptions: [
                {
                    id: "s1",
                    workspace_id: "w",
                    user_id: "u",
                    name: "Spotify",
                    amount: 39.9,
                    billing_interval: "monthly",
                    currency: "BRL",
                    start_date: "2026-01-01",
                    next_billing_date: "2026-05-12",
                    day_of_month: null,
                    category_id: "c1",
                    notes: null,
                    payment_method: "pix",
                    payment_credit_card_id: null,
                    is_active: true,
                    created_at: "",
                    updated_at: "",
                },
            ],
            creditCards,
        })
        expect(res.c1?.projectedSubscriptionsTotal).toBeCloseTo(39.9)
        expect(res.c1?.committedTotal).toBeCloseTo(39.9)
    })

    it("does not double-count projected subscriptions when a posted subscription transaction exists on same day", () => {
        const res = buildCategoryCommitmentsForMonth({
            yearMonth: "2026-05",
            transactions: [
                {
                    type: "expense",
                    amount: 39.9,
                    date: "2026-05-12T12:00:00.000Z",
                    category_id: "c1",
                    subscription_id: "s1",
                    installment_plan_id: null,
                    installment_sequence: null,
                    payment_method: "pix",
                    payment_credit_card_id: null,
                },
            ],
            installmentPlans: [],
            subscriptions: [
                {
                    id: "s1",
                    workspace_id: "w",
                    user_id: "u",
                    name: "Spotify",
                    amount: 39.9,
                    billing_interval: "monthly",
                    currency: "BRL",
                    start_date: "2026-01-01",
                    next_billing_date: "2026-05-12",
                    day_of_month: null,
                    category_id: "c1",
                    notes: null,
                    payment_method: "pix",
                    payment_credit_card_id: null,
                    is_active: true,
                    created_at: "",
                    updated_at: "",
                },
            ],
            creditCards,
        })
        expect(res.c1?.postedTotal).toBeCloseTo(39.9)
        expect(res.c1?.projectedSubscriptionsTotal).toBe(0)
        expect(res.c1?.committedTotal).toBeCloseTo(39.9)
    })
})

