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
        expect(HEADER).toMatch(/<TopBarActionGroup\s+morph\s+trailingKey=\{filtro\?\.icon\}>\s*\{lupa\(true\)\}\s*\{filtroNoCabecalho\}/)
        // A lupa sozinha fora do grupo saiu: o grupo segura um ou dois filhos.
        expect(HEADER).not.toMatch(/filtroNoCabecalho \? \(\s*<TopBarActionGroup>/)
    })

    it("o filtro declarado não esmaece: só o disabled publicado desliga", () => {
        const botao = HEADER.slice(HEADER.indexOf("const botaoDoFiltro"), HEADER.indexOf("const filtroNoCabecalho"))
        expect(botao).toContain("disabled={filtro.disabled}")
        expect(botao).toContain("aria-disabled={filtro.inerte || undefined}")
        expect(botao).not.toMatch(/\sdisabled=\{[^}]*inerte/)
    })

    it("o ref do filtro sobrevive às duas instâncias da troca: a limpeza só zera o próprio nó", () => {
        const botao = HEADER.slice(HEADER.indexOf("const botaoDoFiltro"), HEADER.indexOf("const filtroNoCabecalho"))
        expect(botao).toContain("ref={guardarFiltro}")
        expect(botao).not.toContain("ref={filtroRef}")
        expect(HEADER).toMatch(
            /const guardarFiltro = React\.useCallback\(\(no: HTMLButtonElement \| null\) => \{\s*filtroRef\.current = no\s*return \(\) => \{\s*if \(filtroRef\.current === no\) filtroRef\.current = null\s*\}\s*\}, \[\]\)/,
        )
        // A paleta continua lendo o objeto como a origem do ×.
        expect(HEADER).toContain("closeOrigin={filtroRef}")
    })

    it("a largura do título lê o filtro efetivo", () => {
        expect(HEADER).toContain('filtro ? "inset-x-28" : "inset-x-16"')
    })
})
