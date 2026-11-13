import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

describe("impacto-da-parcela", () => {
    it("P4g: ladrilhos mês a mês, sem barra", () => {
        const f = semComentarios(lerFonte("src/components/transactions/impacto-da-parcela.tsx"))
        expect(f).not.toContain("<Progress")
        expect(f).toContain('titulo="Parcelas mês a mês"')
        expect(f).toContain("impacto.meses.map(")
        expect(f).toContain("· pico")
        expect(f).toContain("sem esta")
        expect(f).toContain("text-warning")
    })
})
