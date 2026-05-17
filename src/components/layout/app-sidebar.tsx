"use client"

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
import { prefetchNavRouteHref } from "@/components/layout/sidebar-route-prefetch"

export function AppSidebar() {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const { currentWorkspaceId } = useWorkspace()
    const MembersIcon = MEMBERS_NAV_ITEM.icon
    const SettingsIcon = SETTINGS_NAV_ITEM.icon

    return (
        <Sidebar collapsible="icon">
            {/*
              Never gate children with isMobile: <Sidebar> already renders a Sheet on mobile,
              but empty children meant the drawer had no links (Configurações appeared to do nothing).
            */}
            <WorkspaceSwitcher />
            <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
                <SidebarGroup variant="action">
                    <QuickActionButton variant="sidebar" />
                </SidebarGroup>
                <SidebarGroup className="mt-2">
                    <SidebarMenu className="gap-2">
                        {MAIN_NAVIGATION.map((item) => {
                            const Icon = item.icon
                            const tooltip = item.beta
                                ? {
                                      children: (
                                          <span className="flex items-center gap-2">
                                              <span>{item.name}</span>
                                              <Badge
                                                  size="xs"
                                                  variant="primary"
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
                                        isActive={isExactPath(pathname, item.href)}
                                        tooltip={tooltip}
                                    >
                                        <Link
                                            href={item.href}
                                            className="gap-3"
                                            onMouseEnter={() =>
                                                prefetchNavRouteHref(
                                                    queryClient,
                                                    currentWorkspaceId,
                                                    item.href,
                                                )
                                            }
                                        >
                                            <Icon className="h-5 w-5 shrink-0" />
                                            <span className="group-data-[collapsible=icon]:hidden flex min-w-0 flex-1 items-center gap-2">
                                                <span className="truncate">
                                                    {item.name}
                                                </span>
                                                {item.beta ? (
                                                    <Badge
                                                        size="xs"
                                                        variant="primary"
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
                <SidebarGroup className="mt-auto pb-2">
                    <SidebarMenu className="gap-2">
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isExactPath(pathname, MEMBERS_NAV_ITEM.href)}
                                tooltip={MEMBERS_NAV_ITEM.name}
                            >
                                <Link href={MEMBERS_NAV_ITEM.href} className="gap-3">
                                    <MembersIcon className="h-5 w-5 shrink-0" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        {MEMBERS_NAV_ITEM.name}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isExactPath(
                                    pathname,
                                    SETTINGS_NAV_ITEM.href
                                )}
                                tooltip={SETTINGS_NAV_ITEM.name}
                            >
                                <Link href={SETTINGS_NAV_ITEM.href} className="gap-3">
                                    <SettingsIcon className="h-5 w-5 shrink-0" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        {SETTINGS_NAV_ITEM.name}
                                    </span>
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
