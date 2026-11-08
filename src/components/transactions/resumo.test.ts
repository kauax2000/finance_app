import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("aviso a conferir", () => {
    it("aviso usa AlertAction e não escreve svg", () => {
        const f = semComentarios(lerFonte("src/components/transactions/aviso-a-conferir.tsx"))
        expect(f).toContain("AlertAction")
        expect(f).not.toContain("<svg")
        expect(f).toContain('variant="primary"')
    })
})
