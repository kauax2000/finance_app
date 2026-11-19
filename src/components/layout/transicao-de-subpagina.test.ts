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
        for (const seletor of regras) expect(seletor).toMatch(/^(html\[data-subpagina\]|html\[data-subtela\]|\.workspace-switch) /)
    })

    it("com nome, a pílula da barra fica chapada: sem borrão, o texto passaria por ela", () => {
        expect(CSS).toMatch(/html\[data-subpagina\] \[data-slot="bottom-bar-tabs"\] \{\s+background-color: var\(--bottom-bar-surface\);/)
    })

    it("a casca liga a transição, e quem chama não marca link", () => {
        expect(CASCA).toContain("<TransicaoDeSubpagina />")
        expect(T).toContain('document.addEventListener("click", aoClicar, true)')
    })

    it("o gesto espera a tela nova: a navegação corre dentro da promessa, e há um teto", () => {
        expect(T).toMatch(/startViewTransition\(async \(\) => \{\s+router\.push\([\s\S]+await telaPronta\(rotaDeAntes\)/)
        expect(T).toContain("const LIMITE_DA_ESPERA_MS = 1200")
        expect(T).toContain(`'[aria-busy="true"], [data-slot="skeleton"]'`)
    })

    // No simulador (19/11/2026) o teto vencia com a rota velha: o gesto andava a Você
    // sobre ela mesma, e a tela nova chegava num corte seco.
    it("nunca anima sem a rota nova: o teto de 1,2s só conta depois da troca, e a rota tem o próprio teto", () => {
        expect(T).toContain("const LIMITE_DA_ROTA_MS = 4000")
        expect(T).toMatch(/function telaPronta\(rotaDeAntes: string\): Promise<boolean>/)
        expect(T).toMatch(/if \(!\(await telaPronta\(rotaDeAntes\)\)\) transicao\.skipTransition\(\)/)
    })

    it("o teto do esqueleto nasce na troca de rota, não no clique", () => {
        // o temporizador de 1,2s é armado dentro do ramo em que a rota já mudou
        expect(T).toMatch(/location\.pathname !== rotaDeAntes[\s\S]{0,300}setTimeout\([^,]+, LIMITE_DA_ESPERA_MS\)/)
    })

    it("só o telefone, sem movimento reduzido, fora de diálogo e de link externo", () => {
        expect(T).toContain("if (!isMobile) return")
        expect(T).toContain('"(prefers-reduced-motion: reduce)"')
        expect(T).toContain(`link.closest('[role="dialog"]')`)
        expect(T).toContain("destino.origin !== location.origin")
    })

    it("o estado dura a transição inteira, sem temporizador", () => {
        expect(T).toContain("raiz.dataset.subpagina = direcao")
        expect(T).toContain("transicao.finished.finally(() => delete raiz.dataset.subpagina)")
    })

    it("a tela velha não pula: as duas fotos de saída descem o quanto a rolagem mudou", () => {
        expect(T).toContain("window.scrollY - rolagemDeAntes")
        expect(CSS).toContain("translate: 0 var(--subpagina-desvio, 0px);")
        expect(CSS).toContain("translate: -30% var(--subpagina-desvio, 0px);")
        expect(CSS).toContain("translate: 100% var(--subpagina-desvio, 0px);")
    })

    it("as duas direções e o movimento reduzido estão no CSS", () => {
        for (const direcao of ["entra", "volta"]) {
            expect(CSS).toContain(`html[data-subpagina="${direcao}"]::view-transition-old(subpagina-conteudo)`)
            expect(CSS).toContain(`html[data-subpagina="${direcao}"]::view-transition-new(subpagina-conteudo)`)
        }
        expect(CSS).toMatch(/prefers-reduced-motion: reduce\)[\s\S]{0,200}subpagina-conteudo/)
    })
})
