import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { DataTable, type DataTableColumnDef } from "./data-table"

/** `mobileSwipe`: no telefone, deslizar a linha revela as ações dela (rodada 401). */

type L = { id: string; nome: string; prevista?: boolean }
const LINHAS: L[] = [
  { id: "a", nome: "Mercado" },
  { id: "b", nome: "Aluguel", prevista: true },
]
const COLUNAS: DataTableColumnDef<L>[] = [
  { id: "nome", accessorFn: (l) => l.nome, header: "Nome", meta: { label: "Nome", mobile: "title" } },
]
const ACOES = [
  { label: "Editar", onSelect: () => undefined, hidden: (l: L) => Boolean(l.prevista) },
  { label: "Excluir", variant: "destructive" as const, onSelect: () => undefined, hidden: (l: L) => Boolean(l.prevista) },
]
const base = { columns: COLUNAS, data: LINHAS, getRowId: (l: L) => l.id, getRowLabel: (l: L) => l.nome, pageSize: false as const }
const conta = (html: string, s: string) => html.split(s).length - 1

describe("DataTable mobileSwipe", () => {
  const fonte = semComentarios(lerFonte("src/components/ui/data-table.tsx"))
  const ramo = fonte.slice(fonte.indexOf("function LinhaDeslizavel"), fonte.indexOf("function GemeoDoTelefone"))

  it("declara a prop, desligada por padrão, e o gesto só do dedo com a trava de direção", () => {
    expect(fonte).toContain("mobileSwipe?: boolean")
    expect(fonte).toContain("mobileSwipe = false,")
    expect(ramo).toContain('pointerType !== "touch"')
    expect(ramo).toContain("travarDirecao(")
    expect(ramo).toContain("assentarDeslize(")
    expect(ramo).toContain("...MOLA")
    expect(ramo).toContain('data-slot="data-table-mobile-swipe-actions"')
    expect(ramo).toContain("tabIndex={aberta ? 0 : -1}")
  })

  it("só a linha com ação visível desliza, e as ações ficam fora do Tab fechadas", () => {
    const html = renderToStaticMarkup(h(DataTable<L>, { ...base, rowActions: ACOES, mobileSwipe: true }))
    expect(conta(html, 'data-slot="data-table-mobile-swipe"')).toBe(1)
    expect(html).toMatch(/data-slot="data-table-mobile-swipe-actions" aria-hidden="true"/)
    expect(conta(html, 'tabindex="-1"')).toBeGreaterThanOrEqual(2)
    expect(html).toContain('aria-label="Excluir Mercado"')
  })

  it("desligado, nada muda", () => {
    const html = renderToStaticMarkup(h(DataTable<L>, { ...base, rowActions: ACOES }))
    expect(html).not.toContain("data-table-mobile-swipe")
  })

  it("Transações liga", () => {
    expect(lerFonte("src/components/transactions/transacoes-tabela.tsx")).toMatch(/^\s+mobileSwipe$/m)
  })
})
