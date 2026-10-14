import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { PresenceCursor } from "./presence-cursor"

/** O `PresenceCursor`: o par de identidade, o decorativo, o movimento e as proibições. */

const CODIGO = semComentarios(lerFonte("src/components/ui/presence-cursor.tsx"))

const cursor = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(PresenceCursor, { name: "Você", tone: 3, at: { x: 40, y: 24 }, ...props } as never))

const classeDo = (html: string, slot: string) => {
  const tag = html.match(new RegExp(`<[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ""
  return tag.match(/class="([^"]*)"/)?.[1] ?? ""
}

describe("PresenceCursor", () => {
  it("é decorativo: aria-hidden e sem ponteiro", () => {
    const html = cursor({})
    expect(html).toMatch(/<div[^>]*aria-hidden="true"[^>]*data-slot="presence-cursor"/)
    expect(classeDo(html, "presence-cursor")).toContain("pointer-events-none")
  })

  it("a família vira a utility identity-N, por extenso, nas seis", () => {
    for (const tone of [1, 2, 3, 4, 5, 6]) {
      const html = cursor({ tone })
      expect(classeDo(html, "presence-cursor")).toMatch(new RegExp(`(^|\\s)identity-${tone}(\\s|$)`))
      expect(html).toContain(`data-tone="${tone}"`)
    }
  })

  it("a pílula pinta o par de identidade: a superfície e a tinta do sistema", () => {
    const pilula = classeDo(cursor({}), "presence-cursor-name")
    expect(pilula).toContain("bg-(--identity-surface)")
    expect(pilula).toContain("text-identity-foreground")
    expect(pilula).toMatch(/rounded-full rounded-tl-xs/)
    expect(cursor({ name: "Ana" })).toContain(">Ana</span>")
  })

  it("a pílula tem borda em token e teto de largura: anel da tinta a 15% e max-w-40 truncado", () => {
    const pilula = classeDo(cursor({}), "presence-cursor-name")
    expect(pilula).toMatch(/(^|\s)ring-1(\s|$)/)
    expect(pilula).toMatch(/(^|\s)ring-identity-foreground\/15(\s|$)/)
    expect(pilula).toMatch(/(^|\s)max-w-40(\s|$)/)
    expect(pilula).toMatch(/(^|\s)truncate(\s|$)/)
  })

  it("a seta desenhada usa a mesma superfície, contornada na tinta", () => {
    const seta = classeDo(cursor({}), "presence-cursor-arrow")
    expect(seta).toContain("fill-(--identity-surface)")
    expect(seta).toContain("stroke-identity-foreground")
  })

  it("a ponta pousa em at, no pai posicionado", () => {
    expect(cursor({ at: { x: 120, y: 64 } })).toMatch(/style="[^"]*left:120px;top:64px/)
    expect(classeDo(cursor({}), "presence-cursor")).toMatch(/(^|\s)absolute(\s|$)/)
  })

  it("pressed publica o estado", () => {
    expect(cursor({ pressed: true })).toContain('data-pressed="true"')
    expect(cursor({})).not.toContain("data-pressed")
  })
})

describe("PresenceCursor — o fonte", () => {
  it("anda pela projeção de layout na mola, e pula com movimento reduzido", () => {
    expect(CODIGO).toContain('layout="position"')
    expect(CODIGO).toContain("useReducedMotion()")
    expect(CODIGO).toMatch(/layout: reduzido \? INSTANTE : MOLA/)
    expect(CODIGO).toMatch(/animate\(eixo, 0, MOLA\)/)
    // Sem deslocamento de entrada no movimento reduzido.
    expect(CODIGO).toMatch(/if \(!el \|\| !pai \|\| !from \|\| reduzido\) return/)
  })

  it("o clique encolhe e volta na mola", () => {
    expect(CODIGO).toMatch(/animate=\{\{ scale: pressed \? 0\.85 : 1 \}\}/)
    expect(CODIGO).toMatch(/transition=\{reduzido \? INSTANTE : MOLA\}/)
  })

  it("proíbe rAF, ouvinte no document, instanceof e cor crua", () => {
    expect(CODIGO).not.toContain("requestAnimationFrame")
    expect(CODIGO).not.toContain("document.addEventListener")
    expect(CODIGO).not.toMatch(/\binstanceof\b/)
    expect(CODIGO).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(|hsl\(|\b(?:bg|text|fill|stroke)-(?:white|black|gray|zinc|neutral|slate|red|green|blue)-?/i)
    expect(CODIGO).not.toMatch(/\bidentity-\$\{/)
  })
})
