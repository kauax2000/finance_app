import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o seletor de mês compacto", () => {
    const f = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"), "tudo")

    it("a cápsula é um ButtonGroup com ‹, o mês e ›", () => {
        expect(f).toContain('from "@/components/ui/button-group"')
        const grupo = f.slice(f.indexOf("<ButtonGroup"), f.indexOf("</ButtonGroup>"))
        const a = grupo.indexOf('aria-label="Mês anterior"')
        const p = grupo.indexOf("PopoverTrigger")
        const n = grupo.indexOf('aria-label="Próximo mês"')
        expect(a).toBeGreaterThan(-1)
        expect(p).toBeGreaterThan(a)
        expect(n).toBeGreaterThan(p)
    })

    it('"Voltar a este mês" só fora do mês atual', () => {
        expect(f).toContain("Voltar a este mês")
        expect(f).not.toContain(">Este mês<")
        expect(f).toMatch(/budgetMonthYm !== formatYearMonth\(new Date\(\)\)/)
    })

    it("o botão volta como terciário", () => {
        expect(f).toMatch(/variant="tertiary"[\s\S]{0,300}?Voltar a este mês/)
    })
})
