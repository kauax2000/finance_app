"use client"

import { resolveAppSubPageMeta } from "@/components/layout/breadcrumb"
import { usePageChromeState } from "@/components/layout/page-chrome-provider"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { APP_PAGE_TITLES, DASHBOARD_PAGE_TITLES, ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"

export function defaultMobileTitle(
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
    if (/^\/projetos\/[^/]+$/.test(pathname)) return "Projeto"
    if (titleMode === "dashboard") {
        return DASHBOARD_PAGE_TITLES[pathname] ?? "Painel"
    }
    return APP_PAGE_TITLES[pathname] ?? "Finance App"
}

type TituloDaTelaProps = {
    pathname: string
    titleMode: "dashboard" | "app"
}

/**
 * O título grande de toda tela no telefone: mora na casca, e não em cada página,
 * para aparecer no clique, antes do `AdiarMontagem`. O `<h1>` é o da barra do topo.
 * A página Você não o tem: quem a abre é a identidade da pessoa. No desktop cada
 * tela revisada escreve o próprio `PageHeader`.
 */
export function TituloDaTela({ pathname, titleMode }: TituloDaTelaProps) {
    const chrome = usePageChromeState()
    const isMobile = useIsMobile()
    if (!isMobile || pathname === ROUTES.ME) return null

    const titulo = chrome?.title ?? defaultMobileTitle(pathname, titleMode)
    return (
        <PageHeader key={pathname} collapse>
            <PageHeaderTitle asChild>
                <p aria-hidden="true">{titulo}</p>
            </PageHeaderTitle>
        </PageHeader>
    )
}
