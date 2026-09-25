import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { menuItemFadeClassName } from "@/lib/menu-classes"

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")

describe("a linha de lista acende como o link do catálogo (rodada 137)", () => {
    it("esmaece a cor no ritmo do tertiary, sem disco e sem realce viajante", () => {
        expect(menuItemFadeClassName).toBe(
            "transition-colors duration-(--duration-slow) ease-(--ease-emphasized)"
        )
        for (const caminho of [
            "src/lib/menu-classes.ts",
            "src/components/ui/select.tsx",
            "src/components/ui/command.tsx",
            "src/components/ui/navigation-menu.tsx",
        ]) {
            const src = fonte(caminho)
            expect(src, `${caminho} sem o esmaecer`).toContain("menuItemFadeClassName,")
            // As duas tentativas recusadas não voltam por acidente.
            expect(src).not.toContain("useListHighlight")
            expect(src).not.toContain("followPointerFill")
        }
    })
})
