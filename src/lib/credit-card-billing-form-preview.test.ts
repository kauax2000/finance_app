import { describe, expect, it } from "vitest"
import {
    computeBillingFormPreview,
    isValidBillingDay,
} from "./credit-card-billing-form-preview"
import { localNoonDate } from "./credit-card-billing"

describe("isValidBillingDay", () => {
    it("accepts 1–31", () => {
        expect(isValidBillingDay(1)).toBe(true)
        expect(isValidBillingDay(31)).toBe(true)
    })

    it("rejects out of range", () => {
        expect(isValidBillingDay(0)).toBe(false)
        expect(isValidBillingDay(32)).toBe(false)
        expect(isValidBillingDay(NaN)).toBe(false)
    })
})

describe("computeBillingFormPreview", () => {
    it("returns null for invalid days", () => {
        expect(computeBillingFormPreview(0, 15)).toBeNull()
        expect(computeBillingFormPreview(10, 0)).toBeNull()
    })

    it("computes close and due for purchase before close in month", () => {
        const ref = localNoonDate(2026, 2, 5) // Mar 5, close 10
        const preview = computeBillingFormPreview(10, 15, ref)
        expect(preview).not.toBeNull()
        expect(preview!.closeDate.getFullYear()).toBe(2026)
        expect(preview!.closeDate.getMonth()).toBe(2)
        expect(preview!.closeDate.getDate()).toBe(10)
        expect(preview!.dueDate.getMonth()).toBe(3)
        expect(preview!.dueDate.getDate()).toBe(15)
    })

    it("computes next cycle when purchase is after close day", () => {
        const ref = localNoonDate(2026, 2, 11) // Mar 11, close 10
        const preview = computeBillingFormPreview(10, 15, ref)
        expect(preview).not.toBeNull()
        expect(preview!.closeDate.getMonth()).toBe(3)
        expect(preview!.closeDate.getDate()).toBe(10)
    })
})
