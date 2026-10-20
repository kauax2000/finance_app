import { describe, expect, it } from "vitest"
import { filtroDoCabecalho } from "@/components/layout/page-chrome-provider"
import { lerFonte, semComentarios } from "@/test/fonte"

const pub = { label: "Filtros", active: true, icon: "filter" as const }

describe("filtroDoCabecalho", () => {
    it("sem publicação, a rota declara um botão inerte", () => {
        expect(filtroDoCabecalho("month", undefined)).toEqual({
            label: "Mês",
            active: false,
            inerte: true,
            icon: "month",
        })
        expect(filtroDoCabecalho("filter", undefined)).toEqual({
            label: "Filtros",
            active: false,
            inerte: true,
            icon: "filter",
        })
    })

    it("o inerte não abre nada", () => {
        const inerte = filtroDoCabecalho("filter", undefined)
        expect(inerte).not.toHaveProperty("onOpen")
        expect(inerte).not.toHaveProperty("popover")
        // Não esmaece: o `disabled` do botão pintaria 50% até a página publicar.
        expect(inerte).not.toHaveProperty("disabled")
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

describe("usePageChromeFilter", () => {
    const fonte = semComentarios(lerFonte("src/components/layout/page-chrome-provider.tsx"))

    it("ao sair, devolve o estado a \"não falou\" (null), nunca um null com a rota", () => {
        expect(fonte).toContain("return () => setFilter(null)")
        expect(fonte).not.toContain("return () => setFilter({")
    })

    it("com enabled falso, publica o null com o pathname", () => {
        expect(fonte).toContain("if (!enabled) {\n            setFilter({ pathname, filter: null })")
    })
})
