import { describe, expect, it } from "vitest"
import {
    buildPaymentEventsForMonth,
    paymentEventHasMetaBadge,
} from "./payment-events"
import type { CreditCard, Transaction, WorkspaceInstallmentPlan } from "@/lib/supabase"

describe("buildPaymentEventsForMonth installments", () => {
    it("omits synthetic installment when matching transaction already exists", () => {
        const plan: WorkspaceInstallmentPlan = {
            id: "plan-1",
            workspace_id: "w",
            user_id: "u",
            category_id: null,
            description: "Loja",
            payment_method: "credit_card",
            payment_credit_card_id: "card-1",
            total_installments: 12,
            generated_count: 0,
            installment_amount: 80,
            final_installment_amount: 80,
            next_billing_date: "2026-05-05",
            is_active: true,
            created_at: "",
            updated_at: "",
        }
        const tx: Transaction = {
            id: "tx-1",
            user_id: "u",
            workspace_id: "w",
            category_id: null,
            type: "expense",
            amount: 80,
            description: "Loja (1/12)",
            date: "2026-05-05T12:00:00.000Z",
            is_recurring: false,
            recurring_interval: null,
            payment_method: "credit_card",
            payment_credit_card_id: "card-1",
            installment_plan_id: "plan-1",
            installment_sequence: 1,
            created_at: "",
            updated_at: "",
        }
        const events = buildPaymentEventsForMonth("2026-05", {
            todayYmd: "2026-05-04",
            subscriptions: [],
            installmentPlans: [plan],
            creditCards: [] as CreditCard[],
            transactions: [tx],
        })
        const installmentKinds = events.filter((e) => e.kind === "installment")
        expect(installmentKinds).toHaveLength(0)
        const posted = events.filter((e) => e.kind === "posted_expense")
        expect(posted.some((e) => e.id === "tx-tx-1")).toBe(true)
        const postedTx = posted.find((e) => e.id === "tx-tx-1")
        expect(postedTx?.transactionId).toBe("tx-1")
        expect(postedTx?.installmentPlanId).toBe("plan-1")
        expect(
            paymentEventHasMetaBadge({
                kind: "posted_expense",
                installmentPlanId: postedTx?.installmentPlanId,
            }),
        ).toBe(true)
    })

    it("emits installment event when no transaction covers that charge", () => {
        const plan: WorkspaceInstallmentPlan = {
            id: "plan-2",
            workspace_id: "w",
            user_id: "u",
            category_id: null,
            description: "Outra",
            payment_method: "credit_card",
            payment_credit_card_id: "card-1",
            total_installments: 6,
            generated_count: 0,
            installment_amount: 50,
            final_installment_amount: 50,
            next_billing_date: "2026-05-12",
            is_active: true,
            created_at: "",
            updated_at: "",
        }
        const events = buildPaymentEventsForMonth("2026-05", {
            todayYmd: "2026-05-04",
            subscriptions: [],
            installmentPlans: [plan],
            creditCards: [] as CreditCard[],
            transactions: [],
        })
        const installmentKinds = events.filter((e) => e.kind === "installment")
        expect(installmentKinds).toHaveLength(1)
        expect(installmentKinds[0]?.amount).toBe(50)
    })
})
