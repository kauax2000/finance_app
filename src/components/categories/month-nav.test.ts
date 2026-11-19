import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o seletor de mês do desktop", () => {
    const f = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"), "tudo")
    const ini = f.indexOf("function MonthNavPicker(")
    const picker = f.slice(ini, f.indexOf("function MonthNavPanel(", ini))

    it("é uma pílula só, com as setas dentro e o mês no centro; o fundo das peças só no cursor", () => {
        expect(ini).toBeGreaterThan(-1)
        expect(picker).toContain("<MonthNavPanel")
        expect(picker).toContain("aria-label={pickerAriaLabel}")
        expect(picker).toContain('aria-label="Mês anterior"')
        expect(picker).toContain('aria-label="Próximo mês"')
        expect(picker).toContain("shiftYearMonth(budgetMonthYm, -1)")
        expect(picker).toContain("shiftYearMonth(budgetMonthYm, 1)")
        expect(picker).toContain("rounded-full bg-popover")
        expect(picker).not.toContain("<ButtonGroup")
        expect(picker).not.toContain('variant="floating"')
        expect(picker.match(/variant="tertiary"/g)?.length).toBe(3)
        expect(picker).toMatch(/fullWidth \? \(\s*<ChevronDownIcon/)
    })

    it("na fatura (fullWidth) só o botão da faixa, sem setas", () => {
        expect(picker).toContain("if (fullWidth) return popover")
        expect(picker.indexOf('aria-label="Mês anterior"')).toBeGreaterThan(picker.indexOf("if (fullWidth) return popover"))
    })

    it("não tem atalho solto nem as setas antigas do rodapé fora do painel", () => {
        expect(picker).not.toContain("Voltar a este mês")
        expect(f).not.toContain("MonthNavArrowControls")
    })

    it("na fatura do telefone o botão ocupa a faixa", () => {
        expect(picker).toContain(`fullWidth ? "flex-1" : "text-foreground"`)
    })
})
