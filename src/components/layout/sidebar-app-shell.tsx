"use client"

import { useEffect, useSyncExternalStore } from "react"
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

/** As rotas que a navegação abre, na ordem em que vale aquecer. */
const ROTAS_DO_APP = [
    ROUTES.DASHBOARD,
    ROUTES.TRANSACTIONS,
    ROUTES.BILLS,
    ROUTES.SUBSCRIPTIONS,
    ROUTES.CREDIT_CARDS,
    ROUTES.DASHBOARD_CATEGORIES,
    ROUTES.SETTINGS,
    ROUTES.MEMBERS,
    ROUTES.PLANS,
    ROUTES.ACCOUNT,
    ROUTES.ACCOUNT_ACTIVITY,
    ROUTES.ACCOUNT_SESSIONS,
]

/**
 * Só em `next dev`: o servidor compila cada rota na primeira visita, e o
 * clique esperava essa compilação (~1s) antes de trocar de tela. Pedir o
 * payload de cada rota em segundo plano, uma de cada vez, deixa todas
 * compiladas antes do clique. Em produção o bloco some (não há compilação).
 */
function aquecerRotasEmDesenvolvimento() {
    if (process.env.NODE_ENV !== "development") return
    let cancelado = false
    const aquecer = async () => {
        for (const rota of ROTAS_DO_APP) {
            if (cancelado) return
            await fetch(rota, { headers: { RSC: "1" } }).catch(() => undefined)
        }
    }
    // O Safari (iPhone e Mac) não tem `requestIdleCallback`: lá, um segundo depois.
    if (typeof requestIdleCallback !== "function") {
        const id = setTimeout(aquecer, 1000)
        return () => {
            cancelado = true
            clearTimeout(id)
        }
    }
    const id = requestIdleCallback(aquecer)
    return () => {
        cancelado = true
        cancelIdleCallback(id)
    }
}

export function SidebarAppShell({
    children,
    defaultSidebarOpen,
}: SidebarAppShellProps) {
    const pathname = usePathname()
    const titleMode = titleModeFor(pathname)
    useEffect(aquecerRotasEmDesenvolvimento, [])
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
