import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { menuItemFadeClassName } from "@/lib/menu-classes"

describe("a linha de lista acende como o link do catálogo", () => {
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
            const src = lerFonte(caminho)
            expect(src, `${caminho} sem o esmaecer`).toContain("menuItemFadeClassName,")
            // As duas tentativas recusadas não voltam por acidente.
            expect(src).not.toContain("useListHighlight")
            expect(src).not.toContain("followPointerFill")
        }
    })
})
