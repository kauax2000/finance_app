import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const PROVIDER = semComentarios(lerFonte("src/components/layout/page-chrome-provider.tsx"))
const CABECALHO = semComentarios(lerFonte("src/components/layout/app-header.tsx"))

describe("o ⋯ da tela na cápsula do telefone", () => {
    it("o provider publica o menu e o limpa ao desmontar", () => {
        expect(PROVIDER).toContain("export function usePageChromeMenu(")
        expect(PROVIDER).toContain("export function usePageChromeMenuState(")
        const efeito = PROVIDER.slice(PROVIDER.indexOf("export function usePageChromeMenu("))
        expect(efeito).toContain("return () => setMenu(null)")
    })

    it("o cabeçalho lê o menu e o põe no grupo do telefone, depois do filtro", () => {
        expect(CABECALHO).toContain("usePageChromeMenuState()")
        const grupo = CABECALHO.slice(CABECALHO.indexOf("<TopBarActionGroup trailingKey"))
        expect(grupo).toMatch(/<span className="flex">\s*\{filtroNoCabecalho\}\s*\{menuDaTela\}\s*<\/span>/)
    })
})
