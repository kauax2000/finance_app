"use client"

import { useRef, useState } from "react"
import { CheckIcon, DocumentTextIcon, XMarkIcon } from "@heroicons/react/16/solid"

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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogSteps,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { numberBR } from "@/lib/formatters"
import type { DestinoImportacao } from "@/lib/import/importar"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { formatYmdPtBr } from "@/lib/transaction-date"

import { ConferirImportacao } from "./conferir-importacao"
import { MapearColunas } from "./mapear-colunas"
import { useImportarExtrato } from "./use-importar-extrato"

const CONTAS = [
    { forma: "pix", rotulo: "Pix" },
    { forma: "debit_card", rotulo: "Débito" },
    { forma: "other", rotulo: "Outro" },
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
    const entrada = useRef<HTMLInputElement>(null)

    function mudarAberto(aberto: boolean) {
        if (!aberto) {
            imp.reiniciar()
            setPerguntando(false)
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
    const nomeDoDestino = cartao ? `o ${cartao.name}` : (CONTAS.find((c) => d?.tipo === "conta" && c.forma === d.paymentMethod)?.rotulo ?? "")
    const periodo = imp.resumo.periodo

    function enviar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (imp.passo === "arquivo") return imp.continuar()
        if (imp.passo === "colunas") return imp.lerColunas()
        if (imp.passo === "conferir") return imp.importar()
    }

    function soltar(e: React.DragEvent) {
        e.preventDefault()
        if (travado) return
        const f = e.dataTransfer.files?.[0]
        if (f) imp.escolherArquivo(f)
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
            <DialogContent size={expandido ? "full" : "lg"} layout={expandido ? "fixed" : "auto"}>
                <Form layout="none" onSubmit={enviar} className={expandido ? "flex min-h-0 min-w-0 flex-1 flex-col" : "min-w-0"}>
                    <DialogHeader>
                        <DialogTitle>
                            {imp.passo === "conferir" && nomeDoDestino
                                ? `${lancamentos(imp.resumo.total)} para ${nomeDoDestino}`
                                : "Importar extrato"}
                        </DialogTitle>
                        <DialogDescription>
                            {imp.passo === "feito"
                                ? "Os lançamentos já estão na lista."
                                : imp.passo === "conferir"
                                  ? `${periodo ? `De ${formatYmdPtBr(periodo.de)} a ${formatYmdPtBr(periodo.ate)}. ` : ""}Desmarque o que não quer trazer.`
                                  : imp.passo === "colunas"
                                    ? "Diga o que é cada coluna do arquivo."
                                    : "CSV ou OFX do seu banco, ou uma planilha sua."}
                        </DialogDescription>
                        {imp.passo === "feito" || expandido ? null : (
                            <DialogSteps current={atual} total={passos.length} labels={passos} />
                        )}
                    </DialogHeader>
                    <DialogBody>
                        {imp.passo === "arquivo" ? (
                            <div className="flex flex-col gap-4">
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
                                        imp.escolherArquivo(f)
                                    }}
                                />
                                {imp.arquivo ? (
                                    <div className="flex flex-col gap-2">
                                        <Item variant="outline">
                                            <ItemMedia>
                                                <DocumentTextIcon />
                                            </ItemMedia>
                                            <ItemContent>
                                                <ItemTitle>{imp.arquivo.name}</ItemTitle>
                                                <ItemDescription>
                                                    {tamanho(imp.arquivo.size)}
                                                    {imp.csv
                                                        ? ` · ${lancamentos(Math.max(0, imp.csv.length - (imp.mapeamento.temCabecalho ? 1 : 0)))}`
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
                                                {imp.deducao.mapa.categoria != null ? ", Categoria" : ""}. Gasto é{" "}
                                                {imp.deducao.negativoEhDespesa ? "negativo" : "positivo"}.
                                            </Caption>
                                        ) : null}
                                    </div>
                                ) : (
                                    <Card
                                        variant="dashed"
                                        className="items-center text-center"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={soltar}
                                    >
                                        <p className="font-medium text-foreground">Arraste o arquivo aqui</p>
                                        <p>
                                            ou{" "}
                                            <Button
                                                type="button"
                                                variant="link"
                                                disabled={travado}
                                                onClick={() => entrada.current?.click()}
                                            >
                                                <span>escolha no computador</span>
                                            </Button>{" "}
                                            · CSV ou OFX
                                        </p>
                                    </Card>
                                )}
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
                        ) : imp.passo === "colunas" && imp.csv ? (
                            <MapearColunas
                                linhas={imp.csv}
                                valor={imp.mapeamento}
                                onChange={imp.setMapeamento}
                                disabled={travado}
                            />
                        ) : imp.passo === "conferir" ? (
                            <ConferirImportacao imp={imp} />
                        ) : imp.passo === "feito" && feito ? (
                            <EmptyState variant="plain">
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
                                        {feito.semCategoria > 0
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
                            {imp.passo === "arquivo" ? (
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
                                {imp.passo === "conferir" ? `Importar ${lancamentos(imp.resumo.entram)}` : "Continuar"}
                            </FormSubmit>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    )
}
