import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

import { topBarVariants } from "./top-bar"
import { barEdgeLayerBaseClassName, barEdgeLayerClassNames, barSurfaceClassName } from "@/lib/glass-classes"

/** O redesenho, as peças e os comportamentos do `TopBar`. */

const fonte = (caminho: string) => semComentarios(lerFonte(caminho), "linha-inteira")
const CODIGO = fonte("src/components/ui/top-bar.tsx")
const CSS = lerFonte("src/app/globals.css")

describe("o redesenho", () => {
  it("o fio só aparece ao rolar, no scroll", () => {
    expect(topBarVariants({})).toContain("data-[scrolled=false]:border-b-transparent")
  })

  it("a flutuante é a pílula da casa, abaixo do notch", () => {
    const flutuante = topBarVariants({ variant: "floating" })
    expect(flutuante).toContain("rounded-full")
    expect(flutuante).toContain("ring-1 ring-foreground/10")
    expect(flutuante).toContain("pt-0!")
    expect(topBarVariants({ variant: "floating", position: "fixed" })).toContain(
      "top-[calc(var(--top-bar-safe-area)+--spacing(2))]"
    )
    expect(topBarVariants({ variant: "floating", surface: "solid" })).toContain("bg-popover")
  })

  it("o título no meio, no telefone, por uma grade de pontas iguais", () => {
    expect(topBarVariants({})).toContain(
      "data-[title-align=center]:max-md:grid-cols-[minmax(0,1fr)_minmax(0,max-content)_minmax(0,1fr)]"
    )
  })

  it("o sm mede 56 no telefone e 52 do md para cima, e a base acompanha", () => {
    expect(topBarVariants({ size: "sm" })).toContain("[--top-bar-h:3.5rem] md:[--top-bar-h:3.25rem]")
    expect(CSS).toMatch(/data-size="sm"\]\) \{\s*--top-bar-bottom: calc\(3\.5rem/)
    expect(CSS).toMatch(/data-size="sm"\]\) \{[\s\S]*?@media \(width >= 48rem\) \{\s*--top-bar-bottom: calc\(3\.25rem/)
  })

  it("o degrau lg mede 64", () => {
    expect(topBarVariants({ size: "lg" })).toContain("[--top-bar-h:4rem]")
  })

  it("a área segura passa por variável, para o iPhone do catálogo a emular", () => {
    expect(topBarVariants({})).toContain("[--top-bar-safe-area:env(safe-area-inset-top,0px)]")
    expect(topBarVariants({ position: "fixed" })).toContain("[--top-bar-safe:var(--top-bar-safe-area)]")
    expect(fonte("src/app/designsystem/ds-frame.tsx")).toContain("--top-bar-safe-area:${IPHONE_SEGURA_TOPO}px")
  })
})

describe("as peças", () => {
  it("a ação, a busca, o esqueleto e o fio de progresso", () => {
    for (const peca of ["TopBarAction", "TopBarSearch", "TopBarSkeleton", "TopBarProgress"]) {
      expect(CODIGO).toContain(`function ${peca}(`)
    }
  })

  it("a contagem da ação entra no nome, e o número fica escondido do leitor", () => {
    expect(CODIGO).toContain('const nome = temContagem ? label + ", " + (countLabel ?? count) : label')
    expect(CODIGO).toContain('{mostrado > 99 ? "99+" : mostrado}')
  })

  it("a busca é ícone e pílula, com as quebras por extenso", () => {
    expect(CODIGO).toContain('md: { icone: "md:hidden", pilula: "hidden md:flex" }')
    expect(CODIGO).toContain('lg: { icone: "lg:hidden", pilula: "hidden lg:flex" }')
  })

  it("todo alvo de toque ampliado da barra se ancora no próprio botão", () => {
    // Sem `relative`, o `::after` absoluto cobria a barra e engolia o ☰.
    const alvos = CODIGO.match(/"[^"]*pointer-coarse:after:absolute[^"]*"/g) ?? []
    expect(alvos.length).toBeGreaterThan(0)
    for (const alvo of alvos) expect(alvo).toMatch(/"relative /)
  })

  it("o fio de progresso é progressbar, e o indeterminado mora numa @utility depois do no-scrollbar", () => {
    expect(CODIGO).toContain('role="progressbar"')
    expect(esperarDepoisDeNoScrollbar(CSS, "@utility top-bar-progress")).toContain("prefers-reduced-motion")
  })

  it("a barra do app usa as peças, numa árvore só", () => {
    const app = fonte("src/components/layout/app-header.tsx")
    expect(app).not.toContain("hidden md:contents")
    expect(app).not.toContain('className="contents md:hidden">\n                <TopBarStart')
    expect(app).toContain("<TopBarSearch")
    // A busca é a do catálogo, centrada: uma vez só, ícone abaixo de lg, com brilho.
    expect([...app.matchAll(/<TopBarSearch/g)]).toHaveLength(1)
    expect(app).toContain('collapse="lg"')
    expect(app).toMatch(/<TopBarSearch[\s\S]*?\bglow\b[\s\S]*?\/>/)
    expect(app).toContain('placeholder="Buscar telas e ações…"')
    expect(app).toContain("lg:w-full lg:max-w-xs xl:max-w-sm lg:justify-center")
    expect(app).toContain("lg:flex-1 lg:basis-0 lg:justify-end")
    expect(app).not.toContain('className="w-56"')
    expect(fonte("src/components/layout/notification-bell-link.tsx")).toContain("<TopBarAction")
  })

  it("a busca do app veste o vidro do campo da paleta", () => {
    expect(fonte("src/components/layout/app-header.tsx")).toMatch(/<TopBarSearch[\s\S]*?\bplate\b[\s\S]*?\/>/)
    expect(CODIGO).toContain('searchFieldSurfaceClassName[plate ? "plate" : "field"]')
    // O fio fica dentro da caixa: o `ring-1` pintava por fora, sobre o arco de 2px do brilho.
    expect(CODIGO).toContain('plate && "bg-clip-border ring-0 border-foreground/10"')
  })

  it("o sino do app veste o vidro da busca, como o botão de recolher", () => {
    expect(fonte("src/components/layout/notification-bell-link.tsx")).toMatch(/<TopBarAction[\s\S]*?\bplate\b/)
    // Sem dica, a pedido do dono: o nome acessível continua no `aria-label`.
    expect(fonte("src/components/layout/notification-bell-link.tsx")).toContain("tooltip={false}")
    // A mesma receita do gatilho da barra lateral: tinta, anel, sombra e realce.
    const gatilho = fonte("src/components/ui/sidebar.tsx")
    for (const parte of ["bg-popover/85", "glass-surface", "supports-backdrop-filter:bg-popover/60", "reduced-transparency:bg-popover", "ring-1", "ring-foreground/10", "[--button-hover-fill:color-mix(in_oklab,var(--sidebar-accent)_50%,transparent)]"]) {
      expect(gatilho).toContain(`wrapper:${parte}`)
      // Em todo tamanho: no telefone os botões da barra são os mesmos círculos de vidro.
      expect(CODIGO).toMatch(new RegExp(`const TOP_BAR_PLATE =\\s*"[^"]*(?<![:\\w])${parte.replace(/[[\]().*+?^$|/]/g, "\\$&")}`))
    }
    // Ninguém fora do arquivo veste o vidro à mão: o voltar entra no `TopBarActionSwap`.
    expect(CODIGO).not.toContain("topBarPlateClassName")
  })
})

describe("os comportamentos", () => {
  it("uma árvore: phone nas pontas", () => {
    expect(CODIGO).toContain('className="contents max-md:hidden"')
    expect(CODIGO).toContain('className="hidden max-md:contents"')
  })

  it("some ao rolar, só no telefone e nunca com o foco dentro", () => {
    // A regra mora em `lib/hide-on-scroll` (testada lá); a barra só a chama, com a própria altura.
    expect(CODIGO).toContain("mostrarAte: el.offsetHeight }")
    expect(CODIGO).toContain("setEscondida((v) => proximoEscondido(v, s))")
    expect(topBarVariants({})).toContain("max-md:data-hidden:-translate-y-")
  })

  it("tocar no título sobe ao topo, só no telefone", () => {
    expect(CODIGO).toContain('janela.matchMedia("(max-width: 767px)").matches')
    expect(CODIGO).toContain("scrollTo({ top: 0, behavior: suave })")
  })

  it("a busca escuta ⌘K e /, fora de campo de texto, e cala com listen={false}", () => {
    expect(CODIGO).toContain('slash && e.key === "/" && !isEditableTarget(e.target)')
    expect(CODIGO).toContain("if (!listen) return")
  })
})

// A régua do TopBar. O `CODIGO` daqui tira todo comentário, e o de cima só as linhas inteiras.
{
  /**
   * A régua da barra do topo, trancada: o `AppHeader` medindo o fio por fora da altura (o
   * telefone ficava 1px mais alto que `--mobile-header-offset`), escrevendo o próprio borrão,
   * num `z-10` cru e animando o fundo em `duration-200` com a curva do navegador. Zero render:
   * tudo lê o `cva` e o fonte sem comentários.
   */

  const CODIGO = semComentarios(lerFonte("src/components/ui/top-bar.tsx"))

  const CSS = lerFonte("src/app/globals.css")

  const alturaEm = (classes: string, prefixo = "") => {
    const m = classes.match(
      new RegExp(
        `(?:^|\\s)${prefixo.replace(/[[\]/]/g, "\\$&")}\\[--top-bar-h:([\\d.]+)rem\\]`
      )
    )
    return m ? Number(m[1]) : NaN
  }

  const TAMANHOS = ["sm", "md"] as const
  const POSICOES = ["static", "sticky", "fixed", "auto"] as const

  describe("régua do TopBar", () => {
    it("1. os degraus são degraus do md para cima (52 e 56); no telefone o sm sobe aos 56 do md", () => {
      // No telefone a barra do app segue a régua nativa (rodada 328): botões de 44
      // com 6 de folga. Do `md` para cima os degraus continuam distintos.
      const telefone = TAMANHOS.map((size) => alturaEm(topBarVariants({ size })))
      expect(telefone).toEqual([3.5, 3.5])
      expect(alturaEm(topBarVariants({ size: "sm" }), "md:")).toBe(3.25)
    })

    it("2. o padrão é 56 no telefone e 52 do md para cima, sem acompanhar a barra lateral", () => {
      const padrao = topBarVariants({})
      expect(alturaEm(padrao)).toBe(3.5)
      // 52 no desktop (decisão do dono, 2026-10-16): 8px em cima e embaixo dos controles de 36.
      expect(padrao).toContain("md:[--top-bar-h:3.25rem]")
      expect(padrao).not.toContain("group-has")
      expect(padrao).not.toContain("transition-[height")
    })

    it("3. o padrão é declarado uma vez, e é a forma de uma barra de página", () => {
      expect(topBarVariants({})).toBe(
        topBarVariants({
          size: "sm",
          position: "sticky",
          surface: "solid",
          gutter: "bar",
        })
      )
    })

    it("4. a altura contém o fio e a área segura, e bate com --mobile-header-offset", () => {
      const base = topBarVariants({})
      expect(base).toContain(
        "h-[calc(var(--top-bar-h)+var(--top-bar-safe,0px))]"
      )
      expect(base).toContain("pt-[var(--top-bar-safe,0px)]")
      expect(base).not.toMatch(/\bbox-content\b/)

      // A área segura passa por `--top-bar-safe-area`.
      expect(base).toContain("[--top-bar-safe-area:env(safe-area-inset-top,0px)]")
      const safe = "[--top-bar-safe:var(--top-bar-safe-area)]"
      expect(topBarVariants({ position: "fixed" })).toContain(safe)
      expect(topBarVariants({ position: "auto" })).toContain(`max-md:${safe}`)
      expect(topBarVariants({ position: "sticky" })).not.toContain(safe)

      // O token que a casca do app usa para empurrar o conteúdo é o degrau
      // padrão mais a mesma área segura — sem o 1px do fio por fora.
      const token = CSS.match(
        /--mobile-header-offset:\s*calc\(([\d.]+)rem \+ env\(safe-area-inset-top, 0px\)\)/
      )
      expect(token, "o token mudou de forma").not.toBeNull()
      expect(Number(token![1])).toBe(alturaEm(topBarVariants({})))
    })

    it("5. grudada fica abaixo da faixa de aviso; fixa fica na camada do cabeçalho", () => {
      expect(topBarVariants({ position: "sticky" })).toContain("z-(--z-sticky)")
      expect(topBarVariants({ position: "sticky" })).not.toContain("--z-header")
      expect(topBarVariants({ position: "fixed" })).toContain("z-(--z-header)")
      const auto = topBarVariants({ position: "auto" })
      expect(auto).toContain("max-md:z-(--z-header)")
      expect(auto).toContain("md:z-(--z-sticky)")
      for (const position of POSICOES) {
        expect(topBarVariants({ position })).not.toMatch(/\bz-(?:\d|\[)/)
      }
    })

    it("6. o vidro é a régua de barra, e o arquivo não escreve borrão próprio", () => {
      expect(topBarVariants({ surface: "glass" })).toContain(barSurfaceClassName)
      expect(topBarVariants({ surface: "solid" })).toContain("bg-background")
      expect(topBarVariants({ surface: "solid" })).not.toContain("glass-surface")
      expect(CODIGO).not.toMatch(/\bbackdrop-blur/)
    })

    it("6b. `edge` é a borda do iOS: sem tinta chapada, sem fio, camadas da régua de vidro", () => {
      const borda = topBarVariants({ surface: "edge" })
      expect(borda).toContain("border-b-0")
      expect(borda).toContain("supports-backdrop-filter:bg-transparent")
      expect(borda).toContain("reduced-transparency:bg-background")
      // A barra não veste borrão: seria a raiz do borrão das camadas, que só veriam ela.
      expect(borda).not.toContain("glass-surface")
      expect(CODIGO).toContain("barEdgeLayerClassNames.map(")
      expect(barEdgeLayerClassNames).toHaveLength(3)
      expect(barEdgeLayerBaseClassName).toContain("h-[calc(100%+--spacing(6))]")
      expect(barEdgeLayerBaseClassName).toContain("reduced-transparency:hidden")
      expect(fonte("src/components/layout/app-header.tsx")).toContain('surface="edge"')
    })

    it("7. `scroll` escolhe entre as duas pinturas inteiras, e nada é montado", () => {
      expect(CODIGO).toMatch(/rolou \? "glass" : "solid"/)
    })

    it("8. o fio é o da variante da barra lateral, com 1px fora dela", () => {
      expect(topBarVariants({})).toContain(
        "border-b-[length:var(--sidebar-inset-rule,1px)]"
      )
    })

    it("10. o título é o da barra de exemplo da página da Sidebar", () => {
      const titulo = CODIGO.slice(
        CODIGO.indexOf('data-slot="top-bar-title"'),
        CODIGO.indexOf("{...props}", CODIGO.indexOf('data-slot="top-bar-title"'))
      )
      expect(titulo.length, "o título não foi achado").toBeGreaterThan(0)
      expect(titulo).toContain("text-sm font-medium")
      expect(titulo).not.toMatch(/\btext-base\b|\bfont-semibold\b/)
    })

    it("11. o vidro arredonda pelo raio da própria barra, não pelo recorte de fora", () => {
      // O `backdrop-filter` ignora o recorte de ancestral: numa caixa arredondada
      // o borrão saía com os cantos de cima quadrados. Só o raio do elemento vale.
      expect(topBarVariants({})).toContain("rounded-t-[var(--top-bar-r,0px)]")
    })

    it("9. a altura fala a curva da barra lateral, e nada fica com a do navegador", () => {
      expect(topBarVariants({})).toContain(
        "duration-(--duration-slow) ease-(--ease-emphasized)"
      )
      expect(CODIGO).not.toContain("ease-linear")
      expect(CODIGO).not.toMatch(/\bduration-\d/)
    })
  })
}

describe("a base da barra", () => {
  it("a base da barra é CSS, não medida", () => {
    const css = lerFonte("src/app/globals.css")
    expect(css).toMatch(/--top-bar-bottom:/)
    for (const f of ["sonner", "toolbar", "page-header", "page-section"]) {
      expect(lerFonte(`src/components/ui/${f}.tsx`)).not.toContain("useTopBarBottom")
    }
  })
})

describe("as ações numa cápsula", () => {
  it("TopBarActionGroup é o ButtonGroup com um anel só e sem divisor, e join diz de que lado cola", () => {
    const peca = CODIGO.slice(CODIGO.indexOf("const CAPSULA_COLA"), CODIGO.indexOf("const TOP_BAR_SEARCH_PLATE"))
    expect(peca).toContain("<ButtonGroup")
    expect(peca).toContain('data-slot="top-bar-action-group"')
    expect(peca).toContain('join = "always"')
    expect(peca).toContain('"*:before:hidden *:ml-0!"')
    // O anel é do grupo onde cola; o de cada botão desenhava uma linha na emenda.
    expect(peca).toContain('always: "rounded-full ring-1 ring-foreground/10 max-md:ring-foreground/15 *:ring-0!"')
    // Do outro lado da quebra, o botão que sobra é um círculo solto com o próprio anel.
    expect(peca).toContain("md:*:ring-0! max-md:gap-1 max-md:*:rounded-full!")
    expect(peca).toContain("max-md:*:ring-0! md:gap-1 md:*:rounded-full!")
  })

  it("o cabeçalho do app escolhe a busca pela preferência do aparelho", () => {
    const cabecalho = fonte("src/components/layout/app-header.tsx")
    expect(cabecalho).toContain("useBuscaDoCabecalho()")
    expect(cabecalho).toMatch(/busca === "botao" \? \(\s*<TopBarActionGroup>\s*\{lupa\(\)\}\s*<NotificationBellButton \/>/)
    expect(cabecalho).not.toContain("teste-ab")
  })

  it("no telefone o sino fica à esquerda (o voltar o substitui) e a lupa cola no filtro da tela, à direita", () => {
    const cabecalho = fonte("src/components/layout/app-header.tsx")
    expect(cabecalho).toMatch(/<PageHeaderBack[\s\S]*?\) : \(\s*<NotificationBellButton \/>/)
    // A cápsula é a mesma com ou sem filtro: ele pinga da lupa (`morph`).
    expect(cabecalho).toMatch(/<TopBarActionGroup\s+morph[^>]*>\s*\{lupa\(true\)\}\s*\{filtroNoCabecalho\}/)
    // Uma sondagem só, embora o sino desenhe nas duas pontas.
    expect(cabecalho).toContain("useUnreadBellCount()")
    expect(cabecalho).not.toContain("<NotificationBellLink")
    // As barras com filtro o publicam, e não desenham o próprio no telefone.
    const transacoes = fonte("src/components/transactions/transactions-toolbar.tsx")
    expect(transacoes).toContain("usePageChromeFilter(")
    expect(transacoes).toMatch(/<ToolbarFilterButton[\s\S]*?className=\{cn\(headerFilter && "max-md:hidden"\)\}/)
    const contas = fonte("src/components/bills/bills-toolbar.tsx")
    expect(contas).toContain("usePageChromeFilter(")
    expect(contas).not.toContain("<ToolbarFilterButton")
    // O mês das telas que o têm também vai ao cabeçalho, como calendário; a faixa do telefone saiu.
    for (const tela of [
      "src/app/(app)/dashboard/page-client.tsx",
      "src/app/(app)/categories/page-client.tsx",
      "src/app/(app)/categories/[categoryId]/page-client.tsx",
    ]) {
      const fonteDaTela = fonte(tela)
      expect(fonteDaTela, tela).toContain("useMonthInHeader(")
      expect(fonteDaTela, tela).not.toContain("mobileTriggerFullWidth")
    }
    // No detalhe da categoria o mês leva o cabeçalho, e o filtro dos lançamentos fica na barra.
    expect(fonte("src/components/categories/detail/category-embedded-transactions.tsx")).toContain("headerFilter={false}")
    // O filtro sai do cabeçalho quando a tela sai.
    expect(fonte("src/components/layout/page-chrome-provider.tsx")).toContain("return () => setFilter(null)")
  })

  it("no telefone a busca nasce da lupa do header", () => {
    const cabecalho = fonte("src/components/layout/app-header.tsx")
    expect(cabecalho).toContain("const lupaRef = React.useRef<HTMLButtonElement>(null)")
    expect(cabecalho).toMatch(/<AppCommandPalette[^>]*origin=\{lupaRef\}/)
    const paleta = fonte("src/components/layout/app-command-palette.tsx")
    expect(paleta).toContain("origin?: React.RefObject<HTMLElement | null>")
    expect(paleta).toMatch(/<CommandDialog[\s\S]*?origin=\{origin\}/)
  })
})


describe("TopBarActionSwap", () => {
  const peca = CODIGO.slice(CODIGO.indexOf("function TopBarActionSwap("), CODIGO.indexOf("const CAPSULA_COLA"))

  it("existe, é exportada e é o próprio vidro", () => {
    expect(CODIGO).toContain("function TopBarActionSwap(")
    expect(CODIGO).toMatch(/export \{[\s\S]*\bTopBarActionSwap,[\s\S]*\}/)
    expect(peca).toContain('data-slot="top-bar-action-swap"')
    expect(peca).toContain("TOP_BAR_PLATE")
    expect(peca).toContain("size-11")
  })

  it("o quadro da troca na MOLA, do progresso guardado, e o que sai fica inerte por cima", () => {
    for (const parte of ["quadroDaTroca(", "MOLA", "useReducedMotion", "inert", "aria-hidden", "pointer-events-none"]) {
      expect(peca).toContain(parte)
    }
    // A interrupção segue do progresso atual, e não do zero.
    expect(peca).toMatch(/animate\(\s*\w+\.current/)
  })

  it("sem caixa (a árvore do telefone escondida) troca na hora", () => {
    expect(peca).toContain("offsetWidth === 0")
  })

  it("montar não anima: a troca nasce da chave que já montou, e nenhum efeito anima pela swapKey", () => {
    expect(peca).toMatch(/montou|primeiro/)
    expect(peca).not.toMatch(/use(Layout)?Effect\([\s\S]*?\[[^\]]*\bswapKey\b[^\]]*\]\)/)
  })

  it("interrompida, não pula: cada miolo parte do quadro em que estava, e antes do meio o que sai segue saindo", () => {
    expect(peca).toContain("lerMiolo(sai,")
    expect(peca).toContain("lerMiolo(entra,")
    expect(peca).toMatch(/misturar\(deSai, f\.sai, t\)/)
    expect(peca).toContain("suave(p, [p0, p0 + 0.25])")
    expect(peca).toContain("saindo && !passouDoMeio && swapKey !== saindo.chave ? saindo : montou")
    // Quem desmonta com o foco o passa ao que entra.
    expect(peca).toContain("ref={guardarFoco}")
  })

  it("o miolo que saiu desmonta antes de o repouso o limpar, no mesmo quadro", () => {
    expect(peca).toMatch(/flushSync\(\(\) => \{\s*setSaindo\(null\)\s*setPassouDoMeio\(false\)\s*\}\)\s*repouso\(\)/)
  })

  it("o botão de dentro acende com o realce do vidro, e não o da variante", () => {
    const realce = CODIGO.match(/const TOP_BAR_PLATE =\s*"[^"]*(\[--button-hover-fill:[^\]\s]+\])/)?.[1]
    expect(realce).toBeTruthy()
    expect(CODIGO).toContain(`const REALCE_DO_VIDRO_NO_MIOLO =\n  "[&_[data-variant]]:${realce}"`)
    expect(peca).toContain("TOP_BAR_PLATE, REALCE_DO_VIDRO_NO_MIOLO")
  })

  it("a ação dentro da troca não desenha o próprio vidro", () => {
    const acao = CODIGO.slice(CODIGO.indexOf("function TopBarAction("), CODIGO.indexOf("function TopBarActionSwap("))
    expect(acao).toContain("TopBarSwapContext")
  })
})

describe("TopBarActionGroup morph", () => {
  const grupo = CODIGO.slice(CODIGO.indexOf("function TopBarActionGroup("), CODIGO.indexOf("const TOP_BAR_SEARCH_PLATE"))

  it("aceita um ou dois filhos, com a identidade do segundo", () => {
    for (const parte of ["morph", "trailingKey", "quadroDoVidroQueEstica(", "BALANCO"]) {
      expect(grupo).toContain(parte)
    }
  })

  it("o segundo que sai fica montado, inerte e escondido do leitor, até o gesto acabar", () => {
    expect(grupo).toContain("inert")
    expect(grupo).toContain("aria-hidden")
  })

  it("parte do g guardado, troca na hora sem caixa ou com movimento reduzido, e montar não anima", () => {
    expect(grupo).toMatch(/animate\(\s*\w+\.current/)
    expect(grupo).toContain("offsetWidth === 0")
    expect(grupo).toContain("useReducedMotion")
  })

  it("ao sair, a gota desmonta antes de o repouso limpar os vidros, no mesmo quadro", () => {
    expect(grupo).toMatch(/if \(alvo === 0\) flushSync\(\(\) => setSegundo\(null\)\)\s*repouso\(\)/)
    // No caminho sem mola o estado já esvazia no próprio efeito, antes da pintura.
    expect(grupo).toMatch(/repouso\(\)\s*if \(alvo === 0\) setSegundo\(null\)\s*return/)
  })

  it("o segundo que sai com o foco dentro o passa à lupa antes de ficar inerte", () => {
    expect(grupo).toContain("if (alvo === 0 && filtroEl.contains(el.ownerDocument.activeElement)) lupaEl.querySelector<HTMLElement>(\"button, a\")?.focus()")
  })

  it("a cápsula é um vidro só, o do grupo: a lupa e o filtro não pintam vidro (a emenda de dois borrões era um fio)", () => {
    expect(grupo).toContain("const grupo = React.useRef")
    expect(grupo).toMatch(/TOP_BAR_PLATE,\s*"relative after:/)
    const lupa = grupo.slice(grupo.indexOf('data-slot="top-bar-action-lupa"'), grupo.indexOf('data-slot="top-bar-action-lupa"') + 200)
    const filtro = grupo.slice(grupo.indexOf('data-slot="top-bar-action-drop"'), grupo.indexOf('data-slot="top-bar-action-drop"') + 400)
    expect(lupa).not.toContain("TOP_BAR_PLATE")
    expect(filtro).not.toContain("TOP_BAR_PLATE")
    // Por dentro nada tem borrão: o recorte e o `transform` moram no próprio vidro.
    expect(grupo).toContain('grupo.style.clipPath = "inset(')
  })

  it("o vidro estica sem perder o anel: o do voo é o pseudo-elemento do grupo, na largura do quadro", () => {
    expect(grupo).toContain('grupo.dataset.voo = ""')
    expect(grupo).toContain('grupo.style.setProperty("--vidro-largura"')
    expect(grupo).toContain('grupo.style.setProperty("--vidro-esquerda"')
    expect(grupo).toContain("after:left-(--vidro-esquerda)")
    expect(grupo).toContain("after:w-(--vidro-largura)")
    expect(grupo).toContain("data-voo:after:block")
    expect(grupo).toContain("delete grupo.dataset.voo")
  })

  it("a tinta do voo é uma só, a do header-morph", () => {
    expect(CODIGO).not.toContain("TINTA_DO_VOO =")
    expect(fonte("src/components/ui/command.tsx")).not.toContain("TINTA_DO_VOO =")
    expect(fonte("src/lib/header-morph.ts")).toContain("export const TINTA_DO_VOO =")
    // A gota do cabeçalho voa sem tinta: ela acendia a lupa no primeiro quadro.
    expect(CODIGO).not.toContain("TINTA_DO_VOO")
    expect(CODIGO).not.toContain("backgroundImage")
    expect(fonte("src/components/ui/command.tsx")).toMatch(/import \{[^}]*\bTINTA_DO_VOO\b[^}]*\} from "@\/lib\/header-morph"/)
  })

  it("o catálogo mostra os três estados: só a lupa, lupa + mês, lupa + ajustes", () => {
    const pagina = fonte("src/app/designsystem/docs/top-bar.tsx")
    expect(pagina).toMatch(/<TopBarActionGroup[^>]*\bmorph\b/)
    expect(pagina).toContain("trailingKey=")
  })
})
