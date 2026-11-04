"use client"

import { SparklesIcon, EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/16/solid"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { ConectarIaDialog } from "@/components/account/conectar-ia-dialog"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"
import { supabase } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"

/** O endereço do MCP no projeto Supabase, com ou sem barra no fim. */
export function urlDoMcp(supabaseUrl: string): string {
    return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/mcp`
}

/** As IAs (Claude, ChatGPT) que a pessoa autorizou no MCP, e como conectar outra. */
export function IasSecao() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const chave = ["oauth_grants", user?.id]
    const lista = useQuery({
        queryKey: chave,
        enabled: Boolean(user),
        retry: false,
        // A seção mostra o próprio erro: sem o toast global cru, em inglês.
        meta: { errorToast: false },
        queryFn: async () => {
            const { data, error } = await supabase.auth.oauth.listGrants()
            if (error) throw error
            return data ?? []
        },
    })
    const [conectarAberto, setConectarAberto] = useState(false)
    const [alvo, setAlvo] = useState<{ id: string; nome: string } | null>(null)
    const [pendente, setPendente] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const grants = lista.data ?? []

    function fechar(aberto: boolean) {
        if (aberto) return
        setAlvo(null)
        setErro(null)
    }

    async function desconectar() {
        if (!alvo) return
        setPendente(true)
        setErro(null)
        const { error } = await supabase.auth.oauth.revokeGrant({ clientId: alvo.id })
        setPendente(false)
        if (error) return setErro("Não foi possível desconectar. Tente de novo.")
        setAlvo(null)
        await queryClient.invalidateQueries({ queryKey: chave })
    }

    return (
        <SettingsSection
            titulo="IAs conectadas"
            actions={
                <Button type="button" variant="tertiary" onClick={() => setConectarAberto(true)}>
                    <PlusIcon aria-hidden data-icon="inline-start" />
                    Conectar
                </Button>
            }
        >
            <Card padding="none">
                {lista.isPending && user ? (
                    <SkeletonGroup label="Carregando conexões…" delay>
                        <div className="flex flex-col gap-1 px-4 py-3">
                            <Skeleton className="h-4 w-32 max-w-full" />
                            <Skeleton className="h-3 w-24 max-w-full" />
                        </div>
                    </SkeletonGroup>
                ) : lista.isError ? (
                    <CardMessage tone="destructive">Não foi possível carregar as conexões.</CardMessage>
                ) : grants.length === 0 ? (
                    <CardMessage>Nenhuma IA conectada.</CardMessage>
                ) : (
                    <ItemGroup variant="divided">
                        {grants.map((g) => (
                            <Item key={g.client.id} variant="flush" className="px-4">
                                <ItemMedia variant="tile">
                                    <SparklesIcon aria-hidden />
                                </ItemMedia>
                                <ItemContent className="min-w-0">
                                    <ItemTitle className="truncate">{g.client.name}</ItemTitle>
                                    <Muted className="truncate">desde {formatDatePtBr(g.granted_at)}</Muted>
                                </ItemContent>
                                <ItemActions>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="tertiary"
                                                size="icon-md"
                                                aria-label={`Mais opções para ${g.client.name}`}
                                            >
                                                <EllipsisHorizontalIcon aria-hidden />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onSelect={() => setAlvo({ id: g.client.id, nome: g.client.name })}
                                            >
                                                Desconectar…
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </ItemActions>
                            </Item>
                        ))}
                    </ItemGroup>
                )}
            </Card>

            <ConectarIaDialog open={conectarAberto} onOpenChange={setConectarAberto} />

            <AlertDialog pending={pendente} open={alvo != null} onOpenChange={fechar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar a IA?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alvo ? `Desconectar ${alvo.nome}? Ela perde o acesso na hora.` : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {erro ? <AlertDialogError>{erro}</AlertDialogError> : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Desconectando…"
                            onClick={(e) => {
                                e.preventDefault()
                                void desconectar()
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
