import { describe, expect, it } from "vitest"
import {
    shouldNotifyMembersForTransaction,
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
