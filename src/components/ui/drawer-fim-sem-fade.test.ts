import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("gaveta de baixo sem dissolução no pé", () => {
    it("a gaveta que encosta no fim da tela zera a rampa de baixo do corpo e do meio", () => {
        const fonte = semComentarios(lerFonte("src/components/ui/drawer.tsx"))
        expect(fonte).toContain('"data-[vaul-drawer-direction=bottom]:[--scroll-fade-bottom-max:0px]"')
    })
    it("o corpo do diálogo lê o teto da rampa de baixo, para a gaveta poder zerá-lo", () => {
        const fonte = lerFonte("src/components/ui/dialog.tsx")
        expect(fonte).toContain("var(--scroll-fade-bottom-max,var(--scroll-fade-end-h))")
    })
})
