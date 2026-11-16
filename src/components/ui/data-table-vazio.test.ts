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
  // O vazio é irmão do cartão: fica depois dele, nunca dentro.
  const painel = html.indexOf('data-slot="table-panel"')
  const solto = html.indexOf('data-slot="data-table-empty-phone"')
  // Contenção: contando as tags de div a partir do cartão, o cartão já fechou quando o vazio abre.
  const abre = html.lastIndexOf("<div", painel)
  let prof = 0
  for (const m of html.slice(abre, html.lastIndexOf("<div", solto)).matchAll(/<div|<\/div>/g)) prof += m[0] === "<div" ? 1 : -1
  expect(prof).toBe(0)
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
