"use client"

import { useRef, useState } from "react"
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline"
import {
    ArrowsRightLeftIcon,
    CheckIcon,
    ChevronLeftIcon,
    DocumentTextIcon,
    EllipsisHorizontalIcon,
    MagnifyingGlassIcon,
    TableCellsIcon,
    XMarkIcon,
} from "@heroicons/react/16/solid"

import { useWorkspace } from "@/components/workspace-provider"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogError,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { tagChipUnreadCount } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogCloseButton,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogHeaderRow,
    DialogSteps,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Form, FormCancel, FormControl, FormError, FormField, FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Caption } from "@/components/ui/typography"
import { useIsMobile } from "@/hooks/use-mobile"
import { numberBR } from "@/lib/formatters"
import { TrocaSuave } from "@/lib/troca-suave"
import { cn } from "@/lib/utils"
import { ESCADA, ESMAECE_AO_CHEGAR, PASSOS_ACOMPANHAM } from "./movimento"
import type { DestinoImportacao } from "@/lib/import/importar"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"

import { ConferirImportacao, FiltrosDaConferencia, ItensDasVisiveis, pelaBusca, pendenciaLigada, PendenciasNoMenu, ResumoDoSaldo, useConferencia } from "./conferir-importacao"
import { ConferirLeitura, MapearColunas } from "./mapear-colunas"
import { useTransicaoDaSubtela } from "./transicao-da-subtela"
import { periodoPtBr, rotuloDasIgnoradas, useImportarExtrato } from "./use-importar-extrato"

const CONTAS = [
    { forma: "pix", rotulo: "Pix", em: "no Pix" },
    { forma: "debit_card", rotulo: "Débito", em: "no Débito" },
    { forma: "other", rotulo: "Outro", em: "em Outro" },
] as const

const lancamentos = (n: number) => `${numberBR(n)} ${n === 1 ? "lançamento" : "lançamentos"}`
const tamanho = (bytes: number) => `${numberBR(Math.max(1, Math.round(bytes / 1024)))} KB`

/** O destino como o valor do `Select`: `cartao:<id>` ou `conta:<forma>`. */
const valorDoDestino = (d: DestinoImportacao | null) =>
    !d ? "" : d.tipo === "cartao" ? `cartao:${d.cardId}` : `conta:${d.paymentMethod}`

function destinoDoValor(v: string): DestinoImportacao | null {
    const [tipo, id] = v.split(":")
    if (tipo === "cartao" && id) return { tipo: "cartao", cardId: id }
    const conta = CONTAS.find((c) => c.forma === id)
    return tipo === "conta" && conta ? { tipo: "conta", paymentMethod: conta.forma } : null
}

/**
 * Importar extrato (versão C): Arquivo → Conferir, com Colunas no meio só quando
 * a dedução do CSV falha. O lote é preparado uma vez no `useImportarExtrato`:
 * repetir "Importar" não duplica. A lista grande não estica o diálogo: o compacto
 * mostra 6 linhas, e expandir leva o mesmo diálogo à tela cheia.
 */
export function ImportarExtratoDialog({
    open,
    onOpenChange,
    onRevisar,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Quem chama aplica o filtro A conferir (e Sem categoria, quando pedido); o diálogo fecha sozinho. */
    onRevisar: (o?: { semCategoria?: boolean }) => void
}) {
    const { currentWorkspaceId } = useWorkspace()
    const cartoes = useCreditCardsQuery(currentWorkspaceId).data ?? []
    const imp = useImportarExtrato({ workspaceId: currentWorkspaceId })
    const [perguntando, setPerguntando] = useState(false)
    const [sobre, setSobre] = useState(false)
    const [variosArquivos, setVariosArquivos] = useState(false)
    const entrada = useRef<HTMLInputElement>(null)
    const celular = useIsMobile()
    const conf = useConferencia(imp.passo === "conferir")
    // Ajustar colunas, vindo da conferência, é uma edição do que o app leu (dono, 16/11/2026): a gaveta vira
    // subtela, com ‹ no lugar dos passos e um botão só, Pronto. Quando a dedução falha, Colunas segue um passo.
    const subtela = imp.ajustandoColunas
    const voltarNoTopo = celular && (imp.passo === "conferir" || imp.passo === "colunas")
    // Entrar e sair da subtela é o gesto da subpágina do app, só no telefone.
    const trocarDeTela = useTransicaoDaSubtela({ passo: imp.passo, pendente: imp.pendente, erro: imp.erro }, celular)

    function mudarAberto(aberto: boolean) {
        if (!aberto) {
            imp.reiniciar()
            setPerguntando(false)
            setVariosArquivos(false)
        }
        onOpenChange(aberto)
    }

    // Colunas só aparece quando a dedução do CSV falha ou a pessoa pede Ajustar.
    const passos = imp.passo === "colunas" ? ["Arquivo", "Colunas", "Conferir"] : ["Arquivo", "Conferir"]
    const atual = Math.max(0, passos.indexOf({ arquivo: "Arquivo", colunas: "Colunas", conferir: "Conferir", feito: "" }[imp.passo]))
    const expandido = imp.passo === "conferir" && imp.expandido
    const gravando = imp.pendente === "importar" || imp.pendente === "desfazer"
    // Lendo ou gravando, nada do passo muda: a resposta cairia num estado trocado.
    const travado = imp.pendente != null
    const feito = imp.feito
    const d = imp.destino
    const cartao = d?.tipo === "cartao" ? cartoes.find((c) => c.id === d.cardId) : undefined
    // "para o Nubank"; na conta, "no Pix", "no Débito", "em Outro".
    const nomeDoDestino = cartao
        ? `para o ${cartao.name}`
        : (CONTAS.find((c) => d?.tipo === "conta" && c.forma === d.paymentMethod)?.em ?? "")
    // No telefone o título mora no centro da barra, entre o ⋯ e o ✕ (a barra das folhas do iOS): o destino
    // desce para a descrição, senão "2 lançamentos em Outro" cortava.
    const destinoNaDescricao = celular && imp.passo === "conferir" && Boolean(nomeDoDestino)
    const titulo = subtela
        ? "Ajustar colunas"
        : imp.passo === "conferir" && nomeDoDestino
          ? destinoNaDescricao
              ? lancamentos(imp.resumo.total)
              : `${lancamentos(imp.resumo.total)} ${nomeDoDestino}`
          : "Importar extrato"
    const periodo = imp.resumo.periodo
    // No telefone as ações da conferência moram no ⋯ do cabeçalho, ao lado do ✕; as abas ficam com a linha delas.
    const comMenu = celular && imp.passo === "conferir"
    const travadoAoImportar = imp.pendente === "importar"

    const tituloEDescricao = (
        <>
            <DialogTitle className="relative">
                {/* Um título só para o leitor: o que sai da cena é decoração. */}
                <span aria-hidden="true">
                    <TrocaSuave forma="texto" chave={titulo}>{titulo}</TrocaSuave>
                </span>
                <span className="sr-only">{titulo}</span>
            </DialogTitle>
            {/* A descrição fica só para o leitor de tela no passo Arquivo (a área de soltar já diz "CSV ou OFX") e,
                no telefone, nas Colunas: lá a frase é o título da seção da lista (`ConferirLeitura`). */}
            <DialogDescription
                className={imp.passo === "arquivo" || (celular && imp.passo === "colunas") ? "sr-only" : undefined}
            >
                {imp.passo === "feito"
                    ? "Os lançamentos já estão na lista."
                    : imp.passo === "conferir"
                      ? (
                        <>
                            {destinoNaDescricao ? `${nomeDoDestino[0].toUpperCase()}${nomeDoDestino.slice(1)}${periodo ? `, de ${periodoPtBr(periodo)}` : ""}. ` : periodo ? `De ${periodoPtBr(periodo)}. ` : ""}
                            {/* No telefone a gaveta guarda a linha para a lista; o "Vão entrar" já diz o que conta. */}
                            <span className="hidden md:inline">Desmarque o que não quer trazer.</span>
                        </>
                    )
                      : imp.passo === "colunas"
                        ? "Diga o que é cada coluna do arquivo."
                        : "CSV ou OFX do seu banco, ou uma planilha sua."}
            </DialogDescription>
        </>
    )

    function enviar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (imp.passo === "arquivo") return imp.continuar()
        if (imp.passo === "colunas") return subtela ? trocarDeTela("volta", imp.lerColunas) : imp.lerColunas()
        if (imp.passo === "conferir") return imp.importar()
    }

    // O corpo inteiro recebe o arquivo, e o `dragover` impedido sempre: sem ele o navegador abre o arquivo no lugar da página.
    function arrastando(e: React.DragEvent) {
        e.preventDefault()
        if (imp.passo === "arquivo" && !travado) setSobre(true)
    }

    function soltar(e: React.DragEvent) {
        e.preventDefault()
        setSobre(false)
        if (imp.passo !== "arquivo" || travado) return
        const arquivos = e.dataTransfer.files
        const f = arquivos?.[0]
        if (!f) return
        imp.escolherArquivo(f)
        setVariosArquivos(arquivos.length > 1)
    }

    return (
        <Dialog
            surface="auto"
            open={open}
            onOpenChange={mudarAberto}
            pending={gravando}
            dirty={imp.dirty}
            confirmDiscard
        >
            <DialogContent
                size={expandido ? "full" : imp.passo === "conferir" ? "xl" : "lg"}
                layout={expandido ? "fixed" : "auto"}
                // Com o ⋯, o ✕ desce à linha do título, ao lado dele (como no painel de notificações).
                showCloseButton={!comMenu}
            >
                <Form layout="none" data-subtela-conteudo="" onSubmit={enviar} className={expandido ? "flex min-h-0 min-w-0 flex-1 flex-col" : "min-w-0"}>
                    <DialogHeader>
                        {comMenu ? (
                            <DialogHeaderRow endAdornment={
                                <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="tertiary"
                                            size="icon-md"
                                            className="relative"
                                            aria-label={pendenciaLigada(imp) ? "Mais ações, filtro ligado" : "Mais ações"}
                                            disabled={travadoAoImportar}
                                        >
                                            <EllipsisHorizontalIcon />
                                            {/* A bolha do sino das notificações (`top-bar-action-count`) sem o número: mesma cor, anel e entrada na mola, e menor (8px), no contorno do botão a 45° (centro a 22px do centro do círculo de 44), metade dentro e metade fora, porque não carrega número. */}
                                            {pendenciaLigada(imp) ? (
                                                <span
                                                    aria-hidden
                                                    className={cn(
                                                        "pointer-events-none absolute top-0.5 right-0.5 z-10 size-2 rounded-full ring-2 ring-background",
                                                        tagChipUnreadCount,
                                                        "transition-[scale,opacity] duration-(--duration-spring) ease-(--ease-spring) starting:scale-30 starting:opacity-0"
                                                    )}
                                                />
                                            ) : null}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        onCloseAutoFocus={conf.focoAoFecharMenu}
                                        // O menu cabe na tela: o teto de 384 do toque o fazia rolar por 2px. Quem limita é a altura disponível (o recurso do `panel`).
                                        className="[--menu-max-h:100dvh] pointer-coarse:[--menu-max-h:100dvh]"
                                    >
                                        <DropdownMenuItem onSelect={conf.abrirBusca}>
                                            <MagnifyingGlassIcon />
                                            Buscar
                                        </DropdownMenuItem>
                                        {/* O jeito de ler o arquivo só existe no CSV: o OFX já diz o sinal e as colunas. */}
                                        {imp.csv ? (
                                            <>
                                                <DropdownMenuItem disabled={imp.pendente === "lendo"} onSelect={() => void imp.inverterSinal()}>
                                                    <ArrowsRightLeftIcon />
                                                    Inverter sinal
                                                </DropdownMenuItem>
                                                {/* Ajustar no meio da releitura deixaria a resposta cair no passo trocado: espera, como o Inverter. */}
                                                <DropdownMenuItem disabled={imp.pendente === "lendo"} onSelect={() => trocarDeTela("entra", imp.ajustarColunas)}>
                                                    <TableCellsIcon />
                                                    Ajustar colunas
                                                </DropdownMenuItem>
                                            </>
                                        ) : null}
                                        {/* As pendências filtram por aqui no telefone: as três abas de tipo ficam sozinhas na linha. */}
                                        <PendenciasNoMenu imp={imp} travado={travadoAoImportar} />
                                        <DropdownMenuSeparator />
                                        {/* As visíveis são as da aba e da busca, como no Ações do desktop. */}
                                        <ItensDasVisiveis
                                            imp={imp}
                                            itens={pelaBusca(imp.visiveis, conf.busca)}
                                            onPorCategoria={conf.setPorCategoria}
                                        />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DialogCloseButton placement="inline" />
                                </>
                            }>
                                {tituloEDescricao}
                            </DialogHeaderRow>
                        ) : (
                            tituloEDescricao
                        )}
                        {/* No telefone não há barra de passos (dono, 17/11/2026): o título diz o passo, e o ‹ do canto, que dá para voltar. */}
                        {imp.passo === "feito" || expandido || subtela || celular ? null : (
                            // Esmaece junto com a conferência no Ver todos, em vez de sumir seca e puxar tudo para cima.
                            <DialogSteps
                                current={atual}
                                total={passos.length}
                                labels={passos}
                                className={PASSOS_ACOMPANHAM}
                            />
                        )}
                        {/* No telefone o filtro da conferência fica fixo no topo: o cabeçalho não rola, e o corpo
                            começa abaixo dele pela altura medida (`--dialog-header-h`), também com a busca aberta. */}
                        {comMenu ? <FiltrosDaConferencia imp={imp} conf={conf} travado={travadoAoImportar} /> : null}
                    </DialogHeader>
                    <DialogBody
                        // Na tela cheia do desktop o corpo não rola: quem rola é o viewport da tabela, com as abas e o cabeçalho parados.
                        // No telefone as abas moram no cabeçalho: o respiro dele (16) já separa a legenda, e o do topo do corpo dobraria o vão.
                        // Na subtela também: o respiro do cabeçalho (16) já separa o subtítulo da lista das colunas.
                        className={cn(expandido && "md:flex md:flex-col md:overflow-hidden", (comMenu || subtela) && "[--dialog-body-pt:0px]")}
                        onDragOver={arrastando}
                        onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSobre(false)
                        }}
                        onDrop={soltar}
                    >
                        {/* O passo novo chega em escada enquanto a caixa anda: cada passo leva a escada na própria raiz. */}
                        {imp.passo === "arquivo" ? (
                            <div key="arquivo" className={cn(ESCADA, "flex flex-col gap-4")}>
                                <Input
                                    ref={entrada}
                                    type="file"
                                    className="hidden"
                                    aria-label="Arquivo do extrato ou da planilha"
                                    accept=".csv,.ofx"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null
                                        // Limpo, o mesmo arquivo pode ser escolhido de novo.
                                        e.target.value = ""
                                        setVariosArquivos(false)
                                        imp.escolherArquivo(f)
                                    }}
                                />
                                {/* A área e o arquivo escolhido trocam de lugar no desfoque e na mola
                                    (a troca do sistema); o diálogo acompanha a altura. */}
                                <div className="relative">
                                    <TrocaSuave chave={imp.arquivo ? "arquivo" : "vazio"} className="block">
                                        {imp.arquivo ? (
                                    <div className="flex flex-col gap-2">
                                        <Item
                                            variant="outline"
                                            data-dragging={sobre || undefined}
                                            className="data-dragging:ring-3 data-dragging:ring-ring/45"
                                        >
                                            {/* O ladrilho redondo, o mesmo poço do ícone da área de soltar. */}
                                            <ItemMedia variant="tile" tone="neutral">
                                                <DocumentTextIcon aria-hidden />
                                            </ItemMedia>
                                            <ItemContent>
                                                <ItemTitle>{imp.arquivo.name}</ItemTitle>
                                                <ItemDescription>
                                                    {tamanho(imp.arquivo.size)}
                                                    {imp.arquivoLido ? ` · ${lancamentos(imp.arquivoLido.total)}` : ""}
                                                    {imp.arquivoLido?.periodo
                                                        ? ` · ${periodoPtBr(imp.arquivoLido.periodo)}`
                                                        : ""}
                                                </ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Button
                                                    type="button"
                                                    variant="tertiary"
                                                    size="icon-sm"
                                                    aria-label="Trocar arquivo"
                                                    disabled={travado}
                                                    onClick={() => imp.escolherArquivo(null)}
                                                >
                                                    <XMarkIcon />
                                                </Button>
                                            </ItemActions>
                                        </Item>
                                        {imp.deducao?.certa ? (
                                            <Caption className="flex items-center gap-1">
                                                <CheckIcon className="size-4 shrink-0 text-success" />
                                                Colunas reconhecidas: Data, Descrição, Valor
                                                {imp.deducao.mapa.categoria != null ? ", Categoria" : ""}.
                                                {/* O sinal depende do destino: só aparece com ele, na mesma linha (a altura não muda). */}
                                                {imp.destino ? ` Gasto é ${imp.deducao.negativoEhDespesa ? "negativo" : "positivo"}.` : null}
                                            </Caption>
                                        ) : null}
                                    </div>
                                        ) : (
                                            <EmptyState
                                                variant="dashed"
                                                size="sm"
                                                data-dragging={sobre || undefined}
                                                className="group/soltar transition-[border-color,background-color,box-shadow] duration-(--duration-base) ease-(--ease-out) data-dragging:border-solid data-dragging:border-ring data-dragging:bg-muted/40 data-dragging:ring-3 data-dragging:ring-ring/45"
                                            >
                                                {/* Arrastando, o ícone sobe um passo na mola e o título troca. */}
                                                <EmptyStateIcon className="transition-transform duration-(--duration-spring) ease-(--ease-spring) group-data-dragging/soltar:-translate-y-1">
                                                    <ArrowUpTrayIcon aria-hidden />
                                                </EmptyStateIcon>
                                                <EmptyStateTitle className="relative">
                                                    <TrocaSuave chave={sobre ? "soltar" : "arrastar"} className="block">
                                                        {sobre ? (
                                                            "Solte para ler o extrato"
                                                        ) : (
                                                            <>
                                                                <span className="pointer-coarse:hidden">Arraste o extrato para cá</span>
                                                                <span className="hidden pointer-coarse:inline">Escolha o extrato</span>
                                                            </>
                                                        )}
                                                    </TrocaSuave>
                                                </EmptyStateTitle>
                                                <EmptyStateDescription>
                                                    CSV ou OFX, exportado do app ou do site do banco
                                                </EmptyStateDescription>
                                                {/* Arrastando, o botão esmaece mas guarda o lugar: a área não muda de altura. */}
                                                <EmptyStateActions className="transition-opacity duration-(--duration-fast) group-data-dragging/soltar:opacity-0">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        disabled={travado}
                                                        onClick={() => entrada.current?.click()}
                                                    >
                                                        escolher arquivo
                                                    </Button>
                                                </EmptyStateActions>
                                            </EmptyState>
                                        )}
                                    </TrocaSuave>
                                </div>
                                {variosArquivos ? <Caption>Só um arquivo por vez; usamos o primeiro.</Caption> : null}
                                <FormField label="Para onde vão">
                                    <Select
                                        disabled={travado}
                                        value={valorDoDestino(imp.destino)}
                                        onValueChange={(v) => imp.setDestino(destinoDoValor(v))}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha o cartão ou a conta" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {cartoes.length > 0 ? (
                                                <SelectGroup>
                                                    <SelectLabel>Cartões</SelectLabel>
                                                    {cartoes.map((c) => (
                                                        <SelectItem key={c.id} value={`cartao:${c.id}`}>
                                                            {c.name} · •••• {c.last_four}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ) : null}
                                            <SelectGroup>
                                                <SelectLabel>Contas</SelectLabel>
                                                {CONTAS.map((c) => (
                                                    <SelectItem key={c.forma} value={`conta:${c.forma}`}>
                                                        {c.rotulo}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            </div>
                        ) : imp.passo === "colunas" && imp.csv && celular ? (
                            <ConferirLeitura
                                linhas={imp.csv}
                                valor={imp.mapeamento}
                                onChange={imp.setMapeamento}
                                disabled={travado}
                            />
                        ) : imp.passo === "colunas" && imp.csv ? (
                            <MapearColunas
                                linhas={imp.csv}
                                valor={imp.mapeamento}
                                onChange={imp.setMapeamento}
                                disabled={travado}
                            />
                        ) : imp.passo === "conferir" ? (
                            // Só o esmaecer da chegada: a lista e a tabela já descem em escada por dentro.
                            <div key="conferir" className={cn(ESMAECE_AO_CHEGAR, expandido && "md:flex md:min-h-0 md:flex-1 md:flex-col")}>
                                <ConferirImportacao imp={imp} conf={conf} travado={travadoAoImportar} />
                            </div>
                        ) : imp.passo === "feito" && feito ? (
                            <EmptyState key="feito" variant="plain" className={ESCADA}>
                                <EmptyStateIcon variant="done" />
                                <EmptyStateTitle>
                                    {feito.importados === 1
                                        ? "1 lançamento importado"
                                        : `${lancamentos(feito.importados)} importados`}
                                </EmptyStateTitle>
                                <EmptyStateDescription>
                                    {[
                                        feito.jaExistiam > 0 &&
                                            `${numberBR(feito.jaExistiam)} ${feito.jaExistiam === 1 ? "ficou de fora porque já existia" : "ficaram de fora porque já existiam"}.`,
                                        feito.deixadas > 0 &&
                                            `${numberBR(feito.deixadas)} ${feito.deixadas === 1 ? "ficou de fora" : "ficaram de fora"}.`,
                                        feito.ignoradas > 0 && `${rotuloDasIgnoradas(feito.ignoradas)}.`,
                                        feito.semCategoria > 0
                                            ? `${numberBR(feito.semCategoria)} sem categoria, marcados a conferir.`
                                            : "Todos estão marcados a conferir.",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                </EmptyStateDescription>
                                <EmptyStateActions>
                                    <AlertDialog
                                        open={perguntando}
                                        onOpenChange={setPerguntando}
                                        pending={imp.pendente === "desfazer"}
                                    >
                                        <AlertDialogTrigger asChild>
                                            <Button type="button" variant="tertiary">
                                                Desfazer importação
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Desfazer a importação?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {feito.importados === 1
                                                        ? "O lançamento que entrou é apagado."
                                                        : `Os ${lancamentos(feito.importados)} que entraram são apagados.`}{" "}
                                                    Não dá para desfazer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            {imp.erro ? <AlertDialogError>{imp.erro}</AlertDialogError> : null}
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        void imp.desfazer().then((ok) => ok && setPerguntando(false))
                                                    }}
                                                >
                                                    Apagar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => {
                                            onRevisar({ semCategoria: feito.semCategoria > 0 })
                                            mudarAberto(false)
                                        }}
                                    >
                                        {feito.semCategoria === 1
                                            ? "Ver o 1 sem categoria"
                                            : feito.semCategoria > 0
                                              ? `Ver os ${numberBR(feito.semCategoria)} sem categoria`
                                              : "Revisar agora"}
                                    </Button>
                                </EmptyStateActions>
                            </EmptyState>
                        ) : null}
                        {imp.passo !== "feito" ? <FormError>{imp.erro}</FormError> : null}
                    </DialogBody>
                    {imp.passo === "feito" ? null : (
                        <DialogFooter>
                            {/* Quantas entram fica à esquerda, na linha dos botões; no telefone sobe para cima deles.
                                Dentro do rodapé (e não no `start`): o par Voltar e Importar mantém os dois pesos. */}
                            
                            {subtela ? null : imp.passo === "arquivo" ? (
                                <DialogClose asChild>
                                    <FormCancel>Cancelar</FormCancel>
                                </DialogClose>
                            ) : (
                                <FormCancel onClick={imp.voltar} disabled={travado}>
                                    Voltar
                                </FormCancel>
                            )}
                            <FormSubmit
                                disabled={
                                    imp.passo === "arquivo"
                                        ? !imp.arquivo || !imp.destino
                                        : imp.passo === "conferir" && !imp.resumo.entram
                                }
                            >
                                {imp.passo === "conferir" ? `Importar ${lancamentos(imp.resumo.entram)}` : subtela ? "Pronto" : "Continuar"}
                            </FormSubmit>
                            {/* No telefone o Total fica parado acima do botão, nas duas vistas: com o
                                `flex-col-reverse` do rodapé, o último filho sobe para cima dos botões. */}
                            {celular && imp.passo === "conferir" ? (
                                <div role="status" aria-busy={imp.pendente === "lendo"} className="sm:order-first sm:me-auto sm:flex-1">
                                    <ResumoDoSaldo imp={imp} rotulo="Total" />
                                </div>
                            ) : null}
                        </DialogFooter>
                    )}
                </Form>
                {/* O ‹ é o espelho do ✕: o mesmo canto (`top-2.5`, acima do cabeçalho translúcido), do lado esquerdo. No telefone ele aparece em todo passo que tinha o Voltar no rodapé (o `FormCancel` some lá); a subtela sempre o tem. */}
                {voltarNoTopo ? (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-md"
                        aria-label={subtela ? "Voltar à conferência" : "Voltar"}
                        disabled={travado}
                        className="absolute top-2.5 left-2.5 z-20"
                        onClick={() => (subtela ? trocarDeTela("volta", imp.voltar) : imp.voltar())}
                    >
                        <ChevronLeftIcon />
                    </Button>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
