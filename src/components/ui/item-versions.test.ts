import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte } from "@/test/fonte"

import { cn } from "@/lib/utils"
import { Item, itemVariants } from "./item"

/** As versões do `Item`. */

describe("Item", () => {
  it("a linha rente tem o recuo da tira do cartão, e vence o do degrau", () => {
    const classes = cn(itemVariants({ variant: "flush", size: "md" })).split(/\s+/)
    expect(classes).toContain("px-4")
    expect(classes).toContain("py-3")
    expect(classes).not.toContain("px-3")
    expect(classes).toContain("rounded-none")
  })

  it("a selecionada é aria-current, com o contorno do cartão de escolha", () => {
    const html = renderToStaticMarkup(h(Item, { selected: true }))
    expect(html).toContain('aria-current="true"')
    expect(cn(itemVariants({ variant: "outline", selected: true }))).toContain("border-primary-accent/60")
  })

  it("só quebra com faixa, e alinha à esquerda de fábrica", () => {
    const base = itemVariants({})
    expect(base).toContain("flex-nowrap")
    expect(base).toContain("has-[>[data-slot=item-footer]]:flex-wrap")
    expect(base).toContain("text-start")
  })

  it("nenhuma tela desliga a quebra nem alinha à esquerda à mão", () => {
    const culpados = arquivosTsx(join(process.cwd(), "src"))
      .filter((c) => !c.includes("components/ui/"))
      .filter((c) =>
        [...lerFonte(c).matchAll(/<Item\b[^>]*className=(?:"[^"]*"|\{[^}]*\})/g)].some((m) =>
          /\b(flex-nowrap|text-left)\b/.test(m[0])
        )
      )
    expect(culpados).toEqual([])
  })
})

/**
 * A escada do `Item`, trancada. O defeito: `size` tinha `default` e `sm` com a mesma string
 * (`gap-2.5 px-3 py-2.5`), dois nomes para uma medida. A asserção que vale (nenhum par de
 * degraus produz a mesma string) mora em `escadas.test.ts`.
 */
const DEGRAUS = ["sm", "md", "lg"] as const

describe("escada do Item", () => {
  it("1. tem exatamente os três degraus do sistema, e `md` é o padrão", () => {
    const padrao = itemVariants({ variant: "plain" })
    expect(padrao).toBe(itemVariants({ size: "md", variant: "plain" }))

    // `default` e `xs` saíram do tipo e quem os pega é o `tsc`; este teste garante que o padrão
    // continua `md`.
    for (const size of DEGRAUS) {
      expect(itemVariants({ size, variant: "plain" })).toBeTruthy()
    }
  })

  it("4. o `Item` não declara altura — uma linha de lista cresce com o conteúdo", () => {
    for (const size of DEGRAUS) {
      const classes = itemVariants({ size, variant: "plain" })
      expect(classes).not.toMatch(/(?:^|\s)h-\d/)
      expect(classes).not.toMatch(/(?:^|\s)h-\[/)
    }
  })

  it("5. `interactive` traz hover, o par de toque e o alvo de dedo", () => {
    const ligado = itemVariants({ interactive: true, variant: "plain" })
    expect(ligado).toContain("hover:bg-muted")
    // O par `active:` é o que faz a resposta existir no telefone: o `hover:`
    // compila dentro de `@media (hover: hover)`.
    expect(ligado).toContain("active:bg-muted")
    expect(ligado).toContain("pointer-coarse:min-h-11")
    expect(ligado).toContain("focus-visible:ring-3")

    const desligado = itemVariants({ interactive: false, variant: "plain" })
    expect(desligado).not.toContain("hover:bg-muted")
  })
})
