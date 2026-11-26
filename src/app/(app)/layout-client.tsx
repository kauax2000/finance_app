"use client"

import { AquecerMembros } from "@/components/layout/aquecer-membros"
import { ConvidadoRouteGuard } from "@/components/layout/convidado-route-guard"
import { RegistroDeAcesso } from "@/components/reativacao/registro-de-acesso"
import { SidebarAppShell } from "@/components/layout/sidebar-app-shell"
import { TopoAoTrocarDeTela } from "@/components/layout/topo-ao-trocar-de-tela"

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
            <AquecerMembros />
            <TopoAoTrocarDeTela />
            <ConvidadoRouteGuard>{children}</ConvidadoRouteGuard>
        </SidebarAppShell>
    )
}
