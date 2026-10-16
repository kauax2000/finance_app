"use client"

import Link from "next/link"
import { useAuth } from "@/components/providers"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/layout/user-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EllipsisVerticalIcon } from "@heroicons/react/16/solid"
import { cn, getInitials } from "@/lib/utils"
import { identityToneFor } from "@/lib/avatar"
import { ROUTES } from "@/config/navigation"

export function SidebarUserProfile() {
    const { user, profile, loading, profileReady } = useAuth()
    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarTone = identityToneFor(
        profile?.avatar_color,
        user?.email || userName
    )

    if (loading || (user && !profileReady)) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuSkeleton size="lg" showIcon media="avatar" aria-busy="true" />
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    if (!user) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <Button asChild variant="outline" size="sm" className="w-full justify-center">
                        <Link href={ROUTES.LOGIN}>Entrar</Link>
                    </Button>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <UserMenu>
                    {/* Era um `<button>` cru com o `cva` do `SidebarMenuButton`
                        copiado à mão — e a cópia **já tinha divergido**: ela
                        escrevia `group-data-[collapsible=icon]:p-0!`, que é a
                        regra do degrau `lg`, sobre a geometria do degrau
                        padrão. Compor o degrau certo entrega a mesma caixa sem
                        a segunda régua. */}
                    <SidebarMenuButton size="lg">
                        {/* Era markup desenhado à mão: uma caixa recortada com
                            a foto crua dentro. O `Avatar` do design system faz
                            o mesmo recorte, entra em fade quando a foto chega e
                            cai nas iniciais sozinho quando ela falha — que era
                            justamente o que a versão à mão não fazia: endereço
                            quebrado deixava um quadrado cinza vazio. */}
                        <Avatar size="sm">
                            {user?.user_metadata?.avatar_url ? (
                                <AvatarImage
                                    src={user.user_metadata.avatar_url}
                                    alt=""
                                />
                            ) : null}
                            <AvatarFallback className={cn(avatarTone.surface, avatarTone.ink)}>
                                {getInitials(userName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{userName}</span>
                            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                        </div>
                        <EllipsisVerticalIcon className="ml-auto text-muted-foreground" />
                    </SidebarMenuButton>
                </UserMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
