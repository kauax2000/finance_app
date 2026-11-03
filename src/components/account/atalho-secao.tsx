"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { GuiaDoAtalho } from "@/components/account/guia-do-atalho"
import { useAuth } from "@/components/providers"
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
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CaptureToken } from "@/lib/supabase"
import { formatDateTimeShortPtBr } from "@/lib/transaction-date"

/** O authenticated só lê estas sete colunas: o hash nunca sai do banco, e `*` dá 42501. */
const COLUNAS = "id, user_id, workspace_id, name, created_at, last_used_at, revoked_at"

export const NOME_INVALIDO = "Nome do aparelho: de 1 a 60 caracteres."

/** O erro do banco (check, not null ou o `raise` das RPCs) na frase da tela. */
export function mensagemDoErroDeToken(erro: { code?: string; message?: string }): string {
    if (erro.code === "23514" || erro.code === "23502") return NOME_INVALIDO
    if (erro.message?.includes("nao_membro")) return "Você não é membro dessa carteira."
    if (erro.message?.includes("limite_tokens")) return "Limite de 10 tokens ativos. Revogue um para criar outro."
    return "Não foi possível concluir. Tente de novo."
}

/**
 * Lançar sem abrir o app: os tokens de captura da pessoa (Atalho do iPhone,
 * Apple Pay e compartilhar). Só os ativos aparecem; o código novo vive no guia.
 */
export function AtalhoSecao() {
    const { user } = useAuth()
    const { workspaces } = useWorkspace()
    const lista = useQuery({
        queryKey: ["capture_tokens", user?.id],
        enabled: Boolean(user),
        retry: false,
        // A seção mostra o próprio erro: sem o toast global cru, em inglês.
        meta: { errorToast: false },
        queryFn: async () => {
            const { data, error } = await supabase
                .from("capture_tokens")
                .select(COLUNAS)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data as CaptureToken[]
        },
    })
    const [guiaAberto, setGuiaAberto] = useState(false)
    const [alvo, setAlvo] = useState<CaptureToken | null>(null)
    const [revogando, setRevogando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const nomeDaCarteira = (id: string) => workspaces.find((w) => w.id === id)?.name ?? "Carteira"
    const tokens = (lista.data ?? []).filter((t) => t.revoked_at == null)

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
                <Button type="button" variant="secondary" onClick={() => setGuiaAberto(true)}>
                    Conectar aparelho
                </Button>
            }
        >
            <Card padding="none">
                {lista.isPending && user ? (
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
                            <CardMessage>Nenhum aparelho conectado.</CardMessage>
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
                                            Revogar
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
                        <AlertDialogTitle>Revogar o token?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alvo ? `Revogar o token "${alvo.name}"? O aparelho para de lançar.` : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {erro ? <AlertDialogError>{erro}</AlertDialogError> : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Revogando…"
                            onClick={(e) => {
                                e.preventDefault()
                                void revogar()
                            }}
                        >
                            Revogar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SettingsSection>
    )
}
