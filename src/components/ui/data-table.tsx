"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/16/solid"
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  constructFilterFn,
  filterFn_arrHas,
  filterFn_includesString,
  functionalUpdate,
  globalFilteringFeature,
  metaHelper,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type Cell,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type ExpandedState,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type ReactTable,
  type Updater,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import { cn } from "@/lib/utils"
import { normalizeSearchText } from "@/lib/command-filter"
import { downloadCsv, toCsv, type CsvColumn } from "@/lib/data-table/csv"
import { nextCell, nextRowIndex } from "@/lib/data-table/keyboard"
import { runningBalance } from "@/lib/data-table/running-balance"
import {
  mergeParams,
  parseList,
  parsePage,
  parseSort,
  serializeList,
  serializePage,
  serializeSort,
} from "@/lib/data-table/url-state"
import { formatDatePtBr } from "@/lib/transaction-date"
import { numberBR } from "@/lib/formatters"
import { parseMoneyBrl } from "@/lib/money-brl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxField,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxClear,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  contextMenuTargets,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Pagination, PaginationStatus } from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { menuItemFadeClassName, menuItemGeometryClassName } from "@/lib/menu-classes"
import { SearchInput } from "@/components/ui/search-input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableCellIdentity,
  TableCellMoney,
  TableEmpty,
  TableError,
  TableExpandButton,
  TableFooter,
  TableGroupRow,
  TableHead,
  TableHeader,
  TableRow,
  TableRowDetail,
  TableSizeContext,
  TableSkeleton,
  type TablePin,
  type TableSize,
  type TableSkeletonColumn,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/* -------------------------------------------------------------------------- */
/* A moldura: o TablePanel                                                     */
/* -------------------------------------------------------------------------- */

// Mora aqui desde a rodada 231: era `table-panel.tsx`, com página própria, e
// as duas páginas descreviam a mesma tabela. Sozinho, sem estado, ele serve o
// esqueleto de carregamento; com estado, é a moldura que o `DataTable` monta.

/**
 * Verdadeiro dentro da moldura. Existe só para a `TablePanelToolbar` avisar
 * quando é passada como filho — ali ela cairia dentro do painel, calada.
 */
const TablePanelFrameContext = React.createContext(false)

/**
 * A tabela como o app a mostra: moldura, barra de ações opcional, tabela e
 * rodapé de paginação — o que `transactions-table.tsx` e
 * `subscriptions/page-client.tsx` montavam em 7 lugares com quatro grafias
 * diferentes de arredondar os cantos:
 *
 * ```
 * <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
 *   <CardContent className="relative flex flex-col p-0">
 *     <div className={cn("min-w-0", …rounded-t-xl/rounded-b-xl condicionais…)}>
 * ```
 *
 * `Card` já resolvia isso — `padding="none"` zera o recuo do corpo
 * (`--card-px: 0px`) e `overflow-hidden` recorta os cantos de todo filho —,
 * e as quatro grafias eram a prova de que faltava a peça, não de que o
 * `Card` não bastava. `TablePanel` é essa peça: `Card padding="none"
 * variant="outline"`, publicando `md` em `TableSizeContext` — nenhuma tela
 * dentro dele escreve `size`, porque `md` (44, o `lg` de antes da rodada 225)
 * é a densidade confortável que os 7 painéis já usavam. O `DataTable` publica
 * por cima a densidade que a pessoa escolheu.
 *
 * **Sem eixo de superfície.** As 7 chamadas são a mesma variante do `Card`,
 * sem uma segunda evidência — e eixo sem contagem é ficção, a régua que este
 * sistema já aplicou ao cortar dois eixos de outros componentes. O dia em que
 * uma tela pedir outra superfície, ela entra com o caso que a justifica.
 *
 * **A barra de topo mora fora da moldura**, por pedido do dono: a contagem e
 * as ações de seleção (excluir etc.) ficam acima do painel, e a moldura começa
 * no cabeçalho da tabela. **A barra é prop (`toolbar`), e não filho.** Ela já
 * foi separada dos outros filhos pelo tipo da função, e isso quebrou medido: a
 * cada edição deste arquivo o Fast Refresh troca a função, a página segue
 * criando o elemento com a antiga, a comparação deixa de bater e as quatro
 * barras do catálogo caíam para dentro da moldura. É a decisão que o
 * `DropdownMenu` já registra para `header`/`footer`: detectar peça entre os
 * filhos não funciona, e slot como prop é o idioma daqui — que também não
 * depende de fragmento nem de embrulho. `className` vai ao envelope, que
 * é quem dimensiona o conjunto; o resto das props segue na moldura.
 *
 * **O rodapé de paginação também mora fora, embaixo** (rodada 231, pedido do
 * dono): `footer` é o espelho de `toolbar`, e a moldura fecha na última linha.
 * Com ele saiu a faixa que o rodapé publicava (`--table-panel-foot-h`) para as
 * linhas passarem por baixo dele — fora da moldura não há o que atravessar.
 *
 * O envelope declara o recuo horizontal de tira: a variável mora no `Card`, e
 * fora dele o recuo da barra cairia a zero calado.
 */
function TablePanel({
  className,
  toolbar,
  footer,
  children,
  ...props
}: React.ComponentProps<typeof Card> & {
  /** A barra de topo, acima da moldura. Passe uma `TablePanelToolbar`. */
  toolbar?: React.ReactNode
  /** O rodapé de paginação, abaixo da moldura. Passe um `TablePanelFooter`. */
  footer?: React.ReactNode
}) {
  return (
    <TableSizeContext.Provider value="md">
      <div
        data-slot="table-panel-group"
        className={cn(
          "flex min-w-0 flex-col gap-(--space-inline)",
          "[--card-strip-px:--spacing(4)]",
          className
        )}
      >
        {toolbar}
        <Card
          data-slot="table-panel"
          padding="none"
          variant="outline"
          className={cn(
            "gap-0",
            // **A última linha não soma fio com a moldura.** O `Card` fecha
            // embaixo, e o divisor da última linha encostava na borda dele —
            // dois fios empilhados. Desde que o rodapé saiu da moldura (rodada
            // 231) não há mais o que ele separe ali dentro, e ele sai sempre.
            "[&_[data-slot=table-viewport]>table>tbody>tr:last-child]:border-b-0",
            // **`clip-path`, e não só o `overflow-hidden` do `Card`.** O borrão
            // do cabeçalho fixo vira camada própria, e no Chrome acelerado ela
            // escapa do recorte arredondado de um `overflow` — os cantos do
            // vidro saíam da moldura. O `clip-path`
            // recorta em qualquer motor, no raio que o `Card` já desenha, e
            // ainda limita o que o borrão enxerga ao que está dentro dela.
            "[clip-path:inset(0_round_var(--radius-xl))]",
            // O raio de dentro da moldura, para o véu do rodapé não pintar
            // sobre o arco da borda nos cantos de baixo.
            "[--scroll-fade-veil-r:calc(var(--radius-xl)_-_1px)]"
          )}
          {...props}
        >
          <TablePanelFrameContext.Provider value>
            {children}
          </TablePanelFrameContext.Provider>
        </Card>
        {footer}
      </div>
    </TableSizeContext.Provider>
  )
}

/**
 * A barra de topo — contagem, filtro, seleção em massa. É `CardToolbar` com o
 * nome do painel: mesma peça, mesmas duas variantes (`label` o rótulo apagado,
 * `title` o dado que nomeia o painel).
 *
 * **Nunca `role="toolbar"`.** O papel é um contrato de teclado — foco
 * itinerante entre os controles —, e nenhuma barra de seleção do app o
 * implementa. O app escrevia o papel à mão em quatro lugares sem cumprir o
 * contrato; na migração do backlog os quatro o perderam, que é exatamente o
 * defeito que `Toolbar` documenta e se recusa a reproduzir.
 *
 * **Ela fica acima da moldura, sem fundo e sem borda.** Ela chegou a ter o
 * `bg-muted/50` do cabeçalho da tabela como destaque leve, e o dono o tirou:
 * fora da moldura, a posição já a separa da tabela. O fio **transparente** nas laterais é
 * carga estrutural: a moldura tem 1px de borda, e sem ele o texto da barra
 * cairia 1px à esquerda da coluna das células.
 *
 * **Sem recuo vertical, com `min-h-7`.** Fora da moldura quem separa a barra da
 * tabela é o vão do envelope (8px), e os 12px de cada lado sobravam — pedido do
 * dono. A altura mínima é a do botão de ação da seleção (`sm`, 28px), então a contagem e a seleção com
 * "Excluir" medem o mesmo e a barra não pula ao marcar uma linha.
 */
function TablePanelToolbar({
  className,
  ...props
}: React.ComponentProps<typeof CardToolbar>) {
  const naMoldura = React.useContext(TablePanelFrameContext)
  if (naMoldura && process.env.NODE_ENV !== "production") {
    console.error(
      "TablePanelToolbar dentro da moldura: passe a barra em <TablePanel toolbar={…}>, e não como filho."
    )
  }
  return (
    <CardToolbar
      data-slot="table-panel-toolbar"
      className={cn("min-h-7 border-x border-transparent py-0", className)}
      {...props}
    />
  )
}

/**
 * O rodapé de paginação — a contagem e os controles. Vai na prop `footer` do
 * `TablePanel`, **abaixo da moldura** e separado dela pelo mesmo vão da barra
 * de cima (rodada 231, pedido do dono): é a forma da `TablePanelToolbar`
 * espelhada — sem fundo, sem recuo vertical, `min-h-7`, e o fio
 * **transparente** nas laterais que alinha o texto com a coluna das células.
 * Empilha no telefone e vira linha no desktop. Como filho cairia dentro da
 * moldura, e avisa no console.
 */
function TablePanelFooter({
  className,
  ...props
}: React.ComponentProps<typeof CardNote>) {
  const naMoldura = React.useContext(TablePanelFrameContext)
  if (naMoldura && process.env.NODE_ENV !== "production") {
    console.error(
      "TablePanelFooter dentro da moldura: passe o rodapé em <TablePanel footer={…}>, e não como filho."
    )
  }
  return (
    <CardNote
      data-slot="table-panel-footer"
      className={cn(
        "flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between",
        "min-h-7 border-x border-transparent py-0",
        className
      )}
      {...props}
    />
  )
}

export { TablePanel, TablePanelFooter, TablePanelToolbar }

/**
 * A tabela de dados (rodada 225): o motor da `TanStack Table` (v9) por baixo
 * das peças da `Table` e do `TablePanel`. Ele **não desenha nada** que a
 * `Table` já desenhe — só decide o estado e compõe:
 *
 * - **ordenar** por uma coluna ou várias (Shift+clique), com a seta que gira;
 * - **marcar** com o indeterminado, a faixa (Shift+clique), o grupo e o
 *   "marcar todos os N", com a **barra flutuante** das ações em massa;
 * - **buscar** sem acento, **filtrar** por faceta com a contagem, **esconder
 *   colunas** e trocar a **densidade**, guardadas por tabela;
 * - **agrupar** linhas consecutivas com o total, **expandir** o detalhe e as
 *   **sublinhas**;
 * - as **ações** da linha à vista e no ⋯ (folha no telefone), repetidas no
 *   menu de contexto;
 * - o **gêmeo do telefone**, gerado das colunas e trocado por CSS;
 * - o **teclado** entre as linhas, a **URL**, a **virtualização**, o **CSV**
 *   e a **edição** na célula (esta, numa grade de verdade).
 *
 * **Os dados podem vir do servidor** (`manual`): aí ordenar, paginar e
 * filtrar só escrevem o estado, e quem chama busca a página — a forma das
 * transações, que pagina e ordena no banco.
 */

/** O que cada coluna diz de si além do que a TanStack já sabe. */
export type DataTableColumnMeta = {
  /** O nome legível: o menu de colunas, o cabeçalho do CSV, o gêmeo. */
  label?: string
  numeric?: boolean
  pin?: TablePin
  /** O nome da linha — sublinha numa linha clicável. */
  primary?: boolean
  headClassName?: string
  cellClassName?: string
  /**
   * O lugar da coluna no gêmeo do telefone. Sem ele, ela não aparece lá.
   * `meta` (rodada 231) é a linha miúda sob a ponta, à direita — a data, por
   * padrão.
   */
  mobile?: "media" | "title" | "description" | "trailing" | "meta"
  /**
   * As partes da célula de identidade, para o gêmeo as separar: o ladrilho na
   * mídia do `Item`, o nome no título e a legenda na descrição — e não a
   * célula inteira dentro do título. A fábrica `identity` as preenche.
   */
  identity?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    title: (row: any) => React.ReactNode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    description?: (row: any) => React.ReactNode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    media?: (row: any) => React.ReactNode
  }
  /** O valor no CSV, cru. `false` tira a coluna do arquivo. */
  csv?: false | ((row: never) => string | number | boolean | Date | null | undefined)
  /** A célula se edita (com `editable` no `DataTable`). */
  edit?: { type: "text" | "money" | "select"; options?: { value: string; label: string }[] }
  /** O filtro por faceta: as opções, ou as que os dados trazem. */
  facet?: { options?: { value: string; label: string }[] }
}

/**
 * A busca sem acento — "alimentacao" acha "Alimentação" —, a mesma régua da
 * paleta de comandos e do `Combobox` (`normalizeSearchText`). Na v9 um filtro
 * é um comparador de valores com os normalizadores ao lado
 * (`constructFilterFn`), então esta é a `includesString` com os dois trocados.
 */
const filtroSemAcento = constructFilterFn({
  ...filterFn_includesString,
  resolveFilterValue: (v: unknown) => normalizeSearchText(String(v ?? "")),
  resolveDataValue: (v: unknown) => (v == null ? undefined : normalizeSearchText(String(v))),
})

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortedRowModel: createSortedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    // A faceta: o valor da linha está **entre** os escolhidos. Na v9 o
    // `arrIncludesSome` pede que o valor da linha já seja uma lista.
    arrHas: filterFn_arrHas,
    semAcento: filtroSemAcento,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
    basic: sortFn_basic,
  },
  columnMeta: metaHelper<DataTableColumnMeta>(),
})

export type DataTableFeatures = typeof dataTableFeatures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumnDef<T extends RowData> = ColumnDef<DataTableFeatures, T, any>
export type DataTableRow<T extends RowData> = Row<DataTableFeatures, T>

/** O ajudante de colunas, já com as features do `DataTable`. */
export function createDataTableColumnHelper<T extends RowData>() {
  return createColumnHelper<DataTableFeatures, T>()
}

const metaDe = <T extends RowData>(column: Column<DataTableFeatures, T, unknown>) =>
  (column.columnDef.meta ?? {}) as DataTableColumnMeta

/* -------------------------------------------------------------------------- */
/* Ações                                                                       */
/* -------------------------------------------------------------------------- */

export type DataTableAction<T> = {
  label: string
  /** Um ícone `16/solid`. */
  icon?: React.ReactNode
  onSelect: (row: T) => void | Promise<unknown>
  variant?: "default" | "destructive"
  /** O primeiro toque só arma (o `confirm` do `DropdownMenuItem`). */
  confirm?: boolean | string
  /** Fica à vista na linha, como botão de ícone; as outras vão para o ⋯. */
  primary?: boolean
  hidden?: (row: T) => boolean
}

export type DataTableBulkAction<T> = {
  label: string
  icon?: React.ReactNode
  /**
   * Recebe as linhas marcadas que estão carregadas e os ids de todas. A
   * seleção limpa quando ela termina — **menos se devolver `false`**: a ação
   * que só abre uma confirmação devolve `false`, e cancelar não perde a
   * seleção (a tela limpa ao confirmar).
   */
  onSelect: (rows: T[], ids: string[]) => void | false | Promise<unknown>
  variant?: "default" | "destructive"
  /** A ação não vale para esta seleção — "Editar" com mais de uma marcada. */
  disabled?: (rows: T[]) => boolean
}

/* -------------------------------------------------------------------------- */
/* Contexto                                                                    */
/* -------------------------------------------------------------------------- */

type DataTableContextValue = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ReactTable<DataTableFeatures, any, any>
  density: TableSize
  setDensity: (d: TableSize) => void
  manual: boolean
  onExport?: () => void
  exportFile?: string
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null)

function useDataTableContext(peca: string) {
  const ctx = React.useContext(DataTableContext)
  if (!ctx) throw new Error(`${peca} mora dentro de um <DataTable>.`)
  return ctx
}

/** O estado da tabela, para quem compõe a barra à mão. */
export function useDataTable() {
  return useDataTableContext("useDataTable").table
}

/* -------------------------------------------------------------------------- */
/* Estado: controlado ou não, com a mesma assinatura que a TanStack chama      */
/* -------------------------------------------------------------------------- */

function useFatia<V>(
  controlado: V | undefined,
  aoMudar: ((v: V) => void) | undefined,
  inicial: V
): [V, (u: Updater<V>) => void] {
  const [interno, setInterno] = React.useState(inicial)
  const valor = controlado !== undefined ? controlado : interno
  const valorRef = React.useRef(valor)
  React.useEffect(() => {
    valorRef.current = valor
  })
  const set = React.useCallback(
    (u: Updater<V>) => {
      const proximo = functionalUpdate(u, valorRef.current)
      valorRef.current = proximo
      if (controlado === undefined) setInterno(proximo)
      aoMudar?.(proximo)
    },
    [controlado, aoMudar]
  )
  return [valor, set]
}

/** A altura é a da linha da `Table` em cada degrau — o que a pessoa escolhe de fato. */
const DENSIDADES: { value: TableSize; label: string; altura: number }[] = [
  { value: "xs", label: "Mínima", altura: 32 },
  { value: "sm", label: "Compacta", altura: 36 },
  { value: "md", label: "Padrão", altura: 44 },
  { value: "lg", label: "Ampla", altura: 52 },
  { value: "xl", label: "Arejada", altura: 64 },
]

/* -------------------------------------------------------------------------- */
/* As props                                                                    */
/* -------------------------------------------------------------------------- */

export type DataTableToolbarConfig = {
  /** O campo de busca; uma string é o placeholder. */
  search?: boolean | string
  /** As colunas com filtro por faceta (precisam de `meta.facet`). */
  facets?: string[]
  /** O menu de colunas e densidade. */
  view?: boolean
  /** O botão de exportar; a string é o nome do arquivo. */
  export?: string
  /** O que vem antes e depois — a contagem, um botão da tela. */
  start?: React.ReactNode
  end?: React.ReactNode
}

export type DataTableProps<T extends RowData> = {
  columns: DataTableColumnDef<T>[]
  data: T[]
  getRowId: (row: T) => string
  /** O nome de cada linha, para os rótulos acessíveis ("Selecionar Mercado"). */
  getRowLabel?: (row: T) => string
  /**
   * A chave das escolhas guardadas (densidade e colunas), em `localStorage`.
   * Sem ela, nada é guardado.
   */
  id?: string
  "aria-label"?: string

  sorting?: SortingState
  onSortingChange?: (v: SortingState) => void
  defaultSorting?: SortingState
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (v: RowSelectionState) => void
  pagination?: PaginationState
  onPaginationChange?: (v: PaginationState) => void
  /** Linhas por página; `false` desliga a paginação. */
  pageSize?: number | false
  globalFilter?: string
  onGlobalFilterChange?: (v: string) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (v: ColumnFiltersState) => void
  expanded?: ExpandedState
  onExpandedChange?: (v: ExpandedState) => void

  /** Dados do servidor: o estado só é escrito, e quem chama busca a página. */
  manual?: { rowCount: number; sorting?: boolean; pagination?: boolean; filtering?: boolean }
  /** A ordenação, a página, a busca e as facetas na URL. */
  urlState?: boolean | { prefix?: string }

  onRowClick?: (row: T) => void
  /**
   * Quais linhas o clique abre. Sem ela, todas — com ela, a linha que não
   * abre (a projetada das transações) não tem cursor, realce, Tab nem Enter,
   * em vez de parecer clicável e não fazer nada.
   */
  rowClickable?: (row: T) => boolean
  rowState?: (row: T) => "current" | "pending" | undefined
  renderDetail?: (row: T) => React.ReactNode
  getSubRows?: (row: T) => T[] | undefined
  /**
   * Agrupa linhas **consecutivas** pela chave — o mês das transações. Recebe a
   * ordenação, e `null` desliga o grupo: o mês só faz sentido ordenado por
   * data, e ordenado por valor ele viraria uma faixa a cada linha.
   */
  groupBy?: (row: T, ctx: { sorting: SortingState }) => { key: string; label: React.ReactNode } | null
  groupTotal?: (rows: T[]) => React.ReactNode
  groupCollapsible?: boolean

  enableSelection?: boolean | ((row: T) => boolean)
  bulkActions?: DataTableBulkAction<T>[]
  /** "Marcar todos os N" quando a seleção pede o que não está carregado. */
  onSelectAllMatching?: () => void
  rowActions?: DataTableAction<T>[]
  /**
   * O botão direito (e o toque longo). `true` repete as `rowActions`; uma
   * função monta o `ContextMenuContent` inteiro e recebe os **alvos** pela
   * regra do `contextMenuTargets`: a seleção toda se a linha faz parte dela,
   * só ela se não faz.
   */
  rowContextMenu?: boolean | ((row: T, ctx: { targets: T[]; selected: boolean }) => React.ReactNode)

  toolbar?: DataTableToolbarConfig | React.ReactNode
  /** Sem a moldura do painel: só a tabela. */
  panel?: boolean
  density?: TableSize
  onDensityChange?: (d: TableSize) => void
  striped?: boolean
  dividers?: "rows" | "none" | "grid"
  headerVariant?: "plain" | "muted"
  stickyHeader?: boolean
  viewportClassName?: string

  loading?: boolean
  pending?: boolean
  error?: { message?: React.ReactNode; onRetry?: () => void | Promise<unknown> } | null
  empty?: React.ReactNode
  /**
   * A linha de totais, no `<tfoot>`: recebe as linhas filtradas e quantas
   * colunas estão à vista. Some os `colSpan` a `columns` — um número cravado
   * passa da conta quando há caixa de seleção ou coluna escondida, e a coluna
   * fantasma vira um vão vazio na ponta de todas as linhas.
   */
  footer?: (rows: T[], info: { columns: number }) => React.ReactNode
  /**
   * A contagem no rodapé — "12 assinaturas", "4 na lista filtrada (de 12)".
   * Com ela o rodapé aparece mesmo numa página só; sem ela, só quando há
   * mais de uma, com "1–20 de 340".
   */
  countLabel?: (total: number, ctx: { filtered: boolean; all: number }) => React.ReactNode

  /** O gêmeo do telefone, das colunas com `meta.mobile`. Ligado se houver título. */
  mobile?: boolean
  /** As linhas que entram em cascata e deslizam ao reordenar. */
  motion?: boolean
  virtualize?: { estimateSize?: number; overscan?: number }
  /** A edição na célula — liga `role="grid"`. */
  editable?: {
    onCellEdit: (rowId: string, columnId: string, value: string | number | null) => void | Promise<unknown>
  }
  /** O CSV de dados do servidor: quem chama busca tudo e exporta. */
  onExport?: () => void
}

const VAZIO: never[] = []

/** Acima disso, deslizar cada linha custa mais do que mostra. */
const TETO_DO_MOVIMENTO = 60

const MOLA_DO_REALCE = { type: "spring", duration: 0.28, bounce: 0.2 } as const

/* -------------------------------------------------------------------------- */
/* O componente                                                                */
/* -------------------------------------------------------------------------- */

export function DataTable<T extends RowData>(props: DataTableProps<T>) {
  const {
    columns: colunasDaTela,
    data,
    getRowId,
    getRowLabel,
    id,
    manual,
    urlState,
    onRowClick,
    rowClickable,
    rowState,
    renderDetail,
    getSubRows,
    groupBy,
    groupTotal,
    groupCollapsible = false,
    enableSelection = false,
    bulkActions,
    onSelectAllMatching,
    rowActions,
    rowContextMenu = false,
    toolbar,
    panel = true,
    striped,
    dividers,
    headerVariant = "muted",
    stickyHeader = false,
    viewportClassName,
    loading = false,
    pending = false,
    error,
    empty,
    footer,
    countLabel,
    motion: comMovimento = true,
    virtualize,
    editable,
    onExport,
  } = props
  const reduzir = useReducedMotion()
  const rotuloDe = React.useCallback(
    (row: T) => getRowLabel?.(row) ?? getRowId(row),
    [getRowLabel, getRowId]
  )

  // A densidade: a do contexto (um painel por fora), a da tela, a guardada.
  const [density, setDensityRaw] = useFatia<TableSize>(props.density, props.onDensityChange, "md")
  const setDensity = React.useCallback((d: TableSize) => setDensityRaw(d), [setDensityRaw])

  const paginar = props.pageSize !== false
  const [sorting, setSorting] = useFatia(props.sorting, props.onSortingChange, props.defaultSorting ?? [])
  const [rowSelection, setRowSelection] = useFatia<RowSelectionState>(props.rowSelection, props.onRowSelectionChange, {})
  const [pagination, setPagination] = useFatia<PaginationState>(props.pagination, props.onPaginationChange, {
    pageIndex: 0,
    pageSize: typeof props.pageSize === "number" ? props.pageSize : 20,
  })
  const [globalFilter, setGlobalFilter] = useFatia(props.globalFilter, props.onGlobalFilterChange, "")
  const [columnFilters, setColumnFilters] = useFatia<ColumnFiltersState>(props.columnFilters, props.onColumnFiltersChange, [])
  const [expanded, setExpanded] = useFatia<ExpandedState>(props.expanded, props.onExpandedChange, {})
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({})

  // --- As escolhas guardadas: lidas depois da hidratação, como as larguras
  // do `Resizable` — no servidor não há `localStorage`, e ler no render faria
  // a primeira pintura discordar do HTML.
  React.useEffect(() => {
    if (!id) return
    try {
      const salvo = JSON.parse(window.localStorage.getItem(`data-table:${id}`) ?? "null") as {
        density?: TableSize
        hidden?: string[]
      } | null
      if (salvo?.density) setDensityRaw(salvo.density)
      if (salvo?.hidden?.length)
        setColumnVisibility(Object.fromEntries(salvo.hidden.map((c) => [c, false])))
    } catch {
      // Sem armazenamento (aba privada, bloqueio): a tabela segue no padrão.
    }
  }, [id, setDensityRaw])
  React.useEffect(() => {
    if (!id) return
    try {
      const hidden = Object.entries(columnVisibility).filter(([, v]) => v === false).map(([k]) => k)
      window.localStorage.setItem(`data-table:${id}`, JSON.stringify({ density, hidden }))
    } catch {
      // idem
    }
  }, [id, density, columnVisibility])

  // --- A URL: lida uma vez na montagem e escrita a cada troca. Sem
  // `useSearchParams`, que exigiria um `Suspense` em volta de toda página
  // estática; o `history.replaceState` é sincronizado pelo roteador do Next.
  const prefixo = typeof urlState === "object" ? (urlState.prefix ?? "") : ""
  const urlLida = React.useRef(false)
  // O filtro que a URL traz não é "a pessoa filtrou": a página dela fica.
  const filtroDaUrl = React.useRef(false)
  React.useEffect(() => {
    if (!urlState || urlLida.current) return
    urlLida.current = true
    const p = new URLSearchParams(window.location.search)
    const ids = colunasDaTela.map((c) => c.id ?? ("accessorKey" in c ? String(c.accessorKey) : "")).filter(Boolean)
    const sort = parseSort(p.get(`${prefixo}sort`), ids)
    if (sort.length) setSorting(sort)
    const page = parsePage(p.get(`${prefixo}page`))
    if (page) setPagination((pg) => ({ ...pg, pageIndex: page }))
    const q = p.get(`${prefixo}q`)
    if (q) setGlobalFilter(q)
    const filtros = ids
      .map((cid) => ({ id: cid, value: parseList(p.get(`${prefixo}${cid}`)) }))
      .filter((f) => f.value.length)
    if (filtros.length) setColumnFilters(filtros)
    filtroDaUrl.current = Boolean(q) || filtros.length > 0
  }, [urlState, prefixo, colunasDaTela, setSorting, setPagination, setGlobalFilter, setColumnFilters])
  React.useEffect(() => {
    if (!urlState || !urlLida.current) return
    const proximo: Record<string, string | null> = {
      [`${prefixo}sort`]: sorting.length ? serializeSort(sorting) : null,
      [`${prefixo}page`]: serializePage(pagination.pageIndex),
      [`${prefixo}q`]: globalFilter || null,
    }
    for (const c of colunasDaTela) {
      const cid = c.id
      if (!cid || !(c.meta as DataTableColumnMeta | undefined)?.facet) continue
      const f = columnFilters.find((x) => x.id === cid)
      proximo[`${prefixo}${cid}`] = serializeList((f?.value as string[] | undefined) ?? [])
    }
    const qs = mergeParams(window.location.search.slice(1), proximo)
    const alvo = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`
    if (alvo !== `${window.location.pathname}${window.location.search}${window.location.hash}`)
      window.history.replaceState(window.history.state, "", alvo)
  }, [urlState, prefixo, sorting, pagination.pageIndex, globalFilter, columnFilters, colunasDaTela])

  // --- As colunas: a seleção e a seta de expandir na frente, as ações atrás.
  const podeMarcar = React.useCallback(
    (row: T) => (typeof enableSelection === "function" ? enableSelection(row) : enableSelection),
    [enableSelection]
  )
  const expandivel = Boolean(renderDetail || getSubRows)
  const columns = React.useMemo<DataTableColumnDef<T>[]>(() => {
    const lista: DataTableColumnDef<T>[] = []
    if (enableSelection) {
      lista.push({
        id: "__select",
        enableSorting: false,
        enableHiding: false,
        meta: { csv: false },
        header: ({ table }) => {
          const todas = table.getIsAllPageRowsSelected()
          const algumas = table.getIsSomePageRowsSelected()
          return (
            <Checkbox
              checked={todas ? true : algumas ? "indeterminate" : false}
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
              aria-label="Selecionar todas as linhas da página"
            />
          )
        },
        cell: ({ row }) => <CaixaDaLinha row={row} label={rotuloDe(row.original)} />,
      })
    }
    if (expandivel) {
      lista.push({
        id: "__expand",
        enableSorting: false,
        enableHiding: false,
        meta: { csv: false, headClassName: "w-px px-0 ps-(--table-px)", cellClassName: "w-px px-0 ps-(--table-px)" },
        header: () => <span className="sr-only">Expandir</span>,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <TableExpandButton
              expanded={row.getIsExpanded()}
              label={rotuloDe(row.original)}
              aria-controls={
                row.getIsExpanded() && renderDetail?.(row.original) != null ? `detalhe-${row.id}` : undefined
              }
              onClick={() => row.toggleExpanded()}
            />
          ) : null,
      })
    }
    for (const c of colunasDaTela) {
      const meta = (c.meta ?? {}) as DataTableColumnMeta
      lista.push(
        meta.facet && !c.filterFn
          ? ({ ...c, filterFn: "arrHas" } as DataTableColumnDef<T>)
          : c
      )
    }
    if (rowActions?.length) {
      lista.push({
        id: "__actions",
        enableSorting: false,
        enableHiding: false,
        meta: { csv: false },
        header: () => "Ações",
        cell: ({ row }) => <AcoesDaLinha row={row.original} actions={rowActions} label={rotuloDe(row.original)} />,
      })
    }
    return lista
  }, [colunasDaTela, enableSelection, expandivel, rowActions, rotuloDe, renderDetail])

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: data ?? VAZIO,
    getRowId: (row) => getRowId(row),
    getSubRows: getSubRows ? (row) => getSubRows(row) : undefined,
    // Expande quem tem filhas, ou um detalhe — e o detalhe pode ser `null`
    // para a linha que não tem o que mostrar (a compra que já abre as parcelas).
    getRowCanExpand: (row) =>
      row.subRows.length > 0 || (renderDetail ? renderDetail(row.original) != null : false),
    enableRowSelection: enableSelection ? (row) => podeMarcar(row.original) : false,
    enableMultiSort: true,
    globalFilterFn: "semAcento",
    manualSorting: manual?.sorting,
    manualPagination: manual?.pagination || !paginar,
    manualFiltering: manual?.filtering,
    rowCount: manual?.rowCount,
    autoResetPageIndex: false,
    state: {
      sorting,
      rowSelection,
      pagination,
      globalFilter,
      columnFilters,
      expanded,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Filtrar ou buscar volta à primeira página: a de agora pode nem existir.
  const filtroAnterior = React.useRef({ globalFilter, columnFilters })
  React.useEffect(() => {
    const antes = filtroAnterior.current
    filtroAnterior.current = { globalFilter, columnFilters }
    if (antes.globalFilter !== globalFilter || antes.columnFilters !== columnFilters) {
      if (filtroDaUrl.current) filtroDaUrl.current = false
      else setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
    }
  }, [globalFilter, columnFilters, setPagination])

  const linhas = table.getRowModel().rows
  const folhas = table.getVisibleLeafColumns()
  const nColunas = folhas.length
  const filtrado = Boolean(globalFilter) || columnFilters.length > 0

  // --- Os detalhes ficam montados depois de abertos (para a curva de
  // fechar ter o que encolher), no padrão do React de ajustar ao mudar.
  const abertas = linhas.filter((r) => r.getIsExpanded()).map((r) => r.id)
  const [montadas, setMontadas] = React.useState<ReadonlySet<string>>(() => new Set())
  const faltando = abertas.filter((rid) => !montadas.has(rid))
  if (faltando.length) setMontadas(new Set([...montadas, ...faltando]))

  // --- Os grupos recolhidos.
  const [recolhidos, setRecolhidos] = React.useState<ReadonlySet<string>>(() => new Set())

  // --- O foco entre as linhas (o índice da que entra no Tab).
  const [linhaAtiva, setLinhaAtiva] = React.useState(0)
  const corpoRef = React.useRef<HTMLTableSectionElement>(null)
  const linhasFocaveis = Boolean(onRowClick || enableSelection) && !editable

  // --- A edição.
  const [celulaAtiva, setCelulaAtiva] = React.useState({ row: 0, col: 0 })
  const [editando, setEditando] = React.useState<string | null>(null)
  const [salvando, setSalvando] = React.useState<Record<string, string>>({})
  const [aviso, setAviso] = React.useState("")
  const gradeRef = React.useRef<HTMLTableElement>(null)
  // Ao sair da edição (Enter, Esc, Tab), o foco volta à célula — o editor
  // desmontou, e sem isso o foco caía no `<body>` e as setas paravam.
  const editava = React.useRef(false)
  React.useEffect(() => {
    if (editando) {
      editava.current = true
      return
    }
    if (!editava.current) return
    editava.current = false
    gradeRef.current
      ?.querySelector<HTMLElement>(`[data-cell="${celulaAtiva.row}:${celulaAtiva.col}"]`)
      ?.focus()
  }, [editando, celulaAtiva])

  // --- A virtualização.
  const [viewport, setViewport] = React.useState<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: virtualize ? linhas.length : 0,
    getScrollElement: () => viewport,
    estimateSize: () => virtualize?.estimateSize ?? 44,
    overscan: virtualize?.overscan ?? 8,
    getItemKey: (i) => linhas[i]?.id ?? i,
  })

  const animar = comMovimento && !reduzir && !virtualize && linhas.length <= TETO_DO_MOVIMENTO

  const marcadas = Object.keys(rowSelection).filter((k) => rowSelection[k])
  const idsMarcados = new Set(marcadas)
  const total = manual?.rowCount ?? table.getPrePaginatedRowModel().rows.length

  const exportar = React.useCallback(() => {
    if (onExport) return onExport()
    const nome = typeof toolbar === "object" && toolbar && "export" in toolbar ? (toolbar as DataTableToolbarConfig).export : undefined
    const cols: CsvColumn<DataTableRow<T>>[] = table
      .getVisibleLeafColumns()
      .filter((c) => !c.id.startsWith("__") && metaDe(c).csv !== false)
      .map((c) => {
        const meta = metaDe(c)
        const header = meta.label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)
        return {
          header,
          value: (r) =>
            typeof meta.csv === "function"
              ? (meta.csv as (row: T) => ReturnType<NonNullable<CsvColumn<T>["value"]>>)(r.original)
              : (r.getValue(c.id) as string | number | null | undefined),
        }
      })
    downloadCsv(nome ?? "tabela", toCsv(table.getPrePaginatedRowModel().rows, cols))
  }, [onExport, table, toolbar])

  const contexto: DataTableContextValue = {
    // O contexto é de qualquer linha: as peças da barra só leem colunas.
    table: table as unknown as DataTableContextValue["table"],
    density,
    setDensity,
    manual: Boolean(manual),
    onExport: exportar,
    exportFile: typeof toolbar === "object" && toolbar && "export" in toolbar ? (toolbar as DataTableToolbarConfig).export : undefined,
  }

  /* --------------------------- O teclado ---------------------------------- */

  const focarLinha = (i: number) => {
    const alvo = corpoRef.current?.querySelector<HTMLElement>(`[data-row-index="${i}"]`)
    alvo?.focus()
    setLinhaAtiva(i)
  }

  const teclaNaLinha = (e: React.KeyboardEvent<HTMLTableRowElement>, row: DataTableRow<T>, i: number) => {
    if (e.target !== e.currentTarget) return
    if (e.key === " " && row.getCanSelect()) {
      e.preventDefault()
      row.toggleSelected()
      return
    }
    const proxima = nextRowIndex(e.key, i, linhas.length)
    if (proxima === null || proxima === i) return
    e.preventDefault()
    // Shift+seta estende: a linha de destino entra na seleção, como no Finder.
    if (e.shiftKey && enableSelection) {
      const destino = linhas[proxima]
      if (row.getCanSelect() && !row.getIsSelected()) row.toggleSelected(true)
      if (destino?.getCanSelect()) destino.toggleSelected(true)
    }
    focarLinha(proxima)
  }

  const colunasEditaveis = folhas.map((c) => c.id)

  const teclaNaGrade = (e: React.KeyboardEvent<HTMLTableElement>) => {
    if (!editable || editando) return
    const alvo = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]")
    if (!alvo) return
    const [r, c] = alvo.dataset.cell!.split(":").map(Number)
    // A tecla diz qual célula está ativa, mesmo que o foco tenha chegado sem
    // evento (uma janela sem foco não dispara `focus`).
    if (r !== celulaAtiva.row || c !== celulaAtiva.col) setCelulaAtiva({ row: r, col: c })
    const colId = colunasEditaveis[c]
    const meta = folhas[c] ? metaDe(folhas[c]) : {}
    if ((e.key === "Enter" || e.key === "F2") && meta.edit) {
      e.preventDefault()
      setEditando(`${linhas[r].id}:${colId}`)
      return
    }
    const prox = nextCell(e.key, { row: r, col: c }, { rows: linhas.length, cols: nColunas }, e.ctrlKey || e.metaKey)
    if (!prox) return
    e.preventDefault()
    setCelulaAtiva(prox)
    e.currentTarget.querySelector<HTMLElement>(`[data-cell="${prox.row}:${prox.col}"]`)?.focus()
  }

  const salvarCelula = async (row: DataTableRow<T>, colId: string, texto: string, tipo: "text" | "money" | "select") => {
    setEditando(null)
    const chave = `${row.id}:${colId}`
    const valor = tipo === "money" ? parseMoneyBrl(texto) : texto
    if (String(row.getValue(colId) ?? "") === String(valor ?? "")) return
    setSalvando((s) => ({ ...s, [chave]: texto }))
    try {
      await editable!.onCellEdit(row.id, colId, valor)
      setAviso("Alteração salva.")
    } catch {
      // A célula volta ao valor de antes — ele nunca saiu dos dados.
      setAviso("Não foi possível salvar a alteração.")
    } finally {
      setSalvando((s) => {
        const { [chave]: _, ...resto } = s
        void _
        return resto
      })
    }
  }

  /* --------------------------- As células -------------------------------- */

  const celula = (cell: Cell<DataTableFeatures, T, unknown>, r: number, c: number) => {
    const meta = metaDe(cell.column)
    const primeiraDeDados = c === folhas.findIndex((f) => !f.id.startsWith("__"))
    const profundidade = cell.row.depth
    const chave = `${cell.row.id}:${cell.column.id}`
    const emEdicao = editando === chave
    const salvandoTexto = salvando[chave]
    const ehSelecao = cell.column.id === "__select"
    const ehAcoes = cell.column.id === "__actions"
    return (
      <TableCell
        key={cell.id}
        numeric={meta.numeric}
        selection={ehSelecao}
        actions={ehAcoes}
        pin={meta.pin}
        primary={meta.primary}
        role={editable ? "gridcell" : undefined}
        data-cell={editable ? `${r}:${c}` : undefined}
        tabIndex={editable ? (celulaAtiva.row === r && celulaAtiva.col === c ? 0 : -1) : undefined}
        onFocus={editable ? () => setCelulaAtiva({ row: r, col: c }) : undefined}
        onDoubleClick={editable && meta.edit ? () => setEditando(chave) : undefined}
        className={cn(
          meta.cellClassName,
          editable && "focus-visible:inset-ring-2 focus-visible:inset-ring-ring/45 focus-visible:outline-none",
          primeiraDeDados && profundidade > 0 && "ps-[calc(var(--table-px)+var(--table-depth)*1.5rem)]"
        )}
        style={primeiraDeDados && profundidade > 0 ? ({ "--table-depth": profundidade } as React.CSSProperties) : undefined}
      >
        {emEdicao && meta.edit ? (
          <EditorDeCelula
            tipo={meta.edit.type}
            options={meta.edit.options}
            valorInicial={cell.getValue()}
            rotulo={`${meta.label ?? cell.column.id} de ${rotuloDe(cell.row.original)}`}
            onCancelar={() => setEditando(null)}
            onConfirmar={(texto) => void salvarCelula(cell.row, cell.column.id, texto, meta.edit!.type)}
          />
        ) : salvandoTexto !== undefined ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Spinner size="sm" />
            {salvandoTexto}
          </span>
        ) : (
          <table.FlexRender cell={cell} />
        )}
      </TableCell>
    )
  }

  /* --------------------------- As linhas ---------------------------------- */

  const linha = (row: DataTableRow<T>, i: number, extra?: { style?: React.CSSProperties; ariaRowIndex?: number }) => {
    const estado = rowState?.(row.original)
    const clicavel = Boolean(onRowClick) && (rowClickable?.(row.original) ?? true)
    const selecionada = row.getIsSelected()
    const detalhe = renderDetail && montadas.has(row.id) ? renderDetail(row.original) : null
    const aberta = row.getIsExpanded() && detalhe != null
    const conteudo = row.getVisibleCells().map((cell, c) => celula(cell, i, c))
    const propsDaLinha = {
      "data-row-index": i,
      "data-state": selecionada ? "selected" : undefined,
      "data-expanded": aberta ? "" : undefined,
      // A seleção é dita pela caixa da linha: `aria-selected` numa `row` só
      // vale dentro de uma grade, e é só na grade que ele vai.
      "aria-selected": editable && enableSelection && row.getCanSelect() ? selecionada : undefined,
      "aria-rowindex": extra?.ariaRowIndex,
      interactive: clicavel,
      state: estado,
      tabIndex: linhasFocaveis ? (linhaAtiva === i ? 0 : -1) : undefined,
      onFocus: linhasFocaveis ? () => setLinhaAtiva(i) : undefined,
      onKeyDown: linhasFocaveis ? (e: React.KeyboardEvent<HTMLTableRowElement>) => teclaNaLinha(e, row, i) : undefined,
      onClick: clicavel ? () => onRowClick?.(row.original) : undefined,
      className: cn(aberta && "border-b-transparent"),
      style: extra?.style,
    }

    const tr = animar ? (
      <TableRow asChild {...propsDaLinha}>
        <motion.tr
          layout="position"
          initial={false}
          exit={{ opacity: 0, transition: { duration: 0.13 } }}
          transition={{ layout: MOLA_DO_REALCE }}
        >
          {conteudo}
        </motion.tr>
      </TableRow>
    ) : (
      <TableRow {...propsDaLinha}>{conteudo}</TableRow>
    )

    const menu =
      typeof rowContextMenu === "function"
        ? rowContextMenu(row.original, {
            targets: contextMenuTargets(row.id, idsMarcados).flatMap((rid) => {
              const alvo = rid === row.id ? row : table.getRow(rid, true)
              return alvo ? [alvo.original] : []
            }),
            selected: selecionada,
          })
        : rowContextMenu && rowActions?.length
          ? (
              <ContextMenuContent header={rotuloDe(row.original)} size="md">
                {rowActions
                  .filter((a) => !a.hidden?.(row.original))
                  .map((a) => (
                    <ContextMenuItem
                      key={a.label}
                      variant={a.variant}
                      onSelect={() => void a.onSelect(row.original)}
                    >
                      {a.icon}
                      {a.label}
                    </ContextMenuItem>
                  ))}
              </ContextMenuContent>
            )
          : null

    const comMenu = menu ? (
      <ContextMenu key={row.id}>
        <ContextMenuTrigger asChild>{tr}</ContextMenuTrigger>
        {menu}
      </ContextMenu>
    ) : (
      <React.Fragment key={row.id}>{tr}</React.Fragment>
    )

    if (detalhe == null) return comMenu
    return (
      <React.Fragment key={row.id}>
        {comMenu}
        <TableRowDetail
          open={aberta}
          colSpan={nColunas}
          lead={Math.max(0, folhas.findIndex((f) => !f.id.startsWith("__")))}
          depth={row.depth}
          id={`detalhe-${row.id}`}
        >
          {detalhe}
        </TableRowDetail>
      </React.Fragment>
    )
  }

  /** As linhas com as faixas de grupo entre elas. */
  const corpo = () => {
    if (virtualize) {
      const itens = virtualizer.getVirtualItems()
      const antes = itens[0]?.start ?? 0
      const depois = virtualizer.getTotalSize() - (itens.at(-1)?.end ?? 0)
      return (
        <>
          {antes > 0 ? <tr aria-hidden style={{ height: antes }} /> : null}
          {itens.map((v) => {
            const row = linhas[v.index]
            return row ? (
              <React.Fragment key={row.id}>
                {linha(row, v.index, { ariaRowIndex: v.index + 2 })}
              </React.Fragment>
            ) : null
          })}
          {depois > 0 ? <tr aria-hidden style={{ height: depois }} /> : null}
        </>
      )
    }
    const grupoDe = (row: DataTableRow<T>) => groupBy?.(row.original, { sorting }) ?? null
    if (!groupBy || linhas.every((r) => grupoDe(r) === null)) return linhas.map((row, i) => linha(row, i))

    const saida: React.ReactNode[] = []
    let i = 0
    while (i < linhas.length) {
      const g = grupoDe(linhas[i])
      if (!g) {
        saida.push(linha(linhas[i], i))
        i++
        continue
      }
      const membros: DataTableRow<T>[] = []
      while (i < linhas.length && grupoDe(linhas[i])?.key === g.key) membros.push(linhas[i++])
      const marcaveis = membros.filter((m) => m.getCanSelect())
      const nMarcadas = marcaveis.filter((m) => m.getIsSelected()).length
      const aberto = !recolhidos.has(g.key)
      const rotulo = typeof g.label === "string" ? g.label : g.key
      saida.push(
        <TableGroupRow
          // O mesmo mês pode voltar mais abaixo; a chave leva a primeira linha.
          key={`grupo:${g.key}:${membros[0].id}`}
          label={g.label}
          colSpan={nColunas}
          total={groupTotal?.(membros.map((m) => m.original))}
          trailing={rowActions?.length ? 1 : 0}
          collapsible={groupCollapsible}
          open={aberto}
          onOpenChange={(v) =>
            setRecolhidos((s) => {
              const n = new Set(s)
              if (v) n.delete(g.key)
              else n.add(g.key)
              return n
            })
          }
          selection={
            enableSelection && marcaveis.length
              ? {
                  checked: nMarcadas === 0 ? false : nMarcadas === marcaveis.length ? true : "indeterminate",
                  onCheckedChange: (v) =>
                    table.setRowSelection((s) => {
                      const n = { ...s }
                      for (const m of marcaveis) {
                        if (v) n[m.id] = true
                        else delete n[m.id]
                      }
                      return n
                    }),
                  label: `Selecionar ${rotulo}`,
                }
              : undefined
          }
        />
      )
      if (aberto) for (const m of membros) saida.push(linha(m, linhas.indexOf(m)))
    }
    return saida
  }

  /* --------------------------- A montagem --------------------------------- */

  const barra =
    toolbar === undefined || toolbar === null || toolbar === false ? null : React.isValidElement(toolbar) ? (
      toolbar
    ) : typeof toolbar === "object" ? (
      <BarraDaTabela config={toolbar as DataTableToolbarConfig} />
    ) : null

  const colunasDoEsqueleto: TableSkeletonColumn[] = folhas.map((c) => ({
    label: c.id.startsWith("__") ? undefined : (metaDe(c).label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : undefined)),
    numeric: metaDe(c).numeric,
    selection: c.id === "__select",
    actions: c.id === "__actions",
  }))

  const temGemeo =
    (props.mobile ?? colunasDaTela.some((c) => (c.meta as DataTableColumnMeta | undefined)?.mobile === "title")) &&
    !editable

  const vazio = linhas.length === 0

  const tabela = loading ? (
    <TableSkeleton columns={colunasDoEsqueleto} rows={Math.min(pagination.pageSize, 8)} size={density} />
  ) : (
    <Table
      size={density}
      striped={striped}
      dividers={dividers}
      pending={pending}
      fade={folhas.some((c) => metaDe(c).pin) ? "none" : virtualize ? "none" : "sides"}
      viewportRef={virtualize ? setViewport : undefined}
      viewportClassName={cn(virtualize && "max-h-96", viewportClassName)}
      aria-label={props["aria-label"]}
      aria-rowcount={virtualize ? linhas.length + 1 : undefined}
      ref={gradeRef}
      role={editable ? "grid" : undefined}
      onKeyDown={editable ? teclaNaGrade : undefined}
    >
      <TableHeader variant={headerVariant} sticky={stickyHeader || Boolean(virtualize)}>
        {table.getHeaderGroups().map((grupo) => (
          <TableRow key={grupo.id} aria-rowindex={virtualize ? 1 : undefined}>
            {grupo.headers.map((h) => {
              const meta = metaDe(h.column)
              const ordem = h.column.getIsSorted()
              const nOrdenadas = sorting.length
              return (
                <TableHead
                  key={h.id}
                  colSpan={h.colSpan}
                  numeric={meta.numeric}
                  selection={h.column.id === "__select"}
                  actions={h.column.id === "__actions"}
                  pin={meta.pin}
                  className={meta.headClassName}
                  sort={h.column.getCanSort() ? (ordem || "none") : undefined}
                  sortIndex={ordem && nOrdenadas > 1 ? h.column.getSortIndex() + 1 : undefined}
                  onSort={h.column.getCanSort() ? (e) => h.column.toggleSorting(undefined, e.shiftKey) : undefined}
                >
                  {h.isPlaceholder ? null : <table.FlexRender header={h} />}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody
        ref={corpoRef}
        key={animar ? `pagina-${pagination.pageIndex}` : undefined}
        reveal={animar}
      >
        {error ? (
          <TableError colSpan={nColunas} onRetry={error.onRetry}>
            {error.message}
          </TableError>
        ) : vazio ? (
          <TableEmpty colSpan={nColunas}>
            {empty ??
              (filtrado ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm text-muted-foreground">Nenhuma linha com esses filtros.</span>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                      table.setGlobalFilter("")
                      table.resetColumnFilters()
                    }}
                  >
                    limpar filtros
                  </Button>
                </div>
              ) : (
                "Nenhuma linha por aqui."
              ))}
          </TableEmpty>
        ) : animar ? (
          <AnimatePresence initial={false}>{corpo()}</AnimatePresence>
        ) : (
          corpo()
        )}
      </TableBody>
      {footer && !vazio && !error ? (
        <TableFooter>{footer(table.getPrePaginatedRowModel().rows.map((r) => r.original), { columns: nColunas })}</TableFooter>
      ) : null}
    </Table>
  )

  const gemeo = temGemeo && !loading && !vazio && !error ? (
    <GemeoDoTelefone
      rows={linhas}
      rowState={rowState}
      rowClickable={rowClickable}
      grupoDe={groupBy ? (r) => groupBy(r.original, { sorting }) : undefined}
      onRowClick={onRowClick}
      rowActions={rowActions}
      rotuloDe={rotuloDe}
      enableSelection={Boolean(enableSelection)}
      FlexRender={table.FlexRender}
    />
  ) : null

  const variasPaginas = paginar && total > pagination.pageSize
  const rodape =
    !loading && !error && total > 0 && (variasPaginas || countLabel) ? (
      <TablePanelFooter>
        <PaginationStatus>
          {countLabel && !variasPaginas
            ? countLabel(total, { filtered: filtrado, all: manual?.rowCount ?? data.length })
            : `${numberBR(pagination.pageIndex * pagination.pageSize + 1)}–${numberBR(Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize))} de ${numberBR(total)}`}
        </PaginationStatus>
        {variasPaginas ? (
          <Pagination
            align="end"
            className="w-auto"
            page={pagination.pageIndex + 1}
            total={Math.max(1, Math.ceil(total / pagination.pageSize))}
            onPageChange={(p) => table.setPageIndex(p - 1)}
          />
        ) : null}
      </TablePanelFooter>
    ) : null

  // Sem linhas (carregando, vazio, falha) o gêmeo não tem o que mostrar, e a
  // tabela serve as duas larguras — montá-la duas vezes duplicaria os ids.
  const miolo = gemeo ? (
    <>
      <div className="hidden md:block">{tabela}</div>
      <div className="md:hidden">{gemeo}</div>
    </>
  ) : (
    tabela
  )

  return (
    <DataTableContext.Provider value={contexto}>
      <TableSizeContext.Provider value={density}>
        {panel ? (
          <TablePanel
            className="w-full"
            toolbar={barra ? <TablePanelToolbar className="gap-2">{barra}</TablePanelToolbar> : undefined}
            footer={rodape}
          >
            {miolo}
          </TablePanel>
        ) : (
          <div data-slot="data-table" className="flex w-full min-w-0 flex-col gap-(--space-inline)">
            {barra}
            {miolo}
            {rodape}
          </div>
        )}
        {/* O anúncio: a contagem marcada e o resultado da edição. */}
        <div aria-live="polite" className="sr-only">
          {marcadas.length
            ? `${numberBR(marcadas.length)} ${marcadas.length === 1 ? "selecionada" : "selecionadas"}`
            : ""}{" "}
          {aviso}
        </div>
        {enableSelection ? (
          <DataTableSelectionBar
            count={marcadas.length}
            total={total}
            pageAllSelected={table.getIsAllPageRowsSelected()}
            onSelectAll={
              onSelectAllMatching ?? (manual ? undefined : () => table.toggleAllRowsSelected(true))
            }
            onClear={() => table.resetRowSelection(true)}
            actions={bulkActions?.map((a) => {
              const linhasMarcadas = table.getSelectedRowModel().rows.map((r) => r.original)
              return {
                label: a.label,
                icon: a.icon,
                variant: a.variant,
                disabled: a.disabled?.(linhasMarcadas) ?? false,
                onSelect: async () => {
                  const r = await a.onSelect(linhasMarcadas, marcadas)
                  if (r !== false) table.resetRowSelection(true)
                },
              }
            })}
          />
        ) : null}
      </TableSizeContext.Provider>
    </DataTableContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Peças internas                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A caixa da linha. **O clique vai para o handler da TanStack** com o Shift
 * que ele traz — é o que marca a faixa entre a última marcada e esta. O
 * `onCheckedChange` do Radix não carrega o evento, e por isso não é usado: o
 * estado mora na tabela, e a caixa só o mostra.
 */
function CaixaDaLinha<T extends RowData>({ row, label }: { row: DataTableRow<T>; label: string }) {
  if (!row.getCanSelect()) return null
  const selecionada = row.getIsSelected()
  return (
    <Checkbox
      checked={selecionada ? true : row.getIsSomeSelected() ? "indeterminate" : false}
      aria-label={`Selecionar ${label}`}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        row.getToggleSelectedHandler()({ target: { checked: !selecionada }, shiftKey: e.shiftKey })
      }}
    />
  )
}

/**
 * As ações da linha: as `primary` à vista (botões de ícone, com o tooltip e a
 * lixeira neutra que a coluna `actions` da `Table` já dá), o resto no ⋯ — um
 * `DropdownMenu` que vira folha de ações no telefone e já sabe confirmar e
 * esperar a `Promise`.
 */
function AcoesDaLinha<T>({ row, actions, label }: { row: T; actions: DataTableAction<T>[]; label: string }) {
  const visiveis = actions.filter((a) => !a.hidden?.(row))
  const avista = visiveis.filter((a) => a.primary)
  const resto = visiveis.filter((a) => !a.primary)
  return (
    <>
      {avista.map((a) => (
        <Button
          key={a.label}
          type="button"
          variant={a.variant === "destructive" ? "destructive" : "tertiary"}
          size="icon-sm"
          aria-label={`${a.label} ${label}`}
          onClick={(e) => {
            e.stopPropagation()
            void a.onSelect(row)
          }}
        >
          {a.icon}
        </Button>
      ))}
      {resto.length ? (
        <DropdownMenu mobile="sheet">
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="tertiary"
              size="icon-sm"
              aria-label={`Mais ações para ${label}`}
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisHorizontalIcon aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            size="md"
            // O alvo do menu: na folha do telefone era "Ações", e a pessoa não
            // via de que linha eram as ações (rodada 231).
            header={<DropdownMenuHeader title={label} />}
            onClick={(e) => e.stopPropagation()}
          >
            {resto.map((a) => (
              <DropdownMenuItem
                key={a.label}
                variant={a.variant}
                confirm={a.confirm}
                onSelect={() => a.onSelect(row)}
              >
                {a.icon}
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </>
  )
}

/**
 * O gêmeo do telefone: a mesma linha como `Item`, montada das colunas que
 * dizem onde moram (`meta.mobile`). **A troca é por CSS** — a tabela em
 * `hidden md:block`, o gêmeo em `md:hidden` —, nunca por um hook de largura,
 * que erra no servidor e faz a tela piscar no primeiro quadro.
 */
function GemeoDoTelefone<T extends RowData>({
  rows,
  rowState,
  rowClickable,
  grupoDe,
  onRowClick,
  rowActions,
  rotuloDe,
  enableSelection,
  FlexRender,
}: {
  rows: DataTableRow<T>[]
  rowState?: (row: T) => "current" | "pending" | undefined
  rowClickable?: (row: T) => boolean
  /** O grupo da linha, para o gêmeo repetir a faixa do mês. */
  grupoDe?: (row: DataTableRow<T>) => { key: string; label: React.ReactNode } | null
  onRowClick?: (row: T) => void
  rowActions?: DataTableAction<T>[]
  rotuloDe: (row: T) => string
  enableSelection: boolean
  FlexRender: ReactTable<DataTableFeatures, T>["FlexRender"]
}) {
  return (
    <ItemGroup variant="divided" data-slot="data-table-mobile">
      {rows.map((row, i) => {
        // A faixa do grupo, quando a linha abre um grupo novo: no telefone o
        // mês também separa a lista, como na tabela.
        const grupo = grupoDe?.(row)
        const anterior = i > 0 ? grupoDe?.(rows[i - 1]) : null
        const faixa =
          grupo && grupo.key !== anterior?.key ? (
            <div
              key={`grupo:${grupo.key}:${row.id}`}
              data-slot="data-table-mobile-group"
              className="bg-muted/30 px-4 py-1.5 text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {grupo.label}
            </div>
          ) : null
        const cells = row.getVisibleCells()
        const em = (lugar: DataTableColumnMeta["mobile"]) =>
          cells.filter((c) => metaDe(c.column).mobile === lugar)
        const [titulo] = em("title")
        const [midia] = em("media")
        const descricoes = em("description")
        const pontas = em("trailing")
        const metas = em("meta")
        const identidade = titulo ? metaDe(titulo.column).identity : undefined
        const legenda = identidade?.description?.(row.original)
        const midiaDaIdentidade = identidade?.media?.(row.original)
        const estado = rowState?.(row.original)
        const clicavel = Boolean(onRowClick) && (rowClickable?.(row.original) ?? true)
        return (
          <React.Fragment key={row.id}>
          {faixa}
          <Item
            variant="flush"
            size="lg"
            // O mesmo estado da linha da tabela: a prevista apaga o texto e a
            // cor; a de agora só leva `aria-current` (rodada 231).
            data-row-state={estado}
            aria-current={estado === "current" ? "true" : undefined}
            className={cn(
              "gap-3",
              estado === "pending" &&
                "text-muted-foreground [&_[data-slot=item-title]]:text-muted-foreground [&_[data-slot=color-tile]]:opacity-50 [&_[data-slot=avatar]]:opacity-50 [&_[data-slot=money-display]]:opacity-50"
            )}
            interactive={clicavel}
            selected={row.getIsSelected()}
            onClick={clicavel ? () => onRowClick?.(row.original) : undefined}
          >
            {enableSelection && row.getCanSelect() ? (
              <CaixaDaLinha row={row} label={rotuloDe(row.original)} />
            ) : null}
            {midiaDaIdentidade ?? midia ? (
              <ItemMedia>{midiaDaIdentidade ?? (midia ? <FlexRender cell={midia} /> : null)}</ItemMedia>
            ) : null}
            {/* **Duas colunas, como um extrato** (rodada 231): o nome e a
                legenda à esquerda, numa linha cada e truncando; o valor e a
                data à direita, alinhados pela ponta. Antes o valor descia para
                uma terceira linha e a legenda quebrava em duas — cada linha
                media ~62px e os valores não formavam coluna. */}
            <ItemContent>
              <ItemTitle className="w-full truncate">
                {identidade
                  ? identidade.title(row.original)
                  : titulo
                    ? <FlexRender cell={titulo} />
                    : rotuloDe(row.original)}
              </ItemTitle>
              {legenda != null || descricoes.length ? (
                <ItemDescription className="line-clamp-1 text-xs">
                  {legenda}
                  {descricoes.map((d, i) => (
                    <React.Fragment key={d.id}>
                      {i > 0 || legenda != null ? " · " : null}
                      <FlexRender cell={d} />
                    </React.Fragment>
                  ))}
                </ItemDescription>
              ) : null}
            </ItemContent>
            {pontas.length || metas.length ? (
              <ItemContent data-slot="data-table-mobile-aside" className="flex-none items-end text-right">
                {pontas.map((p) => (
                  <span key={p.id} className="text-sm font-medium whitespace-nowrap">
                    <FlexRender cell={p} />
                  </span>
                ))}
                {metas.length ? (
                  <span className="text-xs whitespace-nowrap text-muted-foreground [&_*]:text-xs">
                    {metas.map((m, i) => (
                      <React.Fragment key={m.id}>
                        {i > 0 ? " · " : null}
                        <FlexRender cell={m} />
                      </React.Fragment>
                    ))}
                  </span>
                ) : null}
              </ItemContent>
            ) : null}
            {rowActions?.length ? (
              <ItemActions className="-me-2">
                <AcoesDaLinha
                  row={row.original}
                  actions={rowActions.map((a) => ({ ...a, primary: false }))}
                  label={rotuloDe(row.original)}
                />
              </ItemActions>
            ) : null}
          </Item>
          </React.Fragment>
        )
      })}
    </ItemGroup>
  )
}

/** O editor que entra na célula: Enter confirma, Esc desiste, sair confirma. */
function EditorDeCelula({
  tipo,
  options,
  valorInicial,
  rotulo,
  onCancelar,
  onConfirmar,
}: {
  tipo: "text" | "money" | "select"
  options?: { value: string; label: string }[]
  valorInicial: unknown
  rotulo: string
  onCancelar: () => void
  onConfirmar: (texto: string) => void
}) {
  const inicial =
    tipo === "money" && typeof valorInicial === "number"
      ? valorInicial.toFixed(2).replace(".", ",")
      : String(valorInicial ?? "")
  const [texto, setTexto] = React.useState(inicial)
  const encerrado = React.useRef(false)
  const fim = (confirmar: boolean) => {
    if (encerrado.current) return
    encerrado.current = true
    if (confirmar) onConfirmar(texto)
    else onCancelar()
  }
  const teclas = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Enter" || e.key === "Tab") {
      if (e.key === "Enter") e.preventDefault()
      fim(true)
    } else if (e.key === "Escape") {
      e.preventDefault()
      fim(false)
    }
  }
  if (tipo === "select") {
    return (
      <NativeSelect
        size="sm"
        autoFocus
        aria-label={rotulo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={teclas}
        onBlur={() => fim(true)}
      >
        {options?.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    )
  }
  return (
    <Input
      size="sm"
      autoFocus
      aria-label={rotulo}
      inputMode={tipo === "money" ? "decimal" : undefined}
      className={cn(tipo === "money" && "text-right nums")}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={teclas}
      onBlur={() => fim(true)}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* A barra de cima                                                             */
/* -------------------------------------------------------------------------- */

function BarraDaTabela({ config }: { config: DataTableToolbarConfig }) {
  return (
    <div data-slot="data-table-toolbar" className="flex w-full flex-wrap items-center gap-2">
      {config.start}
      {config.search ? (
        <DataTableSearch placeholder={typeof config.search === "string" ? config.search : undefined} />
      ) : null}
      {config.facets?.map((cid) => (
        <DataTableFacetFilter key={cid} column={cid} />
      ))}
      <div className="ms-auto flex items-center gap-1">
        {config.end}
        {config.export ? <DataTableExport /> : null}
        {config.view ? <DataTableViewOptions /> : null}
      </div>
    </div>
  )
}

/** A busca em todas as colunas, sem acento. */
export function DataTableSearch({ placeholder = "Buscar…" }: { placeholder?: string }) {
  const { table } = useDataTableContext("DataTableSearch")
  const valor = (table.store.state.globalFilter as string | undefined) ?? ""
  return (
    <SearchInput
      size="sm"
      className="w-full sm:w-56"
      placeholder={placeholder}
      aria-label={placeholder.replace(/…$/, "")}
      value={valor}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      onClear={() => table.setGlobalFilter("")}
    />
  )
}

/**
 * O filtro por faceta: o `Combobox multiple` com a contagem de cada valor ao
 * lado do nome — "Ativa 12" —, das linhas que os **outros** filtros deixam.
 */
export function DataTableFacetFilter({ column: cid, label }: { column: string; label?: string }) {
  const { table } = useDataTableContext("DataTableFacetFilter")
  const coluna = table.getColumn(cid)
  if (!coluna) return null
  const meta = metaDe(coluna)
  const nome = label ?? meta.label ?? cid
  const contagem = coluna.getFacetedUniqueValues() as Map<unknown, number>
  const opcoes =
    meta.facet?.options ??
    [...contagem.keys()]
      .filter((v) => v != null && v !== "")
      .map((v) => ({ value: String(v), label: String(v) }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
  const valores = (coluna.getFilterValue() as string[] | undefined) ?? []
  const rotuloDe = (v: string) => opcoes.find((o) => o.value === v)?.label ?? v
  return (
    <Combobox
      multiple
      value={valores}
      onValueChange={(v) => coluna.setFilterValue(v.length ? v : undefined)}
    >
      <ComboboxField className="w-auto min-w-36">
        <ComboboxTrigger size="sm" aria-label={nome}>
          <ComboboxValue placeholder={nome} overflowCount={Math.max(0, valores.length - 1)}>
            {valores[0] ? rotuloDe(valores[0]) : null}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxClear />
      </ComboboxField>
      <ComboboxContent>
        <ComboboxInput placeholder={`Buscar ${nome.toLowerCase()}…`} />
        <ComboboxList>
          <ComboboxEmpty>Nada com esse nome.</ComboboxEmpty>
          {opcoes.map((o) => (
            <ComboboxItem key={o.value} value={o.value}>
              <span className="flex-1 truncate">{o.label}</span>
              <span className="nums text-xs text-muted-foreground">{contagem.get(o.value) ?? 0}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

/** As colunas à vista e a densidade, guardadas por tabela. */
/**
 * O painel Exibir: a densidade e as colunas.
 *
 * As duas seções falam como o resto do sistema: o rótulo em sobrancelha com o
 * estado à direita ("Padrão · 44px", "5 de 6"), e cada coluna é uma **linha
 * inteira** clicável, na geometria e no esmaecer das linhas de menu — a caixa
 * sozinha era um alvo de 16px. A última coluna à vista não sai (uma tabela sem
 * coluna nenhuma não tem como voltar), e "Redefinir" só aparece quando há o
 * que redefinir. No telefone é a gaveta, onde a linha sobe a 44.
 */
export function DataTableViewOptions() {
  const { table, density, setDensity } = useDataTableContext("DataTableViewOptions")
  const colunas = table.getAllLeafColumns().filter((c) => c.getCanHide() && !c.id.startsWith("__"))
  const visiveis = colunas.filter((c) => c.getIsVisible()).length
  const atual = DENSIDADES.find((d) => d.value === density) ?? DENSIDADES[2]
  const mudou = density !== "md" || visiveis < colunas.length
  const redefinir = () => {
    setDensity("md")
    for (const c of colunas) c.toggleVisibility(true)
  }
  const rotulo = "text-2xs font-medium tracking-wider text-muted-foreground uppercase"
  const id = React.useId()

  return (
    <Popover mobile="sheet">
      <PopoverTrigger asChild>
        <Button type="button" variant="tertiary" size="sm">
          <AdjustmentsHorizontalIcon aria-hidden />
          exibir
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" size="md" padding="none" className="pb-1.5">
        <PopoverHeader className="flex-row items-center justify-between px-3 pt-3 pb-1">
          <PopoverTitle className="text-sm">Exibir</PopoverTitle>
          {mudou ? (
            <Button type="button" variant="tertiary" size="xs" className="-me-1.5" onClick={redefinir}>
              redefinir
            </Button>
          ) : null}
        </PopoverHeader>

        <section aria-labelledby={`${id}-densidade`} className="flex flex-col gap-2 px-3 pt-2 pb-3">
          <div className="flex items-baseline justify-between gap-2">
            <span id={`${id}-densidade`} className={rotulo}>
              Densidade
            </span>
            <span className="nums text-xs text-muted-foreground" aria-live="polite">
              {atual.label} · {atual.altura}px
            </span>
          </div>
          <ToggleGroup
            type="single"
            variant="floating"
            size="sm"
            stretch
            value={density}
            onValueChange={(v) => v && setDensity(v as TableSize)}
            aria-label="Densidade"
          >
            {DENSIDADES.map((d) => (
              <ToggleGroupItem key={d.value} value={d.value} aria-label={d.label}>
                {d.value.toUpperCase()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>

        {colunas.length ? (
          <section aria-labelledby={`${id}-colunas`} className="flex flex-col gap-0.5 px-1.5">
            <div className="flex items-baseline justify-between gap-2 px-1.5 pb-1">
              <span id={`${id}-colunas`} className={rotulo}>
                Colunas
              </span>
              <span className="nums text-xs text-muted-foreground">
                {visiveis} de {colunas.length}
              </span>
            </div>
            {colunas.map((c) => {
              const nome = metaDe(c).label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)
              const ligada = c.getIsVisible()
              const ultima = ligada && visiveis === 1
              return (
                <label
                  key={c.id}
                  data-disabled={ultima || undefined}
                  className={cn(
                    menuItemGeometryClassName,
                    menuItemFadeClassName,
                    "gap-2.5 px-1.5 hover:bg-accent active:bg-accent has-focus-visible:bg-accent",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                    !ligada && "text-muted-foreground"
                  )}
                >
                  <Checkbox
                    checked={ligada}
                    disabled={ultima}
                    onCheckedChange={(v) => c.toggleVisibility(v === true)}
                    className="after:hidden"
                  />
                  <span className="min-w-0 flex-1 truncate">{nome}</span>
                </label>
              )
            })}
          </section>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/** O CSV do que está filtrado e ordenado — ou o `onExport` de quem chama. */
export function DataTableExport() {
  const { onExport } = useDataTableContext("DataTableExport")
  return (
    <Button type="button" variant="tertiary" size="sm" onClick={onExport}>
      <ArrowDownTrayIcon aria-hidden />
      exportar
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/* A barra flutuante da seleção                                                */
/* -------------------------------------------------------------------------- */

/**
 * A pílula das ações em massa (rodada 225): sobe na mola quando a primeira
 * linha é marcada — de 12px abaixo e 97% —, e sai em 0,13s. Ela é **fixa**,
 * no centro da janela e acima da `BottomBar` no telefone (`--bottom-bar-pad`),
 * e vai para o `body` por portal: o painel recorta com `clip-path`, que
 * apagaria qualquer descendente fixo.
 *
 * Ela substitui as duas barras de seleção que transações e assinaturas
 * escreviam à mão (cerca de 100 linhas cada, uma para o telefone e outra para
 * o desktop). Uma ação que devolve `Promise` trava a barra com a roda, e a
 * seleção limpa quando ela termina.
 */
export function DataTableSelectionBar({
  count,
  total,
  pageAllSelected,
  onSelectAll,
  onClear,
  actions,
}: {
  count: number
  total: number
  pageAllSelected: boolean
  onSelectAll?: () => void
  onClear: () => void
  actions?: {
    label: string
    icon?: React.ReactNode
    variant?: "default" | "destructive"
    disabled?: boolean
    onSelect: () => void | Promise<unknown>
  }[]
}) {
  const reduzir = useReducedMotion()
  const [montado, setMontado] = React.useState(false)
  const [ocupada, setOcupada] = React.useState<string | null>(null)
  React.useEffect(() => setMontado(true), [])
  if (!montado) return null
  return createPortal(
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          key="barra"
          data-slot="data-table-selection-bar"
          role="region"
          aria-label="Ações para as linhas selecionadas"
          initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduzir ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.13 } }}
          transition={MOLA_DO_REALCE}
          className="fixed inset-x-0 bottom-(--bottom-bar-pad) z-(--z-header) mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full bg-popover p-1.5 ps-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 md:bottom-6"
        >
          <span className="me-1 text-sm font-medium nums whitespace-nowrap">
            {numberBR(count)} {count === 1 ? "selecionada" : "selecionadas"}
          </span>
          {onSelectAll && pageAllSelected && total > count ? (
            <Button type="button" variant="link" size="sm" onClick={onSelectAll} className="whitespace-nowrap">
              marcar todas as {numberBR(total)}
            </Button>
          ) : null}
          {actions?.map((a) => (
            <Button
              key={a.label}
              type="button"
              variant={a.variant === "destructive" ? "destructive" : "secondary"}
              size="sm"
              shape="pill"
              disabled={ocupada !== null || a.disabled}
              aria-busy={ocupada === a.label || undefined}
              onClick={async () => {
                setOcupada(a.label)
                try {
                  await a.onSelect()
                } finally {
                  setOcupada(null)
                }
              }}
            >
              {ocupada === a.label ? <Spinner /> : a.icon}
              {/* No telefone a pílula não cabe com os rótulos: fica o ícone, e
                  o nome continua para o leitor de tela. */}
              <span className={cn(a.icon && "max-sm:sr-only")}>{a.label}</span>
            </Button>
          ))}
          <Button
            type="button"
            variant="tertiary"
            size="icon-sm"
            shape="pill"
            aria-label="Limpar seleção"
            disabled={ocupada !== null}
            onClick={onClear}
          >
            <XMarkIcon aria-hidden />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

/* -------------------------------------------------------------------------- */
/* As fábricas de coluna                                                       */
/* -------------------------------------------------------------------------- */

type BadgeTone = React.ComponentProps<typeof Badge>["tone"]

/**
 * As colunas prontas (rodada 225), para a tela não reescrever a célula de
 * identidade, de dinheiro, de data, de estado e de saldo em cada tabela.
 *
 * ```ts
 * const col = dataTableColumns<Lancamento>()
 * const columns = [
 *   col.identity({ id: "descricao", header: "Descrição", title: (l) => l.desc, … }),
 *   col.money({ id: "valor", header: "Valor", accessor: (l) => l.valor }),
 * ]
 * ```
 */
export function dataTableColumns<T extends RowData>() {
  const helper = createDataTableColumnHelper<T>()
  return {
    identity: ({
      id,
      header,
      title,
      description,
      media,
      meta,
    }: {
      id: string
      header: string
      title: (row: T) => string
      description?: (row: T) => React.ReactNode
      media?: (row: T) => React.ReactNode
      meta?: DataTableColumnMeta
    }): DataTableColumnDef<T> =>
      helper.accessor(title, {
        id,
        header,
        cell: ({ row }) => (
          <TableCellIdentity
            media={media?.(row.original)}
            title={title(row.original)}
            description={description?.(row.original)}
          />
        ),
        meta: { label: header, primary: true, mobile: "title", identity: { title, description, media }, ...meta },
      }),
    money: ({
      id,
      header,
      accessor,
      flash,
      signed,
      tone,
      meta,
    }: {
      id: string
      header: string
      accessor: (row: T) => number
      flash?: boolean
      /** Sem o sinal — a coluna em que todo valor é do mesmo lado. */
      signed?: boolean
      /** `none` deixa neutro: o preço de uma assinatura não é "entrou dinheiro". */
      tone?: "sign" | "none"
      meta?: DataTableColumnMeta
    }): DataTableColumnDef<T> =>
      helper.accessor(accessor, {
        id,
        header,
        sortFn: "basic",
        cell: (ctx) => (
          <TableCellMoney value={ctx.getValue() as number} flash={flash} signed={signed} tone={tone} />
        ),
        meta: { label: header, numeric: true, mobile: "trailing", ...meta },
      }),
    date: ({
      id,
      header,
      accessor,
      meta,
    }: {
      id: string
      header: string
      /** A data em ISO (`2026-03-12`) — é ela que ordena. */
      accessor: (row: T) => string
      meta?: DataTableColumnMeta
    }): DataTableColumnDef<T> =>
      helper.accessor(accessor, {
        id,
        header,
        sortFn: "alphanumeric",
        cell: (ctx) => <span className="nums whitespace-nowrap text-muted-foreground">{formatDatePtBr(ctx.getValue() as string)}</span>,
        meta: { label: header, mobile: "meta", ...meta },
      }),
    status: ({
      id,
      header,
      accessor,
      tone,
      label,
      meta,
    }: {
      id: string
      header: string
      accessor: (row: T) => string
      tone: (value: string) => BadgeTone
      label?: (value: string) => string
      meta?: DataTableColumnMeta
    }): DataTableColumnDef<T> =>
      helper.accessor(accessor, {
        id,
        header,
        cell: (ctx) => {
          const v = ctx.getValue() as string
          return (
            <Badge size="sm" tone={tone(v)}>
              {label?.(v) ?? v}
            </Badge>
          )
        },
        meta: { label: header, facet: {}, ...meta },
      }),
    /**
     * O saldo depois de cada linha. Só é verdade em ordem de data e sem
     * filtro — fora disso a célula diz "—" (`runningBalance`).
     */
    balance: ({
      id,
      header,
      amount,
      start = 0,
      dateColumn,
    }: {
      id: string
      header: string
      amount: (row: T) => number
      start?: number
      /** A coluna de data: o saldo só vale ordenado por ela. */
      dateColumn: string
    }): DataTableColumnDef<T> =>
      helper.display({
        id,
        header,
        enableSorting: false,
        cell: ({ row, table }) => {
          const saldos = saldosDaTabela(table, amount, start, dateColumn)
          return <TableCellMoney value={saldos.get(row.id) ?? null} signed={false} tone="none" flash />
        },
        meta: { label: header, numeric: true },
      }),
  }
}

/** Os saldos da página, calculados uma vez por modelo de linhas. */
const cacheDeSaldos = new WeakMap<object, Map<string, number | null>>()
function saldosDaTabela<T extends RowData>(
  table: TanstackTable<DataTableFeatures, T>,
  amount: (row: T) => number,
  start: number,
  dateColumn: string
) {
  const linhas = table.getRowModel().rows
  const cacheado = cacheDeSaldos.get(linhas)
  if (cacheado) return cacheado
  const estado = table.store.state
  const ordem = estado.sorting[0]
  const valores = runningBalance(
    linhas.map((r) => amount(r.original)),
    {
      start,
      direction: ordem?.desc ? "desc" : "asc",
      sortedByDate: ordem?.id === dateColumn && estado.sorting.length === 1,
      filtered: Boolean(estado.globalFilter) || estado.columnFilters.length > 0,
    }
  )
  const mapa = new Map(linhas.map((r, i) => [r.id, valores[i]]))
  cacheDeSaldos.set(linhas, mapa)
  return mapa
}
