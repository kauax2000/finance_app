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
  CardToolbar,
} from "./card"
import { Button } from "./button"

/** As versões do `Card`. */

const html = (el: React.ReactElement) => renderToStaticMarkup(el)
const casco = (props: Record<string, unknown>) => html(h(Card, props, "x"))

describe("as versões do Card", () => {
  it("brand com glow static é a aurora parada, no humor pedido", () => {
    const aurora = casco({ variant: "brand", glow: "static" })
    expect(aurora).toContain('data-glow="static"')
    expect(aurora).toContain('data-mood="neutral"')
    expect(aurora).toContain("brand-aurora")
    expect(aurora).not.toContain("brand-glow")
    // O fio do casco segue transparente: o anel neutro é o `box-shadow` da `brand-aurora`.
    expect(aurora).toMatch(/border-transparent/)
    expect(casco({ variant: "brand", glow: "static", mood: "warm" })).toContain('data-mood="warm"')
    expect(casco({ variant: "brand", glow: "static", mood: "cool" })).toContain('data-mood="cool"')
    // O brilho de sempre não muda, e fora do `brand` o `glow` e o `mood` não pintam nada.
    const brilho = casco({ variant: "brand" })
    expect(brilho).toContain("brand-glow")
    expect(brilho).not.toContain("brand-aurora")
    expect(brilho).not.toContain("data-mood")
    expect(casco({ glow: "static", mood: "warm" })).not.toMatch(/brand-aurora|data-mood|data-glow/)
  })
  it("inativo, selecionado, horizontal e tracejado são eixos próprios", () => {
    const inativo = casco({ inactive: true })
    expect(inativo).toContain("data-inactive")
    expect(inativo).toContain("opacity-80")
    expect(casco({ selected: true })).toMatch(/border-primary-accent\/60/)
    expect(casco({ orientation: "horizontal" })).toMatch(/sm:flex-row/)
    expect(casco({ variant: "dashed" })).toMatch(/border-dashed/)
  })

  it("tone=\"info\" troca só a borda; sem tone, nada muda", () => {
    const neutro = casco({})
    expect(neutro).not.toContain("data-tone")
    expect(neutro).not.toContain("border-info")
    expect(neutro).toMatch(/border-border/)
    const info = casco({ tone: "info" })
    expect(info).toContain('data-tone="info"')
    expect(info).toMatch(/border-info\/45/)
    expect(info).not.toMatch(/(^|\s)border-border(\s|")/)
    expect(info).toMatch(/bg-card/)
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

describe("o fio das superfícies", () => {
  it("toda caixa com borda e fundo de cartão recorta o fundo no padding, como a lateral", () => {
    // O fio é translúcido no escuro (`--border` a 10%): com o fundo pintando por baixo
    // dele, ele soma ao `--card` e sai claro (~0,28); recortado, soma ao que está
    // fora, como o anel da barra lateral (~0,23). No claro o fio é chapado e nada muda.
    const fontes = arquivosTsx(join(process.cwd(), "src/components"))
    const faltando: string[] = []
    for (const arquivo of fontes) {
      for (const [, classes] of lerFonte(arquivo).matchAll(/"([^"\n]*)"/g)) {
        const t = classes.split(/\s+/)
        if (t.includes("border") && t.some((c) => /^bg-card(\/\d+)?$/.test(c)) && !t.includes("bg-clip-padding")) {
          faltando.push(`${arquivo.replace(process.cwd() + "/", "")}: ${classes}`)
        }
      }
    }
    expect(faltando).toEqual([])
  })
})


describe("CardToolbar dá o degrau aos botões", () => {
  it("o botão da tira nasce sm (28), sem declarar size, como o da PageSection", () => {
    const out = html(h(CardToolbar, null, "Título", h(Button, { variant: "tertiary" }, "ver os 3")))
    expect(out).toContain('data-size="sm"')
  })
})

describe("Card tinted", () => {
  it("o destaque sutil é o outline com um véu de --muted que desce do topo, sobre o --card", () => {
    const out = casco({ variant: "tinted" })
    expect(out).toContain("bg-card")
    expect(out).toContain("bg-linear-to-b")
    expect(out).toContain("from-muted/70")
    expect(out).toContain("border-border")
  })
})
