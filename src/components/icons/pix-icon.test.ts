import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { lerFonte } from "@/test/fonte"

import { PixIcon } from "./pix-icon"

describe("PixIcon", () => {
  it("é um desenho escondido do leitor, na tinta de quem o contém", () => {
    const svg = renderToStaticMarkup(h(PixIcon))
    expect(svg).toContain('aria-hidden="true"')
    expect(svg).toContain('fill="currentColor"')
    expect(svg).toContain('viewBox="0 0 24 24"')
    expect(svg).toContain('data-slot="icon"')
  })

  it("é um desenho nomeado no auditor", () => {
    expect(lerFonte(".claude/skills/design-system-guard/scripts/audit.mjs")).toContain('"pix-icon"')
  })
})
