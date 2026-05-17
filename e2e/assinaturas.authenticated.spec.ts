import { test, expect } from "@playwright/test"

test.describe("Assinaturas (authenticated)", () => {
    test("subscriptions page shows workspace UI", async ({ page }) => {
        await page.goto("/subscriptions")
        await expect(
            page.getByRole("heading", { name: /assinaturas/i })
        ).toBeVisible({ timeout: 45_000 })
    })
})
