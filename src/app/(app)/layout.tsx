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
import { ChevronRight, ArrowLeft } from "lucide-react"

// Mapeamento de títulos das páginas principais
const pageTitles: Record<string, string> = {
    "/account": "Minha conta",
    "/plans": "Planos e pagamentos",
    "/notifications": "Notificações",
}

// Mapeamento de sub-rotas com seus títulos e página pai
const subPageTitles: Record<string, { parent: string; parentTitle: string; title: string }> = {
    "/account/sessions": { parent: "/account", parentTitle: "Minha conta", title: "Sessões Ativas" },
    "/account/activity": { parent: "/account", parentTitle: "Minha conta", title: "Atividade" },
}

// Componente de breadcrumb para sub-páginas
function BreadcrumbNav({ pathname }: { pathname: string }) {
    const subPage = subPageTitles[pathname]

    if (!subPage) {
        // Se não é uma sub-página, mostra apenas o título normal
        const title = pageTitles[pathname] || "Finance App"
        return (
            <h1 className="text-base font-medium">{title}</h1>
        )
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <Link
                href={subPage.parent}
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                {subPage.parentTitle}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-base font-medium text-foreground">
                {subPage.title}
            </h1>
        </div>
    )
}

// Componente de botão voltar para sub-páginas
function BackButton({ pathname }: { pathname: string }) {
    const subPage = subPageTitles[pathname]

    if (!subPage) {
        return null
    }

    return (
        <div className="-mt-2">
            <Button variant="ghost" size="sm" asChild className="gap-2">
                <Link href={subPage.parent}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Link>
            </Button>
        </div>
    )
}

export default function AppLayout({
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
                        <BreadcrumbNav pathname={pathname} />
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
                    <BackButton pathname={pathname} />
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
