import { expect, it } from "vitest"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { DataTable } from "./data-table"

const colunas = [{ id: "t", header: "Descrição", accessorKey: "t", meta: { mobile: "title" } }]

it("vazio com gêmeo: o telefone ganha o vazio solto e o cartão some abaixo do md", () => {
  const html = renderToStaticMarkup(
    h(DataTable, { columns: colunas, data: [], getRowId: (r: { t: string }) => r.t, "aria-label": "x",
      empty: h("p", null, "desktop"), emptyPhone: h("p", null, "telefone") } as never)
  )
  expect(html).toMatch(/data-slot="data-table-empty-phone"[^>]*md:hidden/)
  expect(html).toContain("telefone")
  expect(html).toMatch(/data-slot="table-panel"[^>]*max-md:hidden/)
})

it("sem gêmeo nada muda", () => {
  const html = renderToStaticMarkup(
    h(DataTable, { columns: [{ id: "t", header: "D", accessorKey: "t" }], data: [], getRowId: (r: { t: string }) => r.t, "aria-label": "x" } as never)
  )
  expect(html).not.toContain("data-table-empty-phone")
})

it("carregando ou com erro, o vazio solto não aparece", () => {
  const base = { columns: colunas, data: [], getRowId: (r: { t: string }) => r.t, "aria-label": "x", emptyPhone: "t" }
  expect(renderToStaticMarkup(h(DataTable, { ...base, loading: true } as never))).not.toContain("data-table-empty-phone")
  expect(renderToStaticMarkup(h(DataTable, { ...base, error: { message: "e" } } as never))).not.toContain("data-table-empty-phone")
})
