"use client"

import Link from "next/link"
import { useAbasFora } from "@/components/layout/abas-fora"
import { VoceAvatar } from "@/components/layout/voce-avatar"
import { MePageSkeleton } from "@/components/me/me-page-skeleton"
import { useAuth } from "@/components/providers"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Item,
    ItemChevron,
    ItemContent,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { H2, Muted } from "@/components/ui/typography"
import { getVoceGroups, miniIconFor } from "@/config/mobile-navigation"

export default function MePage() {
    const { user, loading, profileReady } = useAuth()
    const grupos = getVoceGroups(useAbasFora())

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""

    // Como em Minha conta: sem o perfil, o nome e o tom do avatar ainda não são os
    // da pessoa, e a página inteira espera no esqueleto da rota.
    if (loading || (user && !profileReady)) {
        return <MePageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            {/* Não é link: a conta tem a linha dela no grupo de baixo. */}
            <div className="flex flex-col items-center gap-3 text-center">
                <VoceAvatar size="xl" />
                {/* Nome sobre e-mail é par de identidade: sem `gap`. */}
                <div className="min-w-0 max-w-full">
                    <H2 className="truncate">{userName}</H2>
                    {userEmail ? <Muted className="truncate">{userEmail}</Muted> : null}
                </div>
            </div>

            {grupos.map((grupo) => (
                <Card key={grupo.id} padding="none">
                    {/* Sem título visível (as linhas se explicam); o nome do grupo fica para o leitor de tela. */}
                    <ItemGroup variant="divided" role="group" aria-label={grupo.label}>
                        {grupo.items.map((item) => {
                            const Icon = miniIconFor(item.icon) ?? item.icon
                            return (
                                <Item key={item.href} variant="flush" interactive asChild>
                                    <Link href={item.href}>
                                        <ItemMedia variant="icon">
                                            <Icon className="size-5" aria-hidden />
                                        </ItemMedia>
                                        <ItemContent>
                                            {/* 16 no toque, como as linhas dos menus (`menu-classes`): o `ItemTitle` para em 14. */}
                                            <ItemTitle className="pointer-coarse:text-base">
                                                {item.name}
                                                {item.beta ? <Badge size="xs">Beta</Badge> : null}
                                            </ItemTitle>
                                        </ItemContent>
                                        <ItemChevron />
                                    </Link>
                                </Item>
                            )
                        })}
                    </ItemGroup>
                </Card>
            ))}
        </div>
    )
}
