import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLinkTitle,
  NavigationMenuList,
  NavigationMenuTrigger,
  noTriangulo,
} from "./navigation-menu"

/** O redesenho do `NavigationMenu`. */

const CODIGO = lerFonte("src/components/ui/navigation-menu.tsx")
const CSS = lerFonte("src/app/globals.css")

const fileira = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    h(
      NavigationMenu,
      props,
      h(NavigationMenuList, null, h(NavigationMenuItem, null, h(NavigationMenuTrigger, null, "Finanças")))
    )
  )

describe("o redesenho do NavigationMenu", () => {
  it("a pílula flutuante e o realce que viaja são o padrão", () => {
    const html = fileira()
    expect(html).toContain('data-variant="floating"')
    expect(CODIGO).toContain('variant = "floating",')
    expect(CODIGO).toContain('indicator = "highlight",')
    expect(CODIGO).toContain("layoutId={`${barId}-realce`}")
    expect(CODIGO).toContain('{ type: "spring", duration: 0.28, bounce: 0.2 }')
    // Só a fileira tem o realce que viaja: os links do painel não.
    expect(CODIGO.match(/layoutId=/g)).toHaveLength(1)
  })

  it("o painel brota no gesto do menu e os links sobem em cascata", () => {
    expect(CODIGO.match(/menu-sprout/g)?.length).toBeGreaterThanOrEqual(2)
    expect(CODIGO).not.toContain("zoom-in-[0.97]")
    expect(CODIGO).toContain('"navigation-menu-reveal"')
    expect(CSS).toMatch(/@utility navigation-menu-reveal \{\s*& > li \{\s*animation: rise 160ms var\(--ease-out\) 40ms both;\s*--rise-distance: 3px;/)
  })

  it("a diagonal segura: o triângulo aceita o caminho até o painel e recusa o resto", () => {
    const de = { x: 0, y: 0 }
    const esq = { x: 100, y: 100 }
    const dir = { x: 300, y: 100 }
    expect(noTriangulo({ x: 100, y: 60 }, de, esq, dir)).toBe(true)
    expect(noTriangulo({ x: 300, y: 10 }, de, esq, dir)).toBe(false)
    // O Radix pula o próprio handler quando o nosso chama `preventDefault`.
    expect(CODIGO).toMatch(/ctx\.aCaminho\(e\.clientX, e\.clientY\)\) \{\s*e\.preventDefault\(\)/)
  })

  it("o aprofundamento: o grupo tem id estável, e o conteúdo reenvia o item ao viewport", () => {
    expect(CODIGO).toContain('const id = value ?? (typeof label === "string" ? label : auto)')
    expect(CODIGO).toContain("<ItemContext.Provider value={item}>\n          <PreviewContext.Provider")
    // Abre no nível da página atual.
    expect(CODIGO).toContain("() => ctx.entradas.find((e) => e.item === item && e.ativo)?.nivel ?? []")
  })

  it("as setas são do painel, na captura; o Esc sobe um nível antes de fechar", () => {
    expect(CODIGO).toContain("onKeyDownCapture={teclas}")
    expect(CODIGO).toContain('e.key === "ArrowLeft" || (e.key === "Escape" && caminho.length > 0)')
  })

  it("o selo do título e o ponto da rota atual no gatilho", () => {
    expect(renderToStaticMarkup(h(NavigationMenuLinkTitle, { badge: "Novo" }, "Cartões"))).toContain("Novo")
    expect(CODIGO).toContain('data-slot="navigation-menu-trigger-current"')
  })

  it("a página não conta o que deixou de ser verdade", () => {
    const doc = lerFonte("src/app/designsystem/docs/navigation-menu.tsx")
    expect(doc).not.toContain("Um item; ancora o painel quando viewport={false}.")
    expect(doc).not.toContain("data-active marca a rota atual")
  })

  it("a âncora mora no estado e chega pela prop style, com o centro de reserva", () => {
    expect(CODIGO).not.toContain(`raiz.style.setProperty("`)
    expect(CODIGO).toContain('"--navigation-menu-anchor-cx": `${ancora.cx}px`')
    expect(CODIGO).toContain("left-[var(--navigation-menu-anchor-cx,50%)]")
    expect(CODIGO).not.toContain("left-(--navigation-menu-anchor-cx)")
  })
})

