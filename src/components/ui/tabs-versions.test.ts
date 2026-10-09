import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

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
} from "./tabs"

/** A rodada 226: o `floating` sem sombra como padrão e as versões novas. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const TABS = fonte("src/components/ui/tabs.tsx")
const LIQUIDO = fonte("src/lib/liquid-move.ts")

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
    expect(TABS).toContain('from "@/lib/liquid-move"')
    expect(fonte("src/components/ui/theme-toggle.tsx")).toContain('from "@/lib/liquid-move"')
    expect(LIQUIDO).toContain('export const TRAJETO = { duration: 400, easing: "cubic-bezier(1,0,0.4,1)" }')
    expect(LIQUIDO).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")')
    // Proporcional às abas andadas, um pouco mais macio que o alternador.
    expect(TABS).toContain("Math.min(0.18, passo > 0 ? (andado / passo) * 0.09 : 0.09)")
    // Desde a rodada 230 o trajeto macio mora na lib, e o BottomBar o divide.
    expect(TABS).toContain("const TRAJETO_DAS_ABAS = TRAJETO_MACIO")
    expect(LIQUIDO).toContain('export const TRAJETO_MACIO = { duration: 480, easing: "cubic-bezier(0.65,0,0.25,1)" }')
    // O esticão acompanha o trajeto, para continuar em fase.
    expect(LIQUIDO).toContain("duration: Math.round(trajeto.duration / VIRADA)")
    // A viagem só acontece quando a aba muda, e não num redimensionamento.
    expect(TABS).toContain("antes.el !== ativa")
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
      const codigo = fonte(arquivo)
      expect(codigo, arquivo).not.toMatch(/<TabsList[^>]*variant="solid"/)
      expect(codigo, arquivo).not.toMatch(/<TabsTrigger[^>]*className="[^"]*\b(h-\d|rounded-|bg-)/)
    }
    expect(fonte("src/components/bills/bill-detail-history-list.tsx")).toContain("count={")
  })
})
