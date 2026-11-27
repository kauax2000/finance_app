import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const PROVIDER = semComentarios(lerFonte("src/components/layout/page-chrome-provider.tsx"))
const CABECALHO = semComentarios(lerFonte("src/components/layout/app-header.tsx"))

describe("o ⋯ da tela na cápsula do telefone", () => {
    it("o provider publica o menu e o limpa ao desmontar", () => {
        expect(PROVIDER).toContain("export function usePageChromeMenu(")
        expect(PROVIDER).toContain("export function usePageChromeMenuFor(")
        const efeito = PROVIDER.slice(PROVIDER.indexOf("export function usePageChromeMenu("))
        // Cada publicação leva a rota, como a do filtro, e ao desmontar a tela volta a "não falou".
        expect(efeito).toContain("setMenu({ pathname, menu })")
        expect(efeito).toContain("return () => setMenu(null)")
        expect(PROVIDER).toContain("return ctx.menu?.pathname === pathname ? ctx.menu.menu : undefined")
    })

    it("o cabeçalho lê o menu da rota e o põe na ponta parada da cápsula", () => {
        expect(CABECALHO).toContain("usePageChromeMenuFor(pathname)")
        // Antes de a tela falar, a rota declara o ⋯ inerte na mesma forma (sem esmaecer).
        expect(CABECALHO).toMatch(/menuPublicado !== undefined \? \(\s*menuPublicado\s*\) : mobileHeaderMenuFor\(pathname\) \? \(\s*<TopBarAction type="button" label="Opções" plate tooltip=\{false\} aria-disabled>/)
        expect(CABECALHO).toMatch(/<TopBarActionGroup trailingKey=\{menu \? undefined : chaveDoFiltro\} end=\{menu\}>/)
    })
})
