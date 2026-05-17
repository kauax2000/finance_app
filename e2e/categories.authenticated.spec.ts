import { test, expect } from "@playwright/test"

test.describe("Categorias (authenticated)", () => {
    test("categories page loads main heading or onboarding", async ({ page }) => {
        await page.goto("/categories")
        await expect(
            page.getByRole("heading", {
                name: /categorias|renda mensal|categorias e limites|confirmar|carregando sessão|carregando carteira|configurar categorias e orçamentos/i,
            }),
        ).toBeVisible({ timeout: 45_000 })
    })
})
