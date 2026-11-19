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

    // A barra de cima, com nome, perdia o borrão da borda, e o conteúdo passava nítido
    // por baixo dela (simulador, 19/11/2026): nesse instante ela veste a placa cheia.
    it("com nome, a barra de cima veste a placa do `top-bar-fade`, cheia", () => {
        expect(CSS).toMatch(/html\[data-subpagina\] \[data-slot="top-bar"\] > \[data-slot="top-bar-fade"\] \{\s+--top-bar-fade-tint: var\(--background\);\s+display: block;\s+opacity: 1;/)
    })

    it("a casca liga a transição, e quem chama não marca link", () => {
        expect(CASCA).toContain("<TransicaoDeSubpagina />")
        expect(T).toContain('document.addEventListener("click", aoClicar, true)')
    })

    it("o gesto espera a tela nova: a navegação corre dentro da promessa, e há um teto", () => {
        expect(T).toMatch(/startViewTransition\(async \(\) => \{[\s\S]{0,160}?router\.push\([\s\S]+await telaPronta\(rotaDeAntes, inicio\)/)
        expect(T).toContain("const LIMITE_DA_ESPERA_MS = 1200")
        expect(T).toContain(`'[aria-busy="true"], [data-slot="skeleton"]'`)
    })

    // No simulador (19/11/2026) o teto vencia com a rota velha: o gesto andava a Você
    // sobre ela mesma, e a tela nova chegava num corte seco.
    it("nunca anima sem a rota nova: o teto de 1,2s só conta depois da troca, e a rota tem o próprio teto", () => {
        expect(T).toContain("const LIMITE_DA_ROTA_MS = 2500")
        expect(T).toMatch(/function telaPronta\(rotaDeAntes: string, inicio: number\): Promise<boolean>/)
        expect(T).toMatch(/const pronta = await telaPronta\(rotaDeAntes, inicio\)[\s\S]{0,800}transicao\.skipTransition\(\)/)
    })

    it("o teto do esqueleto nasce na troca de rota, não no clique", () => {
        // o temporizador de 1,2s é armado dentro do ramo em que a rota já mudou
        expect(T).toMatch(/location\.pathname !== rotaDeAntes[\s\S]{0,300}setTimeout\([\s\S]{0,40}Math\.min\(LIMITE_DA_ESPERA_MS, restante\)/)
    })

    // No WebKit, rolar com a promessa correndo mostra a página viva no lugar da foto
    // parada: a Você rolada piscava em branco (simulador, 19/11/2026).
    it("a navegação não rola durante a espera; a rolagem ao topo vem depois da tela pronta", () => {
        expect(T).toContain("{ scroll: false }")
        expect(T).toMatch(/await telaPronta\(rotaDeAntes, inicio\)[\s\S]{0,200}window\.scrollTo\(\{ top: 0, behavior: "instant" \}\)/)
    })

    // A troca que passou do teto deixava a Você saltar ao topo antes da tela nova chegar.
    it("sem a rota nova a tempo, a tela velha fica na rolagem dela e o topo espera a rota", () => {
        expect(T).toContain('window.scrollTo({ top: rolagem, behavior: "instant" })')
        expect(T).toContain("topoNaProximaRota.current = true")
        expect(T).toMatch(/useEffect\(\(\) => \{\s+if \(!topoNaProximaRota\.current\) return[\s\S]{0,120}\}, \[pathname\]\)/)
    })

    // No WebKit a foto de um conteúdo alto e rolado saía vazia (o voltar cortava seco), e a
    // tela nova mais curta encolhia o documento, cortando a rolagem na espera.
    it("antes da foto, a página rolada vira uma janela do tamanho da tela, rolada por dentro", () => {
        expect(T).toMatch(/conteudo\.style\.height = `\$\{window\.innerHeight\}px`[\s\S]{0,120}window\.scrollTo\(\{ top: 0, behavior: "instant" \}\)[\s\S]{0,40}conteudo\.scrollTop = rolagem - topo[\s\S]+startViewTransition/)
        // A janela só vale sob `html[data-subpagina]`: o atributo vem antes dela.
        expect(T).toMatch(/raiz\.dataset\.subpagina = direcao[\s\S]{0,80}if \(conteudo && rolagem > 0\)/)
        expect(T).toMatch(/await telaPronta\(rotaDeAntes, inicio\)[\s\S]{0,160}soltar\(\)/)
        expect(T).toMatch(/\.finally\(\(\) => \{[\s\S]{0,160}voltarAoLugar\(\)/)
        expect(CSS).toMatch(/\[data-workspace-content\]\[data-janela\] \{\s+overflow: hidden;/)
        expect(T).toContain('conteudo.style.flex = "none"')
        expect(CSS).toMatch(/\[data-workspace-content\]\[data-janela\] > \* \{\s+flex-shrink: 0;/)
    })

    // O WebKit desenha as fotos alguns quadros antes de ligar a animação.
    it("as fotos já nascem no quadro inicial, e os keyframes de entrada têm o `to` explícito", () => {
        expect(CSS).toMatch(/html\[data-subpagina="entra"\]::view-transition-new\(subpagina-conteudo\) \{\s+translate: 100% 0;/)
        expect(CSS).toMatch(/@keyframes subpagina-direita \{[\s\S]{0,200}to \{\s+translate: 0 0;/)
        expect(CSS).toMatch(/@keyframes subpagina-vem-esquerda \{[\s\S]{0,120}to \{\s+translate: 0 0;/)
    })

    // No iPhone, com a tela nova lenta, o iOS abortava a troca (~4s) com a página já em 0
    // pela janela: a Você aparecia do topo antes da tela nova (19/11/2026).
    it("a espera inteira fica abaixo do teto do iOS, e a troca abortada devolve a Você ao lugar", () => {
        expect(T).toContain("const PRAZO_TOTAL_MS = 3000")
        expect(T).toMatch(/\.finally\(\(\) => \{\s+if \(!resolvida\) \{\s+resolvida = true\s+voltarAoLugar\(\)/)
        expect(T).toMatch(/const voltarAoLugar = \(\) => \{\s+soltar\(\)\s+if \(location\.pathname === rotaDeAntes\) \{\s+window\.scrollTo\(\{ top: rolagem/)
        expect(T).toContain("transicao.ready.catch(() => {})")
    })

    it("um clique durante a troca nunca é engolido, e marca velha sai", () => {
        expect(T).toMatch(/if \(raiz\.dataset\.subpagina\) \{\s+if \(performance\.now\(\) - trocaDesde < PRAZO_TOTAL_MS \+ 2000\) return\s+delete raiz\.dataset\.subpagina\s+\}\s+[\s\S]{0,120}e\.preventDefault\(\)/)
    })

    it("só o telefone, sem movimento reduzido, fora de diálogo e de link externo", () => {
        expect(T).toContain("if (!isMobile) return")
        expect(T).toContain('"(prefers-reduced-motion: reduce)"')
        expect(T).toContain(`link.closest('[role="dialog"]')`)
        expect(T).toContain("destino.origin !== location.origin")
    })

    it("o estado dura a transição inteira, sem temporizador", () => {
        expect(T).toContain("raiz.dataset.subpagina = direcao")
        expect(T).toMatch(/transicao\.finished[\s\S]{0,80}\.finally\(\(\) => \{[\s\S]{0,200}delete raiz\.dataset\.subpagina/)
    })

    it("sem desvio de rolagem: a página já está em 0 na foto", () => {
        expect(T).not.toContain("--subpagina-desvio")
        expect(CSS).not.toContain("--subpagina-desvio")
    })

    it("as duas direções e o movimento reduzido estão no CSS", () => {
        for (const direcao of ["entra", "volta"]) {
            expect(CSS).toContain(`html[data-subpagina="${direcao}"]::view-transition-old(subpagina-conteudo)`)
            expect(CSS).toContain(`html[data-subpagina="${direcao}"]::view-transition-new(subpagina-conteudo)`)
        }
        expect(CSS).toMatch(/prefers-reduced-motion: reduce\)[\s\S]{0,200}subpagina-conteudo/)
    })

    it("o gesto anda na curva das folhas, e a tela de baixo escurece ao recuar", () => {
        const regras = [...CSS.matchAll(/html\[data-subpagina="(?:entra|volta)"\]::view-transition-(?:old|new)\(subpagina-conteudo\) \{\s+animation: ([^;]+);/g)].map((m) => m[1])
        expect(regras).toHaveLength(4)
        for (const a of regras) expect(a).toMatch(/^var\(--duration-spring\) var\(--ease-emphasized\) both subpagina-/)
        expect(CSS).toMatch(/@keyframes subpagina-esquerda \{[\s\S]{0,200}opacity: 0\.85;/)
        expect(CSS).toMatch(/@keyframes subpagina-vem-esquerda \{[\s\S]{0,120}opacity: 0\.85;/)
    })
})
