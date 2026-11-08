"use client"

import { DocumentTextIcon } from "@heroicons/react/16/solid"
import { useRef, useState } from "react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
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
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Caption } from "@/components/ui/typography"
import { numberBR } from "@/lib/formatters"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { formatYmdPtBr } from "@/lib/transaction-date"

import { MapearColunas } from "./mapear-colunas"
import { tipoDoArquivo, useImportarExtrato, type ModoImportacao } from "./use-importar-extrato"

const CONTAS = [
    { forma: "pix", rotulo: "Pix" },
    { forma: "debit_card", rotulo: "Débito" },
    { forma: "other", rotulo: "Outro" },
] as const

const lancamentos = (n: number) => `${numberBR(n)} ${n === 1 ? "lançamento" : "lançamentos"}`
const tamanho = (bytes: number) => `${numberBR(Math.max(1, Math.round(bytes / 1024)))} KB`

/**
 * Importar extrato do banco ou planilha em passos (spec §9.2): arquivo e
 * destino, colunas (só CSV), conferir e o fim. O lote é preparado uma vez no
 * `useImportarExtrato`: repetir "Importar" não duplica.
 */
export function ImportarExtratoDialog({
    open,
    onOpenChange,
    onRevisar,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** "Revisar agora": quem chama aplica o filtro `conferir`; o diálogo fecha sozinho. */
    onRevisar: () => void
}) {
    const { currentWorkspaceId } = useWorkspace()
    const cartoes = useCreditCardsQuery(currentWorkspaceId).data ?? []
    const imp = useImportarExtrato({ workspaceId: currentWorkspaceId })
    const [tipoDestino, setTipoDestino] = useState<"cartao" | "conta" | "">("")
    const [perguntando, setPerguntando] = useState(false)
    const entrada = useRef<HTMLInputElement>(null)

    function mudarAberto(aberto: boolean) {
        if (!aberto) {
            imp.reiniciar()
            setTipoDestino("")
            setPerguntando(false)
        }
        onOpenChange(aberto)
    }

    const ehOfx = imp.arquivo ? tipoDoArquivo(imp.arquivo.name, imp.modo) === "ofx" : false
    const passos = ehOfx ? ["Arquivo", "Conferir"] : ["Arquivo", "Colunas", "Conferir"]
    const atual = Math.max(0, passos.indexOf({ arquivo: "Arquivo", colunas: "Colunas", conferir: "Conferir", feito: "" }[imp.passo]))
    const previa = imp.previa
    const gravando = imp.pendente === "importar" || imp.pendente === "desfazer"
    // Lendo ou gravando, nada do passo muda: a resposta cairia num estado trocado.
    const travado = imp.pendente != null

    function enviar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (imp.passo === "arquivo") return imp.continuar()
        if (imp.passo === "colunas") return imp.lerColunas()
        if (imp.passo === "conferir") return imp.importar()
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
            <DialogContent size="lg">
                <Form layout="none" onSubmit={enviar}>
                    <DialogHeader>
                        <DialogTitle>Importar extrato</DialogTitle>
                        <DialogDescription>
                            {imp.passo === "feito"
                                ? "Os lançamentos já estão na lista."
                                : "Do banco ou da sua planilha, para um cartão ou uma conta."}
                        </DialogDescription>
                        {imp.passo === "feito" ? null : (
                            <DialogSteps current={atual} total={passos.length} labels={passos} />
                        )}
                    </DialogHeader>
                    <DialogBody>
                        {imp.passo === "arquivo" ? (
                            <div className="flex flex-col gap-4">
                                <Tabs value={imp.modo} onValueChange={(m) => imp.setModo(m as ModoImportacao)}>
                                    <TabsList aria-label="O que é o arquivo">
                                        <TabsTrigger value="extrato" disabled={travado}>Extrato do banco (CSV ou OFX)</TabsTrigger>
                                        <TabsTrigger value="planilha" disabled={travado}>Planilha (CSV)</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <div className="flex flex-col gap-2">
                                    <Input
                                        ref={entrada}
                                        type="file"
                                        className="hidden"
                                        aria-label="Arquivo do extrato ou da planilha"
                                        accept={imp.modo === "planilha" ? ".csv" : ".csv,.ofx"}
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] ?? null
                                            // Limpo, o mesmo arquivo pode ser escolhido de novo.
                                            e.target.value = ""
                                            imp.escolherArquivo(f)
                                        }}
                                    />
                                    {imp.arquivo ? (
                                        <Item variant="outline">
                                            <ItemMedia>
                                                <DocumentTextIcon />
                                            </ItemMedia>
                                            <ItemContent>
                                                <ItemTitle>{imp.arquivo.name}</ItemTitle>
                                                <ItemDescription>{tamanho(imp.arquivo.size)}</ItemDescription>
                                            </ItemContent>
                                        </Item>
                                    ) : null}
                                    <div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={travado}
                                            onClick={() => entrada.current?.click()}
                                        >
                                            {imp.arquivo ? "Trocar arquivo" : "Escolher arquivo"}
                                        </Button>
                                    </div>
                                </div>
                                <RadioGroup
                                    aria-label="Destino"
                                    variant="card"
                                    orientation="horizontal"
                                    disabled={travado}
                                    value={tipoDestino}
                                    onValueChange={(v) => {
                                        setTipoDestino(v as "cartao" | "conta")
                                        imp.setDestino(null)
                                    }}
                                >
                                    <RadioGroupItem value="cartao">Cartão de crédito</RadioGroupItem>
                                    <RadioGroupItem value="conta">Conta</RadioGroupItem>
                                </RadioGroup>
                                {tipoDestino === "cartao" ? (
                                    <FormField label="Cartão">
                                        <Select
                                            disabled={travado}
                                            value={imp.destino?.tipo === "cartao" ? imp.destino.cardId : ""}
                                            onValueChange={(cardId) => imp.setDestino({ tipo: "cartao", cardId })}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Escolha o cartão" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {cartoes.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name} · •••• {c.last_four}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                ) : tipoDestino === "conta" ? (
                                    <FormField label="Forma">
                                        <Select
                                            disabled={travado}
                                            value={imp.destino?.tipo === "conta" ? imp.destino.paymentMethod : ""}
                                            onValueChange={(v) =>
                                                imp.setDestino({
                                                    tipo: "conta",
                                                    paymentMethod: v as (typeof CONTAS)[number]["forma"],
                                                })
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Escolha a forma" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CONTAS.map((c) => (
                                                    <SelectItem key={c.forma} value={c.forma}>
                                                        {c.rotulo}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                ) : null}
                            </div>
                        ) : imp.passo === "colunas" && imp.csv ? (
                            <MapearColunas
                                linhas={imp.csv}
                                valor={imp.mapeamento}
                                onChange={imp.setMapeamento}
                                disabled={imp.pendente != null}
                            />
                        ) : imp.passo === "conferir" && previa ? (
                            <div className="flex flex-col gap-4">
                                <DescriptionList columns={3}>
                                    <DescriptionListItem>
                                        <DescriptionTerm>Lançamentos</DescriptionTerm>
                                        <DescriptionDetails>{numberBR(previa.total)}</DescriptionDetails>
                                    </DescriptionListItem>
                                    <DescriptionListItem>
                                        <DescriptionTerm>Período</DescriptionTerm>
                                        <DescriptionDetails>
                                            {previa.periodo
                                                ? `${formatYmdPtBr(previa.periodo.de)} a ${formatYmdPtBr(previa.periodo.ate)}`
                                                : "—"}
                                        </DescriptionDetails>
                                    </DescriptionListItem>
                                    <DescriptionListItem>
                                        <DescriptionTerm>Soma</DescriptionTerm>
                                        <DescriptionDetails>
                                            <MoneyDisplay value={previa.soma} signed />
                                        </DescriptionDetails>
                                    </DescriptionListItem>
                                </DescriptionList>
                                {previa.ignoradas > 0 ? (
                                    <Caption>
                                        {previa.ignoradas === 1
                                            ? "1 linha sem data ou valor ficou de fora."
                                            : `${numberBR(previa.ignoradas)} linhas sem data ou valor ficaram de fora.`}
                                    </Caption>
                                ) : null}
                                {previa.categoriasNovas.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        <Caption>Categorias novas, criadas ao importar:</Caption>
                                        <div className="flex flex-wrap gap-2">
                                            {previa.categoriasNovas.map((c) => (
                                                <Badge key={c.clientId} tone={c.tipo === "income" ? "income" : "expense"}>
                                                    {c.nome}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                <Table size="sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previa.itens.slice(0, 20).map((i) => (
                                            <TableRow key={i.clientId}>
                                                <TableCell>{formatYmdPtBr(i.data)}</TableCell>
                                                <TableCell>
                                                    {i.descricao}
                                                    {i.parcela ? ` (${i.parcela.k}/${i.parcela.n})` : ""}
                                                </TableCell>
                                                <TableCell>
                                                    {i.categoria ??
                                                        (i.categoryId && previa.nomeDaCategoria.get(i.categoryId)) ??
                                                        "Sem categoria"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <MoneyDisplay value={i.estorno ? i.valor : -i.valor} signed />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {previa.itens.length > 20 ? (
                                    <Caption>E mais {lancamentos(previa.itens.length - 20)}.</Caption>
                                ) : null}
                            </div>
                        ) : imp.passo === "feito" && previa ? (
                            <EmptyState variant="plain">
                                <EmptyStateIcon variant="done" />
                                <EmptyStateTitle>
                                    {previa.total === 1
                                        ? "1 lançamento importado, a conferir"
                                        : `${lancamentos(previa.total)} importados, todos a conferir`}
                                </EmptyStateTitle>
                                <EmptyStateDescription>
                                    Confira a categoria de cada um na lista.
                                </EmptyStateDescription>
                                <EmptyStateActions>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => {
                                            onRevisar()
                                            mudarAberto(false)
                                        }}
                                    >
                                        Revisar agora
                                    </Button>
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
                                                    {previa.total === 1
                                                        ? "O lançamento que entrou é apagado."
                                                        : `Os ${lancamentos(previa.total)} que entraram são apagados.`}{" "}
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
                                <FormCancel onClick={imp.voltar} disabled={imp.pendente != null}>
                                    Voltar
                                </FormCancel>
                            )}
                            <FormSubmit
                                disabled={
                                    imp.passo === "arquivo"
                                        ? !imp.arquivo || !imp.destino
                                        : imp.passo === "conferir" && !previa?.total
                                }
                            >
                                {imp.passo === "conferir" && previa
                                    ? `Importar ${lancamentos(previa.total)}`
                                    : "Continuar"}
                            </FormSubmit>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    )
}
