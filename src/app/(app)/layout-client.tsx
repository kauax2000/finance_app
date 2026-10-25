"use client"

import { ConvidadoRouteGuard } from "@/components/layout/convidado-route-guard"
import { SidebarAppShell } from "@/components/layout/sidebar-app-shell"

export default function AppLayoutClient({
    children,
    defaultSidebarOpen,
}: {
    children: React.ReactNode
    defaultSidebarOpen: boolean
}) {
    return (
        <SidebarAppShell defaultSidebarOpen={defaultSidebarOpen}>
            <ConvidadoRouteGuard>{children}</ConvidadoRouteGuard>
        </SidebarAppShell>
    )
}
