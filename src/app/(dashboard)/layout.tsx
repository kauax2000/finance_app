"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Bell } from "lucide-react"
import Link from "next/link"

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/wallets": "Carteiras",
    "/dashboard/transactions": "Transações",
    "/dashboard/categories": "Categorias",
    "/dashboard/settings": "Configurações",
}

function PageTitle({ pathname }: { pathname: string }) {
    const title = pageTitles[pathname] || "Dashboard"
    return (
        <h1 className="text-base font-medium">{title}</h1>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading, signOut } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <div data-orientation="vertical" role="none" data-slot="separator" className="shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px mr-2 data-[orientation=vertical]:h-4"></div>
                        <PageTitle pathname={pathname} />
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-3 pr-4">
                        <Link
                            href="/notifications"
                            className="flex items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        >
                            <Bell className="h-4 w-4" />
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 md:hidden"
                            onClick={() => signOut()}
                        >
                            Sair
                        </Button>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
