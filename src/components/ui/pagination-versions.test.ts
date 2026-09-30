import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { janelaDePaginas, Pagination, PaginationMore } from "./pagination"

/** As versões da rodada 196. */
describe("Pagination, rodada 196", () => {
  it("a janela tem pontas, vizinhas e reticência só quando esconde mais de uma", () => {
    expect(janelaDePaginas(5, 18)).toEqual([1, "…", 4, 5, 6, "…", 18])
    // A reticência que esconderia só a página 2 vira a página 2.
    expect(janelaDePaginas(3, 18)).toEqual([1, 2, 3, 4, "…", 18])
    expect(janelaDePaginas(1, 1)).toEqual([1])
  })

  it("sem href, as peças são botões, e a ponta desabilitada também", () => {
    const html = renderToStaticMarkup(
      h(Pagination, { page: 1, total: 3, onPageChange: () => {} })
    )
    expect(html).not.toContain("<a ")
    expect(html).toMatch(/<button[^>]*aria-label="Ir para a página anterior"[^>]*disabled/)
    expect(html).toMatch(/<button[^>]*aria-current="page"/)
  })

  it("com getHref, as peças são links", () => {
    const html = renderToStaticMarkup(
      h(Pagination, { page: 2, total: 3, getHref: (p: number) => `?page=${p}` })
    )
    expect(html).toContain('href="?page=3"')
  })

  it("a compacta é só a posição entre as setas", () => {
    const html = renderToStaticMarkup(
      h(Pagination, { page: 2, total: 8, variant: "compact", onPageChange: () => {} })
    )
    expect(html).toContain("de 8")
    expect(html).not.toContain('data-slot="pagination-ellipsis"')
  })

  it("o mostrar mais conta, e some quando acaba", () => {
    const html = renderToStaticMarkup(h(PaginationMore, { shown: 30, total: 57, step: 30, onMore: () => {} }))
    expect(html).toContain("30 de 57")
    expect(html).toContain("mostrar mais 27")
    expect(renderToStaticMarkup(h(PaginationMore, { shown: 57, total: 57, onMore: () => {} }))).toBe("")
  })
})
