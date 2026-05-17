"use client"

import { SidebarAppShell } from "@/components/layout/sidebar-app-shell"

export default function AppLayoutClient({
    children,
    defaultSidebarOpen,
}: {
    children: React.ReactNode
    defaultSidebarOpen: boolean
}) {
    return (
        <SidebarAppShell defaultSidebarOpen={defaultSidebarOpen} titleMode="app">
            {children}
        </SidebarAppShell>
    )
}
