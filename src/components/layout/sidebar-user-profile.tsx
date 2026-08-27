"use client"

import Link from "next/link"
import { useAuth } from "@/components/providers"
import {
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/layout/user-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EllipsisVerticalIcon } from "@heroicons/react/16/solid"
import { cn, getInitials } from "@/lib/utils"
import { identityToneFor } from "@/lib/avatar"
import { Skeleton } from "@/components/ui/skeleton"
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
                    <div
                        className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
                        aria-busy="true"
                    >
                        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                        <div className="grid min-w-0 flex-1 gap-1.5 text-left group-data-[collapsible=icon]:hidden">
                            <Skeleton className="h-4 w-24 max-w-full" />
                            <Skeleton className="h-3 w-36 max-w-full" />
                        </div>
                        <Skeleton className="ml-auto size-4 shrink-0 rounded-sm group-data-[collapsible=icon]:hidden" />
                    </div>
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
                    <button className="w-full flex items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 h-12 text-sm">
                        {/* Era markup desenhado à mão: uma caixa recortada com
                            a foto crua dentro. O `Avatar` do design system faz
                            o mesmo recorte, entra em fade quando a foto chega e
                            cai nas iniciais sozinho quando ela falha — que era
                            justamente o que a versão à mão não fazia: endereço
                            quebrado deixava um quadrado cinza vazio. */}
                        <Avatar size="sm" shape="rounded" className="select-none">
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
                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-medium">{userName}</span>
                            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                        </div>
                        <EllipsisVerticalIcon className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    </button>
                </UserMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
