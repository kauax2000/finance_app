import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  Tabs,
  TabsAdd,
  TabsContent,
  TabsList,
  TabsNav,
  TabsNavLink,
  TabsTrigger,
  defaultTabsSize,
  tabsIndicatorVariants,
  tabsListFrameVariants,
  tabsTriggerVariants,
  ALTURA_CLASS,
  TABS_SIZES,
  TABS_TRAY_HEIGHTS,
  tabsListTrackVariants,
} from "./tabs"

/** O `floating` sem sombra como padrão e as versões novas. */

const TABS = lerFonte("src/components/ui/tabs.tsx")
const LIQUIDO = lerFonte("src/lib/liquid-move.ts")
/** A medição e a viagem moram num hook só, com o BottomBar e o ToggleGroup. */
const MARCADOR = lerFonte("src/hooks/use-marcador.ts")

const render = (...filhos: ReturnType<typeof h>[]) =>
  renderToStaticMarkup(h(Tabs, { defaultValue: "a" }, ...filhos))

describe("o floating, padrão do sistema", () => {
  it("é a pílula com anel, chapada e sem sombra atrás", () => {
    const padrao = tabsListFrameVariants({})
    expect(padrao).toBe(tabsListFrameVariants({ variant: "floating" }))
    expect(padrao).toContain("rounded-full bg-popover ring-1 ring-foreground/10")
    expect(padrao).not.toMatch(/\bshadow-/)
    expect(padrao).not.toContain("glass")
    expect(TABS).toContain('variant = "floating"')
  })

  it("o marcador é a tecla em relevo — a sombra é dele, não da bandeja", () => {
    const marcador = tabsIndicatorVariants({})
    expect(marcador).toContain("rounded-full")
    expect(marcador).toContain("bg-muted ring-1 ring-foreground/10 shadow-xs")
    expect(tabsTriggerVariants({})).toContain("rounded-full")
  })

  it("é controle segmentado: mede 32 e estica, como o solid", () => {
    expect(defaultTabsSize("floating")).toBe("md")
    const html = render(h(TabsList, null, h(TabsTrigger, { value: "a" }, "A")))
    expect(html).toContain("flex-1")
  })

  it("o marcador corre com a receita do ThemeToggle, que mora numa lib só", () => {
    expect(TABS).toContain('from "@/hooks/use-marcador"')
    expect(MARCADOR).toContain('from "@/lib/liquid-move"')
    expect(lerFonte("src/components/ui/theme-toggle.tsx")).toContain('from "@/lib/liquid-move"')
    expect(LIQUIDO).toContain('export const TRAJETO = { duration: 400, easing: "cubic-bezier(1,0,0.4,1)" }')
    expect(LIQUIDO).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")')
    // Proporcional às abas andadas, um pouco mais macio que o alternador.
    expect(MARCADOR).toContain("Math.min(0.18, passo > 0 ? (andado / passo) * 0.09 : 0.09)")
    // O trajeto macio mora na lib, e o BottomBar o divide.
    expect(MARCADOR).toContain("trajeto: TRAJETO_MACIO")
    expect(LIQUIDO).toContain('export const TRAJETO_MACIO = { duration: 480, easing: "cubic-bezier(0.65,0,0.25,1)" }')
    // O esticão acompanha o trajeto, para continuar em fase.
    expect(LIQUIDO).toContain("duration: Math.round(trajeto.duration / VIRADA)")
    // A viagem só acontece quando a aba muda, e não num redimensionamento.
    expect(MARCADOR).toContain("antes.el !== ativa")
  })
})

describe("a vertical", () => {
  it("não estica: a coluna fica na largura das abas, e a pílula vira placa", () => {
    const html = renderToStaticMarkup(
      h(Tabs, { defaultValue: "a", orientation: "vertical" },
        h(TabsList, null, h(TabsTrigger, { value: "a" }, "A"), h(TabsTrigger, { value: "b" }, "B"))
      )
    )
    expect(html).not.toContain("flex-1")
    expect(html).toMatch(/data-slot="tabs-list-frame"[^>]*w-fit/)
    expect(tabsListFrameVariants({})).toContain("data-[orientation=vertical]:rounded-surface")
    expect(tabsListFrameVariants({})).toContain("data-[orientation=vertical]:self-start")
    expect(TABS).toContain('scrollable || overflow || orientation === "vertical"')
  })
})

describe("as peças", () => {
  it("o ⋯ tem a altura da aba de cada degrau, não a da bandeja", () => {
    // icon-xs 24 · icon-sm 28 · icon-md 32 · icon-lg 36, a escada do Button.
    const icone = { "icon-xs": 24, "icon-sm": 28, "icon-md": 32, "icon-lg": 36 } as const
    const mapa = /const MAIS_POR_DEGRAU = \{ sm: "(icon-\w+)", md: "(icon-\w+)", lg: "(icon-\w+)", xl: "(icon-\w+)" \}/.exec(TABS)
    expect(mapa).not.toBeNull()
    const [, sm, md, lg, xl] = mapa as unknown as (keyof typeof icone)[]
    expect([icone[sm], icone[md], icone[lg], icone[xl]]).toEqual([
      TABS_SIZES.sm.trigger,
      TABS_SIZES.md.trigger,
      TABS_SIZES.lg.trigger,
      TABS_SIZES.xl.trigger,
    ])
    expect(TABS).toContain("size={MAIS_POR_DEGRAU[size]}")
  })

  it("a contagem entra no nome com um espaço de verdade", () => {
    const html = render(h(TabsList, null, h(TabsTrigger, { value: "a", count: 8 }, "Ativas")))
    expect(html).toMatch(/Ativas <span data-slot="tabs-count"[^>]*>8<\/span>/)
  })

  it("a aba que fecha: o × é só do ponteiro, e Delete fecha", () => {
    const html = render(h(TabsList, null, h(TabsTrigger, { value: "a", onClose: () => undefined }, "Março")))
    expect(html).toContain('aria-keyshortcuts="Delete"')
    expect(html).toMatch(/<span aria-hidden="true" data-slot="tabs-close"/)
  })

  it("o + mora no `end`, fora do tablist", () => {
    const html = render(h(TabsList, { end: h(TabsAdd, { label: "Nova" }) }, h(TabsTrigger, { value: "a" }, "A")))
    const fimDaLista = html.indexOf("</div>", html.indexOf('role="tablist"'))
    expect(html.indexOf('data-slot="tabs-add"')).toBeGreaterThan(fimDaLista)
    expect(html).toContain('aria-label="Nova"')
  })

  it("a navegação é link com aria-current, e nunca role=tab", () => {
    const html = renderToStaticMarkup(
      h(TabsNav, { "aria-label": "Seções" },
        h(TabsNavLink, { href: "/a", active: true }, "A"),
        h(TabsNavLink, { href: "/b" }, "B")
      )
    )
    expect(html).toContain("<nav")
    expect(html).toContain('aria-current="page"')
    expect(html).not.toContain('role="tab"')
  })

  it("o painel mantido fica montado e escondido", () => {
    const html = render(
      h(TabsList, null, h(TabsTrigger, { value: "a" }, "A"), h(TabsTrigger, { value: "b" }, "B")),
      h(TabsContent, { value: "a", keepMounted: true }, "um")
    )
    expect(html).toContain("data-[state=inactive]:hidden")
  })
})

describe("o estado na raiz", () => {
  it("o painel desliza do lado para onde a aba andou", () => {
    expect(TABS).toContain("Math.sign(para - de)")
    expect(TABS).toContain("data-[state=active]:slide-in-from-right-3")
    expect(TABS).toContain("data-[state=active]:slide-in-from-left-3")
  })

  it("a URL: lida depois da hidratação, gravada com replaceState, e a de fábrica não suja", () => {
    expect(TABS).toContain("new URLSearchParams(window.location.search).get(urlParam)")
    expect(TABS).toContain("window.history.replaceState(")
    expect(TABS).toContain("if (!params.has(urlParam) && value === defaultValue) return")
    expect(TABS).not.toMatch(/useSearchParams\(/)
  })

  it("os atalhos são ⌥1–9, pelo `code`, e fora de campo de texto", () => {
    expect(TABS).toContain("/^Digit([1-9])$/.exec(e.code)")
    expect(TABS).toContain("if (!e.altKey || e.metaKey || e.ctrlKey || isEditableTarget(e.target)) return")
  })

  it("arrastar troca de aba só de lado, e o painel deixa a rolagem vertical", () => {
    expect(TABS).toContain("Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5")
    expect(TABS).toContain('swipe && "touch-pan-y"')
  })
})

describe("o app", () => {
  it("as seis telas vestem o padrão, sem pintar a fileira à mão", () => {
    for (const arquivo of [
      "src/components/credit-cards/credit-cards-view-segment.tsx",
      "src/components/subscriptions/subscriptions-toolbar.tsx",
      "src/components/transactions/transaction-type-segment.tsx",
      "src/components/bills/bill-detail-history-list.tsx",
      "src/components/bills/bills-toolbar.tsx",
      "src/components/categories/detail/category-detail-trends.tsx",
    ]) {
      const codigo = lerFonte(arquivo)
      expect(codigo, arquivo).not.toMatch(/<TabsList[^>]*variant="solid"/)
      expect(codigo, arquivo).not.toMatch(/<TabsTrigger[^>]*className="[^"]*\b(h-\d|rounded-|bg-)/)
    }
    expect(lerFonte("src/components/bills/bill-detail-history-list.tsx")).toContain("count={")
  })
})

/**
 * A escada do `Tabs`, trancada. O defeito: o gatilho media 27px porque a altura era declarada
 * no contêiner (`h-9` com `p-1`) e o gatilho era um resto de subtração. A escada nomeia o
 * gatilho e o contêiner cresce em volta. Segue o idioma de `tailwind-hover-policy.test.ts`:
 * política do design system trancada por asserção.
 */

const SIZES = ["sm", "md", "lg", "xl"] as const
const VARIANTS = ["floating", "solid", "underline", "plain"] as const

/** O piso da escada de controles: `xs` (24) é para dentro de outro controle. */
const PISO = 28

/** `(?:^|\s)` e não `\b`: `\b` casaria dentro de `min-h-11`. */
const DECLARA_ALTURA = /(?:^|\s)h-(?!full\b)/

const FONTE = lerFonte("src/components/ui/tabs.tsx")

describe("a escada mede a bandeja", () => {
  it("a bandeja nunca desce do piso de 28 — o gatilho pode, e deve", () => {
    for (const size of SIZES) {
      // A bandeja é o controle que se posiciona: ela respeita o piso.
      expect(TABS_TRAY_HEIGHTS[size]).toBeGreaterThanOrEqual(PISO)
    }
    // O gatilho de `sm` cai a 24 — o degrau `xs`, que a escada do sistema
    // reserva justamente para "dentro de outro controle". É onde ele está.
    expect(TABS_SIZES.sm.trigger).toBe(24)
  })

  it("os nomes batem com os do resto do sistema", () => {
    // A **bandeja** é o que `Button`, `Input`, `SelectTrigger` e
    // `NativeSelect` chamam pelos mesmos nomes — porque é ela a caixa que um
    // layout posiciona. O gatilho é peça interna e deriva.
    expect(TABS_TRAY_HEIGHTS).toEqual({ sm: 28, md: 32, lg: 36, xl: 40 })
    expect(SIZES.map((s) => TABS_SIZES[s].trigger)).toEqual([24, 28, 32, 36])
  })

  it("o gatilho declara a classe de altura da sua derivada", () => {
    const classe = { 24: "h-6", 28: "h-7", 32: "h-8", 36: "h-9" } as const
    for (const size of SIZES) {
      expect(tabsTriggerVariants({ size })).toContain(
        classe[TABS_SIZES[size].trigger]
      )
    }
  })
})

describe("quem declara a altura é a moldura", () => {
  /**
   * A moldura declara a altura (gatilho + bandeja), e os dois números são degraus reais e
   * continuam escritos.
   */
  it("a moldura declara a bandeja — e só na horizontal", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const classe = tabsListFrameVariants({ variant, size })
        // A altura existe…
        expect(classe).toMatch(/data-\[orientation=horizontal\]:h-\d/)
        // …e **nunca** solta: na vertical `size` não significa altura, e uma
        // classe incondicional deixava a moldura com 36px para 106px de
        // conteúdo, com o fio parado ao lado da primeira aba.
        expect(classe).not.toMatch(DECLARA_ALTURA)
      }
      expect(tabsListTrackVariants({ variant })).not.toMatch(DECLARA_ALTURA)
    }
  })

  it("o gatilho não mede por porcentagem do pai — a forma exata do defeito", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        expect(tabsTriggerVariants({ variant, size })).not.toContain("calc(100%")
      }
    }
  })

  it("`h-[calc(100%…)]` não volta ao fonte por outro caminho", () => {
    // Sem os comentários: o arquivo **descreve** o defeito antigo, e um guarda
    // que lê prosa proibiria o componente de explicar a própria história.
    expect(semComentarios(FONTE, "linha-inteira")).not.toMatch(/h-\[calc\(100%/)
  })
})

describe("o anel de foco é o do sistema", () => {
  it("`ring-3`, e não o `ring-2` que só o Tabs usava", () => {
    const classes = tabsTriggerVariants({})
    expect(classes).toContain("focus-visible:ring-3")
    expect(classes).not.toContain("focus-visible:ring-2")
  })
})

describe("o marcador viaja com os tokens do sistema", () => {
  const VARIANTS_ = ["floating", "solid", "underline", "plain"] as const

  it("a viagem é a do ThemeToggle, em WAAPI — e nenhuma transição de CSS disputa com ela", () => {
    // O marcador corre pela receita de `lib/liquid-move`; uma transição de CSS em
    // `translate`/`width` correria junto e as duas brigariam.
    for (const variant of VARIANTS_) {
      const classes = tabsIndicatorVariants({ variant })
      expect(classes).not.toMatch(/transition-\[translate/)
      expect(classes).not.toMatch(/\bduration-\d/)
    }
    expect(FONTE).toContain('prefixo: "tabs-indicator"')
    expect(MARCADOR).toContain("viajarLiquido(peca, antes.caixa, caixa")
  })

  it("a caixa vem das quatro variáveis publicadas pela trilha", () => {
    const classes = tabsIndicatorVariants({})
    for (const eixo of ["x", "y", "w", "h"]) {
      expect(classes).toContain(`--tabs-indicator-${eixo}`)
    }
  })

  it("não usa camada negativa — ela o esconderia atrás da moldura", () => {
    // A moldura pinta `bg-muted` e não cria contexto de empilhamento, então um
    // `-z-*` mandaria o marcador para trás dela. A ordem no DOM já resolve.
    for (const variant of VARIANTS_) {
      expect(tabsIndicatorVariants({ variant })).not.toMatch(/-z-\d/)
    }
  })

  it("o rótulo do gatilho compartilha o relógio do marcador", () => {
    // Relógios diferentes fariam a aba acender antes de o realce chegar.
    const classes = tabsTriggerVariants({})
    expect(classes).toContain("duration-(--duration-base)")
    expect(classes).toContain("ease-(--ease-out)")
  })
})

describe("a escada do Tabs — `size` nomeia a bandeja", () => {
  /**
   * `size="md"` entregava um componente de 40 numa linha de controles de 32; a promessa da casa
   * ("alinha sem ninguém dizer `size`") valia em todo controle menos aqui.
   */
  const ESCADA = [24, 28, 32, 36, 40] as const
  const DEGRAUS = ["sm", "md", "lg", "xl"] as const

  it("1. os oito números são degraus da escada — nenhum é inventado", () => {
    for (const size of DEGRAUS) {
      expect(ESCADA).toContain(TABS_SIZES[size].tray)
      expect(ESCADA).toContain(TABS_SIZES[size].trigger)
    }
  })

  it("2. `md` é 32 — a mesma altura de um `Button md`", () => {
    // É a promessa da casa: alinha sem `size`.
    expect(TABS_SIZES.md.tray).toBe(32)
    expect(TABS_TRAY_HEIGHTS.md).toBe(32)
  })

  it("3. o gatilho deriva da bandeja, sempre", () => {
    for (const size of DEGRAUS) {
      expect(TABS_SIZES[size].trigger).toBe(TABS_SIZES[size].tray - 4)
    }
  })

  it("6. o piso de toque é o degrau que a Toolbar publica", () => {
    // A `Toolbar` vai a 40 no ponteiro grosso e a bandeja acompanha; `pointer-coarse:min-h-11`
    // não volta.
    expect(TABS_SIZES.xl.tray).toBe(40)
    const fonte = FONTE.replace(/\/\*[\s\S]*?\*\//g, "")
    expect(fonte).not.toContain("min-h-11")
    expect(fonte).toContain("pointer-coarse:")
  })

  it("7. os literais de altura batem com a escada — e são literais", () => {
    // Classe montada por template literal ficava no elemento e nunca chegava ao CSS; as classes
    // são escritas por extenso e este teste garante que não divergem da tabela.
    for (const size of DEGRAUS) {
      expect(tabsListFrameVariants({ size })).toContain(
        `data-[orientation=horizontal]:${ALTURA_CLASS[TABS_SIZES[size].tray]}`
      )
      expect(tabsTriggerVariants({ size })).toContain(
        ALTURA_CLASS[TABS_SIZES[size].trigger]
      )
    }
    const piso = ALTURA_CLASS[TABS_SIZES.xl.tray]
    for (const size of ["sm", "md", "lg"] as const) {
      expect(tabsListFrameVariants({ size })).toContain(
        `pointer-coarse:data-[orientation=horizontal]:${piso}`
      )
    }
  })

  it("8. cada variante tem o seu degrau padrão — as três não são a mesma coisa", () => {
    // Sem `size` declarado, `solid`, `underline` e `plain` saíam idênticos.
    expect(defaultTabsSize("solid")).toBe("md")
    expect(defaultTabsSize("underline")).toBe("lg")
    expect(defaultTabsSize("plain")).toBe("lg")

    // `solid` é controle segmentado: a bandeja fica rente a um `Button md`.
    expect(TABS_SIZES[defaultTabsSize("solid")].tray).toBe(32)
    // As abas de página ficam um degrau acima.
    expect(TABS_SIZES[defaultTabsSize("underline")].tray).toBe(36)
  })

  it("9. `lg` e `xl` não carregam o texto miúdo — é a razão do padrão", () => {
    // Se alguém acrescentar `text-control-sm` a `lg`, o motivo de `underline` e
    // `plain` terem padrão `lg` evapora em silêncio: eles vão para lá porque é
    // ali que o rótulo volta ao corpo de texto da página (14px).
    for (const size of ["sm", "md"] as const) {
      expect(tabsTriggerVariants({ size })).toContain("text-control-sm")
    }
    for (const size of ["lg", "xl"] as const) {
      expect(tabsTriggerVariants({ size })).not.toContain("text-control-sm")
    }
  })

  it("10. o recuo é um só, e não voltou a ser eixo", () => {
    expect(FONTE).not.toMatch(/padding\?: TabsPadding/)
  })
})

/**
 * O modo de vidro do marcador: o vidro entra na peça que se move, nunca na bandeja (a 60% no
 * escuro a bandeja deixa de ler como bandeja). O corpo do marcador de vidro é o mesmo do
 * chapado, porque `--glass-tone` é `--background` opaco.
 */
describe("o vidro do marcador do Tabs", () => {
  it("1. o ramo de vidro veste a régua e não escreve o que ela apagaria", () => {
    const vidro = tabsIndicatorVariants({ variant: "solid", glass: true })

    // A régua, e não a classe montada à mão: `glass-classes` é onde as strings
    // moram, porque o Tailwind varre o código como texto.
    expect(vidro).toContain("glass")
    expect(vidro).toContain("glass-control")
    expect(vidro).toContain("[--glass-tone:var(--background)]")

    // **A asserção que prova que é eixo, e não embrulho.** A superfície que o
    // shorthand `background` da utility apagaria simplesmente não é escrita —
    // nada de `bg-background` vivo na lista, nada de `bg-transparent` para
    // desfazê-lo. É a mesma régua da asserção 13 de `glass.test.ts`.
    expect(vidro).not.toContain("bg-background")
    expect(vidro).not.toContain("border-border/80")
    expect(vidro).not.toMatch(/[:\]]bg-transparent|dark:bg-transparent|ring-0\b/)
  })

  it("2. o ramo chapado não se moveu — é o marcador de sempre", () => {
    const chapado = tabsIndicatorVariants({ variant: "solid" })
    expect(chapado).toBe(tabsIndicatorVariants({ variant: "solid", glass: false }))

    for (const classe of [
      "rounded-full",
      "border",
      "border-border/80",
      "bg-background",
      "shadow-xs",
    ]) {
      expect(chapado).toContain(classe)
    }
    expect(chapado).not.toContain("glass")
  })

  it("3. `glass` é no-op fora das variantes segmentadas", () => {
    // No `underline` o marcador é um fio de 2px, sem corpo onde um aro more; o
    // `plain` nunca é montado. O prop não pode vazar para nenhum dos dois — e
    // quem o barra de verdade é a resolução no `TabsList`, checada abaixo.
    for (const variant of ["underline", "plain"] as const) {
      expect(tabsIndicatorVariants({ variant, glass: true })).toBe(
        tabsIndicatorVariants({ variant, glass: false })
      )
    }
    expect(FONTE).toContain("const vidro = glass && SEGMENTADA[variant]")
  })

  it("4. o realce tem o par de toque e vira de direção com o tema", () => {
    const trilha = tabsListTrackVariants({ variant: "solid", glass: true })

    /**
     * Por token, e não por regex sobre a string inteira: o seletor tem colchetes aninhados e um
     * `[^\]]*` para no primeiro `]`.
     */
    const realces = trilha.split(/\s+/).filter((c) => c.includes("--glass-sheen"))
    const claros = realces.filter((c) => !c.startsWith("dark:"))
    const escuros = realces.filter((c) => c.startsWith("dark:"))

    expect(claros).toHaveLength(2)
    expect(escuros).toHaveLength(2)

    // O `:hover` à mão não ganha o `@media (hover: hover)` da variante e grudava no dedo: mora
    // na mídia escrita à mão, com o par `:active` (a regra H não alcança um `cva`).
    for (const grupo of [claros, escuros]) {
      expect(grupo.some((c) => c.includes("[@media(hover:hover)]:") && c.includes(":hover]"))).toBe(true)
      expect(grupo.some((c) => c.includes(":active]"))).toBe(true)
    }

    // E o realce vira de direção com o tema: a lâmina clara é 92% branca,
    // então um realce branco ali não desenha nada. Ele puxa na direção do
    // contato — escurece no claro, clareia no escuro. Os `_` são exigência do
    // Tailwind dentro de classe arbitrária, não cosmética.
    for (const c of claros) expect(c).toContain("oklch(0_0_0")
    for (const c of escuros) expect(c).toContain("oklch(1_0_0")

    // Quem acende é o gatilho **ativo**, e não qualquer um: um realce que
    // seguisse o cursor por abas inativas pintaria o marcador que está noutro
    // lugar.
    for (const c of realces) {
      expect(c).toContain("[data-slot=tabs-trigger][data-state=active]")
    }

    // A variável mora na trilha porque o marcador é filho dela. Publicá-la no
    // gatilho não funcionaria: custom property não atravessa para irmão.
    expect(tabsListTrackVariants({ variant: "solid", glass: false })).not.toContain(
      "--glass-sheen"
    )
  })

  it("5. o marcador de vidro continua obedecendo a régua do marcador", () => {
    const vidro = tabsIndicatorVariants({ variant: "solid", glass: true })

    // A caixa continua vindo das quatro variáveis publicadas pela trilha.
    for (const eixo of ["x", "y", "w", "h"]) {
      expect(vidro).toContain(`--tabs-indicator-${eixo}`)
    }
    // Sem camada negativa: ela o mandaria para trás da moldura, que pinta
    // `bg-muted` e não cria contexto de empilhamento.
    expect(vidro).not.toMatch(/-z-\d/)
    // Sem relógio de CSS: a viagem é WAAPI, como no chapado.
    expect(vidro).not.toMatch(/\bduration-\d/)
    // O raio é herdado do próprio marcador: a utility não declara nenhum.
    expect(vidro).toContain("rounded-full")
  })
})
