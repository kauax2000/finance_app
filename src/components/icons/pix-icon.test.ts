import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CreditCardBrandChip } from "@/components/credit-cards/credit-card-brand-chip"
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

describe("CreditCardBrandChip size=xs", () => {
  it("sem bandeira conhecida não desenha selo", () => {
    expect(renderToStaticMarkup(h(CreditCardBrandChip, { brand: null, size: "xs" }))).toBe("")
    expect(renderToStaticMarkup(h(CreditCardBrandChip, { brand: "Banco X", size: "xs" }))).toBe("")
  })

  it("com bandeira desenha o logo, e o sm segue com a ficha genérica", () => {
    expect(renderToStaticMarkup(h(CreditCardBrandChip, { brand: "Visa", size: "xs" }))).toContain("<svg")
    expect(renderToStaticMarkup(h(CreditCardBrandChip, { brand: null }))).toContain("<svg")
  })
})
