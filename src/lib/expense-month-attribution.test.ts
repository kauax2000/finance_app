import { describe, expect, it } from "vitest"
import {
    aggregateIncomeExpenseForMonth,
    buildCreditCardClosingLookup,
    expenseYearMonthKey,
    projectedChargeCountsInExpenseMonth,
    transactionCountsInExpenseMonth,
} from "./expense-month-attribution"

const lookup = buildCreditCardClosingLookup([{ id: "card1", closing_day: 28 }])

describe("expenseYearMonthKey", () => {
    it("assigns credit card purchase on May 29 to June when closing day is 28", () => {
        const key = expenseYearMonthKey(
            {
                type: "expense",
                date: "2026-05-29T12:00:00.000Z",
                payment_method: "credit_card",
                payment_credit_card_id: "card1",
            },
            lookup,
        )
        expect(key).toBe("2026-06")
    })

    it("assigns credit card purchase on May 28 to May (closes that day)", () => {
        const key = expenseYearMonthKey(
            {
                type: "expense",
                date: "2026-05-28T12:00:00.000Z",
                payment_method: "credit_card",
                payment_credit_card_id: "card1",
            },
            lookup,
        )
        expect(key).toBe("2026-05")
    })

    it("assigns PIX on May 29 to May", () => {
        const key = expenseYearMonthKey(
            {
                type: "expense",
                date: "2026-05-29T12:00:00.000Z",
                payment_method: "pix",
                payment_credit_card_id: null,
            },
            lookup,
        )
        expect(key).toBe("2026-05")
    })

    it("falls back to calendar month when card is missing from lookup", () => {
        const key = expenseYearMonthKey(
            {
                type: "expense",
                date: "2026-05-29T12:00:00.000Z",
                payment_method: "credit_card",
                payment_credit_card_id: "unknown",
            },
            lookup,
        )
        expect(key).toBe("2026-05")
    })
})

describe("transactionCountsInExpenseMonth", () => {
    it("counts income by calendar month", () => {
        expect(
            transactionCountsInExpenseMonth(
                {
                    type: "income",
                    date: "2026-05-29T12:00:00.000Z",
                    payment_method: null,
                    payment_credit_card_id: null,
                },
                "2026-05",
                lookup,
            ),
        ).toBe(true)
        expect(
            transactionCountsInExpenseMonth(
                {
                    type: "income",
                    date: "2026-05-29T12:00:00.000Z",
                    payment_method: null,
                    payment_credit_card_id: null,
                },
                "2026-06",
                lookup,
            ),
        ).toBe(false)
    })
})

describe("aggregateIncomeExpenseForMonth", () => {
    it("mixes CC billing month for expenses and calendar month for income", () => {
        const result = aggregateIncomeExpenseForMonth(
            [
                {
                    type: "expense",
                    amount: 100,
                    date: "2026-05-29T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "card1",
                },
                {
                    type: "expense",
                    amount: 50,
                    date: "2026-05-29T12:00:00.000Z",
                    payment_method: "pix",
                    payment_credit_card_id: null,
                },
                {
                    type: "income",
                    amount: 200,
                    date: "2026-06-01T12:00:00.000Z",
                    payment_method: null,
                    payment_credit_card_id: null,
                },
            ],
            "2026-06",
            lookup,
        )
        expect(result.expense).toBe(100)
        expect(result.income).toBe(200)
        expect(result.net).toBe(100)
    })
})

describe("projectedChargeCountsInExpenseMonth", () => {
    it("uses billing month for credit card installment charges", () => {
        const chargeDate = new Date(2026, 4, 29, 12, 0, 0, 0)
        expect(
            projectedChargeCountsInExpenseMonth(
                chargeDate,
                {
                    payment_method: "credit_card",
                    payment_credit_card_id: "card1",
                },
                "2026-06",
                lookup,
            ),
        ).toBe(true)
        expect(
            projectedChargeCountsInExpenseMonth(
                chargeDate,
                {
                    payment_method: "credit_card",
                    payment_credit_card_id: "card1",
                },
                "2026-05",
                lookup,
            ),
        ).toBe(false)
    })
})
