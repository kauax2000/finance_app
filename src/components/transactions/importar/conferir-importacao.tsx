"use client"

import * as React from "react"
import {
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    CheckIcon,
    ChevronDownIcon,
    NoSymbolIcon,
    TagIcon,
} from "@heroicons/react/16/solid"
import { FunnelIcon } from "@heroicons/react/24/outline"

import { Badge } from "@/components/ui/badge"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { Separator } from "@/components/ui/separator"
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
    useDataTable,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState, EmptyStateIcon, EmptyStateTitle } from "@/components/ui/empty-state"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemLink,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Caption } from "@/components/ui/typography"
import { useIsMobile } from "@/hooks/use-mobile"
import { numberBR, signedCurrencyBRL } from "@/lib/formatters"
import { type ItemImportavel, tipoDoItem } from "@/lib/import/importar"
import { formatYmdPtBr } from "@/lib/transaction-date"

import {
    type FiltroConferencia,
    idsParaCategoria,
    type ImportarExtrato,
    rotuloDasIgnoradas,
    rotulosDasVisiveis,
} from "./use-importar-extrato"

/** O compacto mostra no máximo isto; acima, o "Ver os N" e o expandir. */
const LIMITE = 6

const SEM = "__sem__"

const FILTROS: { valor: FiltroConferencia; rotulo: string; aviso?: true; so_com_linhas?: true }[] = [
    { valor: "todos", rotulo: "Todos" },
    { valor: "saidas", rotulo: "Saídas" },
    { valor: "entradas", rotulo: "Entradas" },
    // As duas pendências só aparecem quando há linha, e acendem em aviso.
    { valor: "existem", rotulo: "Já existem", aviso: true, so_com_linhas: true },
    { valor: "sem-categoria", rotulo: "Sem categoria", aviso: true, so_com_linhas: true },
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
function CategoriaDaLinha({ imp, item, travado }: { imp: ImportarExtrato; item: ItemImportavel; travado: boolean }) {
    const id = imp.categoriaDe(item.clientId)
    const nome = nomeDaCategoria(imp, item)
    return (
        <Combobox
            value={id ?? ""}
            onValueChange={(v) => imp.setCategoria([item.clientId], v === SEM ? null : v)}
        >
            <ComboboxField>
                <ComboboxTrigger
                    size="sm"
                    placeholder="Sem categoria"
                    disabled={travado}
                    aria-label={`Categoria de ${item.descricao}`}
                >
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
function Linha({
    imp,
    item,
    travado,
    onTrocarCategoria,
}: {
    imp: ImportarExtrato
    item: ItemImportavel
    travado: boolean
    onTrocarCategoria: (item: ItemImportavel) => void
}) {
    const marcada = imp.marcadas.has(item.clientId)
    return (
        // A de fora esmaece pela tinta, e não por opacidade: o texto fica no contraste AA.
        <Item variant="flush" size="sm" className={marcada ? undefined : "text-muted-foreground"}>
            <ItemMedia>
                <Checkbox
                    checked={marcada}
                    onCheckedChange={(v) => imp.setMarcada(item.clientId, v === true)}
                    disabled={travado}
                    aria-label={`Trazer ${rotuloDe(item)}`}
                />
            </ItemMedia>
            {/* Uma linha no desktop (descrição · categoria · valor). No telefone a categoria é texto na segunda linha, e tocar no corpo da linha (fora da caixa) a troca. */}
            <div className="relative flex min-w-0 flex-1 items-center gap-x-3">
                {/* A película do `ItemLink` cobre só este bloco (o `relative`): a caixa fica fora dela. */}
                {travado ? null : (
                    <ItemLink
                        aria-label={`Trocar a categoria de ${rotuloDe(item)}`}
                        className="md:hidden"
                        onClick={() => onTrocarCategoria(item)}
                    />
                )}
                <ItemContent className="min-w-0 flex-1">
                    <ItemTitle className="w-full">
                        <span className="truncate">{descricaoDe(item)}</span>
                    </ItemTitle>
                    <ItemDescription className="truncate">
                        <span className="md:hidden">
                            {formatYmdPtBr(item.data).slice(0, 5)} · {nomeDaCategoria(imp, item) ?? "Sem categoria"}
                        </span>
                        <span className="hidden md:inline">{formatYmdPtBr(item.data)}</span>
                        {imp.existentes.has(item.clientId) ? " · " : null}
                        <JaExiste imp={imp} item={item} />
                    </ItemDescription>
                </ItemContent>
                <div className="hidden md:block md:w-40">
                    <CategoriaDaLinha imp={imp} item={item} travado={travado} />
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


const col = dataTableColumns<ItemImportavel>()

/**
 * "Pôr categoria" das linhas à vista (ou de uma, tocada no telefone): escolher
 * aplica e fecha. Sem formulário: o de fora é o do Importar. Com despesas e
 * receitas à vista, cada categoria vale para as do tipo dela.
 */
function PorCategoria({ imp, itens, onClose }: { imp: ImportarExtrato; itens: ItemImportavel[]; onClose: () => void }) {
    const destino = imp.destino
    const tipos = destino ? (["expense", "income"] as const).filter((t) => itens.some((i) => tipoDoItem(i, destino) === t)) : []
    const misturadas = tipos.length > 1
    const categorias = imp.previa?.categorias ?? []

    function escolher(v: string) {
        if (!destino) return
        const tipo = v === SEM ? null : (categorias.find((c) => c.id === v)?.type ?? null)
        imp.setCategoria(idsParaCategoria(itens, tipo, destino), v === SEM ? null : v)
        onClose()
    }

    return (
        <Dialog open={itens.length > 0} surface="auto" onOpenChange={(o) => (o ? undefined : onClose())}>
            <DialogContent size="sm">
                <DialogHeader>
                    <DialogTitle>Pôr categoria</DialogTitle>
                    <DialogDescription>
                        {itens.length === 1
                            ? `Vale para ${itens[0].descricao}.`
                            : `Vale para os ${numberBR(itens.length)} visíveis.`}
                        {misturadas ? " Cada categoria vale para as do tipo dela." : null}
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <Combobox value="" onValueChange={escolher}>
                        <ComboboxField>
                            <ComboboxTrigger placeholder="Escolha uma categoria" aria-label="Categoria">
                                <ComboboxValue placeholder="Escolha uma categoria" />
                            </ComboboxTrigger>
                        </ComboboxField>
                        <ComboboxContent>
                            <ComboboxInput placeholder="Buscar categoria…" />
                            <ComboboxList>
                                <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                                {tipos.map((t) => (
                                    <ComboboxGroup
                                        key={t}
                                        heading={misturadas ? (t === "expense" ? "Despesas" : "Receitas") : undefined}
                                    >
                                        {categorias
                                            .filter((c) => c.type === t)
                                            .map((c) => (
                                                <ComboboxItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </ComboboxItem>
                                            ))}
                                    </ComboboxGroup>
                                ))}
                                <ComboboxGroup>
                                    <ComboboxItem value={SEM} variant="none">
                                        Sem categoria
                                    </ComboboxItem>
                                </ComboboxGroup>
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
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
 * As ações em massa valem para as linhas à vista (o filtro e a busca), nunca
 * para as marcadas: a caixa só diz se a linha entra. Cada item diz quantas.
 */
function AcoesDasVisiveis({
    imp,
    itens,
    onPorCategoria,
    size,
    travado,
}: {
    imp: ImportarExtrato
    itens: ItemImportavel[]
    onPorCategoria: (itens: ItemImportavel[]) => void
    size?: "xs" | "sm"
    travado: boolean
}) {
    const rotulos = rotulosDasVisiveis(itens.length)
    const ids = itens.map((i) => i.clientId)
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary" size={size} disabled={travado || itens.length === 0}>
                    <span>Ações</span>
                    <ChevronDownIcon data-icon="inline-end" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onPorCategoria(itens)}>
                    <TagIcon />
                    {rotulos.categoria}
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={!itens.some((i) => imp.marcadas.has(i.clientId))}
                    onSelect={() => imp.marcarVarias(ids, false)}
                >
                    <NoSymbolIcon />
                    {rotulos.fora}
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={itens.every((i) => imp.marcadas.has(i.clientId))}
                    onSelect={() => imp.marcarVarias(ids, true)}
                >
                    <CheckIcon />
                    {rotulos.trazer}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/** Na barra do `DataTable`: as visíveis são as que ele filtrou (o filtro da conferência mais a busca). */
function AcoesDaTabela(props: {
    imp: ImportarExtrato
    onPorCategoria: (itens: ItemImportavel[]) => void
    travado: boolean
}) {
    const itens = useDataTable().getFilteredRowModel().rows.map((r) => r.original as ItemImportavel)
    return <AcoesDasVisiveis {...props} itens={itens} />
}

/**
 * A conferência: o resumo em chips, o filtro e a lista. Compacta, no máximo 6
 * linhas (a última dissolve) e "Ver os N"; expandida, o mesmo diálogo em tela
 * cheia com o `DataTable` (busca, ordenação, seleção = o que entra, soma).
 */
export function ConferirImportacao({ imp, travado = false }: { imp: ImportarExtrato; travado?: boolean }) {
    const { resumo } = imp
    const [porCategoria, setPorCategoria] = React.useState<ItemImportavel[]>([])
    const grande = imp.visiveis.length > LIMITE
    const celular = useIsMobile()
    const podeExpandir = resumo.total > LIMITE
    const botaoExpandir = (
        <Button
            type="button"
            variant="tertiary"
            size="icon-md"
            aria-label={imp.expandido ? "Recolher a lista" : "Expandir a lista"}
            aria-expanded={imp.expandido}
            disabled={travado}
            onClick={() => imp.setExpandido(!imp.expandido)}
        >
            {imp.expandido ? <ArrowsPointingInIcon /> : <ArrowsPointingOutIcon />}
        </Button>
    )

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
            cell: ({ row }) => <CategoriaDaLinha imp={imp} item={row.original} travado={travado} />,
            meta: { label: "Categoria", csv: false },
        },
        // No gêmeo do telefone a categoria é texto (a legenda é um `<p>`); tocar na linha a troca.
        {
            id: "categoria-nome",
            header: "Categoria",
            enableSorting: false,
            cell: ({ row }) => nomeDaCategoria(imp, row.original) ?? "Sem categoria",
            meta: { label: "Categoria", mobile: "description", headClassName: "hidden", cellClassName: "hidden", csv: false },
        },
        col.money({ id: "valor", header: "Valor", accessor: valorDe }),
    ]

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
            className="flex min-w-0 flex-col gap-2 md:gap-4"
            onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault()
            }}
        >
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
            {/* Sem a faixa das Colunas (OFX), as Ações e, na tela cheia, o recolher moram acima da lista. */}
            {(!imp.csv && !imp.expandido) || (imp.expandido && podeExpandir) ? (
                <div className="flex items-center justify-end gap-2">
                    {imp.expandido || imp.csv ? null : (
                        <AcoesDasVisiveis imp={imp} itens={imp.visiveis} onPorCategoria={setPorCategoria} size="xs" travado={travado} />
                    )}
                    {imp.expandido ? botaoExpandir : null}
                </div>
            ) : null}
            {!imp.existentesConferidos ? (
                <Caption>Não deu para conferir o que já existe.</Caption>
            ) : null}
            {imp.previa && imp.previa.ignoradas > 0 ? <Caption>{rotuloDasIgnoradas(imp.previa.ignoradas)}</Caption> : null}
            {/* O filtro é o resumo: cada aba traz a contagem, e a que pede atenção acende em aviso.
                No desktop as abas dividem a linha; no telefone, onde não cabem, a fileira rola de lado. */}
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <Tabs value={imp.filtro} onValueChange={(v) => imp.setFiltro(v as FiltroConferencia)}>
                        <TabsList aria-label="Filtro" scrollable={celular}>
                            {FILTROS.filter((f) => !f.so_com_linhas || imp.contagens[f.valor] > 0 || imp.filtro === f.valor).map((f) => (
                                <TabsTrigger
                                    key={f.valor}
                                    value={f.valor}
                                    disabled={travado}
                                    // A sobra da linha se divide a partir do rótulo de cada aba, para "Sem categoria" não apertar.
                                    className="flex-auto"
                                    // A fileira rola de lado quando não cabe: a aba escolhida vem inteira à vista.
                                    onClick={(e) => {
                                        const aba = e.currentTarget
                                        requestAnimationFrame(() => aba.scrollIntoView({ block: "nearest", inline: "nearest" }))
                                    }}
                                    count={
                                        f.aviso && imp.contagens[f.valor] > 0 ? (
                                            <Badge size="xs" tone="warning" className="nums">
                                                {numberBR(imp.contagens[f.valor])}
                                            </Badge>
                                        ) : (
                                            numberBR(imp.contagens[f.valor])
                                        )
                                    }
                                >
                                    {f.rotulo}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </div>
            {/* Como o arquivo foi lido mora logo abaixo do filtro, antes das linhas que ele explica. */}
            {imp.csv && !imp.expandido ? (
                <Item variant="muted" size="sm" className="rounded-surface" /* cápsulas a 8px da borda: o canto acompanha, no degrau da superfície */>
                    <ItemContent>
                        <ItemDescription>
                            Colunas: {papeisDe(imp.mapeamento)}
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        {/* O sinal ao contrário do destino é o engano mais comum: um toque refaz a leitura. */}
                        <Button type="button" variant="tertiary" size="sm" disabled={travado} onClick={() => void imp.inverterSinal()}>
                            Inverter
                        </Button>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            disabled={travado}
                            onClick={imp.ajustarColunas}
                        >
                            Ajustar
                        </Button>
                        <AcoesDasVisiveis imp={imp} itens={imp.visiveis} onPorCategoria={setPorCategoria} size="sm" travado={travado} />
                    </ItemActions>
                </Item>
            ) : null}
            {imp.expandido ? (
                <DataTable
                    aria-label="Lançamentos do arquivo"
                    columns={colunas}
                    data={imp.visiveis}
                    getRowId={(i) => i.clientId}
                    getRowLabel={rotuloDe}
                    pageSize={false}
                    toolbar={{ search: "Buscar descrição", end: <AcoesDaTabela imp={imp} onPorCategoria={setPorCategoria} travado={travado} /> }}
                    onRowClick={celular && !travado ? (i) => setPorCategoria([i]) : undefined}
                    enableSelection={travado ? () => false : true}
                    pending={travado}
                    rowSelection={selecao}
                    onRowSelectionChange={mudarSelecao}
                    empty={vazio}
                />
            ) : imp.visiveis.length === 0 ? (
                vazio
            ) : (
                <>
                    <Caption className="md:hidden">Toque numa linha para trocar a categoria</Caption>
                    <ItemGroup variant="divided">
                        {/* O compacto tem teto: as 6 primeiras; a tela cheia mostra todas. */}
                        {imp.visiveis.slice(0, LIMITE).map((i) => (
                            <Linha
                                key={i.clientId}
                                imp={imp}
                                item={i}
                                travado={travado}
                                onTrocarCategoria={(item) => setPorCategoria([item])}
                            />
                        ))}
                    </ItemGroup>
                    {/* O contador e o "Ver todos" (que abre a tela cheia) dividem a linha de baixo, centrados. */}
                    {podeExpandir ? (
                        <div className="flex items-center justify-center gap-1">
                            {grande ? (
                                <Caption>{`Mostrando ${numberBR(LIMITE)} de ${numberBR(imp.visiveis.length)} ·`}</Caption>
                            ) : null}
                            <Button
                                type="button"
                                variant="tertiary"
                                size="sm"
                                aria-expanded={false}
                                disabled={travado}
                                onClick={() => imp.setExpandido(true)}
                            >
                                <ArrowsPointingOutIcon data-icon="inline-start" />
                                <span>Ver todos</span>
                            </Button>
                        </div>
                    ) : null}
                </>
            )}
            {/* O resumo é um recibo, logo abaixo da lista: quantas entram, cada tipo com a quantidade,
                o que ficou sem categoria e, depois do fio, o efeito no saldo. */}
            <Item variant="muted" size="sm" className="rounded-surface" role="status">
                <ItemContent>
                <DescriptionList layout="inline" size="sm">
                    <DescriptionListItem>
                        <DescriptionTerm>Entram</DescriptionTerm>
                        <DescriptionDetails>
                            {numberBR(resumo.entram)} de {numberBR(resumo.total)}
                        </DescriptionDetails>
                    </DescriptionListItem>
                    <DescriptionListItem>
                        <DescriptionTerm>{`Saídas · ${numberBR(resumo.nSaidas)}`}</DescriptionTerm>
                        <DescriptionDetails className="text-expense">{signedCurrencyBRL(-resumo.saidas)}</DescriptionDetails>
                    </DescriptionListItem>
                    <DescriptionListItem>
                        <DescriptionTerm>{`Entradas · ${numberBR(resumo.nEntradas)}`}</DescriptionTerm>
                        <DescriptionDetails className="text-income">{signedCurrencyBRL(resumo.entradas)}</DescriptionDetails>
                    </DescriptionListItem>
                    {resumo.semCategoria > 0 ? (
                        <DescriptionListItem>
                            <DescriptionTerm>Sem categoria</DescriptionTerm>
                            <DescriptionDetails className="text-warning-muted-foreground">{numberBR(resumo.semCategoria)}</DescriptionDetails>
                        </DescriptionListItem>
                    ) : null}
                </DescriptionList>
                <Separator className="my-2" />
                <DescriptionList layout="inline" size="sm">
                    <DescriptionListItem>
                        <DescriptionTerm className="font-medium text-foreground">Saldo</DescriptionTerm>
                        <DescriptionDetails
                            size="lg"
                            className={resumo.entradas - resumo.saidas < 0 ? "text-expense" : "text-income"}
                        >
                            {signedCurrencyBRL(resumo.entradas - resumo.saidas)}
                        </DescriptionDetails>
                    </DescriptionListItem>
                </DescriptionList>
                </ItemContent>
            </Item>
            <PorCategoria imp={imp} itens={porCategoria} onClose={() => setPorCategoria([])} />
        </div>
    )
}
