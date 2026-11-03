"use client"

import { useState } from "react"

import { useAparelhosDeCaptura } from "@/components/account/aparelhos-de-captura"
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
import { Button } from "@/components/ui/button"
import { Card, CardMessage } from "@/components/ui/card"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CaptureToken } from "@/lib/supabase"
import { formatDateTimeShortPtBr } from "@/lib/transaction-date"

export const NOME_INVALIDO = "Nome do aparelho: de 1 a 60 caracteres."

/** O erro do banco (check, not null ou o `raise` das RPCs) na frase da tela. */
export function mensagemDoErroDeToken(erro: { code?: string; message?: string }): string {
    if (erro.code === "23514" || erro.code === "23502") return NOME_INVALIDO
    if (erro.message?.includes("nao_membro")) return "Você não é membro dessa carteira."
    if (erro.message?.includes("limite_tokens")) return "Limite de 10 aparelhos conectados. Desconecte um para conectar outro."
    return "Não foi possível concluir. Tente de novo."
}

/**
 * Lançar sem abrir o app: os tokens de captura da pessoa (Atalho do iPhone,
 * Apple Pay e compartilhar). Só os ativos aparecem; o código novo vive no guia.
 */
export function AtalhoSecao() {
    const { workspaces } = useWorkspace()
    const lista = useAparelhosDeCaptura()
    const [guiaAberto, setGuiaAberto] = useState(false)
    const [alvo, setAlvo] = useState<CaptureToken | null>(null)
    const [revogando, setRevogando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const nomeDaCarteira = (id: string) => workspaces.find((w) => w.id === id)?.name ?? "Carteira"
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
            titulo="Lançar sem abrir o app"
            actions={
                lista.isError || tokens.length > 0 ? (
                    <Button type="button" variant="secondary" onClick={() => setGuiaAberto(true)}>
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
                                <JanelaDoAparelho tela={TELA_DA_NOTIFICACAO} compacta />
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
                            tokens.map((t) => (
                                <Item key={t.id} variant="flush" className="px-4">
                                    <ItemContent className="min-w-0">
                                        <ItemTitle className="truncate">{t.name}</ItemTitle>
                                        <Muted className="truncate">
                                            {nomeDaCarteira(t.workspace_id)} ·{" "}
                                            {t.last_used_at
                                                ? `último uso ${formatDateTimeShortPtBr(t.last_used_at)}`
                                                : "nunca usado"}
                                        </Muted>
                                    </ItemContent>
                                    <ItemActions>
                                        <Button type="button" variant="tertiary" onClick={() => setAlvo(t)}>
                                            Desconectar
                                        </Button>
                                    </ItemActions>
                                </Item>
                            ))
                        )}
                    </ItemGroup>
                )}
            </Card>

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
