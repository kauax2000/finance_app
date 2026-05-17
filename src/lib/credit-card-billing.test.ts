import { describe, expect, it } from "vitest"
import type { WorkspaceInstallmentPlan } from "@/lib/supabase"
import {
    buildCardCycleSnapshot,
    classifyPurchaseVsToday,
    compareCalendarDates,
    creditCardInvoiceSlotLabelPt,
    cycleOffsetBoundsForCard,
    estimatedDueDateForClose,
    firstCloseOnOrAfter,
    invoiceWindowForPurchaseDate,
    localNoonDate,
    nextCloseAfter,
    previousStatementCloseBefore,
    shouldCountCreditCardExpenseForInvoiceSum,
    statementCloseInMonth,
    statementCloseOnOrBefore,
    statementCloseYmdForPurchaseDate,
    sumCreditCardExpensesInWindow,
} from "./credit-card-billing"

describe("statementCloseInMonth", () => {
    it("clamps day 31 to Feb 28 in non-leap year", () => {
        const c = statementCloseInMonth(2026, 1, 31) // February 2026
        expect(c.getFullYear()).toBe(2026)
        expect(c.getMonth()).toBe(1)
        expect(c.getDate()).toBe(28)
    })

    it("keeps day 31 in March", () => {
        const c = statementCloseInMonth(2026, 2, 31)
        expect(c.getDate()).toBe(31)
    })
})

describe("statementCloseOnOrBefore", () => {
    it("returns same month close when ref is after close", () => {
        const ref = localNoonDate(2026, 2, 15) // Mar 15
        const c = statementCloseOnOrBefore(ref, 10)
        expect(c.getMonth()).toBe(2)
        expect(c.getDate()).toBe(10)
    })

    it("returns previous month close when ref is before close in month", () => {
        const ref = localNoonDate(2026, 2, 5) // Mar 5, close 10
        const c = statementCloseOnOrBefore(ref, 10)
        expect(c.getMonth()).toBe(1)
        expect(c.getDate()).toBe(10)
    })
})

describe("firstCloseOnOrAfter / invoiceWindowForPurchaseDate", () => {
    it("purchase on close day belongs to cycle ending that day", () => {
        const p = localNoonDate(2026, 2, 10)
        const end = firstCloseOnOrAfter(p, 10)
        expect(end.getMonth()).toBe(2)
        expect(end.getDate()).toBe(10)
        const w = invoiceWindowForPurchaseDate(p, 10)
        expect(compareCalendarDates(w.end, end)).toBe(0)
        expect(compareCalendarDates(p, w.start)).toBeGreaterThanOrEqual(0)
        expect(compareCalendarDates(p, w.end)).toBeLessThanOrEqual(0)
    })

    it("purchase day after close starts new cycle", () => {
        const p = localNoonDate(2026, 2, 11)
        const w = invoiceWindowForPurchaseDate(p, 10)
        expect(w.end.getMonth()).toBe(3)
        expect(w.end.getDate()).toBe(10)
        expect(w.start.getMonth()).toBe(2)
        expect(w.start.getDate()).toBe(11)
    })
})

describe("statementCloseYmdForPurchaseDate", () => {
    it("returns close YMD matching invoice window end (closing 10)", () => {
        const iso = "2026-03-05T12:00:00.000Z"
        expect(statementCloseYmdForPurchaseDate(iso, 10)).toBe("2026-03-10")
    })

    it("returns next month close when purchase is after close day", () => {
        const iso = "2026-03-11T12:00:00.000Z"
        expect(statementCloseYmdForPurchaseDate(iso, 10)).toBe("2026-04-10")
    })
})

describe("classifyPurchaseVsToday", () => {
    const closing = 10
    // today = Mar 20, 2026 → lastClose Mar 10, next Apr 10, prev Feb 10
    const today = localNoonDate(2026, 2, 20)

    it("classifies open cycle", () => {
        expect(classifyPurchaseVsToday(localNoonDate(2026, 2, 15), closing, today)).toBe(
            "open"
        )
    })

    it("classifies last closed", () => {
        expect(classifyPurchaseVsToday(localNoonDate(2026, 2, 5), closing, today)).toBe(
            "last_closed"
        )
        expect(classifyPurchaseVsToday(localNoonDate(2026, 2, 10), closing, today)).toBe(
            "last_closed"
        )
    })

    it("classifies older", () => {
        expect(classifyPurchaseVsToday(localNoonDate(2026, 1, 5), closing, today)).toBe(
            "older"
        )
    })
})

describe("estimatedDueDateForClose", () => {
    it("due in month after close", () => {
        const close = localNoonDate(2026, 2, 10) // Mar 10
        const due = estimatedDueDateForClose(close, 15)
        expect(due.getFullYear()).toBe(2026)
        expect(due.getMonth()).toBe(3)
        expect(due.getDate()).toBe(15)
    })
})

describe("sumCreditCardExpensesInWindow", () => {
    const cardId = "card-1"
    const start = localNoonDate(2026, 1, 11)
    const end = localNoonDate(2026, 2, 10)

    it("excludes anchor installment row when parcel rows exist for the plan", () => {
        const planId = "plan-anchor"
        const wStart = localNoonDate(2026, 2, 11) // Mar 11
        const wEnd = localNoonDate(2026, 3, 10) // Apr 10
        const rows = [
            {
                type: "expense" as const,
                amount: 1200,
                date: "2026-03-12T12:00:00.000Z",
                payment_method: "credit_card" as const,
                payment_credit_card_id: cardId,
                installment_plan_id: planId,
                installment_sequence: null as number | null,
            },
            {
                type: "expense" as const,
                amount: 100,
                date: "2026-03-20T12:00:00.000Z",
                payment_method: "credit_card" as const,
                payment_credit_card_id: cardId,
                installment_plan_id: planId,
                installment_sequence: 1,
            },
        ]
        expect(
            shouldCountCreditCardExpenseForInvoiceSum(rows[0]!, cardId, rows)
        ).toBe(false)
        expect(
            shouldCountCreditCardExpenseForInvoiceSum(rows[1]!, cardId, rows)
        ).toBe(true)
        const sum = sumCreditCardExpensesInWindow(rows, cardId, wStart, wEnd)
        expect(sum).toBe(100)
    })

    it("sums only matching expenses", () => {
        const sum = sumCreditCardExpensesInWindow(
            [
                {
                    type: "expense",
                    amount: 100,
                    date: "2026-02-15T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: cardId,
                },
                {
                    type: "expense",
                    amount: 50,
                    date: "2026-04-05T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: cardId,
                },
                {
                    type: "income",
                    amount: 999,
                    date: "2026-02-20T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: cardId,
                },
                {
                    type: "expense",
                    amount: 77,
                    date: "2026-02-20T12:00:00.000Z",
                    payment_method: "pix",
                    payment_credit_card_id: null,
                },
            ],
            cardId,
            start,
            end
        )
        expect(sum).toBe(100)
    })
})

describe("buildCardCycleSnapshot", () => {
    it("computes open and last closed totals", () => {
        const today = localNoonDate(2026, 2, 20)
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const snap = buildCardCycleSnapshot(
            card,
            [
                {
                    type: "expense",
                    amount: 10,
                    date: "2026-03-15T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                },
                {
                    type: "expense",
                    amount: 20,
                    date: "2026-02-28T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                },
            ],
            today
        )
        expect(snap.openTotal).toBe(10)
        expect(snap.projectedOpenInstallmentsTotal).toBe(0)
        expect(snap.committedOpenTotal).toBe(10)
        expect(snap.lastClosedTotal).toBe(20)
        expect(snap.projectedLastClosedInstallmentsTotal).toBe(0)
        expect(snap.committedLastClosedTotal).toBe(20)
    })

    it("adds projected installment plan charges inside open window", () => {
        const today = localNoonDate(2026, 2, 20) // Mar 20
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const plans = [
            {
                id: "plan-1",
                workspace_id: "w",
                user_id: "u",
                category_id: null,
                description: "Compra X",
                payment_method: "credit_card" as const,
                payment_credit_card_id: "c1",
                total_installments: 6,
                generated_count: 0,
                installment_amount: 50,
                final_installment_amount: 50,
                next_billing_date: "2026-03-15",
                is_active: true,
                created_at: "",
                updated_at: "",
            },
        ]
        const snap = buildCardCycleSnapshot(
            card,
            [
                {
                    type: "expense",
                    amount: 10,
                    date: "2026-03-16T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: null,
                    installment_sequence: null,
                },
            ],
            today,
            { installmentPlans: plans }
        )
        expect(snap.openTotal).toBe(10)
        expect(snap.projectedOpenInstallmentsTotal).toBe(50)
        expect(snap.committedOpenTotal).toBe(60)
    })

    it("does not double-count posted installment rows", () => {
        const today = localNoonDate(2026, 2, 20)
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const plans = [
            {
                id: "plan-1",
                workspace_id: "w",
                user_id: "u",
                category_id: null,
                description: "Compra X",
                payment_method: "credit_card" as const,
                payment_credit_card_id: "c1",
                total_installments: 6,
                generated_count: 0,
                installment_amount: 50,
                final_installment_amount: 50,
                next_billing_date: "2026-03-15",
                is_active: true,
                created_at: "",
                updated_at: "",
            },
        ]
        const snap = buildCardCycleSnapshot(
            card,
            [
                {
                    type: "expense",
                    amount: 50,
                    date: "2026-03-15T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: "plan-1",
                    installment_sequence: 1,
                },
            ],
            today,
            { installmentPlans: plans }
        )
        expect(snap.openTotal).toBe(50)
        expect(snap.projectedOpenInstallmentsTotal).toBe(0)
        expect(snap.committedOpenTotal).toBe(50)
    })

    it("open vs last-closed: counts each parcel only in its billing window (no anchor)", () => {
        const today = localNoonDate(2026, 2, 20) // Mar 20 — open Mar 11–Apr 10, last closed Feb 11–Mar 10
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const snap = buildCardCycleSnapshot(
            card,
            [
                {
                    type: "expense",
                    amount: 100,
                    date: "2026-02-15T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: "plan-x",
                    installment_sequence: 1,
                },
                {
                    type: "expense",
                    amount: 100,
                    date: "2026-03-15T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: "plan-x",
                    installment_sequence: 2,
                },
            ],
            today
        )
        expect(snap.lastClosedTotal).toBe(100)
        expect(snap.openTotal).toBe(100)
    })

    it("does not double-count legacy anchor with parcel in the open window", () => {
        const today = localNoonDate(2026, 2, 20)
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const snap = buildCardCycleSnapshot(
            card,
            [
                {
                    type: "expense",
                    amount: 1200,
                    date: "2026-03-05T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: "plan-y",
                    installment_sequence: null,
                },
                {
                    type: "expense",
                    amount: 100,
                    date: "2026-03-15T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: "plan-y",
                    installment_sequence: 1,
                },
            ],
            today
        )
        expect(snap.openTotal).toBe(100)
    })

    it("backfills missing parcelas into last closed and open committed totals", () => {
        const today = localNoonDate(2026, 2, 20) // Mar 20
        const card = { id: "c1", closing_day: 10, due_day: 15 }
        const plans = [
            {
                id: "plan-bf",
                workspace_id: "w",
                user_id: "u",
                category_id: null,
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
        const snap = buildCardCycleSnapshot(card, [], today, { installmentPlans: plans })
        // last closed window: Feb11–Mar10 includes Feb15 (seq1)
        expect(snap.projectedLastClosedInstallmentsTotal).toBe(50)
        expect(snap.committedLastClosedTotal).toBe(50)
        // open window: Mar11–Apr10 includes Mar15 (seq2)
        expect(snap.projectedOpenInstallmentsTotal).toBe(50)
        expect(snap.committedOpenTotal).toBe(50)
    })
})

describe("cycleOffsetBoundsForCard", () => {
    const card = { id: "c1", closing_day: 10 }
    /** May 5, 2026 — open invoice closes May 10; previous closed invoice closes Apr 10. */
    const todayEarlyMay = localNoonDate(2026, 4, 5)

    it("allows offset -1 when oldest expense is in the prior cycle (e.g. April close)", () => {
        const bounds = cycleOffsetBoundsForCard(
            card,
            [
                {
                    type: "expense",
                    date: "2026-03-20T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                },
            ],
            [],
            todayEarlyMay
        )
        expect(bounds.min).toBe(-1)
        expect(bounds.max).toBe(1)
    })

    it("keeps min at 0 when oldest expense is already in the open invoice (closes nextClose)", () => {
        const bounds = cycleOffsetBoundsForCard(
            card,
            [
                {
                    type: "expense",
                    date: "2026-05-03T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                },
            ],
            [],
            todayEarlyMay
        )
        expect(bounds.min).toBe(0)
    })

    it("sets max to 0 when furthest projected charge falls in the open invoice close", () => {
        /** Single charge Apr 20 → statement close May 10 matches open invoice at todayEarlyMay. */
        const plan: WorkspaceInstallmentPlan = {
            id: "plan-1",
            workspace_id: "w",
            user_id: "u",
            category_id: null,
            description: "Parcela",
            payment_method: "credit_card",
            payment_credit_card_id: "c1",
            total_installments: 1,
            generated_count: 0,
            installment_amount: 50,
            final_installment_amount: 50,
            next_billing_date: "2026-04-20",
            is_active: true,
            created_at: "",
            updated_at: "",
        }
        const bounds = cycleOffsetBoundsForCard(card, [], [plan], todayEarlyMay)
        expect(bounds.max).toBe(0)
        expect(bounds.min).toBe(0)
    })

    it("sets max to 1 when furthest projected charge is in the next cycle after the open invoice", () => {
        const plan: WorkspaceInstallmentPlan = {
            id: "plan-2",
            workspace_id: "w",
            user_id: "u",
            category_id: null,
            description: "Parcela",
            payment_method: "credit_card",
            payment_credit_card_id: "c1",
            total_installments: 1,
            generated_count: 0,
            installment_amount: 100,
            final_installment_amount: 100,
            next_billing_date: "2026-05-20",
            is_active: true,
            created_at: "",
            updated_at: "",
        }
        const bounds = cycleOffsetBoundsForCard(card, [], [plan], todayEarlyMay)
        expect(bounds.max).toBe(1)
    })

    it("returns {0,0} when there is no expense and no installment plan for the card", () => {
        expect(
            cycleOffsetBoundsForCard(
                card,
                [
                    {
                        type: "expense",
                        date: "2026-05-01T12:00:00.000Z",
                        payment_method: "pix",
                        payment_credit_card_id: null,
                    },
                ],
                [],
                todayEarlyMay
            )
        ).toEqual({ min: 0, max: 0 })
    })
})

describe("creditCardInvoiceSlotLabelPt", () => {
    it("returns non-empty labels", () => {
        expect(creditCardInvoiceSlotLabelPt("open").length).toBeGreaterThan(0)
        expect(creditCardInvoiceSlotLabelPt("last_closed").length).toBeGreaterThan(0)
        expect(creditCardInvoiceSlotLabelPt("older").length).toBeGreaterThan(0)
    })
})

describe("nextCloseAfter", () => {
    it("returns strictly after ref", () => {
        const ref = localNoonDate(2026, 2, 10)
        const n = nextCloseAfter(ref, 10)
        expect(compareCalendarDates(n, ref)).toBeGreaterThan(0)
        expect(n.getMonth()).toBe(3)
        expect(n.getDate()).toBe(10)
    })
})

describe("previousStatementCloseBefore", () => {
    it("returns Feb 10 before Mar 10", () => {
        const mar10 = localNoonDate(2026, 2, 10)
        const p = previousStatementCloseBefore(mar10, 10)
        expect(p.getMonth()).toBe(1)
        expect(p.getDate()).toBe(10)
    })
})
