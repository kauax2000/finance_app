"use client"

import * as React from "react"
import {
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    CheckIcon,
    ChevronDownIcon,
    NoSymbolIcon,
    SparklesIcon,
    TagIcon,
} from "@heroicons/react/16/solid"
import { FunnelIcon } from "@heroicons/react/24/outline"

import { BuscaQueAbre } from "./busca-que-abre"
import { LadrilhoDaCategoria } from "./ladrilho-da-categoria"
import { Alert, AlertAction, AlertActions, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Caption } from "@/components/ui/typography"
import { useIsMobile } from "@/hooks/use-mobile"
import { normalizeSearchText } from "@/lib/command-filter"
import { numberBR, signedCurrencyBRL } from "@/lib/formatters"
import { guiaDaAba, ordemPelaIa, rotuloDePorCategoria } from "./rotulo-por-categoria"
import { type ItemImportavel, tipoDoItem } from "@/lib/import/importar"
import { formatYmdPtBr } from "@/lib/transaction-date"
import { toastUndo } from "@/lib/toast"
import { TrocaSuave } from "@/lib/troca-suave"
import { ESCADA, ESCADA_DA_LISTA, ESCADA_DA_TABELA, VISTA_QUE_SAI, VISTA_QUE_SAI_MS } from "./movimento"
import { cn } from "@/lib/utils"
import { chavesDasLinhas } from "./chave-da-linha"
import { ContagemQueAnda } from "./contagem-que-anda"

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

const FILTROS: { valor: FiltroConferencia; rotulo: string; aviso?: true; so_com_linhas?: true; ia?: true }[] = [
    { valor: "todos", rotulo: "Todos" },
    { valor: "saidas", rotulo: "Saídas" },
    { valor: "entradas", rotulo: "Entradas" },
    // As duas pendências só aparecem quando há linha, e acendem em aviso.
    { valor: "existem", rotulo: "Já existem", aviso: true, so_com_linhas: true },
    { valor: "sem-categoria", rotulo: "Sem categoria", aviso: true, so_com_linhas: true },
    // O ✦ liga a aba ao botão "IA categorizou N".
    { valor: "ia", rotulo: "Sugeridas", so_com_linhas: true, ia: true },
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
    const atual = id ? imp.previa?.categorias.find((c) => c.id === id) : undefined
    const daIa = imp.origemDe(item.clientId) === "ia"
    return (
        <Combobox
            value={id ?? ""}
            onValueChange={(v) => imp.setCategoria([item.clientId], v === SEM ? null : v)}
        >
            <ComboboxField>
                <ComboboxTrigger
                    placeholder="Sem categoria"
                    disabled={travado}
                    aria-label={`Categoria de ${item.descricao}${daIa ? " (sugerida pela IA)" : ""}`}
                >
                    {/* O ✦ fica logo depois do nome, sem truncar: o nome é que encolhe. */}
                    <span className="flex min-w-0 items-center gap-1">
                        <ComboboxValue placeholder="Sem categoria" media={atual ? <LadrilhoDaCategoria categoria={atual} /> : undefined}>
                            {nome}
                        </ComboboxValue>
                        {daIa ? <SparklesIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                    </span>
                </ComboboxTrigger>
            </ComboboxField>
            <ComboboxContent>
                <ComboboxInput placeholder="Buscar categoria…" />
                <ComboboxList>
                    <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                    <ComboboxGroup>
                        {/* A ausência abre a lista: o `variant="none"` traz o fio embaixo dele. */}
                        <ComboboxItem value={SEM} variant="none">
                            Sem categoria
                        </ComboboxItem>
                        {(imp.previa?.categoriasDo(item) ?? []).map((c) => (
                            <ComboboxItem key={c.id} value={c.id} media={<LadrilhoDaCategoria categoria={c} />}>
                                {c.name}
                            </ComboboxItem>
                        ))}
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

/** O crédito do cartão é estorno: abate a despesa da categoria, e por isso pede uma categoria de despesa. */
const ehEstornoDoCartao = (imp: ImportarExtrato, item: ItemImportavel) => item.estorno && imp.destino?.tipo === "cartao"

/** O que a linha precisa dizer além da data: estorno do cartão e "já existe". */
function AvisosDaLinha({ imp, item }: { imp: ImportarExtrato; item: ItemImportavel }) {
    const estorno = ehEstornoDoCartao(imp, item)
    const existe = imp.existentes.has(item.clientId)
    if (!estorno && !existe) return null
    return (
        <>
            {estorno ? <Badge size="xs" tone="info">estorno</Badge> : null}
            {estorno && existe ? " " : null}
            <JaExiste imp={imp} item={item} />
        </>
    )
}

/** A linha do compacto: caixa (entra ou não), descrição e data, categoria, valor. */
function Linha({
    imp,
    item,
    travado,
    onTrocarCategoria,
    posicao = 0,
}: {
    posicao?: number
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
                        {/* No telefone, a mesma linha da tabela: a categoria aqui, a data embaixo do valor. */}
                        <span className="md:hidden">{nomeDaCategoria(imp, item) ?? "Sem categoria"}</span>
                        <span className="hidden md:inline">{formatYmdPtBr(item.data)}</span>
                        {imp.existentes.has(item.clientId) || ehEstornoDoCartao(imp, item) ? " · " : null}
                        <AvisosDaLinha imp={imp} item={item} />
                    </ItemDescription>
                </ItemContent>
                <div className="hidden md:block md:w-44">
                    <CategoriaDaLinha imp={imp} item={item} travado={travado} />
                </div>
                {/* Largura mínima no desktop: a categoria fica alinhada em coluna, qualquer que seja o valor. A troca de sinal (Inverter) vira no lugar. */}
                <div className="ms-auto flex flex-col items-end text-end md:min-w-24">
                    <span className="relative">
                        <TrocaSuave forma="texto" chave={`${item.estorno}:${valorDe(item)}`} atraso={Math.min(posicao, 5) * 0.04}>
                            <MoneyDisplay value={valorDe(item)} signed tone={item.estorno ? "income" : "expense"} />
                        </TrocaSuave>
                    </span>
                    <span className="nums text-xs text-muted-foreground md:hidden">{formatYmdPtBr(item.data).slice(0, 5)}</span>
                </div>
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
                                            <LadrilhoDaCategoria categoria={c} />
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
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary" size={size} disabled={travado || itens.length === 0}>
                    <span>Ações</span>
                    <ChevronDownIcon data-icon="inline-end" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <ItensDasVisiveis imp={imp} itens={itens} onPorCategoria={onPorCategoria} />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/** Os itens das ações em massa: os do menu Ações do desktop e os do ⋯ do cabeçalho no telefone. */
export function ItensDasVisiveis({
    imp,
    itens,
    onPorCategoria,
    disabled = false,
}: {
    imp: ImportarExtrato
    itens: ItemImportavel[]
    onPorCategoria: (itens: ItemImportavel[]) => void
    disabled?: boolean
}) {
    const rotulos = rotulosDasVisiveis(itens.length)
    const ids = itens.map((i) => i.clientId)
    const sem = disabled || itens.length === 0
    return (
        <>
                <DropdownMenuItem disabled={sem} onSelect={() => onPorCategoria(itens)}>
                    <TagIcon />
                    {rotulos.categoria}
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={sem || !itens.some((i) => imp.marcadas.has(i.clientId))}
                    onSelect={() => imp.marcarVarias(ids, false)}
                >
                    <NoSymbolIcon />
                    {rotulos.fora}
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={sem || itens.every((i) => imp.marcadas.has(i.clientId))}
                    onSelect={() => imp.marcarVarias(ids, true)}
                >
                    <CheckIcon />
                    {rotulos.trazer}
                </DropdownMenuItem>
        </>
    )
}

/**
 * O estado da conferência que o cabeçalho também usa: a busca (o ⋯ do telefone a
 * abre) e as linhas do Pôr categoria (o ⋯ o pede). Mora no diálogo, e sair do
 * passo Conferir o limpa, como quando ele morava na conferência e desmontava.
 */
export function useConferencia(ativa: boolean) {
    const [busca, setBusca] = React.useState("")
    const [buscaAberta, setBuscaAberta] = React.useState(false)
    const [porCategoria, setPorCategoria] = React.useState<ItemImportavel[]>([])
    // Pelo id, e não por ref: o objeto da conferência atravessa o render do diálogo e da lista.
    const idDaBusca = React.useId()
    const focarBusca = React.useRef(false)
    const [ativaAntes, setAtivaAntes] = React.useState(ativa)
    if (ativa !== ativaAntes) {
        setAtivaAntes(ativa)
        if (!ativa) {
            setBusca("")
            setBuscaAberta(false)
            setPorCategoria([])
        }
    }
    function abrirBusca() {
        focarBusca.current = true
        setBuscaAberta(true)
    }
    // O menu devolve o foco ao ⋯ ao fechar: aberta pelo Buscar, a busca o fica.
    function focoAoFecharMenu(e: Event) {
        if (!focarBusca.current) return
        focarBusca.current = false
        e.preventDefault()
        document.getElementById(idDaBusca)?.focus()
    }
    return { busca, setBusca, buscaAberta, setBuscaAberta, abrirBusca, idDaBusca, focoAoFecharMenu, porCategoria, setPorCategoria }
}

export type Conferencia = ReturnType<typeof useConferencia>

/** As linhas que a busca deixa à vista: pela descrição, sem acento. */
export function pelaBusca(itens: ItemImportavel[], busca: string) {
    const termo = normalizeSearchText(busca.trim())
    return termo ? itens.filter((i) => normalizeSearchText(descricaoDe(i)).includes(termo)) : itens
}

/**
 * O saldo do lote, recolhido: a linha mostra o saldo, e abrir mostra quantas entram, cada tipo
 * com a quantidade e o que ficou sem categoria. No desktop mora no corpo ("Saldo"); no telefone,
 * no rodapé, logo acima do botão ("Total"), parado nas duas vistas enquanto a lista rola.
 */
export function ResumoDoSaldo({ imp, rotulo }: { imp: ImportarExtrato; rotulo: string }) {
    const { resumo } = imp
    return (
        <Collapsible>
            <CollapsibleRow
                className="[&_[data-slot=collapsible-row-label]]:no-underline"
                trailing={
                    <span className={cn("nums text-base font-medium", resumo.entradas - resumo.saidas < 0 ? "text-expense" : "text-income")}>
                        <ContagemQueAnda value={resumo.entradas - resumo.saidas} formatar={signedCurrencyBRL} />
                    </span>
                }
            >
                {rotulo}
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
    )
}

/** O `menu-unmorph` do `field-bloom` dura 210ms; a folga cobre o último quadro. */
const BUSCA_QUE_SAI_MS = 260

/** O esmaecer da vista que sai (`--duration-base`) e uma folga: ele já terminou se o fim não chegou. */
const RESERVA_DA_SAIDA_MS = VISTA_QUE_SAI_MS + 100

/**
 * A conferência: o resumo em chips, o filtro e a lista. Compacta, no máximo 6
 * linhas (a última dissolve) e "Ver os N"; expandida, o mesmo diálogo em tela
 * cheia com o `DataTable` (busca, ordenação, seleção = o que entra, soma).
 */
export function ConferirImportacao({ imp, conf, travado = false }: { imp: ImportarExtrato; conf: Conferencia; travado?: boolean }) {
    const { resumo } = imp
    const { porCategoria, setPorCategoria, busca, setBusca } = conf
    // A busca mora na linha das abas (no telefone, abaixo dela, aberta pelo ⋯). Ela filtra aqui, pela
    // descrição e sem acento, e não no `DataTable`: a tabela e as Ações recebem a mesma lista.
    const nomeDoId = (id: string | null) => (id ? (imp.previa?.nomeDaCategoria.get(id) ?? "") : "")
    const pelaIa = imp.filtro === "ia"
    const iaLendo = imp.ia.estado === "lendo"
    // Todas as da IA de uma vez, com o toast que deixa voltar.
    const desfazerTodas = () => {
        const ids = (imp.previa?.itens ?? []).filter((i) => imp.origemDe(i.clientId) === "ia").map((i) => i.clientId)
        toastUndo("Sugestões da IA desfeitas", { onUndo: imp.desfazerIa(ids) })
    }
    const linhas = pelaIa ? ordemPelaIa(imp.visiveis, (i) => imp.categoriaDe(i.clientId), nomeDoId) : imp.visiveis
    const daTabela = pelaBusca(linhas, busca)
    const porGrupo = new Map<string, number>()
    if (pelaIa) for (const i of daTabela) {
        const id = imp.categoriaDe(i.clientId)
        if (id) porGrupo.set(id, (porGrupo.get(id) ?? 0) + 1)
    }
    // Os grupos só valem na aba Pela IA e na ordem dela: ordenada por uma coluna, a tabela volta a ser plana.
    const grupoDaIa = (i: ItemImportavel, { sorting }: { sorting: unknown[] }) => {
        const id = pelaIa && sorting.length === 0 ? imp.categoriaDe(i.clientId) : null
        if (!id) return null
        const cat = imp.previa?.categorias.find((c) => c.id === id)
        return {
            key: id,
            label: (
                // O rótulo ocupa a célula do grupo, com as ações na ponta direita: na célula do total elas alargavam a coluna Valor.
                <span data-grupo-ia={id} className="flex min-w-0 flex-1 items-center gap-1.5">
                    {cat ? <LadrilhoDaCategoria categoria={cat} /> : null}
                    <span className="min-w-0 truncate">{`${nomeDoId(id)} · ${numberBR(porGrupo.get(id) ?? 0)}`}</span>
                    {/* No telefone o rótulo vira a faixa do gêmeo, sem lugar para alvo de toque: lá a troca é tocar na linha. */}
                    {celular ? null : acoesDoGrupo(i)}
                </span>
            ),
        }
    }
    function acoesDoGrupo(item: ItemImportavel) {
        const id = imp.categoriaDe(item.clientId)
        const nome = nomeDoId(id)
        const membros = daTabela.filter((m) => imp.categoriaDe(m.clientId) === id)
        return (
            <span className="ms-auto inline-flex shrink-0 items-center gap-1 normal-case tracking-normal">
                <Button
                    type="button"
                    variant="tertiary"
                    disabled={travado}
                    aria-label={`Trocar a categoria do grupo ${nome}`}
                    onClick={() => setPorCategoria(membros)}
                >
                    {"Trocar o grupo…"}
                </Button>
                <Button
                    type="button"
                    variant="tertiary"
                    disabled={travado}
                    aria-label={`Desfazer as sugestões de ${nome}`}
                    onClick={() => {
                        const devolver = imp.desfazerIa(membros.map((m) => m.clientId))
                        toastUndo("Sugestões da IA desfeitas", { onUndo: devolver })
                    }}
                >
                    Desfazer
                </Button>
            </span>
        )
    }
    const grande = daTabela.length > LIMITE
    const celular = useIsMobile()
    // A releitura (Inverter) esmaece o que vai mudar, com o conteúdo velho à vista.
    const lendo = imp.pendente === "lendo"
    const esmaece = cn("transition-opacity duration-(--duration-fast)", lendo && "opacity-60")
    const chavesCompacto = chavesDasLinhas(daTabela.slice(0, LIMITE))
    const podeExpandir = resumo.total > LIMITE
    // Ver todos e Recolher em três fases: a vista que sai esmaece (`--duration-base`, `VISTA_QUE_SAI`),
    // a troca monta na transição (o toque pinta antes da tabela) e a caixa anda; o que chega surge em escada.
    const [mudando, startTransition] = React.useTransition()
    // De que vista a troca pedida parte. Se o `expandido` mudar por fora (reiniciar, Ajustar), a
    // vista não é mais a que esmaecia: `saindo` apaga sozinho, e a troca pendente não vale mais.
    const [saindoDe, setSaindoDe] = React.useState<boolean | null>(null)
    const saindo = saindoDe === imp.expandido
    const pedido = React.useRef<boolean | null>(null)
    const esperando = saindo || mudando
    // Idempotente: o fim, o cancelamento e o tempo de reserva podem chegar juntos; só o primeiro troca.
    function trocar() {
        // Já trocou (o fim chegou antes da reserva): nada a fazer, nem soltar o esmaecer da vista que sai.
        const de = pedido.current
        if (de === null) return
        pedido.current = null
        if (de !== imp.expandido) {
            setSaindoDe(null)
            return
        }
        startTransition(() => {
            setSaindoDe(null)
            // Recolher limpa a busca; no telefone a linha dela fecha junto, para não ficar um campo vazio aberto.
            if (de) {
                setBusca("")
                conf.setBuscaAberta(false)
            }
            imp.setExpandido(!de)
        })
    }
    function alternar() {
        if (esperando) return
        setTrocouDeAba(false)
        pedido.current = imp.expandido
        // Com movimento reduzido não há esmaecer, nem o `transitionend` que o encerra: troca na hora.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return trocar()
        setSaindoDe(imp.expandido)
    }
    function sair(e: React.TransitionEvent) {
        if (saindo && e.target === e.currentTarget && e.propertyName === "opacity") trocar()
    }
    // Reserva para quando o fim da transição não chega (aba em segundo plano, a vista desmontada no meio).
    const trocarDeReserva = React.useEffectEvent(trocar)
    React.useEffect(() => {
        if (!saindo) return
        const t = window.setTimeout(trocarDeReserva, RESERVA_DA_SAIDA_MS)
        return () => window.clearTimeout(t)
    }, [saindo])
    const saida = cn(VISTA_QUE_SAI, saindo && "opacity-0")
    // A aba trocada não tem vista que sai: a escada começa na hora (`ESCADA`, teto 6 = LIMITE). A volta
    // do Ver menos espera o esmaecer (`ESCADA_DA_LISTA`). Só no telefone; o desktop segue como era.
    const [filtroVisto, setFiltroVisto] = React.useState(imp.filtro)
    const [trocouDeAba, setTrocouDeAba] = React.useState(false)
    if (imp.filtro !== filtroVisto) {
        setFiltroVisto(imp.filtro)
        setTrocouDeAba(true)
    }
    const escadaDaLista = celular && trocouDeAba ? ESCADA : ESCADA_DA_LISTA
    // A linha da busca fica montada enquanto sai (os 210ms do `menu-unmorph`); com movimento reduzido, sai na hora.
    const [buscaNaTela, setBuscaNaTela] = React.useState(conf.buscaAberta)
    if (conf.buscaAberta && !buscaNaTela) setBuscaNaTela(true)
    React.useEffect(() => {
        if (conf.buscaAberta || !buscaNaTela) return
        const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const t = window.setTimeout(() => setBuscaNaTela(false), reduzido ? 0 : BUSCA_QUE_SAI_MS)
        return () => window.clearTimeout(t)
    }, [conf.buscaAberta, buscaNaTela])
    // Na tela cheia, entre a lupa e as Ações: três pesos — a lupa sem nada, ele sem fundo, as Ações com fundo, na ponta.
    const botaoRecolher = (
        // Sem `aria-expanded`: no terciário ele é o realce de menu aberto, e o rótulo já diz o estado.
        <Button type="button" variant="tertiary" disabled={travado} onClick={alternar}>
            {esperando ? <Spinner data-icon="inline-start" /> : <ArrowsPointingInIcon data-icon="inline-start" />}
            <span>Ver menos</span>
        </Button>
    )

    const colunas: DataTableColumnDef<ItemImportavel>[] = [
        // No gêmeo do telefone a data é a linha miúda sob o valor (`meta`), em dd/mm, como no resumo.
        { ...col.date({ id: "data", header: "Data", accessor: (i) => i.data }), ...(celular ? { cell: ({ row }) => formatYmdPtBr(row.original.data).slice(0, 5) } : {}) },
        col.identity({
            id: "descricao",
            header: "Descrição",
            title: descricaoDe,
            // No telefone a legenda é a coluna da categoria, com o aviso depois dela.
            description: celular ? undefined : (i) => (imp.existentes.has(i.clientId) || ehEstornoDoCartao(imp, i) ? <AvisosDaLinha imp={imp} item={i} /> : null),
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
        // Só no telefone: no desktop a célula some por CSS, mas o colSpan da linha de grupo contava a vaga dela.
        ...(celular ? [{
            id: "categoria-nome",
            header: "Categoria",
            enableSorting: false,
            cell: ({ row }) => (
                <>
                    {nomeDaCategoria(imp, row.original) ?? "Sem categoria"}
                    {imp.existentes.has(row.original.clientId) || ehEstornoDoCartao(imp, row.original) ? " · " : null}
                    <AvisosDaLinha imp={imp} item={row.original} />
                </>
            ),
            meta: { label: "Categoria", mobile: "description", headClassName: "hidden", cellClassName: "hidden", csv: false },
        } satisfies DataTableColumnDef<ItemImportavel>] : []),
        col.money({ id: "valor", header: "Valor", accessor: valorDe }),
    ]

    // A seleção do DataTable é o que entra; só as linhas à vista mudam (limpar não tira as filtradas).
    const selecao = Object.fromEntries([...imp.marcadas].map((id) => [id, true as const]))
    function mudarSelecao(v: Record<string, true>) {
        const vistas = new Set(daTabela.map((i) => i.clientId))
        const ligadas = Object.keys(v).filter((id) => v[id])
        imp.marcarVarias(ligadas.filter((id) => !imp.marcadas.has(id)), true)
        imp.marcarVarias([...imp.marcadas].filter((id) => vistas.has(id) && !v[id]), false)
    }

    const vazio = (
        <EmptyState size="sm" variant="plain">
            <EmptyStateIcon variant="circle">
                <FunnelIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>{busca.trim() ? "Nenhum lançamento para essa busca." : "Nenhum lançamento neste filtro"}</EmptyStateTitle>
        </EmptyState>
    )

    return (
        // O Enter da busca e dos campos da lista não envia o Importar.
        // No Ver todos e no Recolher a vista inteira esmaece junto (as abas, a faixa das colunas, o
        // saldo): só a lista sumir e o resto pular de lugar lia como tranco. `data-saindo` deixa os
        // passos do cabeçalho esmaecerem no mesmo compasso.
        <div
            className={cn("flex min-w-0 flex-col gap-2 md:gap-4", imp.expandido && "md:min-h-0 md:flex-1", saida)}
            data-saindo={saindo || undefined}
            onTransitionEnd={sair}
            onTransitionCancel={sair}
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
            {/* Sem a faixa das Colunas (OFX), as Ações moram acima da lista. */}
            {/* No telefone elas moram no ⋯ do cabeçalho. */}
            {!imp.csv && !imp.expandido && !celular ? (
                <div className="flex items-center justify-end gap-2">
                    <AcoesDasVisiveis imp={imp} itens={imp.visiveis} onPorCategoria={setPorCategoria} size="xs" travado={travado} />
                </div>
            ) : null}
            {!imp.existentesConferidos ? (
                <Caption>Não deu para conferir o que já existe.</Caption>
            ) : null}
            {imp.previa && imp.previa.ignoradas > 0 ? <Caption>{rotuloDasIgnoradas(imp.previa.ignoradas)}</Caption> : null}
            {/* O filtro é o resumo: cada aba traz a contagem, e a que pede atenção acende em aviso.
                No desktop as abas dividem a linha; no telefone, onde não cabem, a fileira rola de lado. */}
            {/* A IA mora na aba "✦ Sugeridas"; acima das abas fica só a falha, com o caminho de volta. */}
            {imp.ia.estado === "falhou" ? (
                <Alert size="sm" tone="warning" className={esmaece}>
                    <AlertDescription>Não foi possível gerar a categorização automática.</AlertDescription>
                    <AlertActions placement="inline">
                        <AlertAction disabled={travado} onClick={imp.tentarIaDeNovo}>
                            Tentar de novo
                        </AlertAction>
                    </AlertActions>
                </Alert>
            ) : null}
            <div className={cn("flex items-center gap-2", esmaece)} aria-busy={lendo}>
                <div className="min-w-0 flex-1">
                    <Tabs value={imp.filtro} onValueChange={(v) => imp.setFiltro(v as FiltroConferencia)}>
                        {/* Na tela cheia a linha é larga: as abas ficam do tamanho delas, à esquerda, como nas telas do app. */}
                        <TabsList aria-label="Filtro" scrollable={celular} stretch={!imp.expandido}>
                            {/* A aba da IA aparece já enquanto ela lê, com o spinner no lugar da contagem. */}
                            {FILTROS.filter((f) => !f.so_com_linhas || imp.contagens[f.valor] > 0 || imp.filtro === f.valor || (f.ia && iaLendo)).map((f) => (
                                <TabsTrigger
                                    key={f.valor}
                                    value={f.valor}
                                    disabled={travado}
                                    icon={f.ia ? <SparklesIcon /> : undefined}
                                    // A sobra da linha se divide a partir do rótulo de cada aba, para "Sem categoria" não apertar.
                                    className="flex-auto"
                                    // A fileira rola de lado quando não cabe: a aba escolhida vem inteira à vista.
                                    onClick={(e) => {
                                        const aba = e.currentTarget
                                        requestAnimationFrame(() => aba.scrollIntoView({ block: "nearest", inline: "nearest" }))
                                    }}
                                    count={
                                        f.ia && iaLendo ? (
                                            <Spinner size="sm" label="A IA está categorizando" />
                                        ) : f.aviso && imp.contagens[f.valor] > 0 ? (
                                            <Badge size="xs" tone="warning" className="nums">
                                                <ContagemQueAnda value={imp.contagens[f.valor]} formatar={numberBR} />
                                            </Badge>
                                        ) : (
                                            <ContagemQueAnda value={imp.contagens[f.valor]} formatar={numberBR} />
                                        )
                                    }
                                >
                                    {f.rotulo}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
                {/* Na tela cheia sobra largura: a busca, o recolher e as Ações (na ponta) vêm para a linha das abas. */}
                {/* No telefone a linha é só das abas: a busca e as Ações moram no ⋯, e o Ver menos no pé da lista. */}
                {imp.expandido && !celular ? (
                    <>
                        <BuscaQueAbre value={busca} onChange={setBusca} label="Buscar descrição" disabled={travado} />
                        {podeExpandir ? botaoRecolher : null}
                        <AcoesDasVisiveis imp={imp} itens={daTabela} onPorCategoria={setPorCategoria} travado={travado} />
                    </>
                ) : null}
            </div>
            {/* No telefone o Buscar do ⋯ abre a busca logo abaixo das abas, nas duas vistas; o × a fecha. */}
            {celular && (conf.buscaAberta || buscaNaTela) ? (
                // Brota da linha das abas (o `field-bloom`, o gesto do campo que abre) e volta a ela ao fechar.
                <div
                    data-state={conf.buscaAberta ? "open" : "closed"}
                    inert={!conf.buscaAberta}
                    className="field-bloom origin-top motion-reduce:animate-none!"
                >
                    <SearchInput
                        id={conf.idDaBusca}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        onClear={() => {
                            setBusca("")
                            conf.setBuscaAberta(false)
                        }}
                        clearLabel="Fechar busca"
                        placeholder="Buscar descrição"
                        aria-label="Buscar descrição"
                        disabled={travado}
                        // Vazia, sair do campo a fecha: o × só aparece com texto.
                        onBlur={() => {
                            if (!busca) conf.setBuscaAberta(false)
                        }}
                    />
                </div>
            ) : null}
            {/* Como o arquivo foi lido mora logo abaixo do filtro, antes das linhas que ele explica. */}
            {imp.csv && !imp.expandido && !celular ? (
                <Item variant="muted" size="sm" className="rounded-surface" /* cápsulas a 8px da borda: o canto acompanha, no degrau da superfície */>
                    <ItemContent>
                        <ItemDescription>
                            Colunas: {papeisDe(imp.mapeamento)}
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        {/* O sinal ao contrário do destino é o engano mais comum: um toque refaz a leitura. */}
                        <Button type="button" variant="tertiary" disabled={travado || lendo} onClick={() => void imp.inverterSinal()}>
                            {lendo ? <Spinner data-icon="inline-start" /> : null}
                            Inverter
                        </Button>
                        <Button
                            type="button"
                            variant="tertiary"
                            disabled={travado}
                            onClick={imp.ajustarColunas}
                        >
                            Ajustar
                        </Button>
                        <AcoesDasVisiveis imp={imp} itens={imp.visiveis} onPorCategoria={setPorCategoria} size="sm" travado={travado} />
                    </ItemActions>
                </Item>
            ) : null}
            {pelaIa && imp.visiveis.length > 0 ? (
                <Alert size="sm" icon={<SparklesIcon />} className={esmaece}>
                    <AlertDescription>A IA sugeriu estas. Troque o que não fizer sentido: a troca vira sua.</AlertDescription>
                    <AlertActions placement="inline">
                        <AlertAction outline={false} disabled={travado} onClick={desfazerTodas}>
                            Desfazer todas
                        </AlertAction>
                    </AlertActions>
                </Alert>
            ) : null}
            {imp.expandido ? (
                // A barra e as linhas chegam em escada (teto de 8), a barra junto com a primeira; a moldura e o cabeçalho já estão lá.
                // A altura desce até o viewport: o grupo, a moldura e o pai do viewport (o `hidden md:block`, só no desktop) encolhem, e o viewport rola.
                <div
                    className={cn(
                        ESCADA_DA_TABELA,
                        // O rótulo do grupo enche a célula (o DataTable o embrulha num inline-flex): as ações vão à ponta direita.
                        "[&_[data-slot=table-group-row]>td:last-child>span]:flex",
                        "md:flex md:min-h-0 md:flex-col md:[&_[data-slot=table-panel-group]]:min-h-0 md:[&_[data-slot=table-panel]]:min-h-0 md:[&_[data-slot=table-panel]>div:has(>[data-slot=table-viewport])]:flex md:[&_[data-slot=table-panel]>div:has(>[data-slot=table-viewport])]:min-h-0 md:[&_[data-slot=table-panel]>div:has(>[data-slot=table-viewport])]:flex-col"
                    )}
                >
                    <DataTable
                        // No telefone, sem a moldura de tabela: o gêmeo fica igual à lista do resumo.
                        panel={!celular}
                        // Marcar aqui é "esta entra" e quase tudo vem marcado: no telefone a linha fica rasa e no `sm`, como a do resumo (só o gêmeo lê isso; a tabela do desktop não muda).
                        mobileRow="flush"
                        stickyHeader={imp.expandido}
                        viewportClassName="md:min-h-0"
                        aria-label="Lançamentos do arquivo"
                        columns={colunas}
                        data={daTabela}
                        getRowId={(i) => i.clientId}
                        getRowLabel={rotuloDe}
                        groupBy={grupoDaIa}
                        pageSize={false}
                        onRowClick={celular && !travado ? (i) => setPorCategoria([i]) : undefined}
                        enableSelection={travado ? () => false : true}
                        pending={travado}
                        rowSelection={selecao}
                        onRowSelectionChange={mudarSelecao}
                        empty={vazio}
                    />
                    {celular && podeExpandir ? <div className="flex justify-center pt-2">{botaoRecolher}</div> : null}
                </div>
            ) : daTabela.length === 0 ? (
                vazio
            ) : (
                <>
                    <Caption className="md:hidden">Toque numa linha para trocar a categoria</Caption>
                    <ItemGroup
                        // No telefone, trocar de aba remonta a lista: as linhas da aba nova chegam na escada.
                        key={celular ? imp.filtro : undefined}
                        variant="divided"
                        className={cn(esmaece, escadaDaLista)}
                        aria-busy={lendo}
                    >
                        {/* O compacto tem teto: as 6 primeiras; a tela cheia mostra todas. No telefone a busca também filtra aqui. */}
                        {daTabela.slice(0, LIMITE).map((i, n) => (
                            <Linha
                                // O `clientId` nasce de novo a cada leitura: a chave do conteúdo segura a linha, para o valor trocar no lugar.
                                key={chavesCompacto[n]}
                                posicao={n}
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
                                <Caption className="text-control-sm leading-5">{`Mostrando ${numberBR(LIMITE)} de ${numberBR(daTabela.length)} ·`}</Caption>
                            ) : null}
                            <Button
                                type="button"
                                variant="tertiary"
                                // a sobra de 12px à direita do rótulo é invisível e puxava a linha para a esquerda
                                className="-me-3"
                                disabled={travado}
                                onClick={alternar}
                            >
                                {esperando ? <Spinner data-icon="inline-start" /> : <ArrowsPointingOutIcon data-icon="inline-start" />}
                                <span>Ver todos</span>
                            </Button>
                        </div>
                    ) : null}
                </>
            )}
            {/* O resumo é um recibo recolhido: a linha mostra o saldo, e abrir mostra quantas entram,
                cada tipo com a quantidade e o que ficou sem categoria. O diálogo não cresce sem pedir.
                No telefone é a linha "Total", sem caixa, no rodapé do diálogo (`ResumoDoSaldo`), parada nas duas vistas. */}
            {celular ? null : (
                <Item variant="muted" size="sm" className={cn("rounded-surface", esmaece)} role="status" aria-busy={lendo}>
                    <ItemContent>
                        <ResumoDoSaldo imp={imp} rotulo="Saldo" />
                    </ItemContent>
                </Item>
            )}
            <PorCategoria imp={imp} itens={porCategoria} onClose={() => setPorCategoria([])} />
        </div>
    )
}
