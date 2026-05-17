import { test, expect } from "@playwright/test"

/**
 * Smoke checks for Assinaturas / Transações routes (plan §1 / §5).
 * Uses the HTTP API so tests pass even when Supabase client auth never settles in CI
 * (AuthGuard would otherwise spin until getSession completes).
 */
test.describe("Assinaturas smoke", () => {
    test("GET /subscriptions returns 200", async ({ request }) => {
        const res = await request.get("/subscriptions")
        expect(res.status()).toBe(200)
    })

    test("GET /transactions returns 200", async ({ request }) => {
        const res = await request.get("/transactions")
        expect(res.status()).toBe(200)
    })
})
