import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const HEADER = semComentarios(lerFonte("src/components/layout/app-header.tsx"))

describe("o voltar do telefone nas telas da página Você", () => {
    it("o pai conhecido vem antes, e Você é a última opção", () => {
        const corpo = HEADER.slice(HEADER.indexOf("function defaultMobileBackHref"))
        expect(corpo.indexOf("resolveAppSubPageMeta")).toBeLessThan(corpo.indexOf("voceBackHref(pathname)"))
    })

    it("Planos volta a Você, como linha dela", () => {
        const corpo = HEADER.slice(HEADER.indexOf("function defaultMobileBackHref"))
        expect(corpo).toContain("if (pathname === ROUTES.PLANS) return ROUTES.ME")
        expect(corpo).not.toContain("ROUTES.ACCOUNT")
    })

    it("a página Você, as telas dela e o detalhe da categoria não têm seletor de carteira", () => {
        expect(HEADER).toContain("const semSeletor = isVoceTabActive(pathname, []) || mobileHeaderMenuFor(pathname)")
        expect(HEADER).toContain('const seletor = semSeletor ? null : <WorkspaceSwitcher appearance="header" />')
    })

    it("o título que sobe toma o lugar do seletor, menos no Painel", () => {
        expect(HEADER).toMatch(/pathname === ROUTES\.DASHBOARD \? \(\s+seletor\s+\) : \(\s+<TopBarTitle pageTitle className="text-center text-base font-semibold">\s+\{seletor\}\s+<\/TopBarTitle>/)
    })
})
