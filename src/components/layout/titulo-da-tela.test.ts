import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const TITULO = semComentarios(lerFonte("src/components/layout/titulo-da-tela.tsx"))
const CASCA = semComentarios(lerFonte("src/components/layout/sidebar-app-shell.tsx"))

describe("o nome da tela no telefone", () => {
    it("mora na casca, acima da página, para aparecer no clique", () => {
        expect(CASCA.indexOf("<TituloDaTela")).toBeGreaterThan(CASCA.indexOf("data-workspace-content"))
        expect(CASCA.indexOf("<TituloDaTela")).toBeLessThan(CASCA.indexOf("{children}"))
    })

    it("as telas de aba não têm título: nenhum PageHeader na casca do telefone", () => {
        expect(TITULO).not.toContain("<PageHeader")
        expect(TITULO).not.toContain("<PageHeaderTitle")
        expect(TITULO).toMatch(/return null\s*\}\s*$/)
    })

    it("subpágina não tem título grande: o nome só vai à barra depois de rolar", () => {
        expect(CASCA).toContain("subpagina={Boolean(defaultMobileBackHref(pathname))}")
        expect(TITULO).toContain("docked: fixo || window.scrollY > ROLAGEM_MINIMA")
        expect(TITULO).toContain('window.addEventListener("scroll", publicar, { passive: true })')
        expect(TITULO).toContain("publishPageTitle(document, null)")
    })

    it("a tela que dá o próprio título vence o da rota", () => {
        expect(TITULO).toContain("chrome?.title ?? defaultMobileTitle(pathname, titleMode)")
    })

    it("sob um hero do telefone o título em texto se cala", () => {
        const guarda = TITULO.indexOf('[data-workspace-content] [data-slot="page-header"][data-phone="hero"]')
        expect(guarda).toBeGreaterThan(-1)
        expect(guarda).toBeLessThan(TITULO.indexOf("publishPageTitle(document, { text: titulo"))
    })
})
