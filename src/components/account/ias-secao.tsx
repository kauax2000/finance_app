"use client"

import { EllipsisHorizontalIcon, LinkSlashIcon, PlusIcon, SparklesIcon } from "@heroicons/react/16/solid"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { ConectarIaDialog } from "@/components/account/conectar-ia-dialog"
import { IasVazio } from "@/components/account/ias-vazio"
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
import { chaveDasIas, useIasConectadas } from "@/hooks/use-ias-conectadas"
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
    const lista = useIasConectadas()
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
        await queryClient.invalidateQueries({ queryKey: chaveDasIas(user?.id) })
    }

    return (
        <SettingsSection
            titulo="IAs conectadas"
            actions={
                // Sem IA, quem convida é o vazio: o cabeçalho não repete a ação. Com erro, ela fica.
                lista.isError || grants.length > 0 ? (
                    <Button type="button" variant="tertiary" onClick={() => setConectarAberto(true)}>
                        <PlusIcon aria-hidden data-icon="inline-start" />
                        Conectar
                    </Button>
                ) : null
            }
        >
            <Card padding="none">
                {lista.isPending && user ? (
                    <SkeletonGroup label="Carregando conexões…" delay>
                        <div className="flex flex-col gap-1 px-4 py-3">
                            <Skeleton shape="text" className="w-32 max-w-full text-sm" />
                            <Skeleton shape="text" className="w-24 max-w-full text-xs" />
                        </div>
                    </SkeletonGroup>
                ) : lista.isError ? (
                    <CardMessage tone="destructive">Não foi possível carregar as conexões.</CardMessage>
                ) : grants.length === 0 ? (
                    <IasVazio onConectar={() => setConectarAberto(true)} />
                ) : (
                    <ItemGroup variant="divided">
                        {grants.map((g) => (
                            <Item key={g.client.id} variant="flush" size="lg" className="px-4">
                                <ItemMedia variant="tile" className="rounded-row">
                                    <SparklesIcon aria-hidden />
                                </ItemMedia>
                                <ItemContent className="min-w-0">
                                    <ItemTitle className="truncate text-base">{g.client.name}</ItemTitle>
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
                                                <LinkSlashIcon aria-hidden />
                                                Desconectar
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
