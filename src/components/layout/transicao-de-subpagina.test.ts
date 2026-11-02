import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const T = semComentarios(lerFonte("src/components/layout/transicao-de-subpagina.tsx"))
const CASCA = semComentarios(lerFonte("src/components/layout/sidebar-app-shell.tsx"))
const CSS = lerFonte("src/app/globals.css")

describe("a transição de subpágina", () => {
    // `view-transition-name` faz do elemento uma raiz de fundo: o `backdrop-filter` de
    // dentro dele para de enxergar a página, e o vidro vira só tinta (2026-11-02).
    it("nenhum nome de transição é permanente: todo seletor depende de um estado que dura a troca", () => {
        const regras = [...CSS.matchAll(/([^{}]+)\{[^{}]*view-transition-name:[^{}]*\}/g)].map((m) =>
            m[1].replace(/\/\*[\s\S]*?\*\//g, "").trim()
        )
        expect(regras.length).toBeGreaterThan(0)
        for (const seletor of regras) expect(seletor).toMatch(/^(html\[data-subpagina\]|\.workspace-switch) /)
    })

    it("com nome, a pílula da barra fica chapada: sem borrão, o texto passaria por ela", () => {
        expect(CSS).toMatch(/html\[data-subpagina\] \[data-slot="bottom-bar-tabs"\] \{\s+background-color: var\(--bottom-bar-surface\);/)
    })

    it("a casca envolve o conteúdo, e quem chama não marca link", () => {
        expect(CASCA).toMatch(/<TransicaoDeSubpagina pathname=\{pathname\}>\s+<div data-workspace-content/)
        expect(lerFonte("next.config.ts")).toContain("viewTransition: true")
    })

    it("só o telefone anima, e a classe dura uma troca", () => {
        expect(T).toContain('default="none"')
        expect(T).toContain("isMobile ? direcaoDaTela(")
        expect(T).toMatch(/useEffect\([\s\S]+setDirecao\(null\)/)
    })

    it("as barras só têm nome durante a troca, para não perder o borrão em repouso", () => {
        expect(T).toContain("dataset.subpagina")
        expect(CSS).toContain('html[data-subpagina] [data-slot="top-bar"]')
        expect(CSS).toContain('html[data-subpagina] [data-slot="bottom-bar"]')
        expect(CSS).not.toContain("html:not(.theme-reveal, .workspace-switch)")
    })

    it("a tela velha rolada fica onde estava: o desvio da rolagem vai às fotos dela", () => {
        expect(T).toMatch(/"--subpagina-desvio",\s*`\$\{-window\.scrollY\}px`/)
        expect(T).not.toContain("onUpdate")
        expect(CSS).toContain("translate: 0 var(--subpagina-desvio, 0px);")
        expect(CSS).toContain("translate: -30% var(--subpagina-desvio, 0px);")
        expect(CSS).toContain("translate: 100% var(--subpagina-desvio, 0px);")
    })

    it("as duas direções e o movimento reduzido estão no CSS", () => {
        for (const t of [
            "::view-transition-old(.subpagina-entra)",
            "::view-transition-new(.subpagina-entra)",
            "::view-transition-old(.subpagina-volta)",
            "::view-transition-new(.subpagina-volta)",
        ]) {
            expect(CSS).toContain(t)
        }
        expect(CSS).toMatch(/prefers-reduced-motion: reduce\)[\s\S]{0,300}subpagina/)
    })
})
