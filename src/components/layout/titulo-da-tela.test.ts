import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const TITULO = semComentarios(lerFonte("src/components/layout/titulo-da-tela.tsx"))
const CASCA = semComentarios(lerFonte("src/components/layout/sidebar-app-shell.tsx"))

describe("o título grande do telefone", () => {
    it("mora na casca, acima da página, para aparecer no clique", () => {
        expect(CASCA.indexOf("<TituloDaTela")).toBeGreaterThan(CASCA.indexOf("data-workspace-content"))
        expect(CASCA.indexOf("<TituloDaTela")).toBeLessThan(CASCA.indexOf("{children}"))
    })

    it("só existe no telefone, menos na página Você, sobe para a barra e não abre um segundo h1", () => {
                expect(TITULO).toContain("<PageHeader key={pathname} collapse>")
        expect(TITULO).toContain('<p aria-hidden="true">{titulo}</p>')
    })

    it("subpágina não tem título grande: o nome só vai à barra depois de rolar", () => {
        expect(CASCA).toContain("subpagina={Boolean(defaultMobileBackHref(pathname))}")
        expect(TITULO).toContain("if (!isMobile || subpagina || pathname === ROUTES.ME) return null")
        expect(TITULO).toContain("docked: fixo || window.scrollY > ROLAGEM_MINIMA")
        expect(TITULO).toContain('window.addEventListener("scroll", publicar, { passive: true })')
        expect(TITULO).toContain("publishPageTitle(document, null)")
    })

    it("a tela que dá o próprio título vence o da rota", () => {
        expect(TITULO).toContain("chrome?.title ?? defaultMobileTitle(pathname, titleMode)")
    })
})
