import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { toCsv } from "@/lib/data-table/csv"
import { nextCell, nextRowIndex } from "@/lib/data-table/keyboard"
import { runningBalance } from "@/lib/data-table/running-balance"
import { mergeParams, parseList, parsePage, parseSort, serializeList, serializePage, serializeSort } from "@/lib/data-table/url-state"

import { DataTable, type DataTableColumnDef } from "./data-table"
import {
  Table,
  TableBody,
  TableCell,
  TableError,
  TableGroupRow,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  tableVariants,
} from "./table"

/** A rodada 225: o redesenho do `Table` e o motor do `DataTable`. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CSS = fonte("src/app/globals.css")
const TABLE = fonte("src/components/ui/table.tsx")

const tabela = (...linhas: ReturnType<typeof h>[]) =>
  h(Table, null, h(TableBody, null, ...linhas))

describe("as versões do Table", () => {
  it("os fios e a zebra: `none` some com o fio do corpo, `grid` soma o vertical, e a zebra pesa (0,1,0)", () => {
    expect(tableVariants({ dividers: "none" })).toContain("[&>tbody>tr:not([data-variant=group])]:border-transparent")
    expect(tableVariants({ dividers: "grid" })).toContain("[&_td:not(:last-child)]:border-e")
    const zebra = tableVariants({ striped: true })
    // Em `:where()`, para o realce do cursor e o selecionado vencerem.
    expect(zebra).toContain("[&_:where(tbody>tr:nth-child(even):not([data-variant=group]))]:bg-muted/20")
    expect(tableVariants({})).not.toContain("nth-child(even)")
  })

  it("a linha de agora tem `aria-current`, a prevista apaga, e a clicável entra no Tab", () => {
    const html = renderToStaticMarkup(
      tabela(
        h(TableRow, { key: 1, state: "current" }, h(TableCell, null, "a")),
        h(TableRow, { key: 2, state: "pending" }, h(TableCell, null, "b")),
        h(TableRow, { key: 3, interactive: true }, h(TableCell, null, "c"))
      )
    )
    expect(html).toContain('aria-current="true"')
    // Sem fundo desde a rodada 231: o realce lia como hover preso.
    expect(html).not.toContain("bg-muted/50")
    // A prevista apaga a cor junto com o texto.
    expect(html).toContain("[data-slot=color-tile]]:opacity-50")
    expect(html).toContain("[data-slot=money-display]]:opacity-50")
    expect(html).toMatch(/data-row-state="pending"[^>]*class="[^"]*text-muted-foreground/)
    expect(html).toMatch(/tabindex="0"[^>]*class="[^"]*cursor-pointer/)
  })

  it("a coluna fixa gruda, pinta o fundo da linha e só faz sombra com rolagem para aquele lado", () => {
    const html = renderToStaticMarkup(
      tabela(h(TableRow, { key: 1 }, h(TableCell, { pin: "start" }, "a"), h(TableCell, { pin: "end" }, "b")))
    )
    expect(html).toContain("sticky start-0")
    expect(html).toContain("sticky end-0")
    expect(html).toContain("bg-(--table-pin-bg,var(--color-card))")
    expect(html).toContain("group-data-[scroll-more-start]/table-viewport:shadow-")
    expect(html).toContain("group-data-[scroll-more-end]/table-viewport:shadow-")
    // A linha publica o tom composto para a célula fixa.
    expect(TABLE).toContain("hover:[--table-pin-bg:color-mix(in_srgb,var(--color-muted)_30%,var(--color-card))]")
  })

  it("`fade=\"none\"` não veste a máscara lateral, e `pending` esmaece o corpo com `aria-busy`", () => {
    const sem = renderToStaticMarkup(h(Table, { fade: "none" }, h(TableBody)))
    expect(sem).not.toContain("scroll-fade-x")
    expect(renderToStaticMarkup(h(Table, null, h(TableBody)))).toContain("scroll-fade-x")
    const recarga = renderToStaticMarkup(h(Table, { pending: true }, h(TableBody)))
    expect(recarga).toContain('aria-busy="true"')
    expect(recarga).toContain("[&amp;&gt;tbody]:opacity-60")
  })

  it("`aria-sort` só na coluna ordenada", () => {
    const html = renderToStaticMarkup(
      h(Table, null, h(TableHeader, null, h(TableRow, null,
        h(TableHead, { key: 1, sort: "none", onSort: () => undefined }, "Nome"),
        h(TableHead, { key: 2, sort: "desc", onSort: () => undefined, sortIndex: 2 }, "Valor")
      )))
    )
    expect(html.match(/aria-sort=/g)).toHaveLength(1)
    expect(html).toContain('aria-sort="descending"')
    // A seta gira, e não troca de ícone.
    expect(html).toContain("rotate-180")
  })

  it("a faixa de grupo: o total, a caixa com indeterminado e a conta das colunas", () => {
    const html = renderToStaticMarkup(
      tabela(
        h(TableGroupRow, {
          key: 1,
          label: "Março de 2026",
          colSpan: 5,
          trailing: 1,
          total: "R$ 10,00",
          collapsible: true,
          open: false,
          selection: { checked: "indeterminate", onCheckedChange: () => undefined, label: "Selecionar março" },
        })
      )
    )
    expect(html).toContain('aria-label="Selecionar março"')
    expect(html).toContain('data-state="indeterminate"')
    // 5 colunas: a caixa (1), o rótulo (2), o total (1), a ação (1).
    expect(html).toMatch(/colspan="2"/i)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain("R$ 10,00")
  })

  it("o esqueleto anuncia uma vez, com o cabeçalho real; `group={false}` não aninha outro status", () => {
    const com = renderToStaticMarkup(
      h(TableSkeleton, { columns: [{ label: "Descrição" }, { label: "Valor", numeric: true }], headerLabels: "caps" })
    )
    expect(com).toContain('role="status"')
    expect(com).toContain("Descrição")
    expect(com).toContain('data-labels="caps"')
    const sem = renderToStaticMarkup(h(TableSkeleton, { columns: 2, group: false }))
    expect(sem).not.toContain('role="status"')
  })

  it("a falha é `role=\"alert\"` com o tentar de novo", () => {
    const html = renderToStaticMarkup(tabela(h(TableError, { key: 1, colSpan: 3, onRetry: () => undefined })))
    expect(html).toContain('role="alert"')
    expect(html).toContain("tentar de novo")
  })

  it("a cascata e o destaque moram em `@utility`, com os números da referência", () => {
    expect(CSS).toMatch(/@utility table-reveal \{\s*& > tr \{\s*animation: menubar-rise 160ms var\(--ease-out\) 40ms both;/)
    expect(CSS).toContain("& > tr:nth-child(n + 12) { animation-delay: 370ms; }")
    expect(CSS).toMatch(/@utility table-flash \{\s*animation: table-flash 1\.5s/)
  })
})

type L = { id: string; nome: string; valor: number; mes: string }
const LINHAS: L[] = [
  { id: "a", nome: "Mercado", valor: -10, mes: "2026-03" },
  { id: "b", nome: "Salário", valor: 100, mes: "2026-03" },
  { id: "c", nome: "Cinema", valor: -5, mes: "2026-02" },
]
const COLUNAS: DataTableColumnDef<L>[] = [
  { id: "nome", accessorFn: (l) => l.nome, header: "Nome", meta: { label: "Nome", mobile: "title" } },
  { id: "valor", accessorFn: (l) => l.valor, header: "Valor", meta: { label: "Valor", numeric: true, mobile: "trailing" } },
]
const base = { columns: COLUNAS, data: LINHAS, getRowId: (l: L) => l.id, getRowLabel: (l: L) => l.nome, pageSize: false as const }

describe("o DataTable", () => {
  it("marca com o nome da linha, o indeterminado no cabeçalho, e a tabela de leitura não é grade", () => {
    const html = renderToStaticMarkup(h(DataTable<L>, { ...base, enableSelection: true, rowSelection: { a: true } }))
    expect(html).toContain('aria-label="Selecionar Mercado"')
    expect(html).toContain('aria-label="Selecionar todas as linhas da página"')
    expect(html).toMatch(/aria-label="Selecionar todas as linhas da página"[^>]*data-state="indeterminate"|data-state="indeterminate"[^>]*aria-label="Selecionar todas as linhas da página"/)
    expect(html).not.toContain('role="grid"')
    // A seleção é dita pela caixa: `aria-selected` só existe na grade.
    expect(html).not.toContain("aria-selected")
  })

  it("`aria-sort` só na coluna ordenada", () => {
    const html = renderToStaticMarkup(h(DataTable<L>, { ...base, defaultSorting: [{ id: "valor", desc: true }] }))
    expect(html.match(/aria-sort=/g)).toHaveLength(1)
    expect(html).toContain('aria-sort="descending"')
  })

  it("o gêmeo do telefone sai das colunas, trocado por CSS", () => {
    const html = renderToStaticMarkup(h(DataTable<L>, base))
    expect(html).toContain('class="hidden md:block"')
    expect(html).toContain('class="md:hidden"')
    expect(html).toContain('data-slot="data-table-mobile"')
  })

  it("o grupo vem das linhas consecutivas, e `null` o desliga", () => {
    const agrupado = renderToStaticMarkup(
      h(DataTable<L>, { ...base, groupBy: (l: L) => ({ key: l.mes, label: l.mes }) })
    )
    expect(agrupado.match(/data-slot="table-group-row"/g)).toHaveLength(2)
    const solto = renderToStaticMarkup(h(DataTable<L>, { ...base, groupBy: () => null }))
    expect(solto).not.toContain('data-slot="table-group-row"')
  })

  it("virtualizada, ela diz quantas linhas há; editável, ela é uma grade", () => {
    const virtual = renderToStaticMarkup(h(DataTable<L>, { ...base, virtualize: { estimateSize: 44 } }))
    expect(virtual).toContain('aria-rowcount="4"')
    const grade = renderToStaticMarkup(
      h(DataTable<L>, { ...base, editable: { onCellEdit: () => undefined } })
    )
    expect(grade).toContain('role="grid"')
    expect(grade).toContain('role="gridcell"')
  })

  it("carregando é o esqueleto; com falha, a linha de erro e sem paginação", () => {
    expect(renderToStaticMarkup(h(DataTable<L>, { ...base, loading: true }))).toContain('data-slot="table-skeleton"')
    const falha = renderToStaticMarkup(
      h(DataTable<L>, { ...base, pageSize: 1, error: { message: "Caiu." } })
    )
    expect(falha).toContain('role="alert"')
    expect(falha).not.toContain('data-slot="table-panel-footer"')
  })
})

describe("as telas", () => {
  it("transações e assinaturas são DataTable, sem a barra de seleção nem as classes à mão", () => {
    const telas = [
      "src/components/transactions/transactions-table.tsx",
      "src/app/(app)/subscriptions/page-client.tsx",
    ]
    for (const tela of telas) {
      const codigo = fonte(tela)
      expect(codigo, tela).toContain("<DataTable")
      expect(codigo, tela).toContain("bulkActions")
      expect(codigo, tela).not.toContain("h-11 px-4")
      expect(codigo, tela).not.toContain("w-10 px-2 md:w-11 md:px-3")
      expect(codigo, tela).not.toContain("cursor-pointer hover:bg-muted/30")
      expect(codigo, tela).not.toMatch(/function compare\w+|toggleAllPageRowsSelected/)
    }
    // A linha projetada não finge que abre.
    expect(fonte(telas[0])).toContain("rowClickable={(t) => !isProjectedTransactionRow(t)}")
  })

  it("as folhas e os esqueletos não reescrevem a densidade nem a linha atual", () => {
    for (const arquivo of [
      "src/components/transactions/installment-purchase-section.tsx",
      "src/components/subscriptions/subscription-detail-sheet.tsx",
    ]) {
      const codigo = fonte(arquivo)
      expect(codigo, arquivo).not.toContain("px-2 py-1.5")
      expect(codigo, arquivo).not.toContain("h-9 border-border/40")
      expect(codigo, arquivo).toContain('state={')
      expect(codigo, arquivo).toContain("TableEmpty")
    }
    for (const arquivo of [
      "src/components/transactions/transactions-page-skeleton.tsx",
      "src/components/subscriptions/subscriptions-page-skeleton.tsx",
      "src/components/categories/detail/category-detail-skeleton.tsx",
      "src/components/credit-cards/credit-card-detail-skeleton.tsx",
    ]) {
      const codigo = fonte(arquivo)
      expect(codigo, arquivo).toContain("<TableSkeleton")
      // Dentro do esqueleto da página, sem um segundo `role="status"`.
      expect(codigo, arquivo).toContain("group={false}")
      expect(codigo, arquivo).not.toContain('className="bg-muted/50"')
    }
  })
})

describe("a lógica pura", () => {
  it("o CSV é para o Excel em português: BOM, `;`, vírgula decimal e aspas quando precisa", () => {
    const csv = toCsv(
      [{ nome: "Pão; leite", valor: -1284.6 }],
      [
        { header: "Descrição", value: (r) => r.nome },
        { header: "Valor", value: (r) => r.valor },
      ]
    )
    expect(csv.startsWith("﻿")).toBe(true)
    expect(csv).toBe('﻿Descrição;Valor\r\n"Pão; leite";-1284,6')
  })

  it("o saldo corrente acumula na ordem da tela, e some fora da ordem de data ou com filtro", () => {
    const opts = { start: 100, sortedByDate: true, filtered: false }
    expect(runningBalance([10, -5], { ...opts, direction: "asc" })).toEqual([110, 105])
    // O mais novo em cima: o saldo dele inclui todos os de baixo.
    expect(runningBalance([10, -5], { ...opts, direction: "desc" })).toEqual([105, 95])
    expect(runningBalance([10], { ...opts, direction: "asc", sortedByDate: false })).toEqual([null])
    expect(runningBalance([10], { ...opts, direction: "asc", filtered: true })).toEqual([null])
  })

  it("a URL vai e volta, ignora o que não reconhece, e a página é a partir de 1", () => {
    const sort = [{ id: "valor", desc: true }, { id: "data", desc: false }]
    expect(parseSort(serializeSort(sort))).toEqual(sort)
    expect(parseSort("valor.desc,lixo,x.y", ["valor"])).toEqual([{ id: "valor", desc: true }])
    expect(serializePage(0)).toBeNull()
    expect(serializePage(2)).toBe("3")
    expect(parsePage("3")).toBe(2)
    expect(parsePage("abc")).toBe(0)
    expect(parseList(serializeList(["a b", "c,d"]))).toEqual(["a b", "c,d"])
    expect(mergeParams("txn=1&sort=x.asc", { sort: null, page: "2" })).toBe("txn=1&page=2")
  })

  it("o teclado: as linhas andam e param nas pontas; a grade anda nos dois eixos", () => {
    expect(nextRowIndex("ArrowDown", 0, 3)).toBe(1)
    expect(nextRowIndex("ArrowDown", 2, 3)).toBe(2)
    expect(nextRowIndex("End", 0, 3)).toBe(2)
    expect(nextRowIndex("a", 0, 3)).toBeNull()
    const dims = { rows: 3, cols: 4 }
    expect(nextCell("ArrowRight", { row: 0, col: 3 }, dims)).toEqual({ row: 0, col: 3 })
    expect(nextCell("End", { row: 1, col: 0 }, dims)).toEqual({ row: 1, col: 3 })
    expect(nextCell("End", { row: 1, col: 0 }, dims, true)).toEqual({ row: 2, col: 3 })
  })
})

describe("a falha da tabela (rodada 231)", () => {
  it("fala como o ChartError: ícone no tom de erro, título, o porquê e a ação", () => {
    const html = renderToStaticMarkup(
      tabela(h(TableError, { colSpan: 3, onRetry: () => undefined }, "O servidor não respondeu."))
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain('data-slot="empty-state-icon"')
    expect(html).toContain('data-tone="destructive"')
    expect(html).toContain("Não foi possível carregar")
    expect(html).toContain('data-slot="empty-state-description"')
    expect(html).toContain("tentar de novo")
  })
})

describe("o gêmeo do telefone (rodada 231)", () => {
  const fonte = readFileSync(join(process.cwd(), "src/components/ui/data-table.tsx"), "utf8")
  it("é um extrato: o valor e a data à direita, alinhados pela ponta, e a legenda numa linha", () => {
    expect(fonte).toContain('<ItemContent data-slot="data-table-mobile-aside" className="flex-none items-end text-right">')
    expect(fonte).toContain('<ItemDescription className="line-clamp-1 text-xs">')
    expect(fonte).toContain('meta: { label: header, mobile: "meta", ...meta }')
  })
  it("a linha de agora não pinta, e a folha de ações tem o nome da linha", () => {
    const gemeo = fonte.slice(fonte.indexOf("function GemeoDoTelefone"))
    expect(gemeo).not.toContain('"bg-muted/50"')
    expect(fonte).toContain("header={<DropdownMenuHeader title={label} />}")
  })
})
