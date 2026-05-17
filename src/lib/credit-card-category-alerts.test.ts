import { describe, expect, it } from "vitest"
import {
    categoryIdToKey,
    categoryKeyToId,
    parseLegacyLocalAlerts,
    rowToSpendAlert,
    UNCATEGORIZED_CATEGORY_KEY,
} from "./credit-card-category-alerts"

describe("categoryIdToKey / categoryKeyToId", () => {
    it("maps null to uncategorized sentinel", () => {
        expect(categoryIdToKey(null)).toBe(UNCATEGORIZED_CATEGORY_KEY)
    })

    it("maps uuid to itself", () => {
        const id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
        expect(categoryIdToKey(id)).toBe(id)
    })

    it("maps sentinel back to null", () => {
        expect(categoryKeyToId(UNCATEGORIZED_CATEGORY_KEY)).toBeNull()
    })

    it("maps uuid key to id", () => {
        const id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
        expect(categoryKeyToId(id)).toBe(id)
    })
})

describe("rowToSpendAlert", () => {
    it("parses numeric threshold string from Postgres", () => {
        const row = {
            id: "alert-1",
            workspace_id: "ws-1",
            credit_card_id: "cc-1",
            category_id: null,
            threshold_brl: "750.5",
            created_by: "user-1",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
        }
        expect(rowToSpendAlert(row)).toEqual({
            id: "alert-1",
            categoryKey: UNCATEGORIZED_CATEGORY_KEY,
            thresholdBrl: 750.5,
        })
    })
})

describe("parseLegacyLocalAlerts", () => {
    it("parses valid JSON array", () => {
        const raw = JSON.stringify([
            { categoryKey: "__none__", thresholdBrl: 100 },
            { categoryKey: "cat-1", thresholdBrl: 200 },
        ])
        expect(parseLegacyLocalAlerts(raw)).toEqual([
            { categoryKey: "__none__", thresholdBrl: 100 },
            { categoryKey: "cat-1", thresholdBrl: 200 },
        ])
    })

    it("returns empty on invalid JSON", () => {
        expect(parseLegacyLocalAlerts("{")).toEqual([])
    })
})
