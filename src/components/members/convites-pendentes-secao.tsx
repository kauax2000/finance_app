"use client"

import {
    EllipsisHorizontalIcon,
    EnvelopeIcon,
    PaperAirplaneIcon,
    XMarkIcon,
} from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Spinner } from "@/components/ui/spinner"
import { rotuloDoPapel } from "@/lib/papeis/papeis"
import type { WorkspaceInvite } from "@/lib/supabase"
import { formatDateTimeShortPtBr } from "@/lib/transaction-date"

function formatLinkInviteExpiresAt(iso: string | null | undefined): string | null {
    if (!iso) return null
    const end = new Date(iso).getTime()
    if (Number.isNaN(end)) return null
    const ms = end - Date.now()
    if (ms <= 0) return "Este link já expirou."
    const days = Math.ceil(ms / 86_400_000)
    if (days > 1) return `Expira em cerca de ${days} dias (${formatDateTimeShortPtBr(iso)}).`
    if (days === 1) return `Expira em cerca de 1 dia (${formatDateTimeShortPtBr(iso)}).`
    const hours = Math.max(1, Math.ceil(ms / 3_600_000))
    return `Expira em cerca de ${hours} h (${formatDateTimeShortPtBr(iso)}).`
}

export function ConvitesPendentesSecao({
    convites,
    podeGerenciar,
    onReenviar,
    onCancelar,
    ocupadoId,
}: {
    convites: WorkspaceInvite[]
    podeGerenciar: boolean
    onReenviar: (convite: WorkspaceInvite) => void
    onCancelar: (convite: WorkspaceInvite) => void
    ocupadoId: string | null
}) {
    return (
        <PageSection size="sm">
            <PageSectionHeader>
                <PageSectionTitle count={convites.length}>Convites pendentes</PageSectionTitle>
            </PageSectionHeader>
            {convites.length === 0 ? (
                <Card padding="none">
                    <Item variant="flush" size="lg" className="px-4">
                        <ItemContent>
                            <ItemDescription>Nenhum convite pendente</ItemDescription>
                        </ItemContent>
                    </Item>
                </Card>
            ) : (
                <Card padding="none">
                    <ItemGroup variant="divided">
                        {convites.map((convite) => {
                            const titulo = convite.invited_email ?? ""
                            const expira = formatLinkInviteExpiresAt(convite.expires_at)
                            const ocupado = ocupadoId === convite.id
                            return (
                                <Item key={convite.id} variant="flush" size="lg" className="px-4">
                                    <ItemMedia variant="tile">
                                        <EnvelopeIcon aria-hidden />
                                    </ItemMedia>
                                    <ItemContent className="min-w-0">
                                        <ItemTitle className="truncate pointer-coarse:text-base">{titulo}</ItemTitle>
                                        <ItemDescription>
                                            {rotuloDoPapel(convite.role)}
                                            {expira ? ` · ${expira}` : null}
                                        </ItemDescription>
                                    </ItemContent>
                                    {podeGerenciar ? (
                                        <ItemActions>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="tertiary"
                                                        size="icon-md"
                                                        disabled={ocupado}
                                                        aria-label={`Mais opções para ${titulo}`}
                                                    >
                                                        {ocupado ? <Spinner /> : <EllipsisHorizontalIcon aria-hidden />}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => onReenviar(convite)}>
                                                        <PaperAirplaneIcon aria-hidden />
                                                        Reenviar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem variant="destructive" onSelect={() => onCancelar(convite)}>
                                                        <XMarkIcon aria-hidden />
                                                        Revogar convite
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </ItemActions>
                                    ) : null}
                                </Item>
                            )
                        })}
                    </ItemGroup>
                </Card>
            )}
        </PageSection>
    )
}
