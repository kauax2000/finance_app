import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o seletor de mês do desktop", () => {
    const f = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"), "tudo")
    const ini = f.indexOf("function MonthNavPicker(")
    const picker = f.slice(ini, f.indexOf("function MonthNavPanel(", ini))

    it("é a pílula ‹ mês ›: o nome abre a grade e as setas andam um mês", () => {
        expect(ini).toBeGreaterThan(-1)
        expect(picker).toContain("<ButtonGroup")
        expect(picker).toContain("<MonthNavPanel")
        expect(picker).toContain('aria-label="Mês anterior"')
        expect(picker).toContain('aria-label="Próximo mês"')
        expect(picker).toContain("shiftYearMonth(budgetMonthYm, -1)")
        expect(picker).toContain("shiftYearMonth(budgetMonthYm, 1)")
        expect(picker).toContain("aria-label={pickerAriaLabel}")
        expect(picker).not.toContain("CalendarIcon")
    })

    it("as três peças da pílula flutuam, e as setas são o círculo da escada", () => {
        expect(picker.match(/variant="floating"/g)?.length).toBe(3)
        expect(picker.match(/size="icon-lg"/g)?.length).toBe(2)
    })

    it("o ramo da fatura (fullWidth) devolve só o popover, sem setas", () => {
        expect(picker).toContain("if (fullWidth) return popover")
        expect(picker.indexOf("<ButtonGroup")).toBeGreaterThan(picker.indexOf("if (fullWidth) return popover"))
    })

    it("não tem atalho solto nem as setas antigas do rodapé fora do painel", () => {
        expect(picker).not.toContain("Voltar a este mês")
        expect(f).not.toContain("MonthNavArrowControls")
    })

    it("na fatura do telefone o botão ocupa a faixa", () => {
        expect(picker).toMatch(/min-w-0 flex-1/)
    })
})
