"use client"

import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
import { Card } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { memberDisplayName, type MemberWithProfile } from "@/components/members/pessoas-secao"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import type { Workspace } from "@/lib/supabase"

export function rotuloDePessoas(n: number): string {
    return n === 1 ? "1 pessoa" : `${n} pessoas`
}

/**
 * O topo de Membros no telefone: lá a barra lateral não diz qual carteira está
 * aberta, então a tela abre com ela — o ladrilho do seletor, o nome, os rostos e
 * a contagem. Só leitura: o convite mora na barra do topo.
 */
export function CarteiraNoTopo({ carteira, pessoas }: { carteira: Workspace; pessoas: MemberWithProfile[] }) {
    return (
        <Card padding="none">
            <Item>
                <ItemMedia>
                    <WorkspaceBrandMark iconKey={carteira.icon} backgroundColor={carteira.icon_background_color} size="xl" />
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>{carteira.name}</ItemTitle>
                    <div className="flex items-center gap-2">
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
                        <ItemDescription>{rotuloDePessoas(pessoas.length)}</ItemDescription>
                    </div>
                </ItemContent>
            </Item>
        </Card>
    )
}
