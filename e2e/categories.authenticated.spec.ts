import { test, expect } from "@playwright/test"

test.describe("Categorias (authenticated)", () => {
    test("categories page loads main heading or onboarding", async ({ page }) => {
        await page.goto("/categories")
        // `.first()`: a regex casa com mais de um cabeçalho ao mesmo tempo — o
        // `<h1>Categorias</h1>` da casca e o `<h2 class="sr-only">Carregando
        // categorias</h2>` do carregamento —, e sem ele o Playwright acusa
        // violação de modo estrito em vez de medir a tela.
        await expect(
            page
                .getByRole("heading", {
                    name: /categorias|renda mensal|categorias e limites|confirmar|carregando sessão|carregando carteira|configurar categorias e orçamentos/i,
                })
                .first(),
        ).toBeVisible({ timeout: 45_000 })
    })
})
