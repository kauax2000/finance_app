"use client"

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
import { MobileFabProvider } from "@/components/layout/mobile-fab-provider"
import { PageChromeProvider } from "@/components/layout/page-chrome-provider"

type SidebarAppShellProps = {
    children: React.ReactNode
    titleMode: "dashboard" | "app"
    defaultSidebarOpen: boolean
}

export function SidebarAppShell({
    children,
    titleMode,
    defaultSidebarOpen,
}: SidebarAppShellProps) {
    const pathname = usePathname()

    return (
        <AuthGuard>
            <NotificationsUiProvider>
                <PageChromeProvider>
                    <SidebarProvider defaultOpen={defaultSidebarOpen}>
                        <GlobalShellDialogsProvider>
                            <MobileFabProvider>
                                <AppSidebar />
                                <SidebarInset>
                                    <AppHeader pathname={pathname} titleMode={titleMode} />
                                    <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 pb-[var(--mobile-bottom-pad)] pt-[calc(var(--mobile-header-offset)+1rem)] md:p-6 md:pb-6">
                                        {children}
                                    </div>
                                    <MobileBottomNav />
                                </SidebarInset>
                            </MobileFabProvider>
                        </GlobalShellDialogsProvider>
                    </SidebarProvider>
                    <NotificationsSheet />
                </PageChromeProvider>
            </NotificationsUiProvider>
        </AuthGuard>
    )
}
