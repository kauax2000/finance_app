import { describe, expect, it } from "vitest"
import { buttonVariants } from "@/components/ui/button"

describe("iconMotion", () => {
    it("spin gira o ícone meia-volta na mola, no cursor e no toque", () => {
        const classes = buttonVariants({ iconMotion: "spin" })
        expect(classes).toContain("hover:[&_svg]:rotate-180")
        // O par de toque: `hover:` compila dentro de `(hover: hover)`.
        expect(classes).toContain("active:[&_svg]:rotate-180")
        expect(classes).toContain("[&_svg]:duration-(--duration-spring)")
        expect(classes).toContain("[&_svg]:ease-(--ease-spring)")
    })

    it("o padrão não gira nada", () => {
        expect(buttonVariants({})).not.toContain("rotate-180")
    })
})
