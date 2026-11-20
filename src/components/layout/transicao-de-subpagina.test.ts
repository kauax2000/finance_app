import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const T = semComentarios(lerFonte("src/components/layout/transicao-de-subpagina.tsx"))
const CASCA = semComentarios(lerFonte("src/components/layout/sidebar-app-shell.tsx"))
const CSS = lerFonte("src/app/globals.css")

describe("a transição de subpágina", () => {
    it("a casca liga a transição, e quem chama não marca link", () => {
        expect(CASCA).toContain("<TransicaoDeSubpagina />")
        expect(T).toContain('document.addEventListener("click", aoClicar, true)')
    })

    // No iPhone, a foto de uma View Transition não desenha `backdrop-filter`: a barra de cima
    // perdia o borrão a cada troca (o texto passava nítido, ou a barra virava placa). A troca
    // anima só o conteúdo, e as barras ficam vivas, fora do gesto (19/11/2026).
    it("sem View Transitions: as barras nunca entram no gesto", () => {
        expect(T).not.toContain("startViewTransition")
        expect(T).not.toContain("bottom-bar")
        expect(T).not.toContain("bottom-bar")
        expect(CSS).not.toMatch(/html\[data-subpagina\]/)
    })

    it("uma cópia parada do conteúdo fica à vista na mesma posição enquanto a tela nova monta", () => {
        expect(T).toMatch(/const copia = parada\(conteudo\.cloneNode\(true\)/)
        expect(T).toMatch(/top: `\$\{caixa\.top\}px`/)
        expect(T).toContain("camada.inert = true")
        // Abaixo das barras (`--z-header` 40, `--z-modal` 50), no contexto do conteúdo.
        expect(T).toContain('zIndex: "30"')
        expect(T).toContain("(conteudo.parentElement ?? document.body).append(camada)")
    })

    it("o gesto espera a tela nova, e a navegação não rola durante a espera", () => {
        expect(T).toContain("{ scroll: false }")
        expect(T).toMatch(/const pronta = await telaPronta\(rotaDeAntes\)[\s\S]{0,400}window\.scrollTo\(\{ top: 0, behavior: "instant" \}\)[\s\S]{0,400}await animar\(/)
        expect(T).toContain(`'[aria-busy="true"], [data-slot="skeleton"]'`)
    })

    it("sem a rota nova a tempo, a cópia sai e a tela velha fica na rolagem dela", () => {
        expect(T).toMatch(/if \(!pronta\) \{\s+window\.scrollTo\(\{ top: rolagem, behavior: "instant" \}\)\s+return/)
        expect(T).toMatch(/\} finally \{\s+soltarCabecalho\(\)\s+camada\.remove\(\)/)
    })

    // A rota nova monta outro nó de conteúdo: animar o de antes deixava a cópia por cima
    // e a tela nova chegava num corte.
    it("anima o nó de conteúdo que está na tela depois da troca", () => {
        expect(T).toMatch(/novo = document\.querySelector<HTMLElement>\("\[data-workspace-content\]"\) \?\? conteudo\s+soltarCabecalho\(\)\s+await animar\(camada, novo, direcao\)/)
    })

    // O token chega em segundos ("0.5s"); lido como milissegundos, o gesto durava meio ms.
    it("o gesto anda na curva das folhas, com a duração lida na unidade certa", () => {
        expect(T).toContain('getPropertyValue("--duration-spring")')
        expect(T).toContain('bruto.endsWith("ms") ? 1 : 1000')
        expect(T).toContain('getPropertyValue("--ease-emphasized")')
    })

    // O Safari ignora `translate` em keyframes de `animate()`.
    it("as duas direções em `transform`, e a tela de baixo escurece ao recuar", () => {
        expect(T).not.toMatch(/\{ translate:/)
        expect(T).toContain('{ transform: "translateX(-30%)", opacity: 0.85 }')
        expect(T).toContain('{ transform: "translateX(100%)" }')
        expect(T).toMatch(/\? \[camada\.animate\(recua, opcoes\), conteudo\.animate\(vem, opcoes\)\]\s+: \[camada\.animate\(sai, opcoes\), conteudo\.animate\(volta, opcoes\)\]/)
    })

    // O cabeçalho virava para a tela nova ~150ms antes do gesto, e o título piscava
    // (simulador, 19/11/2026). Uma cópia viva dele cobre o de verdade até o gesto começar.
    it("o cabeçalho fica parado até o gesto e troca junto com ele", () => {
        expect(T).toMatch(/function congelarCabecalho\(\)[\s\S]{0,400}barra\.after\(copia\)\s+barra\.style\.visibility = "hidden"/)
        expect(T).toMatch(/const camada = fotografar\(conteudo\)\s+const soltarCabecalho = congelarCabecalho\(\)/)
    })

    it("só o telefone, sem movimento reduzido, fora de diálogo e de link externo, uma troca por vez", () => {
        expect(T).toContain("if (!isMobile) return")
        expect(T).toContain('"(prefers-reduced-motion: reduce)"')
        expect(T).toContain(`link.closest('[role="dialog"]')`)
        expect(T).toContain("destino.origin !== location.origin")
        expect(T).toContain("if (!direcao || emCurso) return")
        expect(T).toMatch(/emCurso = false\s+\}/)
    })

    it("as cópias (cabeçalho e conteúdo) não transicionam: o selo do sino não some e volta", () => {
        expect(T).toMatch(/el\.style\.transition = "none"\s+el\.style\.animation = "none"/)
        expect(T).toContain("const copia = parada(conteudo.cloneNode(true) as HTMLElement)")
        expect(T).toContain("const copia = parada(barra.cloneNode(true) as HTMLElement)")
    })
})
