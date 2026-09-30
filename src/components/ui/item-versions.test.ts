import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"
import { Item, itemVariants } from "./item"

/** As versões da rodada 194. */

const arquivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(caminho).isDirectory()
      ? arquivos(caminho)
      : /\.tsx$/.test(nome)
        ? [caminho]
        : []
  })

describe("Item, rodada 194", () => {
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
    const culpados = arquivos(join(process.cwd(), "src"))
      .filter((c) => !c.includes("components/ui/"))
      .filter((c) =>
        [...readFileSync(c, "utf8").matchAll(/<Item\b[^>]*className=(?:"[^"]*"|\{[^}]*\})/g)].some((m) =>
          /\b(flex-nowrap|text-left)\b/.test(m[0])
        )
      )
    expect(culpados).toEqual([])
  })
})
