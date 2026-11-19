import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o seletor de mês do desktop", () => {
    const f = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"), "tudo")
    const ini = f.indexOf("function MonthNavPicker(")
    const picker = f.slice(ini, f.indexOf("function MonthNavPanel(", ini))

    it("é uma pílula só: o mês no centro com o chevron abre a grade, sem setas dos lados", () => {
        expect(ini).toBeGreaterThan(-1)
        expect(picker).toContain("<MonthNavPanel")
        expect(picker).toContain("aria-label={pickerAriaLabel}")
        expect(picker).toContain('fullWidth ? "tertiary" : "floating"')
        expect(picker).toContain("<ChevronDownIcon")
        expect(picker).not.toContain("<ButtonGroup")
        expect(picker).not.toContain('aria-label="Mês anterior"')
        expect(picker).not.toContain('aria-label="Próximo mês"')
        expect(picker).not.toContain("CalendarIcon")
    })

    it("não tem atalho solto nem as setas antigas do rodapé fora do painel", () => {
        expect(picker).not.toContain("Voltar a este mês")
        expect(f).not.toContain("MonthNavArrowControls")
    })

    it("na fatura do telefone o botão ocupa a faixa", () => {
        expect(picker).toContain(`fullWidth ? "flex-1" : "text-foreground"`)
    })
})
