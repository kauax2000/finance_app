"use client"

import { useState } from "react"
import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon, UserIcon } from "@heroicons/react/16/solid"

import { EditProfileDialog } from "@/components/account/edit-profile-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { identityToneFor } from "@/lib/avatar"
import { rotuloDoPapel } from "@/lib/papeis/papeis"
import type { WorkspaceMember } from "@/lib/supabase"
import { cn, getInitials } from "@/lib/utils"

// A lista lê só as quatro colunas de sempre; o responsável do convidado
// (`sponsor_user_id`) ainda não aparece nesta tela.
export type MemberWithProfile = Omit<WorkspaceMember, "sponsor_user_id"> & {
    profile?: {
        id: string
        email: string
        full_name: string | null
        avatar_url?: string | null
        avatar_color?: string | null
    } | null
}

export function memberDisplayName(member: MemberWithProfile) {
    return member.profile?.full_name || member.profile?.email || "Membro"
}

export function AvatarDoMembro({ member, size = "sm" }: { member: MemberWithProfile; size?: "sm" }) {
    const nome = memberDisplayName(member)
    const semente = nome === "Membro" ? member.profile?.email || "Membro" : nome
    const tom = identityToneFor(member.profile?.avatar_color, semente)
    const foto = member.profile?.avatar_url?.trim() || null
    return (
        <Avatar size={size}>
            {foto ? <AvatarImage src={foto} alt="" loading="lazy" /> : null}
            <AvatarFallback className={cn("font-semibold", tom.surface, tom.ink)}>{getInitials(semente)}</AvatarFallback>
        </Avatar>
    )
}

export function PessoasSecao({
    pessoas,
    meuUserId,
    podeGerenciar,
    onTrocarPapel,
    onRemover,
    ocupadoId,
}: {
    pessoas: MemberWithProfile[]
    meuUserId: string | null
    podeGerenciar: boolean
    onTrocarPapel: (pessoa: MemberWithProfile, papel: "member" | "guest") => void
    onRemover: (pessoa: MemberWithProfile) => void
    ocupadoId: string | null
}) {
    const [editarAberto, setEditarAberto] = useState(false)

    return (
        <PageSection size="sm">
            <PageSectionHeader>
                <PageSectionTitle count={pessoas.length}>Pessoas</PageSectionTitle>
            </PageSectionHeader>
            <Card padding="none">
                <ItemGroup variant="divided">
                    {pessoas.map((pessoa) => {
                        const nome = memberDisplayName(pessoa)
                        const email = pessoa.profile?.email || ""
                        const ocupado = ocupadoId === pessoa.user_id
                        const novoPapel = pessoa.role === "guest" ? "member" : "guest"
                        const minha = pessoa.user_id === meuUserId
                        return (
                            <Item key={pessoa.user_id} variant="flush" size="lg" className="px-4">
                                <ItemMedia>
                                    <AvatarDoMembro member={pessoa} />
                                </ItemMedia>
                                <ItemContent className="min-w-0">
                                    <ItemTitle className="truncate pointer-coarse:text-base">
                                        {nome}
                                        {pessoa.user_id === meuUserId ? " (você)" : null}
                                    </ItemTitle>
                                    <ItemDescription className="truncate">{email || "E-mail indisponível"}</ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                    <Badge>{rotuloDoPapel(pessoa.role)}</Badge>
                                    {minha ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="tertiary"
                                                    size="icon-md"
                                                    aria-label="Mais opções para você"
                                                >
                                                    <EllipsisHorizontalIcon aria-hidden />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setEditarAberto(true)}>
                                                    <PencilSquareIcon aria-hidden />
                                                    Editar perfil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : podeGerenciar && pessoa.role !== "owner" ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="tertiary"
                                                    size="icon-md"
                                                    disabled={ocupado}
                                                    aria-label={`Mais opções para ${nome}`}
                                                >
                                                    {ocupado ? <Spinner /> : <EllipsisHorizontalIcon aria-hidden />}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => onTrocarPapel(pessoa, novoPapel)}>
                                                    <UserIcon aria-hidden />
                                                    {novoPapel === "guest" ? "Tornar convidado" : "Tornar membro"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem variant="destructive" onSelect={() => onRemover(pessoa)}>
                                                    <TrashIcon aria-hidden />
                                                    Remover da carteira
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        // Sem ação: o lugar do ⋯ fica reservado, para o selo do papel não recuar de linha em linha.
                                        <span aria-hidden className="size-8 shrink-0 pointer-coarse:size-11" />
                                    )}
                                </ItemActions>
                            </Item>
                        )
                    })}
                </ItemGroup>
            </Card>
            <EditProfileDialog open={editarAberto} onOpenChange={setEditarAberto} />
        </PageSection>
    )
}
