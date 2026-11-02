import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const T = semComentarios(lerFonte("src/components/layout/transicao-de-subpagina.tsx"))
const CASCA = semComentarios(lerFonte("src/components/layout/sidebar-app-shell.tsx"))
const CSS = lerFonte("src/app/globals.css")

describe("a transição de subpágina", () => {
    it("a casca envolve o conteúdo, e quem chama não marca link", () => {
        expect(CASCA).toMatch(/<TransicaoDeSubpagina pathname=\{pathname\}>\s+<div data-workspace-content/)
        expect(lerFonte("next.config.ts")).toContain("viewTransition: true")
    })

    it("só o telefone anima, e a classe dura uma troca", () => {
        expect(T).toContain('default="none"')
        expect(T).toContain("isMobile ? direcaoDaTela(")
        expect(T).toMatch(/useEffect\([\s\S]+setDirecao\(null\)/)
    })

    it("as barras ficam paradas, menos nas outras transições do app", () => {
        expect(CSS).toContain('html:not(.theme-reveal, .workspace-switch) [data-slot="top-bar"]')
        expect(CSS).toContain('html:not(.theme-reveal, .workspace-switch) [data-slot="bottom-bar"]')
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
