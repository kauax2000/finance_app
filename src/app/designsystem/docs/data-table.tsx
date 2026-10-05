"use client"

import * as React from "react"
import Link from "next/link"
import {
  DocumentDuplicateIcon,
  PencilIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/16/solid"

import { ColorTile } from "@/components/ui/color-tile"
import {
  DataTable,
  dataTableColumns,
  type DataTableColumnDef,
} from "@/components/ui/data-table"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { TableCell, TableRow } from "@/components/ui/table"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { IphoneFrame } from "../ds-frame"
import { DocNote, DocSection, Eixo, Interruptor, PropsTable, Usage } from "../ds-doc"

/* -------------------------------------------------------------------------- */
/* Os dados de mentira                                                         */
/* -------------------------------------------------------------------------- */

type Lancamento = {
  id: string
  descricao: string
  categoria: string
  conta: string
  data: string
  valor: number
  status: "efetivada" | "prevista"
  parcelas?: Lancamento[]
}

const CATEGORIAS: Record<string, string> = {
  Alimentação: TILE_PALETTE[5].hex,
  Renda: TILE_PALETTE[7].hex,
  Assinaturas: TILE_PALETTE[3].hex,
  Saúde: TILE_PALETTE[0].hex,
  Transporte: TILE_PALETTE[1].hex,
  Moradia: TILE_PALETTE[6].hex,
  Lazer: TILE_PALETTE[4].hex,
}

const BASE: Omit<Lancamento, "id" | "data">[] = [
  { descricao: "Mercado", categoria: "Alimentação", conta: "Nubank", valor: -128.4, status: "efetivada" },
  { descricao: "Salário", categoria: "Renda", conta: "Itaú", valor: 8432.15, status: "efetivada" },
  { descricao: "Streaming", categoria: "Assinaturas", conta: "Nubank", valor: -39.9, status: "prevista" },
  { descricao: "Farmácia", categoria: "Saúde", conta: "Inter", valor: -64.3, status: "efetivada" },
  { descricao: "Combustível", categoria: "Transporte", conta: "Itaú", valor: -210, status: "efetivada" },
  { descricao: "Freela", categoria: "Renda", conta: "Inter", valor: 1200, status: "prevista" },
  { descricao: "Aluguel", categoria: "Moradia", conta: "Itaú", valor: -1850, status: "efetivada" },
  { descricao: "Padaria", categoria: "Alimentação", conta: "Nubank", valor: -18.5, status: "efetivada" },
  { descricao: "Academia", categoria: "Saúde", conta: "Nubank", valor: -119.9, status: "efetivada" },
  { descricao: "Cinema", categoria: "Lazer", conta: "Inter", valor: -56, status: "efetivada" },
]

/** 30 lançamentos de março e fevereiro, do mais novo para o mais antigo. */
const LANCAMENTOS: Lancamento[] = Array.from({ length: 30 }, (_, i) => {
  const b = BASE[i % BASE.length]
  const dia = 28 - (i % 28)
  const mes = i < 16 ? "03" : "02"
  return {
    ...b,
    id: `l${i + 1}`,
    data: `2026-${mes}-${String(dia).padStart(2, "0")}`,
    valor: Math.round(b.valor * (1 + (i % 4) * 0.07) * 100) / 100,
  }
}).sort((a, b) => b.data.localeCompare(a.data))

const COMPRA_PARCELADA: Lancamento = {
  id: "p0",
  descricao: "Notebook",
  categoria: "Lazer",
  conta: "Nubank",
  data: "2026-03-10",
  valor: -4800,
  status: "efetivada",
  parcelas: Array.from({ length: 4 }, (_, i) => ({
    id: `p0-${i + 1}`,
    descricao: `Parcela ${i + 1} de 4`,
    categoria: "Lazer",
    conta: "Nubank",
    data: `2026-0${3 + i}-10`,
    valor: -1200,
    status: i === 0 ? "efetivada" : "prevista",
  })),
}

const MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
const nomeDoMes = (iso: string) => {
  const t = MES.format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`))
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const col = dataTableColumns<Lancamento>()

const COLUNAS: DataTableColumnDef<Lancamento>[] = [
  col.identity({
    id: "descricao",
    header: "Descrição",
    title: (l) => l.descricao,
    description: (l) => `${l.categoria} · ${l.conta}`,
    media: (l) => <ColorTile size="xs" color={CATEGORIAS[l.categoria]} />,
    meta: { mobile: "title" },
  }),
  col.date({ id: "data", header: "Data", accessor: (l) => l.data }),
  {
    id: "categoria",
    accessorFn: (l) => l.categoria,
    header: "Categoria",
    meta: { label: "Categoria", facet: {}, cellClassName: "text-muted-foreground" },
  },
  {
    id: "conta",
    accessorFn: (l) => l.conta,
    header: "Conta",
    meta: { label: "Conta", facet: {}, cellClassName: "text-muted-foreground" },
  },
  col.status({
    id: "status",
    header: "Estado",
    accessor: (l) => l.status,
    tone: (v) => (v === "prevista" ? "neutral" : "success"),
    label: (v) => (v === "prevista" ? "Prevista" : "Efetivada"),
  }),
  col.money({ id: "valor", header: "Valor", accessor: (l) => l.valor }),
]

const ACOES = (avisar: (t: string) => void) => [
  { label: "Editar", icon: <PencilIcon aria-hidden />, primary: true, onSelect: (l: Lancamento) => avisar(`Editar ${l.descricao}`) },
  { label: "Duplicar", icon: <DocumentDuplicateIcon aria-hidden />, onSelect: (l: Lancamento) => avisar(`Duplicar ${l.descricao}`) },
  {
    label: "Excluir",
    icon: <TrashIcon aria-hidden />,
    variant: "destructive" as const,
    confirm: true,
    onSelect: (l: Lancamento) => new Promise<void>((r) => window.setTimeout(() => (avisar(`Excluído ${l.descricao}`), r()), 600)),
  },
]

/* -------------------------------------------------------------------------- */
/* Demonstrações                                                               */
/* -------------------------------------------------------------------------- */



function DemoNaTela() {
  const [dividers, setDividers] = React.useState<"rows" | "none" | "grid">("rows")
  const [cabecalho, setCabecalho] = React.useState<"muted" | "plain">("muted")
  const [striped, setStriped] = React.useState(false)
  const [agrupar, setAgrupar] = React.useState(true)
  const [ultima, setUltima] = React.useState("Clique numa linha, marque, ordene, filtre.")

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Eixo rotulo="Fios" valores={["rows", "none", "grid"] as const} valor={dividers} onChange={setDividers} />
        <Eixo rotulo="Cabeçalho" valores={["muted", "plain"] as const} valor={cabecalho} onChange={setCabecalho} />
        <Interruptor id="ds-dt-striped" rotulo="striped" valor={striped} onChange={setStriped} />
        <Interruptor id="ds-dt-grupo" rotulo="groupBy" valor={agrupar} onChange={setAgrupar} />
      </div>
      <DataTable
        id="ds-data-table"
        aria-label="Lançamentos"
        columns={COLUNAS}
        data={LANCAMENTOS}
        getRowId={(l) => l.id}
        getRowLabel={(l) => l.descricao}
        pageSize={12}
        defaultSorting={[{ id: "data", desc: true }]}
        dividers={dividers}
        headerVariant={cabecalho}
        striped={striped}
        toolbar={{ search: "Buscar lançamento…", facets: ["categoria", "conta"], view: true, export: "lancamentos" }}
        enableSelection
        bulkActions={[
          { label: "Recategorizar", icon: <TagIcon aria-hidden />, onSelect: (rows) => setUltima(`Recategorizar ${rows.length}`) },
          {
            label: "Excluir",
            icon: <TrashIcon aria-hidden />,
            variant: "destructive",
            onSelect: (rows) => new Promise((r) => window.setTimeout(() => (setUltima(`Excluídas ${rows.length}`), r(null)), 800)),
          },
        ]}
        rowActions={ACOES(setUltima)}
        rowContextMenu
        onRowClick={(l) => setUltima(`Abrir ${l.descricao}`)}
        rowState={(l) => (l.status === "prevista" ? "pending" : undefined)}
        groupBy={
          agrupar
            ? (l, { sorting }) =>
                sorting[0]?.id === "data" ? { key: l.data.slice(0, 7), label: nomeDoMes(l.data) } : null
            : undefined
        }
        groupTotal={(rows) => <MoneyDisplay value={rows.reduce((s, l) => s + l.valor, 0)} signed />}
        groupCollapsible
        footer={(rows, { columns }) => {
          const entrou = rows.filter((l) => l.valor > 0).reduce((s, l) => s + l.valor, 0)
          const saiu = rows.filter((l) => l.valor < 0).reduce((s, l) => s + l.valor, 0)
          return (
            <TableRow>
              <TableCell colSpan={columns - 2} className="text-muted-foreground">
                {rows.length} lançamentos · entrou <MoneyDisplay value={entrou} tone="income" /> · saiu{" "}
                <MoneyDisplay value={saiu} tone="expense" />
              </TableCell>
              <TableCell numeric>
                <MoneyDisplay value={entrou + saiu} signed />
              </TableCell>
              <TableCell />
            </TableRow>
          )
        }}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {ultima}
      </p>
    </div>
  )
}

function DemoOrdenar() {
  return (
    <DataTable
      aria-label="Ordenação por várias colunas"
      columns={COLUNAS.filter((c) => c.id !== "conta")}
      data={LANCAMENTOS.slice(0, 8)}
      getRowId={(l) => l.id}
      getRowLabel={(l) => l.descricao}
      pageSize={false}
      defaultSorting={[{ id: "categoria", desc: false }, { id: "valor", desc: true }]}
    />
  )
}

function DemoExpandir() {
  const [lista] = React.useState(() => [COMPRA_PARCELADA, ...LANCAMENTOS.slice(0, 4)])
  return (
    <DataTable
      aria-label="Lançamentos com detalhe e parcelas"
      columns={COLUNAS.filter((c) => !["conta", "categoria"].includes(c.id ?? ""))}
      data={lista}
      getRowId={(l) => l.id}
      getRowLabel={(l) => l.descricao}
      pageSize={false}
      getSubRows={(l) => l.parcelas}
      rowState={(l) => (l.id === "p0-1" ? "current" : l.status === "prevista" ? "pending" : undefined)}
      renderDetail={(l) =>
        l.parcelas ? null : (
          <DescriptionList layout="grid" columns={3} term="eyebrow">
            <DescriptionListItem>
              <DescriptionTerm>Conta</DescriptionTerm>
              <DescriptionDetails>{l.conta}</DescriptionDetails>
            </DescriptionListItem>
            <DescriptionListItem>
              <DescriptionTerm>Categoria</DescriptionTerm>
              <DescriptionDetails>{l.categoria}</DescriptionDetails>
            </DescriptionListItem>
            <DescriptionListItem>
              <DescriptionTerm>Valor</DescriptionTerm>
              <DescriptionDetails>
                <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
              </DescriptionDetails>
            </DescriptionListItem>
          </DescriptionList>
        )
      }
    />
  )
}

/** O servidor de mentira: ordena e pagina com atraso, e às vezes falha. */
function DemoServidor() {
  const [sorting, setSorting] = React.useState([{ id: "data", desc: true }])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 8 })
  const [pagina, setPagina] = React.useState<Lancamento[] | null>(null)
  const [buscando, setBuscando] = React.useState(true)
  const [falhar, setFalhar] = React.useState(false)
  const [erro, setErro] = React.useState(false)
  const [tentativa, setTentativa] = React.useState(0)

  React.useEffect(() => {
    let vivo = true
    setBuscando(true)
    const t = window.setTimeout(() => {
      if (!vivo) return
      if (falhar) {
        setErro(true)
        setBuscando(false)
        return
      }
      const [s] = sorting
      const ordenada = [...LANCAMENTOS].sort((a, b) => {
        const k = (s?.id ?? "data") as keyof Lancamento
        const x = a[k] as string | number
        const y = b[k] as string | number
        const cmp = typeof x === "number" ? x - (y as number) : String(x).localeCompare(String(y))
        return s?.desc ? -cmp : cmp
      })
      const ini = pagination.pageIndex * pagination.pageSize
      setPagina(ordenada.slice(ini, ini + pagination.pageSize))
      setErro(false)
      setBuscando(false)
    }, 700)
    return () => {
      vivo = false
      window.clearTimeout(t)
    }
  }, [sorting, pagination, falhar, tentativa])

  return (
    <div className="flex w-full flex-col gap-3">
      <Interruptor id="ds-dt-falhar" rotulo="o servidor falha" valor={falhar} onChange={setFalhar} />
      <DataTable
        aria-label="Lançamentos do servidor"
        columns={COLUNAS.filter((c) => c.id !== "conta")}
        data={pagina ?? []}
        getRowId={(l) => l.id}
        getRowLabel={(l) => l.descricao}
        manual={{ rowCount: LANCAMENTOS.length, sorting: true, pagination: true }}
        sorting={sorting}
        onSortingChange={(s) => setSorting(s.slice(-1))}
        pagination={pagination}
        onPaginationChange={setPagination}
        loading={pagina === null && !erro}
        pending={buscando && pagina !== null}
        error={
          erro
            ? {
                message: "O servidor não respondeu.",
                onRetry: () =>
                  new Promise((r) =>
                    window.setTimeout(() => {
                      setFalhar(false)
                      setTentativa((n) => n + 1)
                      r(null)
                    }, 700)
                  ),
              }
            : null
        }
      />
    </div>
  )
}

function DemoEdicao() {
  const [dados, setDados] = React.useState(() => LANCAMENTOS.slice(0, 6))
  const colunas = React.useMemo<DataTableColumnDef<Lancamento>[]>(
    () => [
      { id: "descricao", accessorFn: (l) => l.descricao, header: "Descrição", meta: { label: "Descrição", edit: { type: "text" } } },
      {
        id: "categoria",
        accessorFn: (l) => l.categoria,
        header: "Categoria",
        meta: { label: "Categoria", edit: { type: "select", options: Object.keys(CATEGORIAS).map((c) => ({ value: c, label: c })) } },
      },
      { ...col.money({ id: "valor", header: "Valor", accessor: (l) => l.valor, flash: true }), meta: { label: "Valor", numeric: true, edit: { type: "money" } } },
      col.balance({ id: "saldo", header: "Saldo", amount: (l) => l.valor, start: 2500, dateColumn: "data" }),
    ],
    []
  )
  return (
    <DataTable
      aria-label="Lançamentos editáveis"
      columns={colunas}
      data={dados}
      getRowId={(l) => l.id}
      getRowLabel={(l) => l.descricao}
      pageSize={false}
      defaultSorting={[{ id: "data", desc: true }]}
      editable={{
        onCellEdit: (rowId, colId, valor) =>
          new Promise<void>((resolve, reject) =>
            window.setTimeout(() => {
              if (colId === "descricao" && valor === "") return reject(new Error("vazio"))
              setDados((d) => d.map((l) => (l.id === rowId ? { ...l, [colId]: valor ?? l[colId as keyof Lancamento] } : l)))
              resolve()
            }, 500)
          ),
      }}
    />
  )
}

function DemoTelefone() {
  return (
    <IphoneFrame title="Lançamentos num iPhone">
      {/* O topo desce da ilha do iPhone, como a página de Touch & safe area. */}
      <div className="h-full overflow-y-auto bg-background px-4 pt-16 pb-8">
        <DataTable
          aria-label="Lançamentos no telefone"
          columns={COLUNAS}
          data={LANCAMENTOS.slice(0, 8)}
          getRowId={(l) => l.id}
          getRowLabel={(l) => l.descricao}
          pageSize={false}
          enableSelection
          rowState={(l) => (l.status === "prevista" ? "pending" : undefined)}
          rowActions={ACOES(() => undefined)}
          onRowClick={() => undefined}
        />
      </div>
    </IphoneFrame>
  )
}

export default function DataTableDoc() {
  return (
    <>
      <Usage>
        Uma tabela com <strong>estado</strong>: ordenar, filtrar, marcar, agrupar, expandir. É o motor da TanStack Table
        (v9) por baixo das peças da{" "}
        <Link href="/designsystem/table" className="underline">
          Table
        </Link>{" "}
        e da moldura do <code>TablePanel</code>, que mora nesta página. Uma tabela de referência, que ninguém ordena nem marca, continua sendo a <code>Table</code> sozinha.
      </Usage>

      <DocSection
        title="Na tela"
        description="Os lançamentos de março e fevereiro, com tudo ligado: a busca sem acento, os filtros por faceta com a contagem, o menu de colunas e densidade, o CSV, a seleção com a barra flutuante, o grupo de mês com o total e a seta que recolhe, as ações à vista e no ⋯, o botão direito, a linha prevista apagada e a linha de totais. Troque os fios, o cabeçalho e a zebra."
        code={`const col = dataTableColumns<Lancamento>()

<DataTable
  columns={[col.identity({…}), col.date({…}), col.status({…}), col.money({…})]}
  data={lancamentos}
  getRowId={(l) => l.id}
  getRowLabel={(l) => l.descricao}
  toolbar={{ search: true, facets: ["categoria", "conta"], view: true, export: "lancamentos" }}
  enableSelection
  bulkActions={[{ label: "Excluir", variant: "destructive", onSelect: excluir }]}
  rowActions={[{ label: "Editar", primary: true, … }, { label: "Excluir", confirm: true, … }]}
  rowContextMenu
  groupBy={(l, { sorting }) =>
    sorting[0]?.id === "data" ? { key: l.data.slice(0, 7), label: nomeDoMes(l.data) } : null}
  groupTotal={(rows) => <MoneyDisplay value={soma(rows)} signed />}
  footer={(rows) => <TableRow>…</TableRow>}
/>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A barra flutuante sobe na mola, e substitui as barras à mão">
        Marcar a primeira linha traz a pílula de baixo — de 12px abaixo e 97%, na mola do realce (0,28s, 20% de quique) — e
        desmarcar a última a leva em 0,13s. Ela é fixa no meio da janela, acima da barra de abas no telefone, e vai para o{" "}
        <code>body</code>: o painel recorta com <code>clip-path</code>, que apagaria qualquer descendente fixo. Com a página
        toda marcada e mais linhas além dela, aparece &ldquo;marcar todas as N&rdquo;. Uma ação que devolve{" "}
        <code>Promise</code> trava a barra com a roda, e a seleção limpa quando ela termina.
      </DocNote>

      <DocNote title="Marcar uma faixa, um grupo, e o anúncio">
        Shift+clique numa caixa marca todas entre a última marcada e esta — o handler da TanStack lê o Shift do clique. A
        caixa do mês marca as linhas dele, com o indeterminado. Cada caixa diz o nome da linha (&ldquo;Selecionar
        Mercado&rdquo;), e uma região viva anuncia &ldquo;3 selecionadas&rdquo;.
      </DocNote>

      <DocNote title="O teclado">
        As linhas entram na ordem do Tab uma vez só (foco itinerante): ↑ e ↓ andam, Home e End vão às pontas, PageUp e
        PageDown andam dez, Espaço marca, Shift+↑↓ estende a seleção, Enter abre. É a semântica de tabela — a grade, com
        foco por célula, é só a versão editável.
      </DocNote>

      <DocSection
        title="Ordenar por várias colunas"
        description="Clique ordena por uma coluna; Shift+clique soma a coluna à ordenação, e o número ao lado da seta diz a ordem. A seta gira na mola, e as linhas deslizam até o lugar novo (o layout do motion) — até 60 linhas, e nunca com movimento reduzido."
        code={`<DataTable defaultSorting={[{ id: "categoria", desc: false }, { id: "valor", desc: true }]} … />`}
        previewClassName="items-stretch"
      >
        <DemoOrdenar />
      </DocSection>

      <DocSection
        title="Detalhe e sublinhas"
        description="renderDetail abre um painel sob a linha, na mola da divulgação; getSubRows abre as filhas — as parcelas de uma compra, recuadas. A parcela vigente é a linha current."
        code={`<DataTable
  getSubRows={(l) => l.parcelas}
  renderDetail={(l) => <DescriptionList layout="grid" columns={3}>…</DescriptionList>}
  rowState={(l) => (l.vigente ? "current" : undefined)}
/>`}
        previewClassName="items-stretch"
      >
        <DemoExpandir />
      </DocSection>

      <DocSection
        title="Dados do servidor"
        description="manual: a tabela só escreve a ordenação e a página, e quem chama busca. O esqueleto entra na primeira carga (depois de 300ms), a recarga esmaece as linhas de antes, e a falha é a linha com o tentar de novo. Ligue a falha e troque de página."
        code={`<DataTable
  manual={{ rowCount: total, sorting: true, pagination: true }}
  sorting={sorting} onSortingChange={setSorting}
  pagination={pagination} onPaginationChange={setPagination}
  loading={!pagina} pending={isFetching}
  error={erro ? { onRetry: refetch } : null}
/>`}
        previewClassName="items-stretch"
      >
        <DemoServidor />
      </DocSection>

      <DocSection
        title="Editar na célula"
        description="editable liga a grade (role=grid): as setas andam entre as células, Enter ou F2 (ou dois cliques) edita, Esc desiste, Enter ou Tab confirma. onCellEdit pode devolver Promise — a célula mostra a roda, e se falhar volta ao valor de antes. Apague uma descrição para ver a falha. O saldo corrente acende quando muda."
        code={`<DataTable
  columns={[{ …, meta: { edit: { type: "money" } } }, col.balance({ … })]}
  editable={{ onCellEdit: (rowId, colId, valor) => salvar(…) }}
/>`}
        previewClassName="items-stretch"
      >
        <DemoEdicao />
      </DocSection>

      <DocNote title="O saldo corrente só existe em ordem de data">
        <code>col.balance</code> soma o saldo depois de cada linha — e só é verdade ordenado pela data e sem filtro.
        Ordenado por valor, o &ldquo;saldo depois&rdquo; somaria outras datas; filtrado, faltaria o que o filtro escondeu. Fora
        disso a coluna diz &ldquo;—&rdquo;, em vez de afirmar um número que ninguém apurou.
      </DocNote>

      <DocSection
        title="No telefone"
        description="As colunas dizem onde moram no gêmeo (meta.mobile: media, title, description, trailing, meta), e abaixo de md a tabela vira a lista de Item — por CSS, sem hook de largura. A linha é um extrato: o nome e a legenda à esquerda, numa linha cada; o valor e a data à direita, alinhados pela ponta. As ações vão para o ⋯, que abre a folha com o nome da linha no título."
        code={`col.identity({ …, meta: { mobile: "title" } })
col.money({ … })        // trailing, de fábrica`}
        previewClassName="items-center"
      >
        <DemoTelefone />
      </DocSection>

      <DocNote title="CSV para o Excel em português">
        O separador é <code>;</code> (a vírgula é a casa decimal), o arquivo leva BOM (senão &ldquo;Alimentação&rdquo; sai
        quebrado) e o número vai cru, com vírgula e sem &ldquo;R$&rdquo; — uma célula de texto não soma. Cada coluna pode dar o
        próprio valor em <code>meta.csv</code>, ou sair do arquivo com <code>csv: false</code>. Com dados do servidor, quem
        chama passa <code>onExport</code>.
      </DocNote>

      <PropsTable
        title="Props de DataTable — os dados e o estado"
        rows={[
          { prop: "columns / data / getRowId", type: "DataTableColumnDef<T>[] / T[] / (row) => string", description: "As colunas (a ColumnDef da TanStack v9, com meta), as linhas e o id de cada uma." },
          { prop: "getRowLabel", type: "(row) => string", description: "O nome da linha nos rótulos: “Selecionar Mercado”, “Mais ações para Mercado”." },
          { prop: "sorting / rowSelection / pagination / globalFilter / columnFilters / expanded", type: "estado + on…Change", description: "Cada fatia é controlada ou não; defaultSorting é a semente." },
          { prop: "pageSize", type: "number | false", default: "20", description: "false desliga a paginação." },
          { prop: "manual", type: "{ rowCount, sorting?, pagination?, filtering? }", description: "Dados do servidor: o estado só é escrito." },
          { prop: "urlState", type: "boolean | { prefix }", description: "A ordenação, a página, a busca e as facetas na URL." },
          { prop: "id", type: "string", description: "Guarda a densidade e as colunas escondidas em localStorage." },
        ]}
      />

      <PropsTable
        title="Props de DataTable — as linhas"
        rows={[
          { prop: "onRowClick", type: "(row) => void", description: "A linha clicável, com Enter no teclado." },
          { prop: "rowState", type: "(row) => \"current\" | \"pending\"", description: "A linha de agora e a prevista." },
          { prop: "renderDetail / getSubRows", type: "(row) => ReactNode / (row) => T[]", description: "O detalhe sob a linha e as sublinhas, com a seta que gira." },
          { prop: "groupBy / groupTotal / groupCollapsible", type: "(row) => { key, label } / (rows) => ReactNode / boolean", description: "A faixa de grupo entre linhas consecutivas, com o total e a seta." },
          { prop: "enableSelection", type: "boolean | (row) => boolean", description: "A coluna de caixas; a função diz quais linhas se marcam." },
          { prop: "bulkActions / onSelectAllMatching", type: "DataTableBulkAction[] / () => void", description: "As ações da barra flutuante; marcar todas além da página." },
          { prop: "rowActions / rowContextMenu", type: "DataTableAction[] / boolean", description: "primary fica à vista, o resto vai para o ⋯; o botão direito repete." },
        ]}
      />

      <PropsTable
        title="Props de DataTable — a forma"
        rows={[
          { prop: "toolbar", type: "{ search, facets, view, export, start, end } | ReactNode", description: "A barra de cima, montada ou à mão (com useDataTable)." },
          { prop: "density / striped / dividers / headerVariant / stickyHeader", type: "os eixos da Table", description: "A densidade também se troca no menu Exibir." },
          { prop: "loading / pending / error / empty", type: "boolean / boolean / { message, onRetry } / ReactNode", description: "O esqueleto, a recarga, a falha e o vazio." },
          { prop: "footer", type: "(rows, { columns }) => ReactNode", description: "A linha de totais, das linhas filtradas; os colSpan somam columns (as colunas à vista)." },
          { prop: "mobile / motion / virtualize / editable / panel", type: "…", description: "O gêmeo, a cascata e o deslizar, a virtualização (só as linhas à vista), a grade de edição e a moldura." },
        ]}
      />

      <PropsTable
        title="meta da coluna"
        rows={[
          { prop: "label", type: "string", description: "O nome no menu de colunas, no CSV e no esqueleto." },
          { prop: "numeric / pin / primary", type: "boolean / \"start\" | \"end\" / boolean", description: "Os mesmos da Table." },
          { prop: "mobile", type: "\"media\" | \"title\" | \"description\" | \"trailing\" | \"meta\"", description: "O lugar no gêmeo do telefone; meta é a linha miúda sob a ponta (a data, por padrão)." },
          { prop: "facet", type: "{ options? }", description: "O filtro por faceta, com a contagem." },
          { prop: "csv / edit", type: "false | (row) => valor / { type, options }", description: "O valor no CSV e a edição na célula." },
        ]}
      />
      <PropsTable
        title="TablePanel — a moldura"
        rows={[
          { prop: "TablePanel", type: "ComponentProps<typeof Card> & { toolbar?: ReactNode; footer?: ReactNode }", description: "Card padding=\"none\" variant=\"outline\" que publica md; toolbar e footer recebem a barra de topo e o rodapé, fora da moldura." },
          { prop: "TablePanelToolbar", type: 'ComponentProps<typeof CardToolbar> · variant: "label" | "title"', default: '"label"', description: "A barra de topo; vai na prop toolbar, nunca como filho — como filho cairia dentro da moldura, e avisa no console." },
          { prop: "TablePanelFooter", type: "ComponentProps<typeof CardNote>", description: "O rodapé de paginação; vai na prop footer, nunca como filho — avisa no console. Empilha no telefone, linha no desktop." },
        ]}
      />
    </>
  )
}
