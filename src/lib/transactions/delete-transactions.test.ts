import { describe, expect, it } from "vitest"
import {
    hasInstallmentDeleteImpact,
    partitionTransactionDeletes,
} from "@/lib/transactions/delete-transactions"

describe("partitionTransactionDeletes", () => {
    it("routes installment rows to plan cascades and plain rows to single deletes", () => {
        const result = partitionTransactionDeletes([
            { id: "tx-1", installment_plan_id: "plan-a" },
            { id: "tx-2", installment_plan_id: "plan-a" },
            { id: "tx-3", installment_plan_id: null },
            { id: "tx-4", installment_plan_id: "plan-b" },
        ])

        expect(result.planIds).toEqual(["plan-a", "plan-b"])
        expect(result.plainTransactionIds).toEqual(["tx-3"])
    })

    it("dedupes multiple parcels from the same plan", () => {
        const result = partitionTransactionDeletes([
            { id: "tx-1", installment_plan_id: "plan-a" },
            { id: "tx-2", installment_plan_id: "plan-a" },
        ])

        expect(result.planIds).toEqual(["plan-a"])
        expect(result.plainTransactionIds).toEqual([])
    })

    it("keeps non-installment bulk deletes as plain transactions", () => {
        const result = partitionTransactionDeletes([
            { id: "tx-1", installment_plan_id: null },
            { id: "tx-2", installment_plan_id: null },
        ])

        expect(result.planIds).toEqual([])
        expect(result.plainTransactionIds).toEqual(["tx-1", "tx-2"])
    })
})

describe("hasInstallmentDeleteImpact", () => {
    it("returns true when any row belongs to a compra parcelada", () => {
        expect(
            hasInstallmentDeleteImpact([
                { installment_plan_id: null },
                { installment_plan_id: "plan-a" },
            ])
        ).toBe(true)
    })

    it("returns false for plain transaction deletes", () => {
        expect(
            hasInstallmentDeleteImpact([
                { installment_plan_id: null },
                { installment_plan_id: undefined },
            ])
        ).toBe(false)
    })
})
