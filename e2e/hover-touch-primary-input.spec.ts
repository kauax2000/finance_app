import { test, expect, devices } from "@playwright/test"

/**
 * On touch-primary viewports, `(hover: hover)` should be false so Tailwind's
 * hover variant (wrapped in @media (hover: hover)) does not apply — avoids
 * useless/sticky hover on phones. Public /login route only; no auth.
 *
 * Uses Pixel 5 (Chromium) so CI/agents without WebKit installed still run this.
 *
 * Local: if `next dev` is already bound, start Playwright with
 * `E2E_SKIP_WEBSERVER=1` and set `E2E_BASE_URL` to that server (default 3000).
 */
test.use(devices["Pixel 5"])

test("touch-primary viewport: hover media is none", async ({ page }) => {
    await page.goto("/login")
    const canPrimaryHover = await page.evaluate(() =>
        window.matchMedia("(hover: hover)").matches
    )
    expect(canPrimaryHover).toBe(false)
})
