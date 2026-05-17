import path from "node:path"
import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000"
const storageState = path.join(process.cwd(), "playwright", ".auth", "user.json")
const hasE2eCreds =
    Boolean(process.env.E2E_EMAIL?.trim()) &&
    Boolean(process.env.E2E_PASSWORD?.trim())

const projects = [
    {
        name: "chromium-smoke",
        testMatch: /(assinaturas|pwa)\.smoke\.spec\.ts/,
        use: { ...devices["Desktop Chrome"] },
    },
    {
        name: "mobile-hover-media",
        testMatch: /hover-touch-primary-input\.spec\.ts/,
        use: { ...devices["Pixel 5"] },
    },
]

if (hasE2eCreds) {
    projects.unshift({
        name: "setup",
        testMatch: /auth\.setup\.ts/,
        use: { ...devices["Desktop Chrome"] },
    })
    projects.push({
        name: "chromium-authenticated",
        testMatch: /\.authenticated\.spec\.ts$/,
        dependencies: ["setup"],
        use: {
            ...devices["Desktop Chrome"],
            storageState,
        },
    })
}

export default defineConfig({
    testDir: "e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "list",
    timeout: 60_000,
    use: {
        baseURL,
        trace: "on-first-retry",
    },
    projects,
    webServer: process.env.E2E_SKIP_WEBSERVER
        ? undefined
        : {
              command: "npm run dev",
              url: baseURL,
              reuseExistingServer: true,
              timeout: 120_000,
          },
})
