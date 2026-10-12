import { readdirSync } from "node:fs"
import { join } from "node:path"

import * as React from "react"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

import { toCsv } from "@/lib/data-table/csv"
import { nextCell, nextRowIndex } from "@/lib/data-table/keyboard"
import { runningBalance } from "@/lib/data-table/running-balance"
import { mergeParams, parseList, parsePage, parseSort, serializeList, serializePage, serializeSort } from "@/lib/data-table/url-state"

import { DataTable, type DataTableColumnDef, TablePanel, TablePanelToolbar } from "./data-table"
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

/** O redesenho do `Table` e o motor do `DataTable`. */

const CSS = lerFonte("src/app/globals.css")
const TABLE = lerFonte("src/components/ui/table.tsx")

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
    // Sem fundo: o realce lia como hover preso.
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
    expect(CSS).toMatch(/@utility table-reveal \{\s*& > tr \{\s*animation: rise 160ms var\(--ease-out\) 40ms both;\s*--rise-distance: 3px;/)
    // 40ms, e 30ms por degrau até a décima segunda linha (370ms).
    expect(CSS).toMatch(/@utility table-reveal \{\s*& > tr \{[^}]*--stagger-base: 40ms;\s*--stagger-step: 30ms;\s*--stagger-cap: 11;\s*@apply stagger-ladder;/)
    // A escada das cascatas: o k-ésimo filho atrasa min(k − 1, teto) passos,
    // até o décimo segundo — o degrau mais fundo que alguma cascata pede.
    const escada = esperarDepoisDeNoScrollbar(CSS, "@utility stagger-ladder {")
    for (let k = 2; k <= 12; k++) {
      expect(escada).toContain(
        `&:nth-child(${k}) {\n    animation-delay: calc(var(--stagger-base) + var(--stagger-step) * min(${k - 1}, var(--stagger-cap)));`
      )
    }
    expect(escada).toContain(
      "&:nth-child(n + 13) {\n    animation-delay: calc(var(--stagger-base) + var(--stagger-step) * var(--stagger-cap));"
    )
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
      const codigo = lerFonte(tela)
      expect(codigo, tela).toContain("<DataTable")
      expect(codigo, tela).toContain("bulkActions")
      expect(codigo, tela).not.toContain("h-11 px-4")
      expect(codigo, tela).not.toContain("w-10 px-2 md:w-11 md:px-3")
      expect(codigo, tela).not.toContain("cursor-pointer hover:bg-muted/30")
      expect(codigo, tela).not.toMatch(/function compare\w+|toggleAllPageRowsSelected/)
    }
    // A linha projetada não finge que abre.
    expect(lerFonte(telas[0])).toContain("rowClickable={(t) => !isProjectedTransactionRow(t)}")
  })

  it("as folhas e os esqueletos não reescrevem a densidade nem a linha atual", () => {
    for (const arquivo of [
      "src/components/transactions/installment-purchase-section.tsx",
      "src/components/subscriptions/subscription-detail-sheet.tsx",
    ]) {
      const codigo = lerFonte(arquivo)
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
      const codigo = lerFonte(arquivo)
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

describe("a falha da tabela", () => {
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

describe("o gêmeo do telefone", () => {
  const fonte = lerFonte("src/components/ui/data-table.tsx")
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

const UI = "src/components/ui"

/**
 * A escada do `Table`, trancada: cinco degraus (`xs` 32 · `sm` 36 · `md` 44 · `lg` 52 · `xl`
 * 64, a altura da linha), nenhum par produz a mesma string, as medidas sobem, e nenhuma é
 * montada em tempo de execução. Também tranca a dissolução (`table-viewport` não desenha nada,
 * a moldura mora fora dele) e a regra J do auditor, lendo o fonte sem comentários: a prosa cita
 * `bg-`, `border` e `role="toolbar"` para explicar o que evita.
 */
const SRC = lerFonte(join(UI, "table.tsx"))
const CODE = semComentarios(SRC)
// O `TablePanel` mora no `data-table.tsx`: a fatia é a da moldura.
const DT_SRC = lerFonte(join(UI, "data-table.tsx"))
const PANEL_CODE = semComentarios(
  DT_SRC.slice(DT_SRC.indexOf("/* A moldura: o TablePanel"), DT_SRC.indexOf("/**\n * A tabela de dados"))
)
const DEGRAUS = ["xs", "sm", "md", "lg", "xl"] as const

/** A entrelinha do corpo de cada degrau, para a conta da altura da linha. */
const ENTRELINHA = { xs: 16, sm: 20, md: 20, lg: 20, xl: 24 } as const

function medidas(size: (typeof DEGRAUS)[number]) {
  const classes = tableVariants({ variant: "plain", size })
  const pegar = (nome: string) => {
    const m = classes.match(new RegExp(`--${nome}:--spacing\\(([\\d.]+)\\)`))
    return m ? Number(m[1]) : NaN
  }
  return {
    px: pegar("table-px"),
    py: pegar("table-py"),
    headH: pegar("table-head-h"),
  }
}

describe("escada do Table", () => {
  it("1. tem os cinco degraus, e `md` é o padrão", () => {
    const padrao = tableVariants({ variant: "plain" })
    expect(padrao).toBe(tableVariants({ variant: "plain", size: "md" }))
    for (const size of DEGRAUS) {
      expect(tableVariants({ variant: "plain", size })).toBeTruthy()
    }
  })

  it("3. a linha mede 32 · 36 · 44 · 52 · 64, e o cabeçalho e o recuo nunca descem", () => {
    const valores = DEGRAUS.map(medidas)
    // A altura da linha é 2 × py mais a entrelinha do corpo; `--spacing` é 4px.
    const alturas = DEGRAUS.map((d, i) => valores[i].py * 4 * 2 + ENTRELINHA[d])
    expect(alturas).toStrictEqual([32, 36, 44, 52, 64])
    // Do `md` para cima o recuo fica em 16, o `--card-strip-px`, que alinha a
    // coluna com a barra do painel.
    const recuo = valores.map((v) => v.px)
    expect(recuo.slice(2)).toStrictEqual([4, 4, 4])
  })

  it("4. nenhum degrau é montado em tempo de execução — todo literal, sem `${`", () => {
    for (const size of DEGRAUS) {
      const classes = tableVariants({ variant: "plain", size })
      expect(classes).not.toContain("${")
    }
  })

  it("5. `TableRow interactive` traz hover + active + foco; sem ele, nenhum hover", () => {
    expect(CODE).toMatch(
      /interactive &&\s*\n\s*"cursor-pointer hover:bg-muted\/30 active:bg-muted\/30/
    )
    // A base do `<tr>` — fora do ramo `interactive` — não pode conter `hover:`.
    const baseRow = CODE.slice(
      CODE.indexOf("function TableRow"),
      CODE.indexOf("interactive &&", CODE.indexOf("function TableRow"))
    )
    expect(baseRow).not.toContain("hover:")
  })

  it("6. o table-viewport não desenha nada — invariante 2 da dissolução", () => {
    const inicio = CODE.indexOf('data-slot="table-viewport"')
    const bloco = CODE.slice(inicio, CODE.indexOf("</div>", inicio))
    for (const proibida of ["bg-", "ring-", "rounded-", "shadow-", "border-"]) {
      expect(bloco).not.toContain(proibida)
    }
  })

  it('7. a moldura (variant="outline") existe como nó próprio, com border+rounded', () => {
    // O viewport (testado acima) não pinta nada; quem carrega border/rounded
    // só pode ser este segundo nó, `data-slot="table-frame"`.
    const molduraIdx = CODE.indexOf('data-slot="table-frame"')
    expect(molduraIdx).toBeGreaterThan(-1)
    const bloco = CODE.slice(molduraIdx, CODE.indexOf(">", molduraIdx) + 1)
    expect(bloco).toContain("overflow-hidden rounded-surface border border-border")
  })

  it('8. TableHeader variant="muted" nunca junta fio e tinta na mesma string — regra J', () => {
    const bloco = CODE.slice(
      CODE.indexOf("function TableHeader"),
      CODE.indexOf("function TableBody")
    )
    // Cada linha do fonte, e não a string de classe isolada: por isso o
    // limite de fronteira aceita aspas além de espaço — é o caractere que de
    // fato precede uma classe no código-fonte, e não só em `classes[1]`
    // extraído (que é o que o auditor de verdade enxerga).
    for (const linha of bloco.split("\n")) {
      const temFio = /(?:^|\s|")border-[bt](?:\s|"|$)/.test(linha)
      const temTinta = /(?:^|\s|")(?:dark:)?bg-muted\/\d+(?:\s|"|$)/.test(linha)
      expect(temFio && temTinta).toBe(false)
    }
  })

  it('9. a moldura não escreve role="toolbar", e provê `md` por contexto', () => {
    expect(PANEL_CODE).not.toContain('role="toolbar"')
    // O `md` de 44 é a linha dos painéis.
    expect(PANEL_CODE).toContain('TableSizeContext.Provider value="md"')
  })

  /** As três classes da coluna de ações, lidas do código. */
  const ACOES = [...CODE.matchAll(/const TABLE_ACTIONS_(\w+) =\s*"([^"]+)"/g)]
  const acao = (nome: string) => ACOES.find((m) => m[1] === nome)?.[2] ?? ""

  it("10. a coluna `actions` encolhe, alinha à direita e monta a fileira", () => {
    expect(ACOES).toHaveLength(3)
    expect(acao("HEAD_CLASS")).toBe("w-px whitespace-nowrap text-right")
    expect(acao("CELL_CLASS")).toMatch(/(?:^|\s)w-px(?:\s|$)/)
    expect(CODE).toMatch(/actions && TABLE_ACTIONS_HEAD_CLASS/)
    expect(CODE).toMatch(/actions && TABLE_ACTIONS_CELL_CLASS/)

    // A célula monta a fileira — o `<div>` que as duas telas reais escrevem à
    // mão, e que o catálogo teria de escrever de novo.
    expect(acao("ROW_CLASS")).toMatch(/(?:^|\s)flex(?:\s|$)/)
    expect(acao("ROW_CLASS")).toContain("justify-end")
    expect(CODE).toMatch(/data-slot="table-actions" className=\{TABLE_ACTIONS_ROW_CLASS\}/)

    // O cabeçalho não mostra rótulo, mas não fica sem nome: um `<th>` vazio é
    // anunciado como coluna sem nome.
    expect(CODE).toMatch(
      /actions \? \(\s*<span className="sr-only">\{children \?\? "Ações"\}<\/span>/
    )
  })

  it("11. o recuo horizontal da coluna vem de `--table-px`, e o vertical sai", () => {
    // A coluna de seleção crava `px-2` e ignora a densidade; esta não repete.
    for (const [, nome, classes] of ACOES) {
      expect(classes, `${nome} crava recuo horizontal`).not.toMatch(
        /(?:^|\s)(?:p|px|ps|pe|pl|pr)-/
      )
    }
    // O botão (28) é mais alto que a linha de texto (20): com o recuo do
    // degrau, a linha de ações cresceria de 44 para 52.
    expect(acao("CELL_CLASS")).toMatch(/(?:^|\s)py-0(?:\s|$)/)
  })

  it("12. os botões crescem no toque, e nada na coluna depende do cursor", () => {
    expect(acao("ROW_CLASS")).toContain("pointer-coarse:size-11")
    for (const [, nome, classes] of ACOES) {
      expect(classes, `${nome} esconde algo atrás do cursor`).not.toMatch(
        /hover:|opacity-0/
      )
    }
  })

  it("13. `sticky` é opaco na base e vidro sob `fade=\"bottom\"` — tinta translúcida só com borrão", () => {
    const bloco = CODE.slice(
      CODE.indexOf("function TableHeader"),
      CODE.indexOf("function TableBody")
    )
    // A base continua a composição opaca em srgb: é o que fica sem `backdrop-filter`.
    expect(bloco).toMatch(
      /sticky &&\s*variant === "muted" &&\s*"bg-\[color-mix\(in_srgb,var\(--color-muted\)_50%,var\(--color-card\)\)\]"/
    )
    // O vidro só existe onde o viewport não se mascara — ver a 27.
    expect(bloco).toContain('const vidro = sticky && fade === "bottom"')
    expect(bloco).toMatch(/vidro && "glass-surface"/)
    // 20% passando, e não 50: é o que segura os rótulos acima de 4,5 com o
    // texto claro de uma linha borrado atrás deles.
    expect(bloco).toContain(
      '"supports-backdrop-filter:bg-[color-mix(in_srgb,color-mix(in_srgb,var(--color-muted)_62.5%,var(--color-card))_80%,transparent)] reduced-transparency:bg-[color-mix(in_srgb,var(--color-muted)_50%,var(--color-card))]"'
    )
    // Nunca uma tinta translúcida solta num cabeçalho fixo: sem borrão as
    // linhas passariam nítidas por baixo — o que as duas telas escrevem à mão.
    for (const linha of bloco.split("\n")) {
      // `(?<!!)`: a linha do `muted` **parado** (`!sticky && …`) é translúcida de propósito.
      if (!/(?<!!)\bsticky &&|\bvidro &&/.test(linha)) continue
      for (const m of linha.matchAll(/(\S*)bg-(?:muted|card)\/\d+/g)) {
        expect(m[1].endsWith("supports-backdrop-filter:")).toBe(true)
      }
      for (const m of linha.matchAll(/(\S*)bg-\[[^\s"]*transparent\)\]/g)) {
        expect(m[1].endsWith("supports-backdrop-filter:")).toBe(true)
      }
    }
  })

  it("14. `sticky` sem `muted` é `bg-card`, vidro em `card/80`, e o `muted` parado não muda", () => {
    expect(CODE).toMatch(/sticky && variant !== "muted" && "bg-card"/)
    expect(CODE).toContain('"supports-backdrop-filter:bg-card/80 reduced-transparency:bg-card"')
    expect(CODE).toMatch(/!sticky && variant === "muted" && "bg-muted\/50"/)
  })

  it("15. o nome da linha sublinha no cursor e no toque, e só sob `interactive`", () => {
    const primaria = CODE.match(/const TABLE_PRIMARY_CELL_CLASS =\s*"([^"]+)"/)?.[1] ?? ""
    expect(primaria).toContain("group-hover/table-row:underline")
    expect(primaria).toContain("group-active/table-row:underline")
    expect(primaria).toContain("underline-offset-4")
    // Um `hover:` solto sublinharia o nome ao apontar a própria célula, também
    // numa linha que não responde ao cursor.
    expect(primaria).not.toMatch(/(?:^|\s)(?:hover|active):underline/)
    expect(CODE).toMatch(/primary && TABLE_PRIMARY_CELL_CLASS/)

    // O grupo só existe no ramo interativo: é o que desliga o traço fora dele.
    const linha = CODE.slice(CODE.indexOf("function TableRow"), CODE.indexOf("const TABLE_NUMERIC_HEAD_CLASS"))
    const interativo = linha.match(/interactive &&\s*\n\s*"([^"]+)"/)?.[1] ?? ""
    expect(interativo).toMatch(/(?:^|\s)group\/table-row(?:\s|$)/)
    expect(linha.replace(interativo, "")).not.toContain("group/table-row")
  })

  it("16. cada ação com nome ganha um tooltip `sm`, e o alvo de dedo não depende do `data-slot`", () => {
    const celula = CODE.slice(CODE.indexOf("function TableCell"), CODE.indexOf("function TableEmpty"))
    expect(celula).toContain('["aria-label"]')
    expect(celula).toContain("<TooltipTrigger asChild>{acao}</TooltipTrigger>")
    expect(celula).toContain('<TooltipContent size="sm">{rotulo}</TooltipContent>')
    // Um helper que devolve `<>…</>` chegaria como um filho só, sem nome: os
    // fragmentos são abertos antes do embrulho.
    expect(celula).toContain("acoesAbertas(children)")
    expect(CODE).toMatch(/no\.type === React\.Fragment\s*\?\s*acoesAbertas\(/)
    // O `TooltipTrigger asChild` troca o `data-slot` do botão por
    // `tooltip-trigger`: um seletor por `data-slot=button` deixaria de casar, e
    // o alvo de 44px sumiria calado no toque.
    expect(acao("ROW_CLASS")).not.toContain("data-slot=button")
    expect(acao("ROW_CLASS")).toContain("[&>button]:pointer-coarse:size-11")
  })

  it("17. o realce do botão se separa da linha acesa, e vence o `tertiary` nos dois temas", () => {
    const realce = CODE.match(/const TABLE_ACTION_HOVER_CLASS =\s*"([^"]+)"/)?.[1] ?? ""
    // Os quatro: cursor e toque, e o par `dark:` que vence o `dark:hover` do botão.
    for (const v of ["hover:", "active:", "dark:hover:", "dark:active:"]) {
      expect(realce.split(" "), v).toContain(`${v}bg-current/10`)
    }
    // Por `className`, para o `twMerge` remover o realce do `tertiary` — e o de
    // quem chama vem por último, para a exceção continuar possível.
    expect(CODE).toContain(
      "className: cn(destrutiva ? TABLE_ACTION_DESTRUCTIVE_CLASS : TABLE_ACTION_HOVER_CLASS, no.props.className)"
    )
  })

  it("21. a ação destrutiva é neutra em repouso e vira o botão `destructive` no cursor e no toque", () => {
    const perigo = CODE.match(/const TABLE_ACTION_DESTRUCTIVE_CLASS =\s*"([^"]+)"/)?.[1] ?? ""
    const classes = perigo.split(" ")
    // A superfície de repouso do `Button destructive`, nos dois temas e nos dois gatilhos.
    for (const c of [
      "hover:bg-destructive/10",
      "active:bg-destructive/10",
      "dark:hover:bg-destructive/20",
      "dark:active:bg-destructive/20",
      "hover:text-destructive-muted-foreground",
      "active:text-destructive-muted-foreground",
    ]) {
      expect(classes, c).toContain(c)
    }
    // Nada de vermelho em repouso: nenhuma classe sem variante de estado.
    for (const c of classes) expect(c, `${c} pinta em repouso`).toMatch(/^(?:dark:)?(?:hover|active):/)
    // A célula troca a intenção por `tertiary` — senão o vermelho ficaria em toda linha.
    expect(CODE).toContain('const destrutiva = no.props.variant === "destructive"')
    expect(CODE).toContain('...(destrutiva ? { variant: "tertiary" } : {})')
  })

  it("18. `fade` escolhe um eixo só; o de baixo é um véu irmão, e o viewport não se mascara", () => {
    const tabela = CODE.slice(CODE.indexOf("function Table("), CODE.indexOf("function TableHeader"))
    expect(tabela).toContain('fade = "sides"')
    // Só a ponta de baixo, espelhada na casca para o véu (irmão) poder ler. `arrows` no eixo x
    // publica `data-scroll-more-*`, que a sombra da coluna fixa lê.
    expect(tabela).toMatch(
      /useScrollFade\(\s*fundo \? \{ axis: "y", sides: "end", shell: true \} : \{ axis: "x", arrows: true \}\s*\)/
    )
    // O viewport de baixo não veste máscara nenhuma: só o recuo e a folga de
    // rolagem. E `none` não veste a lateral.
    expect(tabela).toContain(
      '"pb-(--scroll-fade-foot-h) [scroll-padding-block-end:calc(var(--scroll-fade-foot-h)+var(--scroll-fade-h)+0.25rem)]"'
    )
    expect(tabela).toContain('fade === "sides" && scrollFadeViewportXClassName')
    // A casca sangra por baixo do rodapé e segura o véu.
    expect(tabela).toContain(
      '"relative -mb-(--scroll-fade-foot-h) [--scroll-fade-h:--spacing(8)] [--scroll-fade-foot-h:var(--table-panel-foot-h,0px)]"'
    )
    expect(tabela).toContain('<div aria-hidden data-slot="table-fade-veil" className={scrollFadeVeilClassName} />')
    // Sem borrão de faixa: num corpo com rodapé ele virava retângulo de tom.
    expect(CODE).not.toContain("ScrollFadeBlurLayers")
  })

  it("19. o rodapé do painel sai da moldura, embaixo, e não publica faixa", () => {
    const rodape = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanelFooter"))
    expect(DT_SRC.startsWith('"use client"')).toBe(true)
    // Fora da moldura não há linhas passando por baixo dele.
    expect(rodape).not.toContain("--table-panel-foot-h")
    const painel = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanel("), PANEL_CODE.indexOf("function TablePanelToolbar"))
    expect(painel.indexOf("{footer}")).toBeGreaterThan(painel.indexOf("</Card>"))
  })

  it("20. a barra sai da moldura, sem fundo e sem fio", () => {
    const painel = PANEL_CODE.slice(
      PANEL_CODE.indexOf("function TablePanel("),
      PANEL_CODE.indexOf("function TablePanelToolbar")
    )
    // A barra é prop, renderizada antes da moldura — nunca caçada entre os
    // filhos, que é o que o Fast Refresh quebrava.
    expect(painel).toContain("toolbar?: React.ReactNode")
    expect(painel.indexOf("{toolbar}")).toBeGreaterThan(-1)
    expect(painel.indexOf("{toolbar}")).toBeLessThan(painel.indexOf("<Card"))
    expect(painel).not.toContain("React.Children")
    expect(painel).not.toMatch(/\.type\s*[!=]==/)
    // O recuo de tira mora no `Card`: fora dele cairia a zero.
    expect(painel).toContain('"[--card-strip-px:--spacing(4)]"')
    const barra = PANEL_CODE.slice(
      PANEL_CODE.indexOf("function TablePanelToolbar"),
      PANEL_CODE.indexOf("function TablePanelFooter")
    )
    // O fio transparente das laterais alinha o texto com as células; tinta, não.
    // Sem recuo vertical, e a altura do botão de ação (`sm`): a seleção não faz a barra pular.
    expect(barra).toContain('cn("min-h-7 border-x border-transparent py-0", className)')
    expect(barra).not.toMatch(/\bbg-/)
    expect(barra).not.toMatch(/border-border|border-b(?:\s|")/)
  })

  it("22. no cabeçalho fixo o divisor é sombra da célula, e não a borda da grade", () => {
    const bloco = CODE.slice(
      CODE.indexOf("function TableHeader"),
      CODE.indexOf("function TableBody")
    )
    // Com `border-collapse` a borda é da grade, e rola com o corpo.
    expect(bloco).toContain(
      '"[&_tr]:border-b-0 [&_th]:shadow-[inset_0_-1px_0_var(--color-border)]"'
    )
    // Só sob `sticky`: o cabeçalho parado continua com o fio de sempre.
    expect(bloco).toMatch(/sticky &&\s*"\[&_tr\]:border-b-0/)
    expect(bloco).toContain('"[&_tr]:border-b"')
  })

  it("23. no painel, a última linha só perde o fio quando não há rodapé", () => {
    // Sem rodapé, o fio dela empilharia com a borda de baixo da moldura; com
    // rodapé, é ele que separa as linhas do rodapé.
    expect(PANEL_CODE).toContain(
      '"[&_[data-slot=table-viewport]>table>tbody>tr:last-child]:border-b-0"'
    )
    expect(PANEL_CODE).not.toContain("data-fade=bottom")
  })

  it("24. o rodapé do painel é a barra de cima espelhada", () => {
    // Fora da moldura ele não mede uma linha: tem a forma da `TablePanelToolbar` (sem recuo
    // vertical, `min-h-7`, fio transparente).
    const rodape = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanelFooter"))
    expect(rodape).toContain('"min-h-7 border-x border-transparent py-0"')
  })

  it("25. a barra é slot: sai da moldura por construção, e como filho avisa", () => {
    const h = React.createElement
    const moldura = 'data-slot="table-panel"'
    const barra = 'data-slot="table-panel-toolbar"'
    const foraDaMoldura = (html: string) =>
      html.includes(barra) &&
      html.indexOf(barra) < html.indexOf(moldura) &&
      !html.slice(html.indexOf(moldura)).includes(barra)

    const erro = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      // (a) a barra pela prop
      const direta = renderToStaticMarkup(
        h(TablePanel, { toolbar: h(TablePanelToolbar, null, "3 transações") }, h("div", null, "corpo"))
      )
      expect(foraDaMoldura(direta)).toBe(true)
      // (b) embrulhada noutro componente — o caso que a detecção por tipo nunca
      // acharia, e o que o `DropdownMenu` registra para o `UserMenu`
      const Embrulho = () => h(TablePanelToolbar, null, "embrulhada")
      const embrulhada = renderToStaticMarkup(
        h(TablePanel, { toolbar: h(Embrulho) }, h("div", null, "corpo"))
      )
      expect(foraDaMoldura(embrulhada)).toBe(true)
      expect(erro).not.toHaveBeenCalled()
      // (c) como filho ela cai dentro da moldura, e o componente avisa
      renderToStaticMarkup(h(TablePanel, null, h(TablePanelToolbar, null, "x")))
      expect(erro).toHaveBeenCalledWith(expect.stringContaining("toolbar="))
    } finally {
      erro.mockRestore()
    }
  })

  it("26. nenhuma peça de ui/ reconhece filho pela identidade da função", () => {
    // O Fast Refresh troca a função a cada edição, e `c.type === Peca` deixa de
    // bater calado — foi assim que a barra do `TablePanel` voltava para dentro
    // da moldura. Só `React.Fragment` é estável. Quem precisa de uma peça num
    // lugar certo a recebe por prop, o idioma do `DropdownMenu`.
    const achados = readdirSync(UI)
      .filter((f) => f.endsWith(".tsx"))
      .flatMap((f) => {
        const codigo = semComentarios(lerFonte(join(UI, f)))
        return [...codigo.matchAll(/\.type\s*[!=]==?\s*(?!React\.Fragment\b)([A-Z]\w*)/g)].map(
          (m) => `${f}: ${m[0]}`
        )
      })
    expect(achados).toEqual([])
  })

  it("27. o viewport de um cabeçalho de vidro não se mascara — a borda de baixo é véu", () => {
    // `backdrop-filter` dentro de um elemento mascarado não borra, e a máscara num `<tbody>`
    // não é redesenhada ao mudar: nada nesta tabela se mascara.
    expect(CODE).not.toContain("scrollFadeViewportClassName")
    expect(CODE).not.toMatch(/mask-image/)
    const css = lerFonte("src/app/globals.css")
    expect(css).not.toContain("scroll-fade-y-content")
    const inicio = css.indexOf("@utility scroll-fade-veil-y {")
    expect(inicio).toBeGreaterThan(-1)
    const util = semComentarios(css.slice(inicio, css.indexOf("\n}\n", inicio) + 2))
    expect(util).not.toMatch(/mask/)
    expect(util).toContain("pointer-events: none")
    expect(util.match(/linear-gradient\(/g)?.length).toBe(1)
    // A mesma curva e o mesmo piso da rampa, e a cor da superfície por variável.
    expect(util).toContain("calc((1 - var(--scroll-fade-floor)) * 100%)")
    // A rampa atravessa a faixa (chega ao piso a 3/4 dela), e a curva é
    // suave nas duas pontas — terminando no topo da faixa ela desenhava borda.
    expect(util).toContain(
      "--scroll-fade-veil-l: calc(var(--scroll-fade-veil-z) + var(--scroll-fade-foot-h, 0px) * 0.75)"
    )
    expect(util.match(/color-mix\(/g)?.length).toBeGreaterThanOrEqual(10)
    expect(util).toContain("var(--scroll-fade-surface, var(--color-card))")
    expect(util).toContain('[data-scroll-fade="off"] > &')
    // E fecha opaco na borda de baixo: no piso a linha seguinte aparece a 6% e
    // é cortada pela borda, e a moldura lê como se não tivesse borda embaixo.
    expect(util).toMatch(/var\(--scroll-fade-veil-c\) 100%\s*\)/)
  })

  it("28. as molduras recortam com `clip-path`, e o fio da linha segue sendo borda", () => {
    // O borrão do cabeçalho fixo vira camada própria, e escapa do recorte
    // arredondado de um `overflow` no Chrome acelerado.
    expect(CODE).toContain("[clip-path:inset(0_round_var(--radius-surface))]")
    expect(PANEL_CODE).toContain('"[clip-path:inset(0_round_var(--radius-surface))]"')
    // Com o véu pintando por cima de tudo, o fio não precisa virar sombra da célula.
    expect(CODE).not.toContain("[&>tr]:border-b-0")
    expect(PANEL_CODE).not.toContain("tr:last-child>td]:shadow-none")
    // O `clip-path` recorta pelo raio de fora e não protege o arco da borda: os cantos de baixo
    // leem o raio de dentro que a moldura publica, por variável e não `inherit` (entre a
    // moldura e o véu costuma haver um embrulho sem raio).
    expect(CODE).toContain("[--scroll-fade-veil-r:calc(var(--radius-surface)_-_1px)]")
    expect(PANEL_CODE).toContain('"[--scroll-fade-veil-r:calc(var(--radius-surface)_-_1px)]"')
    const css = lerFonte("src/app/globals.css")
    const inicio = css.indexOf("@utility scroll-fade-veil-y {")
    const util = semComentarios(css.slice(inicio, css.indexOf("\n}\n", inicio) + 2))
    expect(util).toContain("border-bottom-left-radius: var(--scroll-fade-veil-r, 0px)")
    expect(util).toContain("border-bottom-right-radius: var(--scroll-fade-veil-r, 0px)")
  })
})

describe("a linha de totais do DataTable", () => {
  it("recebe as colunas à vista, e nenhum colSpan cravado passa da conta", () => {
    // Com 7 + 1 + 1 numa tabela de 8, a nona coluna seria um vão na ponta de toda linha.
    expect(DT_SRC).toContain("footer(table.getPrePaginatedRowModel().rows.map((r) => r.original), { columns: nColunas })")
    const doc = lerFonte("src/app/designsystem/docs/data-table.tsx")
    expect(doc).not.toMatch(/colSpan=\{\d+\}/)
  })
})

describe("o painel Exibir do DataTable", () => {
  const painel = DT_SRC.slice(DT_SRC.indexOf("export function DataTableViewOptions"), DT_SRC.indexOf("/** O CSV do que está filtrado"))
  it("a coluna é uma linha inteira, a última não sai, e há o que redefinir", () => {
    expect(painel).toContain("menuItemGeometryClassName")
    expect(painel).toContain("const ultima = ligada && visiveis === 1")
    expect(painel).toContain("{mudou ? (")
    expect(painel).toContain('<Popover mobile="sheet">')
    // A densidade diz o nome e a altura da linha, e não só a sigla.
    expect(painel).toContain("{atual.label} · {atual.altura}px")
  })
})

describe("a seta de expandir", () => {
  it("é ghost também aberta: o realce só no cursor e no toque", () => {
    expect(SRC).toContain(
      '"aria-expanded:[--button-hover:0] aria-expanded:hover:[--button-hover:1] aria-expanded:active:[--button-hover:1]"'
    )
  })
})

describe("o detalhe da linha", () => {
  it("começa onde o conteúdo da linha começa, e recua com a sublinha", () => {
    expect(SRC).toContain("{lead > 0 ? <td colSpan={lead} aria-hidden className=\"p-0\" /> : null}")
    expect(SRC).toContain('depth > 0 && "ps-[calc(var(--table-px)+var(--table-depth)*1.5rem)]"')
    expect(DT_SRC).toContain('lead={Math.max(0, folhas.findIndex((f) => !f.id.startsWith("__")))}')
  })
})
