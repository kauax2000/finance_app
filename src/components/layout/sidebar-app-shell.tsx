"use client"

import { useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { AuthGuard } from "@/components/layout/auth-guard"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { NotificationsUiProvider } from "@/components/layout/notifications-ui-provider"
import { NotificationsSheet } from "@/components/layout/notifications-sheet"
import { GlobalShellDialogsProvider } from "@/components/layout/global-shell-dialogs-provider"
import { PageChromeProvider } from "@/components/layout/page-chrome-provider"
import { DASHBOARD_PAGE_TITLES, ROUTES } from "@/config/navigation"
import { sidebarLabVersion } from "@/lib/sidebar-lab"

const semAssinatura = () => () => {}

type SidebarAppShellProps = {
    children: React.ReactNode
    defaultSidebarOpen: boolean
}

/**
 * O cabeçalho do painel e de categorias é o título; o resto usa breadcrumb.
 * A escolha vinha de dois grupos de rota com a mesma casca — e trocar de grupo
 * desmontava a casca inteira (guarda de sessão, provedores, barra lateral).
 */
function titleModeFor(pathname: string): "dashboard" | "app" {
    return pathname in DASHBOARD_PAGE_TITLES ||
        pathname.startsWith(`${ROUTES.DASHBOARD_CATEGORIES}/`)
        ? "dashboard"
        : "app"
}

export function SidebarAppShell({
    children,
    defaultSidebarOpen,
}: SidebarAppShellProps) {
    const pathname = usePathname()
    const titleMode = titleModeFor(pathname)
    // O botão de recolher mora na borda da barra (`edge`). No laboratório
    // (`/laboratorio/barra`) o nome do quadro troca a versão para comparar.
    const toggle = useSyncExternalStore(
        semAssinatura,
        () => sidebarLabVersion(window.name),
        () => "edge" as const,
    )

    return (
        <AuthGuard>
            <NotificationsUiProvider>
                <PageChromeProvider>
                    <SidebarProvider defaultOpen={defaultSidebarOpen} toggle={toggle}>
                        <GlobalShellDialogsProvider>
                                <AppSidebar />
                                <SidebarInset>
                                    <AppHeader pathname={pathname} titleMode={titleMode} />
                                    <div data-workspace-content className="flex min-w-0 flex-1 flex-col gap-4 px-4 pb-(--bottom-bar-pad) pt-[calc(var(--mobile-header-offset)+1rem)] md:p-6 md:pb-6">
                                        {children}
                                    </div>
                                    <MobileBottomNav />
                                </SidebarInset>
                        </GlobalShellDialogsProvider>
                    </SidebarProvider>
                    <NotificationsSheet />
                </PageChromeProvider>
            </NotificationsUiProvider>
        </AuthGuard>
    )
}
