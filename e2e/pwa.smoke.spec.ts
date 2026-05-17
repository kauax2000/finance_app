import { test, expect } from "@playwright/test"

test.describe("PWA smoke", () => {
    test("serves web app manifest", async ({ request }) => {
        const res = await request.get("/manifest.webmanifest")
        expect(res.ok()).toBeTruthy()
        const json = (await res.json()) as { name?: string; display?: string }
        expect(json.name).toBeTruthy()
        expect(json.display).toBe("standalone")
    })

    test("serves PWA icons", async ({ request }) => {
        const icon = await request.get("/icons/icon-192.png")
        expect(icon.ok()).toBeTruthy()
        expect(icon.headers()["content-type"]).toContain("image")
    })

    test("login page has viewport fit for iOS safe areas", async ({ page }) => {
        await page.goto("/login")
        const viewport = page.locator('meta[name="viewport"]')
        await expect(viewport).toHaveAttribute("content", /viewport-fit=cover/)
    })
})
