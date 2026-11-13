"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { DocumentIcon, EllipsisHorizontalIcon, PaperClipIcon, PhotoIcon, PlusIcon } from "@heroicons/react/16/solid"

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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardMessage } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState, EmptyStateDescription, EmptyStateIcon } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { PageSection, PageSectionHeader, PageSectionSkeleton, PageSectionTitle } from "@/components/ui/page-section"
import { Spinner } from "@/components/ui/spinner"
import {
    abrirAnexo,
    apagarAnexo,
    descricaoDoAnexo,
    enviarAnexo,
    podeApagarAnexo,
    tamanhoDoAnexo,
    type VinculoAnexo,
} from "@/lib/anexos"
import { anexosDoLancamento } from "@/lib/bills/anexos-da-conta"
import { supabase, type Attachment, type Transaction } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"

/**
 * Nota, recibo ou boleto do lançamento (spec §9.4), privados e abertos por URL
 * assinada. O boleto da conta que este lançamento pagou aparece junto, só para
 * ler: é anexo da instância (`podeApagarAnexo`).
 */
export function AnexosDoLancamento({ transaction: t }: { transaction: Pick<Transaction, "id" | "workspace_id"> }) {
    const workspaceId = t.workspace_id
    const vinculo: VinculoAnexo = { transactionId: t.id }
    const lista = useQuery({
        // A mesma chave do wireframe de anexos: quem invalida um, invalida o outro.
        queryKey: ["attachments", workspaceId, vinculo, "custom"],
        queryFn: () => anexosDoLancamento(supabase, t.id),
    })
    const input = React.useRef<HTMLInputElement>(null)
    const [enviando, setEnviando] = React.useState(false)
    const [erro, setErro] = React.useState<string | null>(null)
    /** A URL assinada que o popup bloqueado não abriu: vira um link para tocar. */
    const [link, setLink] = React.useState<string | null>(null)
    const [apagando, setApagando] = React.useState<Attachment | null>(null)
    const [apagandoPendente, setApagandoPendente] = React.useState(false)
    const [erroDoApagar, setErroDoApagar] = React.useState<string | null>(null)

    async function enviar(arquivo: File | undefined) {
        if (!arquivo || !workspaceId) return
        setEnviando(true)
        setErro(null)
        const r = await enviarAnexo(supabase, { workspaceId }, arquivo, vinculo)
        setEnviando(false)
        if (!r.ok) return setErro(r.erro)
        await lista.refetch()
    }

    async function abrir(anexo: Attachment) {
        setErro(null)
        setLink(null)
        const r = await abrirAnexo(supabase, anexo.path)
        if (r.estado === "erro") setErro("Não foi possível abrir o anexo.")
        if (r.estado === "bloqueada") setLink(r.url)
    }

    async function apagar() {
        if (!apagando) return
        setApagandoPendente(true)
        setErroDoApagar(null)
        const r = await apagarAnexo(supabase, apagando)
        setApagandoPendente(false)
        if (!r.ok) return setErroDoApagar(r.erro)
        setApagando(null)
        await lista.refetch()
    }

    if (!workspaceId) return null
    if (lista.isPending) return <PageSectionSkeleton size="sm" actions />
    const anexos = lista.data ?? []

    return (
        <PageSection size="sm">
            <PageSectionHeader
                actions={
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={enviando}
                        aria-busy={enviando || undefined}
                        onClick={() => input.current?.click()}
                    >
                        {enviando ? <Spinner /> : <PlusIcon aria-hidden />}
                        Adicionar
                    </Button>
                }
            >
                <PageSectionTitle icon={<PaperClipIcon />}>Anexos</PageSectionTitle>
            </PageSectionHeader>
            <Input
                ref={input}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                aria-label="Anexar foto ou PDF (até 10 MB)"
                onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    e.target.value = ""
                    void enviar(arquivo)
                }}
            />

            {lista.isError ? (
                <Card padding="none">
                    <CardMessage tone="destructive">Não foi possível listar os anexos.</CardMessage>
                </Card>
            ) : anexos.length === 0 ? (
                <EmptyState size="sm" layout="inline">
                    <EmptyStateIcon>
                        <PaperClipIcon aria-hidden />
                    </EmptyStateIcon>
                    <EmptyStateDescription>Sem anexos. Guarde o recibo ou o boleto aqui.</EmptyStateDescription>
                </EmptyState>
            ) : (
                <Card padding="none">
                    <ItemGroup variant="divided">
                        {anexos.map((a) => {
                            const pdf = a.mime === "application/pdf"
                            const boleto = !podeApagarAnexo(a, vinculo)
                            return (
                                <Item key={a.id} variant="flush">
                                    <ItemMedia variant="tile">{pdf ? <DocumentIcon aria-hidden /> : <PhotoIcon aria-hidden />}</ItemMedia>
                                    <ItemContent className="min-w-0">
                                        <ItemTitle className="truncate">
                                            {pdf ? "PDF" : "Foto"}
                                            {boleto ? <Badge>Boleto da conta</Badge> : null}
                                        </ItemTitle>
                                        <ItemDescription className="truncate">
                                            {tamanhoDoAnexo(a.size_bytes)} · {formatDatePtBr(a.created_at)}
                                        </ItemDescription>
                                    </ItemContent>
                                    <ItemActions>
                                        <Button
                                            type="button"
                                            variant="tertiary"
                                            aria-label={`Abrir ${descricaoDoAnexo(a)}`}
                                            onClick={() => void abrir(a)}
                                        >
                                            Abrir
                                        </Button>
                                        {boleto ? null : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="tertiary"
                                                        size="icon-md"
                                                        aria-label={`Mais opções para ${descricaoDoAnexo(a)}`}
                                                    >
                                                        <EllipsisHorizontalIcon aria-hidden />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() => {
                                                            setErroDoApagar(null)
                                                            setApagando(a)
                                                        }}
                                                    >
                                                        Apagar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </ItemActions>
                                </Item>
                            )
                        })}
                    </ItemGroup>
                </Card>
            )}

            {/* A região existe antes do link, para o leitor de tela anunciar quando ele chega. */}
            <div aria-live="polite">
                {link ? (
                    <Button variant="link" asChild>
                        <a href={link} target="_blank" rel="noopener" onClick={() => setLink(null)}>
                            Abrir anexo
                        </a>
                    </Button>
                ) : null}
            </div>
            {erro ? (
                <Card padding="none">
                    <CardMessage tone="destructive">{erro}</CardMessage>
                </Card>
            ) : null}

            <AlertDialog
                open={apagando != null}
                onOpenChange={(aberto) => {
                    if (!aberto) setApagando(null)
                }}
                pending={apagandoPendente}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apagar este anexo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {apagando ? descricaoDoAnexo(apagando) : null}. Não dá para desfazer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {erroDoApagar ? <AlertDialogError>{erroDoApagar}</AlertDialogError> : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                void apagar()
                            }}
                        >
                            Apagar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageSection>
    )
}
