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

import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { Badge } from "@/components/ui/badge"
import { ColorTile } from "@/components/ui/color-tile"
import { Form, FormPickerPopoverItem, FormSubmit } from "@/components/ui/form"
import { SearchInput } from "@/components/ui/search-input"
import { Separator } from "@/components/ui/separator"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { Collapsible, CollapsibleContent, CollapsibleRow } from "@/components/ui/collapsible"
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
import { normalizeSearchText } from "@/lib/command-filter"
import { numberBR, signedCurrencyBRL } from "@/lib/formatters"
import { guiaDaAba, rotuloDePorCategoria } from "./rotulo-por-categoria"
import { type ItemImportavel, tipoDoItem } from "@/lib/import/importar"
import { formatYmdPtBr } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"

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

type TipoDeCategoria = "expense" | "income"
type Escolhas = Record<TipoDeCategoria, string | null>

/**
 * "Pôr categoria" das linhas à vista (ou de uma, tocada no telefone): a lista
 * mora no diálogo, tocar só marca, e o botão do rodapé diz o efeito e aplica.
 * O `Form` é do diálogo (portalizado, mas o submit sobe pela árvore do React
 * até o do Importar: `stopPropagation`). Com despesas e receitas à vista,
 * cada categoria vale para as do tipo dela.
 */
function PorCategoria({ imp, itens, onClose }: { imp: ImportarExtrato; itens: ItemImportavel[]; onClose: () => void }) {
    const destino = imp.destino
    const tipos = destino ? (["expense", "income"] as const).filter((t) => itens.some((i) => tipoDoItem(i, destino) === t)) : []
    const misturadas = tipos.length > 1
    const categorias = imp.previa?.categorias ?? []
    const [escolhas, setEscolhas] = React.useState<Escolhas>({ expense: null, income: null })
    const [aba, setAba] = React.useState<TipoDeCategoria>("expense")
    const [busca, setBusca] = React.useState("")
    // Com um tipo só à vista, a lista é desse tipo; com os dois, a aba aberta manda.
    const tipo = misturadas ? aba : (tipos[0] ?? "expense")

    const saidas = destino ? itens.filter((i) => tipoDoItem(i, destino) === "expense").length : 0
    const entradas = destino ? itens.filter((i) => tipoDoItem(i, destino) === "income").length : 0
    const nomeDaEscolha = (id: string | null) =>
        id == null ? null : id === SEM ? "sem categoria" : (categorias.find((c) => c.id === id)?.name ?? null)

    const q = normalizeSearchText(busca.trim())
    const achadas = categorias.filter((c) => c.type === tipo && (!q || normalizeSearchText(c.name).includes(q)))
    const escolhida = escolhas[tipo]
    const marcar = (id: string) => setEscolhas((e) => ({ ...e, [tipo]: e[tipo] === id ? null : id }))
    const aplicaveis = (destino ? tipos : []).flatMap((t) => {
        const id = escolhas[t]
        if (id == null || !destino) return []
        const ids = idsParaCategoria(itens, t, destino)
        const cat = id === SEM ? null : (categorias.find((c) => c.id === id) ?? null)
        return id === SEM || cat ? [{ ids, categoriaId: id === SEM ? null : id, nome: cat?.name ?? null }] : []
    })
    const rotulo = rotuloDePorCategoria(aplicaveis.map((p) => ({ nome: p.nome, n: p.ids.length })))

    function fechar() {
        setEscolhas({ expense: null, income: null })
        setAba("expense")
        setBusca("")
        onClose()
    }

    function aplicar(e: React.FormEvent) {
        // O `Form` não impede o envio nativo (quem impede é o `onSubmit`): sem o
        // `preventDefault`, o navegador recarrega a página. O `stopPropagation`
        // segura o submit que subiria pela árvore do React até o do Importar.
        e.preventDefault()
        e.stopPropagation()
        if (aplicaveis.length === 0) return
        for (const p of aplicaveis) imp.setCategoria(p.ids, p.categoriaId)
        fechar()
    }

    return (
        <Dialog open={itens.length > 0} surface="auto" onOpenChange={(o) => (o ? undefined : fechar())}>
            <DialogContent size="md" layout="fixed" className="h-(--dialog-max-h) [--dialog-max-h:min(85dvh,34rem)] [--dialog-body-fade-h:--spacing(12)]">
                <DialogHeader>
                    <DialogTitle>Pôr categoria</DialogTitle>
                    <DialogDescription>
                        {itens.length === 1
                            ? `Vale para ${itens[0].descricao}.`
                            : misturadas
                              ? "Escolha uma categoria para as saídas e outra para as entradas. Cada uma vale só para o seu tipo."
                              : `Vale para todos os ${numberBR(itens.length)} lançamentos.`}
                    </DialogDescription>
                </DialogHeader>
                <Form layout="none" onSubmit={aplicar} className="flex min-h-0 flex-1 flex-col">
                    {/* A busca fica parada acima da lista: só a lista rola. */}
                    <div className="px-(--dialog-px)">
                        <SearchInput
                            placeholder="Buscar categoria"
                            aria-label="Buscar categoria"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            onClear={() => setBusca("")}
                        />
                    </div>
                    {misturadas ? (
                        <div className="flex flex-col gap-2 px-(--dialog-px) pt-3">
                            <Tabs value={aba} onValueChange={(v) => setAba(v as TipoDeCategoria)}>
                                <TabsList aria-label="Tipo do lançamento" stretch>
                                    <TabsTrigger value="expense" count={numberBR(saidas)}>
                                        Saídas
                                    </TabsTrigger>
                                    <TabsTrigger value="income" count={numberBR(entradas)}>
                                        Entradas
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            {/* Diz para quem vale a lista aberta e o que já foi escolhido nela. */}
                            <Caption className="px-1">{guiaDaAba(tipo, tipo === "expense" ? saidas : entradas, nomeDaEscolha(escolhas[tipo]))}</Caption>
                        </div>
                    ) : null}
                    <DialogBody className="flex flex-col gap-3">
                        <ul className="flex flex-col gap-0.5">
                            <li>
                                <FormPickerPopoverItem selected={escolhida === SEM} onClick={() => marcar(SEM)}>
                                    <span className="min-w-0 truncate">Sem categoria</span>
                                    {escolhida === SEM ? <CheckIcon className="ms-auto shrink-0" /> : null}
                                </FormPickerPopoverItem>
                            </li>
                        </ul>
                        <Separator />
                        {achadas.length === 0 ? (
                            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                                Nenhuma categoria com esse nome.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-0.5">
                                {achadas.map((c) => (
                                    <li key={c.id}>
                                        <FormPickerPopoverItem selected={escolhida === c.id} onClick={() => marcar(c.id)}>
                                            <ColorTile size="xs" color={c.color} className="shrink-0">
                                                <CategoryIconPreview name={normalizeCategoryIcon(c.icon)} />
                                            </ColorTile>
                                            <span className="min-w-0 truncate">{c.name}</span>
                                            {escolhida === c.id ? <CheckIcon className="ms-auto shrink-0" /> : null}
                                        </FormPickerPopoverItem>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="tertiary" type="button">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <FormSubmit disabled={aplicaveis.every((p) => p.ids.length === 0)}>{rotulo}</FormSubmit>
                    </DialogFooter>
                </Form>
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
                                <Caption className="text-control-sm leading-5">{`Mostrando ${numberBR(LIMITE)} de ${numberBR(imp.visiveis.length)} ·`}</Caption>
                            ) : null}
                            <Button
                                type="button"
                                variant="tertiary"
                                size="sm"
                                // a sobra de 12px à direita do rótulo é invisível e puxava a linha para a esquerda
                                className="-me-3"
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
            {/* O resumo é um recibo recolhido: a linha mostra o saldo, e abrir mostra quantas entram,
                cada tipo com a quantidade e o que ficou sem categoria. O diálogo não cresce sem pedir. */}
            <Item variant="muted" size="sm" className="rounded-surface" role="status">
                <ItemContent>
                    <Collapsible>
                        <CollapsibleRow
                            className="[&_[data-slot=collapsible-row-label]]:no-underline"
                            trailing={
                                <span className={cn("nums text-base font-medium", resumo.entradas - resumo.saidas < 0 ? "text-expense" : "text-income")}>
                                    {signedCurrencyBRL(resumo.entradas - resumo.saidas)}
                                </span>
                            }
                        >
                            Saldo
                        </CollapsibleRow>
                        <CollapsibleContent>
                            <DescriptionList layout="inline" size="sm" className="pt-1">
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
                                        <DescriptionDetails className="text-warning-muted-foreground">
                                            {numberBR(resumo.semCategoria)}
                                        </DescriptionDetails>
                                    </DescriptionListItem>
                                ) : null}
                            </DescriptionList>
                        </CollapsibleContent>
                    </Collapsible>
                </ItemContent>
            </Item>
            <PorCategoria imp={imp} itens={porCategoria} onClose={() => setPorCategoria([])} />
        </div>
    )
}
