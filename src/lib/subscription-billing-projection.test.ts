import { describe, expect, it } from "vitest"
import {
    advanceBilling,
    expandSubscriptionChargesInYmdRange,
    rewindBilling,
} from "./subscription-billing-projection"
import type { WorkspaceSubscription } from "@/lib/supabase"
import { localYmdFromDate } from "@/lib/transaction-date"

function date(y: number, m0: number, d: number): Date {
    return new Date(y, m0, d, 12, 0, 0, 0)
}

function baseSubscription(
    overrides: Partial<WorkspaceSubscription> = {},
): WorkspaceSubscription {
    return {
        id: "sub-1",
        workspace_id: "ws-1",
        user_id: "user-1",
        name: "Plano bimestral",
        amount: 99.9,
        billing_interval: "bimonthly",
        currency: "BRL",
        start_date: "2026-01-01",
        next_billing_date: "2026-01-01",
        day_of_month: null,
        category_id: null,
        notes: null,
        payment_method: null,
        payment_credit_card_id: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        ...overrides,
    }
}

describe("advanceBilling / rewindBilling (bimonthly)", () => {
    it("advances by 2 months", () => {
        const d = date(2026, 0, 15)
        const next = advanceBilling(d, "bimonthly")
        expect(localYmdFromDate(next)).toBe("2026-03-15")
    })

    it("rewinds by 2 months", () => {
        const d = date(2026, 2, 15)
        const prev = rewindBilling(d, "bimonthly")
        expect(localYmdFromDate(prev)).toBe("2026-01-15")
    })

    it("clamps end-of-month when advancing", () => {
        const d = date(2026, 0, 31)
        const next = advanceBilling(d, "bimonthly")
        expect(localYmdFromDate(next)).toBe("2026-03-31")
    })
})

describe("expandSubscriptionChargesInYmdRange (bimonthly)", () => {
    it("projects charges every 2 months within range", () => {
        const sub = baseSubscription()
        const charges = expandSubscriptionChargesInYmdRange(
            sub,
            "2026-01-01",
            "2026-06-30",
        )
        expect(charges.map((c) => c.chargeYmd)).toEqual([
            "2026-01-01",
            "2026-03-01",
            "2026-05-01",
        ])
    })

    it("returns empty for inactive subscription", () => {
        const sub = baseSubscription({ is_active: false })
        const charges = expandSubscriptionChargesInYmdRange(
            sub,
            "2026-01-01",
            "2026-06-30",
        )
        expect(charges).toEqual([])
    })
})
