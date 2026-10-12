import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte } from "@/test/fonte"

import {
  Card,
  CardDescription,
  CardField,
  CardHeader,
  CardLink,
  CardMessage,
  CardSkeleton,
  CardTitle,
} from "./card"

/** As versões do `Card`. */

const html = (el: React.ReactElement) => renderToStaticMarkup(el)
const casco = (props: Record<string, unknown>) => html(h(Card, props, "x"))

describe("as versões do Card", () => {
  it("inativo, selecionado, horizontal e tracejado são eixos próprios", () => {
    const inativo = casco({ inactive: true })
    expect(inativo).toContain("data-inactive")
    expect(inativo).toContain("opacity-80")
    expect(casco({ selected: true })).toMatch(/border-primary-accent\/60/)
    expect(casco({ orientation: "horizontal" })).toMatch(/sm:flex-row/)
    expect(casco({ variant: "dashed" })).toMatch(/border-dashed/)
  })

  it("o título nasce md e a mídia do cabeçalho ocupa a primeira coluna", () => {
    expect(html(h(CardTitle, null, "t"))).toContain('data-size="md"')
    const cabecalho = html(
      h(CardHeader, { media: h("span", null, "i") }, h(CardTitle, null, "t"), h(CardDescription, null, "d"))
    )
    expect(cabecalho).toContain('data-slot="card-header-media"')
    expect(cabecalho).toMatch(/group-has-data-\[slot=card-description\]\/card-header:row-span-2/)
  })

  it("o link esticado cobre o cartão, e o casco ergue os outros botões", () => {
    expect(html(h(CardLink, { href: "/x" }, "ir"))).toMatch(/data-slot="card-link"[^>]*after:absolute after:inset-0/)
    expect(casco({})).toMatch(/has-\[\[data-slot=card-link\]\]:\[&amp;_:is\(button,a,\[role=button\]\):not\(\[data-slot=card-link\]\)\]:z-10/)
  })

  it("campo, mensagem e esqueleto", () => {
    expect(html(h(CardField, { label: "Data" }, "1"))).toContain('data-slot="card-field-label"')
    expect(html(h(CardField, null, "nota"))).not.toContain("card-field-label")
    expect(html(h(CardMessage, { tone: "destructive" }, "erro"))).toContain('role="alert"')
    expect(html(h(CardMessage, null, "vazio"))).not.toContain("role=")
    expect(html(h(CardSkeleton, null))).toMatch(/aria-hidden="true"/)
  })

  it("nenhuma tela escreve o campo, o esmaecido ou o link esticado à mão", () => {
    for (const arquivo of arquivosTsx(join(process.cwd(), "src"))) {
      if (arquivo.includes(join("components", "ui"))) continue
      const codigo = lerFonte(arquivo)
      expect(codigo, arquivo).not.toContain("rounded-lg border border-border/60 bg-background/80 p-3")
      expect(codigo, arquivo).not.toContain("opacity-[0.82]")
      expect(codigo, arquivo).not.toMatch(/after:absolute after:inset-0/)
    }
  })
})
