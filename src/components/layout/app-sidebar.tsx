"use client"

import { createElement } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { QuickActionButton } from "@/components/layout/quick-actions"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { SidebarUserProfile } from "@/components/layout/sidebar-user-profile"
import { Badge } from "@/components/ui/badge"
import {
    MAIN_NAVIGATION,
    MEMBERS_NAV_ITEM,
    SETTINGS_NAV_ITEM,
    isExactPath,
} from "@/config/navigation"
import { useWorkspace } from "@/components/workspace-provider"
import { solidIconFor } from "@/config/mobile-navigation"
import type { HeroIcon } from "@/types/navigation"
import { prefetchNavRouteHref } from "@/components/layout/sidebar-route-prefetch"

/** A página ativa ganha o ícone preenchido, a mesma convenção da barra de baixo do telefone. */
function NavIcon({ icon, active }: { icon: HeroIcon; active: boolean }) {
    return createElement(active ? (solidIconFor(icon) ?? icon) : icon)
}

export function AppSidebar() {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const { currentWorkspaceId } = useWorkspace()
    const membersActive = isExactPath(pathname, MEMBERS_NAV_ITEM.href)
    const settingsActive = isExactPath(pathname, SETTINGS_NAV_ITEM.href)

    return (
        <Sidebar collapsible="icon" variant="floating">
            {/*
              Never gate children with isMobile: <Sidebar> already renders a Sheet on mobile,
              but empty children meant the drawer had no links (Configurações appeared to do nothing).
            */}
            <WorkspaceSwitcher />
            <SidebarContent>
                <SidebarGroup>
                    <QuickActionButton variant="sidebar" />
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarMenu>
                        {MAIN_NAVIGATION.map((item) => {
                            const active = isExactPath(pathname, item.href)
                            const tooltip = item.beta
                                ? {
                                      children: (
                                          <span className="flex items-center gap-2">
                                              <span>{item.name}</span>
                                              <Badge
                                                  size="xs"
                                                  className="shrink-0"
                                              >
                                                  Beta
                                              </Badge>
                                          </span>
                                      ),
                                  }
                                : item.name
                            return (
                                <SidebarMenuItem key={item.name}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={tooltip}
                                    >
                                        <Link
                                            href={item.href}
                                            onMouseEnter={() =>
                                                prefetchNavRouteHref(
                                                    queryClient,
                                                    currentWorkspaceId,
                                                    item.href,
                                                )
                                            }
                                        >
                                            <NavIcon icon={item.icon} active={active} />
                                            <span className="flex min-w-0 flex-1 items-center gap-2">
                                                <span className="truncate">
                                                    {item.name}
                                                </span>
                                                {item.beta ? (
                                                    <Badge
                                                        size="xs"
                                                        className="shrink-0"
                                                    >
                                                        Beta
                                                    </Badge>
                                                ) : null}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="mt-auto">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={membersActive}
                                tooltip={MEMBERS_NAV_ITEM.name}
                            >
                                <Link href={MEMBERS_NAV_ITEM.href}>
                                    <NavIcon icon={MEMBERS_NAV_ITEM.icon} active={membersActive} />
                                    <span>{MEMBERS_NAV_ITEM.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={settingsActive}
                                tooltip={SETTINGS_NAV_ITEM.name}
                            >
                                <Link href={SETTINGS_NAV_ITEM.href}>
                                    <NavIcon icon={SETTINGS_NAV_ITEM.icon} active={settingsActive} />
                                    <span>{SETTINGS_NAV_ITEM.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarUserProfile />
            </SidebarFooter>
        </Sidebar>
    )
}
