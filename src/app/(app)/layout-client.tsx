"use client"

import { ConvidadoRouteGuard } from "@/components/layout/convidado-route-guard"
import { RegistroDeAcesso } from "@/components/reativacao/registro-de-acesso"
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
            <RegistroDeAcesso />
            <ConvidadoRouteGuard>{children}</ConvidadoRouteGuard>
        </SidebarAppShell>
    )
}
