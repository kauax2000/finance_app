"use client"

import { createElement, useState } from "react"
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
import { microIconFor } from "@/config/mobile-navigation"
import type { HeroIcon } from "@/types/navigation"
import { prefetchNavRouteHref } from "@/components/layout/sidebar-route-prefetch"

/**
 * A barra desenha o ícone a 16px, e 16px é o micro (`16/solid`): o contorno de
 * 24 encolhido afinava o traço a 1px. O micro só existe sólido, então a página
 * ativa não "preenche" mais: quem a marca é a pílula e o peso do rótulo.
 */
function NavIcon({ icon }: { icon: HeroIcon }) {
    return createElement(microIconFor(icon) ?? icon)
}

export function AppSidebar() {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const { currentWorkspaceId } = useWorkspace()

    // **A pílula do ativo anda no clique, e não quando a página chega.** Medido:
    // esperando o `pathname`, a viagem caía nos ~200ms em que a página nova se
    // desenha, sem quadro nenhum, e lia como salto. O destino marca o ativo na
    // hora; quando o `pathname` muda, volta a ser ele quem manda.
    const [destino, setDestino] = useState<string | null>(null)
    const [pathAnterior, setPathAnterior] = useState(pathname)
    if (pathname !== pathAnterior) {
        setPathAnterior(pathname)
        setDestino(null)
    }
    const ativo = (href: string) =>
        destino ? destino === href : isExactPath(pathname, href)
    const irPara = (href: string) => (e: React.MouseEvent) => {
        // Abrir em outra aba (⌘, Ctrl, Shift, botão do meio) não troca a página daqui.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        if (!isExactPath(pathname, href)) setDestino(href)
    }
    const membersActive = ativo(MEMBERS_NAV_ITEM.href)
    const settingsActive = ativo(SETTINGS_NAV_ITEM.href)

    return (
        <Sidebar collapsible="icon" variant="floating">
            {/*
              Never gate children with isMobile: <Sidebar> already renders a Sheet on mobile,
              but empty children meant the drawer had no links (Configurações appeared to do nothing).
            */}
            <WorkspaceSwitcher />
            <SidebarContent>
                {/* Caixa a caixa, o vão da linha da carteira ao botão é o mesmo do botão à
                    linha do Painel: 16 aberta (carteira de 48, botão de 36). Recolhida, a
                    carteira vira a caixa de 40 e o botão 32, e os dois vãos ficam em 20: 6 de
                    recuo em cima e 10 embaixo, para o Painel não sair do lugar. */}
                <SidebarGroup className="group-data-[collapsible=icon]:pt-1.5 group-data-[collapsible=icon]:pb-2.5">
                    <QuickActionButton variant="sidebar" />
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarMenu>
                        {MAIN_NAVIGATION.map((item) => {
                            const active = ativo(item.href)
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
                                            onClick={irPara(item.href)}
                                            onMouseEnter={() =>
                                                prefetchNavRouteHref(
                                                    queryClient,
                                                    currentWorkspaceId,
                                                    item.href,
                                                )
                                            }
                                        >
                                            <NavIcon icon={item.icon} />
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
                                <Link href={MEMBERS_NAV_ITEM.href} onClick={irPara(MEMBERS_NAV_ITEM.href)}>
                                    <NavIcon icon={MEMBERS_NAV_ITEM.icon} />
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
                                <Link href={SETTINGS_NAV_ITEM.href} onClick={irPara(SETTINGS_NAV_ITEM.href)}>
                                    <NavIcon icon={SETTINGS_NAV_ITEM.icon} />
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
