"use client"

import { UserPlusIcon } from "@heroicons/react/16/solid"
import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
import { Button } from "@/components/ui/button"
import { H3, Muted } from "@/components/ui/typography"
import { memberDisplayName, type MemberWithProfile } from "@/components/members/pessoas-secao"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import type { Workspace } from "@/lib/supabase"

export function rotuloDePessoas(n: number): string {
    return n === 1 ? "1 pessoa" : `${n} pessoas`
}

/**
 * O topo de Membros no telefone: lá a barra lateral não diz qual carteira está
 * aberta, então a tela abre com ela, centrada e sem moldura, como a identidade
 * da página Você — o ladrilho do seletor, o nome, os rostos e a contagem. Com
 * `onConvidar` (só o dono), o "Convidar pessoa" vem logo abaixo.
 */
export function CarteiraNoTopo({
    carteira,
    pessoas,
    onConvidar,
}: {
    carteira: Workspace
    pessoas: MemberWithProfile[]
    onConvidar?: () => void
}) {
    return (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
            <WorkspaceBrandMark iconKey={carteira.icon} backgroundColor={carteira.icon_background_color} size="2xl" />
            <div className="flex min-w-0 max-w-full flex-col items-center gap-2">
                <H3 asChild className="max-w-full truncate">
                    <p>{carteira.name}</p>
                </H3>
                <div className="flex items-center justify-center gap-2">
                    <AvatarGroup label="Pessoas da carteira" size="xs">
                        {pessoas.map((pessoa) => (
                            <AvatarGroupItem
                                key={pessoa.user_id}
                                name={memberDisplayName(pessoa)}
                                src={pessoa.profile?.avatar_url}
                                color={pessoa.profile?.avatar_color}
                            />
                        ))}
                    </AvatarGroup>
                    <Muted>{rotuloDePessoas(pessoas.length)}</Muted>
                </div>
            </div>
            {onConvidar ? (
                <Button type="button" variant="secondary" className="mt-1" onClick={onConvidar}>
                    <UserPlusIcon aria-hidden />
                    Convidar pessoa
                </Button>
            ) : null}
        </div>
    )
}
