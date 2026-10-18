import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"
import { esperarSemClasseMontada } from "@/test/regras"

import { cn } from "@/lib/utils"
import { Item, ItemGroupLabel, ItemLink, ItemMedia, itemVariants } from "./item"

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

/** As três peças do painel de notificações (rodada 307). */
describe("Item · ladrilho, link esticado e rótulo de grupo", () => {
  const CODIGO = semComentarios(lerFonte("src/components/ui/item.tsx"))

  it("o ladrilho de tom escreve as classes por extenso", () => {
    expect(CODIGO).toContain("tile:")
    for (const t of [
      "bg-info-muted",
      "bg-warning-muted",
      "bg-destructive-muted",
      "text-info-muted-foreground",
      "text-warning-muted-foreground",
      "text-destructive-muted-foreground",
    ])
      expect(CODIGO).toContain(t)
    esperarSemClasseMontada(CODIGO)
  })

  it("o ladrilho é um círculo com o tom pedido, e neutro por padrão", () => {
    const aviso = renderToStaticMarkup(h(ItemMedia, { variant: "tile", tone: "warning" }))
    expect(aviso).toContain('data-variant="tile"')
    expect(aviso).toContain("bg-warning-muted")
    expect(aviso).toContain("rounded-full")
    const neutro = renderToStaticMarkup(h(ItemMedia, { variant: "tile" }))
    expect(neutro).toContain("bg-muted")
    expect(neutro).not.toContain("bg-warning-muted")
    // O tom é do ladrilho: no ícone solto ele não pinta nada.
    expect(renderToStaticMarkup(h(ItemMedia, { variant: "icon", tone: "warning" }))).not.toContain("bg-warning-muted")
  })

  it("o link esticado é um botão de verdade, e o Item responde a ele", () => {
    const botao = renderToStaticMarkup(h(ItemLink, null, "Fatura fecha amanhã"))
    expect(botao).toContain('data-slot="item-link"')
    expect(botao).toContain('type="button"')
    expect(botao).toContain("after:inset-0")
    const link = renderToStaticMarkup(h(ItemLink, { asChild: true }, h("a", { href: "/x" }, "Ver")))
    expect(link).toContain("<a")
    expect(link).not.toContain("type=")
    const linha = itemVariants({})
    expect(linha).toContain("has-[[data-slot=item-link]]:relative")
    expect(linha).toContain("has-[[data-slot=item-link]:focus-visible]:ring-3")
    expect(linha).toContain("has-[[data-slot=item-link]]:[&_[data-slot=item-actions]]:z-10")
  })

  it("o rótulo de grupo é sobrancelha, e com sticky gruda com o fundo da superfície", () => {
    const solto = renderToStaticMarkup(h(ItemGroupLabel, null, "Hoje"))
    expect(solto).toContain('data-slot="item-group-label"')
    expect(solto).toContain("text-muted-foreground")
    expect(solto).not.toContain("sticky")
    const preso = renderToStaticMarkup(h(ItemGroupLabel, { sticky: true }, "Hoje"))
    expect(preso).toContain("sticky")
    expect(preso).toContain("bg-(--item-group-label-surface,var(--color-popover))")
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
