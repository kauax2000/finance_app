import { describe, expect, it } from "vitest"
import { filtroDoCabecalho } from "@/components/layout/page-chrome-provider"

const pub = { label: "Filtros", active: true, icon: "filter" as const }

describe("filtroDoCabecalho", () => {
    it("sem publicação, a rota declara um botão inerte", () => {
        expect(filtroDoCabecalho("month", undefined)).toEqual({
            label: "Mês",
            active: false,
            disabled: true,
            icon: "month",
        })
        expect(filtroDoCabecalho("filter", undefined)).toEqual({
            label: "Filtros",
            active: false,
            disabled: true,
            icon: "filter",
        })
    })

    it("o inerte não abre nada", () => {
        const inerte = filtroDoCabecalho("filter", undefined)
        expect(inerte).not.toHaveProperty("onOpen")
        expect(inerte).not.toHaveProperty("popover")
    })

    it("a publicação vence, inclusive o null (a aba Receitas desliga)", () => {
        expect(filtroDoCabecalho("month", null)).toBeNull()
        expect(filtroDoCabecalho("month", pub)).toBe(pub)
        expect(filtroDoCabecalho(null, pub)).toBe(pub)
    })

    it("sem declaração nem publicação, nada", () => {
        expect(filtroDoCabecalho(null, undefined)).toBeNull()
    })
})
