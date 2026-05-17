import { mkdir } from "node:fs/promises"
import path from "node:path"
import { test as setup } from "@playwright/test"

const storageState = path.join(
    process.cwd(),
    "playwright",
    ".auth",
    "user.json"
)

/**
 * Saves session cookies/localStorage for authenticated E2E.
 * Requires E2E_EMAIL and E2E_PASSWORD (same Supabase project as the dev server).
 */
setup("authenticate", async ({ page }) => {
    const email = process.env.E2E_EMAIL?.trim()
    const password = process.env.E2E_PASSWORD?.trim()
    if (!email || !password) {
        throw new Error(
            "E2E_EMAIL and E2E_PASSWORD must be set for the setup project (see package.json scripts)."
        )
    }

    await mkdir(path.dirname(storageState), { recursive: true })

    await page.goto("/login")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Entrar" }).click()
    await page.waitForURL((u) => !u.pathname.includes("/login"), {
        timeout: 60_000,
    })

    await page.context().storageState({ path: storageState })
})
