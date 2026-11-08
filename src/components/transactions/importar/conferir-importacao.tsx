"use client"

import * as React from "react"
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, NoSymbolIcon, TagIcon } from "@heroicons/react/16/solid"
import { FunnelIcon } from "@heroicons/react/24/outline"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxField,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue,
} from "@/components/ui/combobox"
import {
    DataTable,
    dataTableColumns,
    type DataTableColumnDef,
} from "@/components/ui/data-table"
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState, EmptyStateIcon, EmptyStateTitle } from "@/components/ui/empty-state"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { numberBR, signedCurrencyBRL } from "@/lib/formatters"
import { type ItemImportavel, tipoDoItem } from "@/lib/import/importar"
import { formatYmdPtBr } from "@/lib/transaction-date"

import type { FiltroConferencia, ImportarExtrato } from "./use-importar-extrato"

/** O compacto mostra no máximo isto; acima, o "Ver os N" e o expandir. */
const LIMITE = 6
const SEM = "__sem__"

const FILTROS: { valor: FiltroConferencia; rotulo: string }[] = [
    { valor: "todos", rotulo: "Todos" },
    { valor: "saidas", rotulo: "Saídas" },
    { valor: "entradas", rotulo: "Entradas" },
    { valor: "existem", rotulo: "Já existem" },
    { valor: "sem-categoria", rotulo: "Sem categoria" },
]

const papeisDe = (m: ImportarExtrato["mapeamento"]) =>
    [
        m.data >= 0 && "Data",
        m.descricao >= 0 && "Descrição",
        m.valor >= 0 && "Valor",
        m.categoria != null && "Categoria",
    ]
        .filter(Boolean)
        .join(" · ")

const valorDe = (i: ItemImportavel) => (i.estorno ? i.valor : -i.valor)
/** O nome da linha nos rótulos ("Trazer Mercado, 02/10/2026"): a data desempata as homônimas. */
const rotuloDe = (i: ItemImportavel) => `${i.descricao}, ${formatYmdPtBr(i.data)}`
const descricaoDe = (i: ItemImportavel) => `${i.descricao}${i.parcela ? ` (${i.parcela.k}/${i.parcela.n})` : ""}`

/** O nome da categoria escolhida, ou o da planilha que nasce ao gravar. */
function nomeDaCategoria(imp: ImportarExtrato, item: ItemImportavel) {
    const id = imp.categoriaDe(item.clientId)
    const nova = imp.categoriaNovaDe(item.clientId)
    return id ? imp.previa?.nomeDaCategoria.get(id) : nova ? `${nova} (nova)` : undefined
}

/** A categoria de uma linha: a sugerida ou a da planilha já vem escolhida. */
function CategoriaDaLinha({ imp, item }: { imp: ImportarExtrato; item: ItemImportavel }) {
    const id = imp.categoriaDe(item.clientId)
    const nome = nomeDaCategoria(imp, item)
    return (
        <Combobox
            value={id ?? ""}
            onValueChange={(v) => imp.setCategoria([item.clientId], v === SEM ? null : v)}
        >
            <ComboboxField>
                <ComboboxTrigger size="sm" placeholder="Sem categoria" aria-label={`Categoria de ${item.descricao}`}>
                    <ComboboxValue placeholder="Sem categoria">{nome}</ComboboxValue>
                </ComboboxTrigger>
            </ComboboxField>
            <ComboboxContent>
                <ComboboxInput placeholder="Buscar categoria…" />
                <ComboboxList>
                    <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                    <ComboboxGroup>
                        {(imp.previa?.categoriasDo(item) ?? []).map((c) => (
                            <ComboboxItem key={c.id} value={c.id}>
                                {c.name}
                            </ComboboxItem>
                        ))}
                        <ComboboxItem value={SEM} variant="none">
                            Sem categoria
                        </ComboboxItem>
                    </ComboboxGroup>
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}

/** "Já existe", com o lançamento da carteira que casou (passar ou tocar não esconde nada: ele está escrito). */
function JaExiste({ imp, item }: { imp: ImportarExtrato; item: ItemImportavel }) {
    const e = imp.existentes.get(item.clientId)
    if (!e) return null
    return (
        <>
            <Badge size="xs" tone="warning">
                já existe
            </Badge>{" "}
            <span className="text-muted-foreground">
                {e.description || "Sem descrição"}, {formatYmdPtBr(e.date.slice(0, 10))}
            </span>
        </>
    )
}

/** A linha do compacto: caixa (entra ou não), descrição e data, categoria, valor. */
function Linha({ imp, item }: { imp: ImportarExtrato; item: ItemImportavel }) {
    const marcada = imp.marcadas.has(item.clientId)
    return (
        // A de fora esmaece pela tinta, e não por opacidade: o texto fica no contraste AA.
        <Item variant="flush" size="sm" className={marcada ? undefined : "text-muted-foreground"}>
            <ItemMedia>
                <Checkbox
                    checked={marcada}
                    onCheckedChange={(v) => imp.setMarcada(item.clientId, v === true)}
                    aria-label={`Trazer ${rotuloDe(item)}`}
                />
            </ItemMedia>
            {/* Uma linha no desktop (descrição · categoria · valor); no telefone a categoria desce para a segunda. */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                <ItemContent className="min-w-0 flex-1">
                    <ItemTitle className="w-full">
                        <span className="truncate">{descricaoDe(item)}</span>
                    </ItemTitle>
                    <ItemDescription>
                        {formatYmdPtBr(item.data)}
                        {imp.existentes.has(item.clientId) ? " · " : null}
                        <JaExiste imp={imp} item={item} />
                    </ItemDescription>
                </ItemContent>
                <div className="order-last basis-full md:order-none md:basis-auto md:w-40">
                    <CategoriaDaLinha imp={imp} item={item} />
                </div>
                <MoneyDisplay
                    // Largura mínima no desktop: a categoria fica alinhada em coluna, qualquer que seja o valor.
                    className="ms-auto text-end md:min-w-24"
                    value={valorDe(item)}
                    signed
                    tone={item.estorno ? "income" : "expense"}
                />
            </div>
        </Item>
    )
}

/**
 * O teto do compacto: a altura das 6 primeiras linhas, medida (a linha muda com
 * a largura e o apontador). A sétima fica por baixo, e a sexta dissolve.
 */
function useTetoDasLinhas(ativo: boolean) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [teto, setTeto] = React.useState<number | null>(null)
    React.useLayoutEffect(() => {
        const el = ref.current
        if (!ativo || !el) return
        const medir = () => {
            const linhas = el.querySelectorAll<HTMLElement>(":scope > [data-slot=item]")
            if (linhas.length > LIMITE) setTeto(linhas[LIMITE].offsetTop - linhas[0].offsetTop)
        }
        medir()
        const ro = new ResizeObserver(medir)
        ro.observe(el)
        return () => ro.disconnect()
    }, [ativo])
    return [ref, ativo ? teto : null] as const
}

const col = dataTableColumns<ItemImportavel>()

/** "Pôr categoria" das marcadas: escolher aplica e fecha (sem formulário: o de fora é o do Importar). */
function PorCategoria({ imp, itens, onClose }: { imp: ImportarExtrato; itens: ItemImportavel[]; onClose: () => void }) {
    const primeiro = itens[0]
    return (
        <Dialog open={itens.length > 0} surface="auto" onOpenChange={(o) => (o ? undefined : onClose())}>
            <DialogContent size="sm">
                <DialogHeader>
                    <DialogTitle>Pôr categoria</DialogTitle>
                    <DialogDescription>Vale para os {numberBR(itens.length)} selecionados.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {primeiro ? (
                        <Combobox
                            value=""
                            onValueChange={(v) => {
                                imp.setCategoria(
                                    itens.map((i) => i.clientId),
                                    v === SEM ? null : v,
                                )
                                onClose()
                            }}
                        >
                            <ComboboxField>
                                <ComboboxTrigger placeholder="Escolha uma categoria" aria-label="Categoria">
                                    <ComboboxValue placeholder="Escolha uma categoria" />
                                </ComboboxTrigger>
                            </ComboboxField>
                            <ComboboxContent>
                                <ComboboxInput placeholder="Buscar categoria…" />
                                <ComboboxList>
                                    <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                                    <ComboboxGroup>
                                        {(imp.previa?.categoriasDo(primeiro) ?? []).map((c) => (
                                            <ComboboxItem key={c.id} value={c.id}>
                                                {c.name}
                                            </ComboboxItem>
                                        ))}
                                        <ComboboxItem value={SEM} variant="none">
                                            Sem categoria
                                        </ComboboxItem>
                                    </ComboboxGroup>
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    ) : null}
                </DialogBody>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary" type="button">
                            Cancelar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * A conferência: o resumo em chips, o filtro e a lista. Compacta, no máximo 6
 * linhas (a última dissolve) e "Ver os N"; expandida, o mesmo diálogo em tela
 * cheia com o `DataTable` (busca, ordenação, seleção = o que entra, soma).
 */
export function ConferirImportacao({ imp }: { imp: ImportarExtrato }) {
    const { resumo } = imp
    const [porCategoria, setPorCategoria] = React.useState<ItemImportavel[]>([])
    const grande = imp.visiveis.length > LIMITE
    const destino = imp.destino
    const [listaRef, teto] = useTetoDasLinhas(grande && !imp.expandido)
    const podeExpandir = resumo.total > LIMITE

    const colunas: DataTableColumnDef<ItemImportavel>[] = [
        col.date({ id: "data", header: "Data", accessor: (i) => i.data }),
        col.identity({
            id: "descricao",
            header: "Descrição",
            title: descricaoDe,
            description: (i) => (imp.existentes.has(i.clientId) ? <JaExiste imp={imp} item={i} /> : null),
            meta: { label: "Descrição", mobile: "title" },
        }),
        {
            id: "categoria",
            header: "Categoria",
            enableSorting: false,
            cell: ({ row }) => <CategoriaDaLinha imp={imp} item={row.original} />,
            meta: { label: "Categoria", csv: false },
        },
        // No gêmeo do telefone a categoria é texto (a legenda é um `<p>`); trocar é o "Pôr categoria" das marcadas.
        {
            id: "categoria-nome",
            header: "Categoria",
            enableSorting: false,
            cell: ({ row }) => nomeDaCategoria(imp, row.original) ?? "Sem categoria",
            meta: { label: "Categoria", mobile: "description", headClassName: "hidden", cellClassName: "hidden", csv: false },
        },
        col.money({ id: "valor", header: "Valor", accessor: valorDe }),
    ]

    // As ações em massa moram na barra da tabela: a pílula flutuante do `DataTable` fica sob o véu do diálogo.
    const marcadasVistas = imp.visiveis.filter((i) => imp.marcadas.has(i.clientId))
    const acoes = (
        <div className="flex items-center gap-2">
            <span className="hidden text-sm whitespace-nowrap text-muted-foreground sm:inline">
                {numberBR(marcadasVistas.length)} {marcadasVistas.length === 1 ? "marcada" : "marcadas"} ·{" "}
                <MoneyDisplay value={marcadasVistas.reduce((s, i) => s + valorDe(i), 0)} signed />
            </span>
            <Button
                type="button"
                variant="secondary"
                // Despesa e receita têm categorias diferentes: filtre Saídas ou Entradas.
                disabled={
                    marcadasVistas.length === 0 ||
                    !destino ||
                    new Set(marcadasVistas.map((i) => tipoDoItem(i, destino))).size > 1
                }
                onClick={() => setPorCategoria(marcadasVistas)}
            >
                <TagIcon data-icon="inline-start" />
                Pôr categoria
            </Button>
            <Button
                type="button"
                variant="tertiary"
                disabled={marcadasVistas.length === 0}
                onClick={() => imp.marcarVarias(marcadasVistas.map((i) => i.clientId), false)}
            >
                <NoSymbolIcon data-icon="inline-start" />
                Deixar de fora
            </Button>
        </div>
    )

    // A seleção do DataTable é o que entra; só as linhas à vista mudam (limpar não tira as filtradas).
    const selecao = Object.fromEntries([...imp.marcadas].map((id) => [id, true as const]))
    function mudarSelecao(v: Record<string, true>) {
        const vistas = new Set(imp.visiveis.map((i) => i.clientId))
        const ligadas = Object.keys(v).filter((id) => v[id])
        imp.marcarVarias(ligadas.filter((id) => !imp.marcadas.has(id)), true)
        imp.marcarVarias([...imp.marcadas].filter((id) => vistas.has(id) && !v[id]), false)
    }

    const vazio = (
        <EmptyState size="sm" variant="plain">
            <EmptyStateIcon variant="circle">
                <FunnelIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>Nenhum lançamento neste filtro</EmptyStateTitle>
        </EmptyState>
    )

    return (
        // O Enter da busca e dos campos da lista não envia o Importar.
        <div
            className="flex min-w-0 flex-col gap-4"
            onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault()
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                <Badge size="md" tone="neutral" role="status">
                    Vão entrar {numberBR(resumo.entram)} de {numberBR(resumo.total)}
                </Badge>
                {resumo.saidas > 0 ? (
                    <Badge size="md" tone="expense">
                        Saídas {signedCurrencyBRL(-resumo.saidas)}
                    </Badge>
                ) : null}
                {resumo.entradas > 0 ? (
                    <Badge size="md" tone="income">
                        Entradas {signedCurrencyBRL(resumo.entradas)}
                    </Badge>
                ) : null}
                {resumo.existem > 0 ? (
                    <Badge size="md" tone="warning">
                        {resumo.existem === 1 ? "1 já existe" : `${numberBR(resumo.existem)} já existem`}
                    </Badge>
                ) : null}
                {resumo.semCategoria > 0 ? (
                    <Button type="button" variant="secondary" size="xs" onClick={() => imp.setFiltro("sem-categoria")}>
                        <span>{`${numberBR(resumo.semCategoria)} sem categoria`}</span>
                    </Button>
                ) : null}
            </div>
            {imp.previa && imp.previa.categoriasNovas.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Categorias novas, criadas ao importar:</span>
                    {imp.previa.categoriasNovas.map((c) => (
                        <Badge key={c.clientId} tone={c.tipo === "income" ? "income" : "expense"}>
                            {c.nome}
                        </Badge>
                    ))}
                </div>
            ) : null}
            <div className="flex items-center gap-2">
                {/* No telefone os cinco filtros não cabem: a fileira rola de lado. */}
                <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
                    <ToggleGroup
                        type="single"
                        aria-label="Filtro"
                        className="w-max"
                        value={imp.filtro}
                        onValueChange={(v) => imp.setFiltro(v as FiltroConferencia)}
                    >
                        {FILTROS.map((f) => (
                            <ToggleGroupItem key={f.valor} value={f.valor}>
                                {f.rotulo}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
                {podeExpandir ? (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-md"
                        aria-label={imp.expandido ? "Recolher a lista" : "Expandir a lista"}
                        aria-expanded={imp.expandido}
                        onClick={() => imp.setExpandido(!imp.expandido)}
                    >
                        {imp.expandido ? <ArrowsPointingInIcon /> : <ArrowsPointingOutIcon />}
                    </Button>
                ) : null}
            </div>
            {imp.expandido ? (
                <DataTable
                    aria-label="Lançamentos do arquivo"
                    columns={colunas}
                    data={imp.visiveis}
                    getRowId={(i) => i.clientId}
                    getRowLabel={rotuloDe}
                    pageSize={false}
                    toolbar={{ search: "Buscar descrição", end: acoes }}
                    enableSelection
                    rowSelection={selecao}
                    onRowSelectionChange={mudarSelecao}
                    empty={vazio}
                />
            ) : imp.visiveis.length === 0 ? (
                vazio
            ) : (
                <>
                    <ScrollArea
                        variant="fade"
                        sides="end"
                        viewportClassName={grande ? "max-h-(--lista-h)" : undefined}
                        style={teto ? ({ "--lista-h": `${teto}px` } as React.CSSProperties) : undefined}
                    >
                        <ItemGroup ref={listaRef} variant="divided">
                            {imp.visiveis.slice(0, grande ? LIMITE + 1 : LIMITE).map((i) => (
                                <Linha key={i.clientId} imp={imp} item={i} />
                            ))}
                        </ItemGroup>
                    </ScrollArea>
                    {grande ? (
                        <div className="flex justify-center">
                            <Button type="button" variant="secondary" onClick={() => imp.setExpandido(true)}>
                                {`Ver os ${numberBR(imp.visiveis.length)} lançamentos`}
                            </Button>
                        </div>
                    ) : null}
                </>
            )}
            {imp.csv && !imp.expandido ? (
                <Item variant="muted" size="sm">
                    <ItemContent>
                        <ItemDescription>
                            Colunas: {papeisDe(imp.mapeamento)} · gasto é{" "}
                            {imp.mapeamento.negativoEhDespesa ? "negativo" : "positivo"}
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <Button type="button" variant="tertiary" size="sm" onClick={imp.ajustarColunas}>
                            Ajustar
                        </Button>
                    </ItemActions>
                </Item>
            ) : null}
            <PorCategoria imp={imp} itens={porCategoria} onClose={() => setPorCategoria([])} />
        </div>
    )
}
