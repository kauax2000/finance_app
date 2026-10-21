import { describe, expect, it } from "vitest"
import {
    shouldNotifyMembersForTransaction,
    triggerSkipReason,
    type TransactionNotifyRow,
} from "@/lib/transaction-notify-rules"

const baseTx: TransactionNotifyRow = {
    id: "tx-1",
    user_id: "user-a",
    workspace_id: "ws-1",
    type: "expense",
    amount: 42.5,
    description: "Mercado",
}

describe("shouldNotifyMembersForTransaction", () => {
    it("allows manual expense in shared workspace with 2+ members", () => {
        expect(
            shouldNotifyMembersForTransaction(baseTx, {
                type: "shared",
                member_count: 2,
            })
        ).toBe(true)
    })

    it("blocks income", () => {
        expect(
            shouldNotifyMembersForTransaction(
                { ...baseTx, type: "income" },
                { type: "shared", member_count: 2 }
            )
        ).toBe(false)
    })

    it("blocks subscription-generated expenses", () => {
        expect(
            shouldNotifyMembersForTransaction(
                { ...baseTx, subscription_id: "sub-1" },
                { type: "shared", member_count: 2 }
            )
        ).toBe(false)
    })

    it("blocks installment-generated expenses", () => {
        expect(
            shouldNotifyMembersForTransaction(
                { ...baseTx, installment_plan_id: "plan-1" },
                { type: "shared", member_count: 2 }
            )
        ).toBe(false)
    })

    it("blocks personal workspace", () => {
        expect(
            shouldNotifyMembersForTransaction(baseTx, {
                type: "personal",
                member_count: 1,
            })
        ).toBe(false)
    })

    it("blocks shared workspace with only one member", () => {
        expect(
            shouldNotifyMembersForTransaction(baseTx, {
                type: "shared",
                member_count: 1,
            })
        ).toBe(false)
    })

    it("blocks missing workspace", () => {
        expect(
            shouldNotifyMembersForTransaction(
                { ...baseTx, workspace_id: null },
                { type: "shared", member_count: 2 }
            )
        ).toBe(false)
    })
})

describe("triggerSkipReason", () => {
    const despesa = {
        type: "expense",
        subscription_id: null,
        installment_plan_id: null,
        import_batch_id: null,
    }

    it("passes a manual expense", () => {
        expect(triggerSkipReason(despesa)).toBeNull()
    })

    it("skips imported rows first", () => {
        expect(triggerSkipReason({ ...despesa, type: "income", import_batch_id: "batch-1" })).toBe("imported")
    })

    it("skips income", () => {
        expect(triggerSkipReason({ ...despesa, type: "income" })).toBe("not_expense")
    })

    it("skips subscription-generated expenses", () => {
        expect(triggerSkipReason({ ...despesa, subscription_id: "sub-1" })).toBe("subscription")
    })

    it("skips installment-generated expenses", () => {
        expect(triggerSkipReason({ ...despesa, installment_plan_id: "plan-1" })).toBe("installment")
    })
})
