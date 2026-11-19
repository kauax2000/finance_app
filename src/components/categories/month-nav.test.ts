import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o seletor de mês compacto", () => {
    const f = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"), "tudo")

    it("‹ e › são círculos de contorno, e o mês, sem caixa, abre a grade com ˅", () => {
        expect(f).not.toContain('from "@/components/ui/button-group"')
        const ini = f.indexOf('aria-label="Mês de referência"')
        const grupo = f.slice(ini, f.indexOf("</Popover>", ini) + 400)
        expect(grupo).toMatch(/variant="outline"\s+size="icon-lg"\s+aria-label="Mês anterior"/)
        expect(grupo).toMatch(/variant="tertiary"\s+aria-label=\{pickerAriaLabel\}/)
        expect(grupo).toContain("ChevronDownIcon")
        expect(grupo).not.toContain("CalendarIcon")
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

    it("a cápsula tem nome e, no telefone da fatura, ocupa a faixa", () => {
        expect(f).toContain('aria-label="Mês de referência"')
        expect(f).toMatch(/esteMesInsidePopoverOnNarrow && "flex-1"[\s\S]*esteMesInsidePopoverOnNarrow && "flex-1"/)
    })

    it("o mês atual é uma prop, com o calendário como padrão, e a fatura passa o ciclo atual", () => {
        expect(f).toContain("currentYm = formatYearMonth(new Date())")
        expect(f).toContain("budgetMonthYm !== currentYm")
        const fat = semComentarios(lerFonte("src/components/credit-cards/credit-card-invoice-analytics-panel.tsx"), "tudo")
        expect(fat).toContain("currentYm={anchorYm}")
    })
})
