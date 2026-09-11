"use client"

import { NotificationBellLink } from "@/components/layout/notification-bell-link"
import { PageHeaderBack } from "@/components/ui/page-header"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    TopBar,
    TopBarActions,
    TopBarContent,
    TopBarStart,
    TopBarTitle,
} from "@/components/ui/top-bar"
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

type AppHeaderProps = {
    pathname: string
    titleMode: "dashboard" | "app"
}

/**
 * A barra do app é o `TopBar` na forma da casca: fixa no telefone com a área
 * segura, grudada no desktop, 48 no telefone e no desktop — aberta ou
 * recolhida a barra lateral —, e
 * vidro depois que a tela rola.
 *
 * As duas árvores são `contents`: o que decide a linha é o `TopBar`, e as peças
 * continuam filhas diretas dele nos dois ramos.
 */
export function AppHeader({ pathname, titleMode }: AppHeaderProps) {
    const chromeSlot = usePageChromeState()

    const mobileTitle =
        chromeSlot?.title ?? defaultMobileTitle(pathname, titleMode)
    const mobileBackHref =
        chromeSlot?.backHref ?? defaultMobileBackHref(pathname)

    return (
        <TopBar position="auto" surface="scroll">
            <div className="contents md:hidden">
                <TopBarStart>
                    {mobileBackHref ? (
                        <PageHeaderBack href={mobileBackHref} />
                    ) : (
                        <WorkspaceSwitcher appearance="header" />
                    )}
                </TopBarStart>
                <TopBarTitle>{mobileTitle}</TopBarTitle>
                <TopBarActions>
                    {chromeSlot?.dateFilter}
                    <NotificationBellLink />
                </TopBarActions>
            </div>

            <div className="hidden md:contents">
                <TopBarStart>
                    <SidebarTrigger className="-ml-2" />
                </TopBarStart>
                <TopBarContent>
                    {titleMode === "dashboard" ? (
                        <DashboardPageTitle pathname={pathname} />
                    ) : (
                        <AppBreadcrumbNav pathname={pathname} />
                    )}
                </TopBarContent>
                <TopBarActions>
                    <NotificationBellLink />
                </TopBarActions>
            </div>
        </TopBar>
    )
}
