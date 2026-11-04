"use client"

import { DevicePhoneMobileIcon, EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/16/solid"
import { useState, type CSSProperties } from "react"

import { useAparelhosDeCaptura } from "@/components/account/aparelhos-de-captura"
import { ApplePayConvite } from "@/components/account/apple-pay-convite"
import { GuiaDoAtalho } from "@/components/account/guia-do-atalho"
import { JanelaDoAparelho, TELA_DA_NOTIFICACAO } from "@/components/account/passo-a-passo"
import { SettingsSection } from "@/components/settings/settings-section"
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
import { BadgeDot } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardMessage } from "@/components/ui/card"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CaptureToken } from "@/lib/supabase"
import { formatRelativeTimePtBr } from "@/lib/transaction-date"

const relativo = (iso: string) => {
    const s = formatRelativeTimePtBr(iso)
    return s.charAt(0).toLowerCase() + s.slice(1)
}

export const NOME_INVALIDO = "Nome do aparelho: de 1 a 60 caracteres."

/** O erro do banco (check, not null ou o `raise` das RPCs) na frase da tela. */
export function mensagemDoErroDeToken(erro: { code?: string; message?: string }): string {
    if (erro.code === "23514" || erro.code === "23502") return NOME_INVALIDO
    if (erro.message?.includes("nao_membro")) return "Você não é membro dessa carteira."
    if (erro.message?.includes("limite_tokens")) return "Limite de 10 aparelhos conectados. Desconecte um para conectar outro."
    return "Não foi possível concluir. Tente de novo."
}

/**
 * Lançar gastos pelo iPhone: os tokens de captura da pessoa (Atalho do iPhone,
 * Apple Pay e compartilhar). Só os ativos aparecem; o código novo vive no guia.
 */
export function AtalhoSecao() {
    const { workspaces } = useWorkspace()
    const lista = useAparelhosDeCaptura()
    const [guiaAberto, setGuiaAberto] = useState(false)
    const [alvo, setAlvo] = useState<CaptureToken | null>(null)
    const [revogando, setRevogando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const tokens = lista.ativos

    function fecharRevogar(aberto: boolean) {
        if (aberto) return
        setAlvo(null)
        setErro(null)
    }

    async function revogar() {
        if (!alvo) return
        setRevogando(true)
        setErro(null)
        const { error } = await supabase.rpc("revoke_capture_token", { p_id: alvo.id })
        setRevogando(false)
        if (error) return setErro(mensagemDoErroDeToken(error))
        setAlvo(null)
        await lista.refetch()
    }

    return (
        <SettingsSection
            titulo="Lançar gastos pelo iPhone"
            actions={
                lista.isError || tokens.length > 0 ? (
                    <Button type="button" variant="tertiary" onClick={() => setGuiaAberto(true)}>
                        <PlusIcon aria-hidden data-icon="inline-start" />
                        Conectar aparelho
                    </Button>
                ) : undefined
            }
        >
            <Card padding="none">
                {lista.isLoading ? (
                    <SkeletonGroup label="Carregando aparelhos…" delay>
                        <div className="flex flex-col gap-1 px-4 py-3">
                            <Skeleton className="h-4 w-40 max-w-full" />
                            <Skeleton className="h-3 w-56 max-w-full" />
                        </div>
                    </SkeletonGroup>
                ) : (
                    <ItemGroup variant="divided">
                        {lista.isError ? (
                            <CardMessage tone="destructive">Não foi possível listar os aparelhos.</CardMessage>
                        ) : tokens.length === 0 ? (
                            <EmptyState variant="plain" size="sm">
                                <JanelaDoAparelho tela={TELA_DA_NOTIFICACAO} tamanho="compacta" />
                                <EmptyStateTitle>Lance gastos falando com a Siri</EmptyStateTitle>
                                <EmptyStateDescription>
                                    Conecte o iPhone uma vez. Depois é só dizer “42 mercado” e o gasto entra sozinho.
                                </EmptyStateDescription>
                                <EmptyStateActions>
                                    <Button type="button" variant="primary" onClick={() => setGuiaAberto(true)}>
                                        Conectar o iPhone
                                    </Button>
                                </EmptyStateActions>
                            </EmptyState>
                        ) : (
                            tokens.map((t) => {
                                const carteira = workspaces.find((w) => w.id === t.workspace_id)
                                return (
                                    <Item key={t.id} variant="flush" size="lg" className="px-4">
                                        <ItemMedia variant="tile" className="rounded-row">
                                            <DevicePhoneMobileIcon aria-hidden />
                                        </ItemMedia>
                                        <ItemContent className="min-w-0">
                                            <ItemTitle className="truncate text-base">{t.name}</ItemTitle>
                                            <Muted asChild>
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                {carteira ? (
                                                    <BadgeDot
                                                        className="size-2"
                                                        style={{ "--badge-dot": carteira.icon_background_color } as CSSProperties}
                                                    />
                                                ) : null}
                                                <span className="truncate">
                                                    {carteira?.name ?? "Carteira"} ·{" "}
                                                    {t.last_used_at
                                                        ? `último gasto ${relativo(t.last_used_at)}`
                                                        : "ainda não lançou nada"}
                                                </span>
                                                </div>
                                            </Muted>
                                        </ItemContent>
                                        <ItemActions>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="tertiary"
                                                        size="icon-md"
                                                        aria-label={`Mais opções para ${t.name}`}
                                                    >
                                                        <EllipsisHorizontalIcon aria-hidden />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem variant="destructive" onSelect={() => setAlvo(t)}>
                                                        Desconectar…
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </ItemActions>
                                    </Item>
                                )
                            })
                        )}
                    </ItemGroup>
                )}
            </Card>

            {/* Com um aparelho conectado, o passo seguinte: lançar ao pagar com Apple Pay. */}
            {!lista.isError && tokens.length > 0 ? <ApplePayConvite /> : null}

            <GuiaDoAtalho open={guiaAberto} onOpenChange={setGuiaAberto} aoCriar={() => void lista.refetch()} />

            <AlertDialog pending={revogando} open={alvo != null} onOpenChange={fecharRevogar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar este aparelho?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alvo ? `"${alvo.name}" para de lançar gastos. Para usar de novo, conecte outra vez.` : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {erro ? <AlertDialogError>{erro}</AlertDialogError> : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Desconectando…"
                            onClick={(e) => {
                                e.preventDefault()
                                void revogar()
                            }}
                        >
                            Desconectar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SettingsSection>
    )
}
