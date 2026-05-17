import { describe, expect, it } from "vitest"
import { isTransactionsSubscriptionBillingColumnsMissingError } from "./supabase-errors"

describe("isTransactionsSubscriptionBillingColumnsMissingError", () => {
    it("returns false for null and non-objects", () => {
        expect(isTransactionsSubscriptionBillingColumnsMissingError(null)).toBe(false)
        expect(isTransactionsSubscriptionBillingColumnsMissingError(undefined)).toBe(
            false
        )
        expect(isTransactionsSubscriptionBillingColumnsMissingError("x")).toBe(false)
    })

    it("returns true for Postgres undefined_column code 42703", () => {
        expect(
            isTransactionsSubscriptionBillingColumnsMissingError({
                code: "42703",
                message: "column transactions.subscription_id does not exist",
            })
        ).toBe(true)
    })

    it("returns true for PGRST204 when message mentions subscription_id", () => {
        expect(
            isTransactionsSubscriptionBillingColumnsMissingError({
                code: "PGRST204",
                message: "Could not find the 'subscription_id' column of 'transactions'",
            })
        ).toBe(true)
    })

    it("returns true for PGRST204 when details mention installment_plan_id", () => {
        expect(
            isTransactionsSubscriptionBillingColumnsMissingError({
                code: "PGRST204",
                message: "Bad Request",
                details: "installment_plan_id not found",
            })
        ).toBe(true)
    })

    it("returns false for PGRST204 without billing column hints", () => {
        expect(
            isTransactionsSubscriptionBillingColumnsMissingError({
                code: "PGRST204",
                message: "Could not find the 'foo' column of 'transactions'",
            })
        ).toBe(false)
    })

    it("returns true when message matches column does not exist for subscription_id", () => {
        expect(
            isTransactionsSubscriptionBillingColumnsMissingError({
                message:
                    "column transactions.subscription_id does not exist (42703)",
            })
        ).toBe(true)
    })

    it("returns false when column missing is unrelated", () => {
        expect(
            isTransactionsSubscriptionBillingColumnsMissingError({
                message: "column transactions.unknown_col does not exist",
            })
        ).toBe(false)
    })

    it("returns false for unrelated PostgREST errors", () => {
        expect(
            isTransactionsSubscriptionBillingColumnsMissingError({
                code: "PGRST205",
                message: "Could not find the table 'public.missing' in the schema cache",
            })
        ).toBe(false)
    })
})
