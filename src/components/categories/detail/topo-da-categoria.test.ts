import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import type { Comparacao } from "@/lib/categoria-detalhe"
import { TopoDaCategoria, valorCurto } from "./topo-da-categoria"

// O `Intl` escreve "R$ 4.114,39" com espaço não separável; o texto do teste usa o comum.
const texto = (props: Parameters<typeof TopoDaCategoria>[0]) =>
    renderToStaticMarkup(h(TopoDaCategoria, props))
        .replace(/<[^>]+>/g, "")
        .replace(/\u00a0/g, " ")

const comparacao: Comparacao = { mesAnterior: "2026-10", anterior: 3734, atual: 4114.39, variacao: -0.18, mesmoPonto: true }

describe("TopoDaCategoria", () => {
    it("despesa: o valor do mês, a legenda e a frase da comparação", () => {
        const t = texto({ tipo: "expense", yearMonth: "2026-11", lancado: 4114.39, comparacao })
        expect(t).toContain("R$ 4.114,39")
        expect(t).toContain("Gasto em novembro")
        expect(t).toContain("↓ 18% que no mesmo dia de outubro · R$ 3.734")
        expect(t).not.toContain("(R$ 3.734)")
    })

    it("sem comparação, a legenda fica sozinha, sem o ponto", () => {
        const t = texto({ tipo: "expense", yearMonth: "2026-11", lancado: 0, comparacao: null })
        expect(t).toContain("R$ 0,00")
        expect(t).toContain("Gasto em")
        expect(t).not.toContain(" · ")
        expect(
            renderToStaticMarkup(h(TopoDaCategoria, { tipo: "expense", yearMonth: "2026-11", lancado: 0, comparacao: null })),
        ).not.toContain('data-slot="badge"')
    })

    it("a comparação mora num Badge", () => {
        const fonte = semComentarios(lerFonte("src/components/categories/detail/topo-da-categoria.tsx"))
        expect(fonte).toContain("<Badge")
    })

    it("receita diz Recebido", () => {
        expect(texto({ tipo: "income", yearMonth: "2026-11", lancado: 500, comparacao: null })).toContain("Recebido em")
    })

    it("valorCurto: reais sem centavos, o que sobe à barra", () => {
        expect(valorCurto(4114.39).replace(/\u00a0/g, " ")).toBe("R$ 4.114")
    })
})

describe("o detalhe da categoria usa o topo", () => {
    const pagina = semComentarios(lerFonte("src/app/(app)/categories/[categoryId]/page-client.tsx"))
    const resumo = semComentarios(lerFonte("src/components/categories/detail/resumo-do-mes.tsx"))

    it("o PageHeader é desenhado sempre, na forma hero, com o valor curto", () => {
        expect(pagina).not.toMatch(/isMobile \? null : \(\s*<PageHeader/)
        expect(pagina).toMatch(/<PageHeader phone="hero" collapse>/)
        expect(pagina).toContain("<PageHeaderHero trailing={valorCurto(")
    })

    it("o ⋯ vai à cápsula, e o resumo não o recebe mais", () => {
        expect(pagina).toContain("usePageChromeMenu(")
        expect(pagina).not.toMatch(/acoes=/)
        expect(resumo).not.toMatch(/acoes/)
    })

    it("o resumo do telefone perde o título e o valor, e guarda o fechamento e a barra", () => {
        const telefone = resumo.slice(resumo.lastIndexOf("return ("))
        expect(telefone).not.toContain("PageSectionTitle")
        expect(telefone).not.toContain("Este mês")
        expect(telefone).not.toContain("MoneyDisplay")
        expect(telefone).toContain("{fecha}")
        expect(telefone).toContain("{barra}")
    })
})
