import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const HEADER = semComentarios(lerFonte("src/components/layout/app-header.tsx"))

describe("o cabeçalho do telefone consome as peças da troca", () => {
    it("o sino e o voltar trocam no mesmo vidro, pela chave", () => {
        expect(HEADER).toMatch(/<TopBarActionSwap\s+swapKey=\{mobileBackHref \? "voltar" : "sino"\}>/)
    })

    it("o voltar não veste mais o vidro próprio: o vidro é do swap", () => {
        expect(HEADER).not.toContain("topBarPlateClassName")
        expect(HEADER).toMatch(/<PageHeaderBack[\s\S]*?className="ms-0"/)
    })

    it("a ponta direita é sempre a cápsula que pinga, com a identidade do filtro", () => {
        expect(HEADER).toMatch(/<TopBarActionGroup\s+morph\s+trailingKey=\{filtro\?\.icon \?\? undefined\}>\s*\{lupa\(true\)\}\s*\{filtroNoCabecalho\}/)
        // A lupa sozinha fora do grupo saiu: o grupo segura um ou dois filhos.
        expect(HEADER).not.toMatch(/filtroNoCabecalho \? \(\s*<TopBarActionGroup>/)
    })

    it("o filtro declarado sem publicação é o botão desligado, e o ref fica nele", () => {
        const botao = HEADER.slice(HEADER.indexOf("const botaoDoFiltro"), HEADER.indexOf("const filtroNoCabecalho"))
        expect(botao).toContain("ref={filtroRef}")
        expect(botao).toContain("disabled={filtro.disabled}")
    })

    it("a largura do título lê o filtro efetivo", () => {
        expect(HEADER).toContain('filtro ? "inset-x-28" : "inset-x-16"')
    })
})
