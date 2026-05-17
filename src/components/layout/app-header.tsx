"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import { NotificationBellLink } from "@/components/layout/notification-bell-link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    AppBreadcrumbNav,
    resolveAppSubPageMeta,
} from "@/components/layout/breadcrumb"
import { DashboardPageTitle } from "@/components/layout/page-title"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { usePageChromeState } from "@/components/layout/page-chrome-provider"
import {
    APP_PAGE_TITLES,
    DASHBOARD_PAGE_TITLES,
    ROUTES,
} from "@/config/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const headerBaseClassName =
    "w-full min-w-0 shrink-0 border-b border-border max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-40 max-md:pt-[env(safe-area-inset-top,0px)] md:sticky md:top-0 md:z-10 transition-[background-color] duration-200"

const headerRowClassName =
    "flex h-16 max-md:h-14 w-full min-w-0 items-center gap-0 transition-[height] ease-linear md:group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"

function defaultMobileTitle(
    pathname: string,
    titleMode: "dashboard" | "app",
): string {
    const sub = resolveAppSubPageMeta(pathname)
    if (sub?.title) return sub.title
    if (pathname === `${ROUTES.DASHBOARD_CATEGORIES}/new`) {
        return "Nova categoria"
    }
    if (
        /^\/categories\/[^/]+$/.test(pathname) &&
        pathname !== ROUTES.DASHBOARD_CATEGORIES
    ) {
        return "Detalhes da categoria"
    }
    if (titleMode === "dashboard") {
        return DASHBOARD_PAGE_TITLES[pathname] ?? "Dashboard"
    }
    return APP_PAGE_TITLES[pathname] ?? "Finance App"
}

function defaultMobileBackHref(pathname: string): string | undefined {
    const sub = resolveAppSubPageMeta(pathname)
    if (sub) return sub.parent
    if (
        pathname === `${ROUTES.DASHBOARD_CATEGORIES}/new` ||
        (/^\/categories\/[^/]+$/.test(pathname) &&
            pathname !== ROUTES.DASHBOARD_CATEGORIES)
    ) {
        return ROUTES.DASHBOARD_CATEGORIES
    }
    return undefined
}

function MobileHeaderBack({ href }: { href: string }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="-ml-1 size-9 shrink-0 active:bg-accent group-active:bg-accent"
            asChild
        >
            <Link href={href} aria-label="Voltar">
                <ArrowLeftIcon className="h-4 w-4" aria-hidden />
            </Link>
        </Button>
    )
}

type AppHeaderProps = {
    pathname: string
    titleMode: "dashboard" | "app"
}

export function AppHeader({ pathname, titleMode }: AppHeaderProps) {
    const [scrolled, setScrolled] = useState(false)
    const chromeSlot = usePageChromeState()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 0)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    const mobileTitle =
        chromeSlot?.title ?? defaultMobileTitle(pathname, titleMode)
    const mobileBackHref =
        chromeSlot?.backHref ?? defaultMobileBackHref(pathname)

    return (
        <header
            className={cn(
                headerBaseClassName,
                "flex flex-col",
                scrolled
                    ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    : "bg-background",
            )}
        >
            <div
                className={cn(
                    headerRowClassName,
                    "flex w-full min-w-0 items-center gap-0 px-4",
                )}
            >
                {/* Mobile: carteira + voltar + título + notificações + filtro */}
                <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
                    {mobileBackHref ? (
                        <MobileHeaderBack href={mobileBackHref} />
                    ) : (
                        <WorkspaceSwitcher appearance="header" />
                    )}
                    <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-foreground">
                        {mobileTitle}
                    </h1>
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                        {chromeSlot?.dateFilter ? (
                            <div className="flex shrink-0 items-center">
                                {chromeSlot.dateFilter}
                            </div>
                        ) : null}
                        <NotificationBellLink />
                    </div>
                </div>

                {/* Desktop chrome */}
                <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
                    <div className="flex shrink-0 items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="h-7 shrink-0 bg-border"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        {titleMode === "dashboard" ? (
                            <DashboardPageTitle pathname={pathname} />
                        ) : (
                            <AppBreadcrumbNav pathname={pathname} />
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <NotificationBellLink />
                    </div>
                </div>
            </div>
        </header>
    )
}
