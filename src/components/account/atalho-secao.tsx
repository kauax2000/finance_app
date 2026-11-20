"use client"

import {
    ArrowDownTrayIcon,
    CursorArrowRippleIcon,
    EllipsisHorizontalIcon,
    LinkSlashIcon,
    MicrophoneIcon,
    PlusIcon,
    WalletIcon,
} from "@heroicons/react/16/solid"
import { useState, type CSSProperties } from "react"

import { useAparelhosDeCaptura } from "@/components/account/aparelhos-de-captura"
import { ApplePayConvite } from "@/components/account/apple-pay-convite"
import { mensagemDoErroDeToken, modoDoGatilho, tituloDoAtalho } from "@/components/account/gatilhos-do-atalho"
import { GuiaDoAtalho } from "@/components/account/guia-do-atalho"
import { LancarPeloIphoneVazio } from "@/components/account/lancar-pelo-iphone-vazio"
import { MudarCarteiraDoAtalho } from "@/components/account/mudar-carteira-do-atalho"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CaptureToken } from "@/lib/supabase"
import { formatRelativeTimePtBr } from "@/lib/transaction-date"

const relativo = (iso: string) => {
    const s = formatRelativeTimePtBr(iso)
    return s.charAt(0).toLowerCase() + s.slice(1)
}

/** Já lançou, mas pelo atalho antigo (sem `X-Atalho-Versao`): falta o formulário. */
const atalhoAntigo = (t: CaptureToken) => t.last_used_at != null && t.atalho_versao == null

/** "Carteira · uso": o modo já está no título e no ícone. */
export function legendaDoAtalho(t: CaptureToken, carteira: string): string {
    const uso = t.last_used_at ? `último gasto ${relativo(t.last_used_at)}` : "ainda não lançou nada"
    return `${carteira} · ${uso}`
}

/**
 * Lançar pelo iPhone: os tokens de captura da pessoa (Atalho do iPhone,
 * Apple Pay e compartilhar). Só os ativos aparecem; o código novo vive no guia.
 */
export function AtalhoSecao() {
    const { workspaces } = useWorkspace()
    const lista = useAparelhosDeCaptura()
    const [guiaAberto, setGuiaAberto] = useState(false)
    const [baixarDeNovo, setBaixarDeNovo] = useState(false)
    // Fica depois de fechar: a folha sai com o texto do atalho, não o do guia novo.
    const [substituir, setSubstituir] = useState<CaptureToken>()
    const [alvo, setAlvo] = useState<CaptureToken | null>(null)
    const [mudando, setMudando] = useState<CaptureToken | null>(null)
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
        <SettingsSection titulo="Lançar pelo iPhone">
            <PageSection>
                <PageSectionHeader>
                    <PageSectionTitle>Atalhos</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    {lista.isLoading ? (
                        <SkeletonGroup label="Carregando atalhos…" delay>
                            <div className="flex flex-col gap-1 px-4 py-3">
                                <Skeleton shape="text" className="w-40 max-w-full text-sm" />
                                <Skeleton shape="text" className="w-56 max-w-full text-xs" />
                            </div>
                        </SkeletonGroup>
                    ) : (
                        <ItemGroup variant="divided">
                            {lista.isError ? (
                                <CardMessage tone="destructive">Não foi possível listar os atalhos.</CardMessage>
                            ) : tokens.length === 0 ? (
                                <LancarPeloIphoneVazio onConectar={() => setGuiaAberto(true)} />
                            ) : (
                                tokens.map((t) => {
                                    const carteira = workspaces.find((w) => w.id === t.workspace_id)
                                    return (
                                        <Item key={t.id} variant="flush" size="lg" className="px-4">
                                            <ItemMedia variant="tile" className="rounded-row">
                                                {modoDoGatilho(t.atalho_gatilho) === "voz" ? (
                                                    <MicrophoneIcon aria-hidden />
                                                ) : (
                                                    <CursorArrowRippleIcon aria-hidden />
                                                )}
                                            </ItemMedia>
                                            <ItemContent className="min-w-0">
                                                <ItemTitle className="truncate text-base">{tituloDoAtalho(t)}</ItemTitle>
                                                <Muted asChild>
                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                    {carteira ? (
                                                        <BadgeDot
                                                            className="size-2"
                                                            style={{ "--badge-dot": carteira.icon_background_color } as CSSProperties}
                                                        />
                                                    ) : null}
                                                    <span className="truncate">
                                                        {legendaDoAtalho(t, carteira?.name ?? "Carteira")}
                                                    </span>
                                                    </div>
                                                </Muted>
                                                {atalhoAntigo(t) ? <Muted>Baixe o atalho de novo para ter o formulário</Muted> : null}
                                            </ItemContent>
                                            <ItemActions>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="tertiary"
                                                            size="icon-md"
                                                            aria-label={`Mais opções para ${tituloDoAtalho(t)}`}
                                                        >
                                                            <EllipsisHorizontalIcon aria-hidden />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {atalhoAntigo(t) ? (
                                                            <DropdownMenuItem onSelect={() => {
                                                                    setSubstituir(t)
                                                                    setBaixarDeNovo(true)
                                                                }}>
                                                                <ArrowDownTrayIcon aria-hidden />
                                                                Baixar o atalho de novo
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        {workspaces.length > 1 ? (
                                                            <DropdownMenuItem onSelect={() => setMudando(t)}>
                                                                <WalletIcon aria-hidden />
                                                                Mudar carteira
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        <DropdownMenuItem variant="destructive" onSelect={() => setAlvo(t)}>
                                                            <LinkSlashIcon aria-hidden />
                                                            Desconectar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </ItemActions>
                                        </Item>
                                    )
                                })
                            )}
                            {/* A linha inteira é o alvo: o "+" solto do cabeçalho era pequeno e sem nome no telefone. */}
                            {lista.isError || tokens.length > 0 ? (
                                <Item variant="flush" size="lg" interactive asChild className="px-4">
                                    <button type="button" onClick={() => setGuiaAberto(true)}>
                                        <ItemMedia variant="tile" className="rounded-row">
                                            <PlusIcon aria-hidden />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle className="text-base">Adicionar atalho</ItemTitle>
                                        </ItemContent>
                                    </button>
                                </Item>
                            ) : null}
                        </ItemGroup>
                    )}
                </Card>
            </PageSection>

            {/* Com um atalho conectado, o passo seguinte: lançar ao pagar com Apple Pay. */}
            {!lista.isError && tokens.length > 0 ? (
                <PageSection>
                    <PageSectionHeader>
                        <PageSectionTitle>Apple Pay</PageSectionTitle>
                    </PageSectionHeader>
                    <ApplePayConvite />
                </PageSection>
            ) : null}

            <GuiaDoAtalho
                open={guiaAberto}
                onOpenChange={setGuiaAberto}
                aoCriar={() => void lista.refetch()}
            />
            {/* O código antigo não pode ser mostrado de novo: o guia cria outro e desconecta o antigo. */}
            <GuiaDoAtalho
                open={baixarDeNovo}
                onOpenChange={setBaixarDeNovo}
                aoCriar={() => void lista.refetch()}
                substituir={substituir}
            />

            <MudarCarteiraDoAtalho
                atalho={mudando}
                onOpenChange={(aberto) => !aberto && setMudando(null)}
                aoMudar={() => void lista.refetch()}
            />

            <AlertDialog pending={revogando} open={alvo != null} onOpenChange={fecharRevogar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar este atalho?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alvo ? `"${tituloDoAtalho(alvo)}" para de lançar gastos. Para usar de novo, conecte outra vez.` : null}
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
