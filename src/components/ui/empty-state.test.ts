import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  EmptyState,
  EmptyStateCode,
  EmptyStateGhost,
  EmptyStateIcon,
  EmptyStateTitle,
} from "./empty-state"

/**
 * O redesign da rodada 131, trancado: a forma diz a situação, e o arco-íris
 * nunca fica sob o texto.
 */
describe("EmptyState", () => {
  it("o primeiro uso não tem arco-íris", () => {
    // Quatro versões dele — atrás dos fantasmas e no contorno — foram
    // recusadas na tela. A marca fica só no numeral das páginas de erro.
    const html = renderToStaticMarkup(h(EmptyState, { variant: "plain", size: "lg" }, h(EmptyStateGhost)))
    expect(html).not.toMatch(/brand|rainbow|empty-state-contour|empty-state-veil/)
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    expect(css).not.toMatch(/@utility empty-state-(veil|contour)/)
  })

  it("os fantasmas são decoração, e o laço não tem emenda", () => {
    const html = renderToStaticMarkup(h(EmptyStateGhost, { leading: "card", trailing: "date" }))
    expect(html).toContain('aria-hidden="true"')
    // Duplicadas, para subir metade da altura cair onde começou.
    expect(html.match(/mb-2 flex h-11/g)?.length).toBe(12)
    // O respiro é margem, e não `gap`: com `gap`, metade da altura cairia no
    // meio de um vão e o laço saltaria meio respiro por volta.
    expect(html).toContain('class="empty-state-drift"')
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    expect(css).toMatch(/@keyframes empty-state-drift \{\s*to \{\s*transform: translateY\(-50%\)/)
    // Em `@utility`, e não em `animate-[…]`: o Tailwind v4 descarta keyframes
    // que nenhuma utility referencia, e os fantasmas ficavam parados.
    expect(css).toMatch(/@utility empty-state-drift \{\s*animation: empty-state-drift/)
  })

  it("o leque põe cada filho num ladrilho, e o círculo segue o padrão", () => {
    const leque = renderToStaticMarkup(
      h(EmptyStateIcon, { variant: "stack" }, h("svg", { key: 1 }), h("svg", { key: 2 }), h("svg", { key: 3 }))
    )
    expect(leque.match(/data-slot="empty-state-icon-tile"/g)?.length).toBe(3)
    // A superfície tonal é só do círculo: no leque quem tem superfície são os
    // ladrilhos.
    expect(leque).not.toMatch(/data-slot="empty-state-icon"[^>]*bg-muted/)

    const circulo = renderToStaticMarkup(h(EmptyStateIcon, null, h("svg")))
    expect(circulo).toContain('data-variant="circle"')
    expect(circulo).toContain("bg-muted")
    expect(circulo).not.toContain("empty-state-icon-tile")
  })

  it("o numeral é decoração; quem diz o que houve é o título", () => {
    const html = renderToStaticMarkup(h(EmptyStateCode, null, "Ops!"))
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain("brand-rainbow-image")
  })

  it("na página de erro o título veste o H1 do sistema", () => {
    const html = renderToStaticMarkup(
      h(EmptyState, { size: "page" }, h(EmptyStateTitle, null, "Página não encontrada"))
    )
    expect(html).toContain('data-slot="empty-state-title"')
    expect(html).toContain("page-title")
    // Nasce `<h1>`: com `asChild` vindo de um server component, o `Slot`
    // recebia uma referência preguiçosa e o título sumia.
    expect(html).toMatch(/^<div[^>]*><h1 /)
  })
})
