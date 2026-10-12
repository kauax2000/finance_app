import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "./breadcrumb"

/** As versões da rodada 202. */

const trilha = (lista: Record<string, unknown>, ...itens: ReturnType<typeof h>[]) =>
  renderToStaticMarkup(h(Breadcrumb, null, h(BreadcrumbList, lista as never, ...itens)))

const degrau = (filho: ReturnType<typeof h>, key: string) => h(BreadcrumbItem, { key }, filho)

describe("Breadcrumb, rodada 202", () => {
  it("o voltar do telefone é o link do degrau de cima, e o resto some abaixo de sm", () => {
    const html = trilha(
      { collapse: "back" },
      degrau(h(BreadcrumbLink, { href: "/conta" }, "Minha conta"), "a"),
      degrau(h(BreadcrumbLink, { href: "/conta/seguranca" }, "Segurança"), "b"),
      degrau(h(BreadcrumbPage, null, "Sessões"), "c")
    )
    expect(html).toMatch(/<li data-slot="breadcrumb-back" class="[^"]*sm:hidden"><a [^>]*href="\/conta\/seguranca"[^>]*><svg/)
    // Os degraus continuam `<li>` filhos do `<ol>`: a classe vai neles.
    expect(html).not.toContain("contents")
    expect(html.match(/<li data-slot="breadcrumb-item" class="[^"]*max-sm:hidden"/g)).toHaveLength(3)
  })

  it("o separador por nome", () => {
    const html = (sep: string) =>
      trilha(
        { separator: sep },
        degrau(h(BreadcrumbLink, { href: "#" }, "A"), "a"),
        degrau(h(BreadcrumbPage, null, "B"), "b")
      )
    expect(html("slash")).toMatch(/data-slot="breadcrumb-separator"[^>]*><span[^>]*>\/<\/span>/)
    expect(html("dot")).toContain(">·</span>")
    expect(html("chevron")).toMatch(/data-slot="breadcrumb-separator"[^>]*><svg/)
  })

  it("o degrau com ícone, e o só-ícone com nome", () => {
    const html = trilha(
      {},
      degrau(h(BreadcrumbLink, { href: "/", icon: h("svg"), "aria-label": "Início" }), "a"),
      degrau(h(BreadcrumbPage, null, "B"), "b")
    )
    expect(html).toMatch(/<a [^>]*class="[^"]*inline-flex[^"]*\[&amp;_svg\]:size-4[^"]*"[^>]*aria-label="Início"><svg>/)
  })

  it("a página atual pode ser o h1, e continua aria-current", () => {
    const html = trilha({}, degrau(h(BreadcrumbPage, { asChild: true }, h("h1", null, "Sessões")), "a"))
    expect(html).toMatch(/<h1 data-slot="breadcrumb-page" aria-current="page"/)
  })

  it("o trocador não cresce a linha e diz a página atual", () => {
    const codigo = lerFonte("src/components/ui/breadcrumb.tsx")
    expect(codigo).toMatch(/aria-current="page"[\s\S]{0,400}"-mx-1 h-auto min-w-0 gap-1 rounded-sm border-0 px-1 py-0/)
  })

  it("a barra do app usa a trilha do sistema", () => {
    const barra = lerFonte("src/components/layout/breadcrumb.tsx")
    expect(barra).toContain("<BreadcrumbPage asChild>")
    expect(barra).not.toMatch(/ChevronRightIcon|max-w-\[45%\]|SubPageBackButton/)
  })
})
