import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o seletor de carteira no header", () => {
    it("no header, o embrulho do seletor centra o botão", () => {
        const f = semComentarios(lerFonte("src/components/layout/workspace-switcher.tsx"))
        expect(f).toContain('<div className="flex min-w-0 max-w-full justify-center">{menu}</div>')
    })
})
