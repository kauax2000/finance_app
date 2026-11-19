import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o seletor de mês do desktop", () => {
    const f = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"), "tudo")
    const ini = f.indexOf("function MonthNavPicker(")
    const picker = f.slice(ini, f.indexOf("function MonthNavPanel(", ini))

    it("é um botão só, sem fundo, que abre a grade de meses", () => {
        expect(ini).toBeGreaterThan(-1)
        expect(picker).toMatch(/variant="tertiary"\s+aria-label=\{pickerAriaLabel\}/)
        expect(picker).toContain("<MonthNavPanel")
        expect(picker).toContain("ChevronDownIcon")
        expect(picker).not.toContain("CalendarIcon")
    })

    it("não tem setas nem atalho soltos: moram no rodapé da grade", () => {
        expect(picker).not.toContain('aria-label="Mês anterior"')
        expect(picker).not.toContain("Voltar a este mês")
        expect(f).not.toContain("MonthNavArrowControls")
    })

    it("na fatura do telefone ocupa a faixa", () => {
        expect(picker).toMatch(/fullWidth && "flex-1"/)
    })
})
