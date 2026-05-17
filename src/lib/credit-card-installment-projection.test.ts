import { describe, expect, it } from "vitest"
import {
    expandAllPlanCharges,
    expandRemainingInstallmentCharges,
    forecastCreditCardInstallmentsForWindow,
    isProjectedChargeAlreadyPosted,
    sumProjectedCreditCardInstallmentsInWindow,
    buildGlobalInstallmentDedupeKeys,
} from "./credit-card-installment-projection"
import { localNoonDate } from "./credit-card-billing"
import type { WorkspaceInstallmentPlan } from "./supabase"

function plan(p: Partial<WorkspaceInstallmentPlan>): WorkspaceInstallmentPlan {
    return {
        id: "p1",
        workspace_id: "w",
        user_id: "u",
        category_id: null,
        description: "Test",
        payment_method: "credit_card",
        payment_credit_card_id: "card-1",
        total_installments: 3,
        generated_count: 0,
        installment_amount: 100,
        final_installment_amount: 100,
        next_billing_date: "2026-05-10",
        is_active: true,
        created_at: "",
        updated_at: "",
        ...p,
    }
}

describe("expandRemainingInstallmentCharges", () => {
    it("emits remaining charges with correct sequences", () => {
        const charges = expandRemainingInstallmentCharges(
            plan({
                total_installments: 3,
                generated_count: 1,
                next_billing_date: "2026-06-01",
            })
        )
        expect(charges).toHaveLength(2)
        expect(charges[0]?.installmentSequence).toBe(2)
        expect(charges[1]?.installmentSequence).toBe(3)
        expect(charges[1]?.amount).toBe(100)
    })
})

describe("expandAllPlanCharges", () => {
    it("reconstructs the full schedule anchored by next_billing_date - generated_count months", () => {
        const charges = expandAllPlanCharges(
            plan({
                total_installments: 4,
                generated_count: 2,
                next_billing_date: "2026-06-20",
                installment_amount: 10,
                final_installment_amount: 25,
            })
        )
        expect(charges).toHaveLength(4)
        expect(charges[0]?.installmentSequence).toBe(1)
        expect(charges[0]?.chargeDate.getMonth()).toBe(3) // Apr
        expect(charges[0]?.chargeDate.getDate()).toBe(20)
        expect(charges[3]?.installmentSequence).toBe(4)
        expect(charges[3]?.amount).toBe(25)
    })
})

describe("forecastCreditCardInstallmentsForWindow", () => {
    it("backfills missing past charges and dedupes posted sequence", () => {
        const winStart = localNoonDate(2026, 3, 11) // Apr 11
        const winEnd = localNoonDate(2026, 4, 10) // May 10
        const plans = [
            plan({
                id: "p-backfill",
                payment_credit_card_id: "c1",
                total_installments: 4,
                generated_count: 2,
                next_billing_date: "2026-06-20", // schedule: Apr20, May20, Jun20, Jul20
                installment_amount: 10,
                final_installment_amount: 10,
            }),
        ]
        const { projectedTotal, projectedRows } =
            forecastCreditCardInstallmentsForWindow("c1", winStart, winEnd, plans, [
                {
                    type: "expense",
                    date: "2026-05-20T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: "p-backfill",
                    installment_sequence: 2,
                },
            ])
        // Apr20 (seq1) is in window and missing; May20 (seq2) is posted => deduped.
        expect(projectedTotal).toBe(10)
        expect(projectedRows).toHaveLength(1)
        expect(projectedRows[0]?.installmentSequence).toBe(1)
    })
})

describe("sumProjectedCreditCardInstallmentsInWindow", () => {
    it("sums only charges in window and skips posted duplicates", () => {
        const start = localNoonDate(2026, 4, 11) // May 11
        const end = localNoonDate(2026, 5, 10) // Jun 10
        const plans = [
            plan({
                id: "plan-a",
                payment_credit_card_id: "c1",
                total_installments: 3,
                generated_count: 0,
                installment_amount: 40,
                final_installment_amount: 40,
                next_billing_date: "2026-05-20",
            }),
        ]
        const sum = sumProjectedCreditCardInstallmentsInWindow(
            "c1",
            start,
            end,
            plans,
            [
                {
                    type: "expense",
                    date: "2026-05-20T12:00:00.000Z",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c1",
                    installment_plan_id: "plan-a",
                    installment_sequence: 1,
                },
            ]
        )
        expect(sum).toBe(0)
    })
})

describe("buildGlobalInstallmentDedupeKeys / isProjectedChargeAlreadyPosted", () => {
    it("detects duplicate by sequence", () => {
        const dedupe = buildGlobalInstallmentDedupeKeys([
            {
                type: "expense",
                date: "2026-05-10T12:00:00.000Z",
                payment_method: "credit_card",
                payment_credit_card_id: "c1",
                installment_plan_id: "p1",
                installment_sequence: 2,
            },
        ])
        const charge = {
            planId: "p1",
            chargeDate: localNoonDate(2026, 4, 10),
            amount: 100,
            installmentSequence: 2,
        }
        expect(isProjectedChargeAlreadyPosted(charge, dedupe)).toBe(true)
    })
})
