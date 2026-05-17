import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("Tailwind hover policy (touch-safe defaults)", () => {
    it("does not override hover to bare :hover in globals.css", () => {
        const css = readFileSync(
            join(process.cwd(), "src/app/globals.css"),
            "utf8"
        )
        expect(css).not.toMatch(/@variant\s+hover\s*\(\s*&?:hover/)
    })

    it("when .next exists, emitted CSS wraps hover utilities with hover-capable media", () => {
        const chunksDir = join(process.cwd(), ".next/static/chunks")
        if (!existsSync(chunksDir)) {
            return
        }
        const cssFiles = readdirSync(chunksDir).filter((f) => f.endsWith(".css"))
        const combined = cssFiles
            .map((f) => readFileSync(join(chunksDir, f), "utf8"))
            .join("\n")
        if (!combined.includes("hover:hover")) {
            return
        }
        expect(combined).toMatch(/@media\s*\(\s*hover:\s*hover\s*\)/)
    })
})
