"use client"

import {
    SidebarHeader,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import { AppLogo } from "@/components/layout/app-logo"

export function SidebarLogo() {
    return (
        <SidebarHeader className="min-w-0 group-data-[collapsible=icon]:h-12">
            <SidebarMenuButton
                size="lg"
                className="h-12 w-full min-w-0 hover:bg-transparent hover:text-sidebar-accent-foreground"
            >
                <AppLogo size="sm" className="size-8!" />
                <span className="min-w-0 flex-1 truncate text-left text-lg font-semibold group-data-[collapsible=icon]:hidden">
                    Finance App
                </span>
            </SidebarMenuButton>
        </SidebarHeader>
    )
}
