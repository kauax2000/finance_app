"use client"

import {
    ArrowPathIcon,
    EllipsisHorizontalIcon,
    EnvelopeIcon,
    LinkIcon,
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
import { Muted } from "@/components/ui/typography"
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
    onGerarNovoLink,
    ocupadoId,
}: {
    convites: WorkspaceInvite[]
    podeGerenciar: boolean
    onReenviar: (convite: WorkspaceInvite) => void
    onCancelar: (convite: WorkspaceInvite) => void
    onGerarNovoLink: (convite: WorkspaceInvite) => void
    ocupadoId: string | null
}) {
    return (
        <PageSection size="sm">
            <PageSectionHeader>
                <PageSectionTitle count={convites.length}>Convites pendentes</PageSectionTitle>
            </PageSectionHeader>
            {convites.length === 0 ? (
                <Muted>Nenhum convite pendente</Muted>
            ) : (
                <Card padding="none">
                    <ItemGroup variant="divided">
                        {convites.map((convite) => {
                            const porEmail = convite.invited_email != null
                            const titulo = convite.invited_email ?? "Link de convite"
                            const expira = formatLinkInviteExpiresAt(convite.expires_at)
                            const ocupado = ocupadoId === convite.id
                            return (
                                <Item key={convite.id} variant="flush" size="lg" className="px-4">
                                    <ItemMedia variant="tile" className="rounded-row">
                                        {porEmail ? <EnvelopeIcon aria-hidden /> : <LinkIcon aria-hidden />}
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
                                                    {porEmail ? (
                                                        <DropdownMenuItem onSelect={() => onReenviar(convite)}>
                                                            <PaperAirplaneIcon aria-hidden />
                                                            Reenviar
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onSelect={() => onGerarNovoLink(convite)}>
                                                            <ArrowPathIcon aria-hidden />
                                                            Gerar novo link
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem variant="destructive" onSelect={() => onCancelar(convite)}>
                                                        <XMarkIcon aria-hidden />
                                                        Cancelar convite
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
