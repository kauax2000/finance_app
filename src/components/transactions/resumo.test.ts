import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("resumo e aviso a conferir", () => {
    it("resumo usa StatCardGroup e não declara KpiCard", () => {
        const f = semComentarios(lerFonte("src/components/transactions/resumo-das-transacoes.tsx"))
        expect(f).toContain("StatCardGroup")
        expect(f).not.toContain("KpiCard")
        expect(f).toContain("max-md:hidden")
    })
    it("aviso usa AlertAction e não escreve svg", () => {
        const f = semComentarios(lerFonte("src/components/transactions/aviso-a-conferir.tsx"))
        expect(f).toContain("AlertAction")
        expect(f).not.toContain("<svg")
        expect(f).toContain('variant="primary"')
    })
})
