"use client"

import { useEffect } from "react"
import { resolveAppSubPageMeta } from "@/components/layout/breadcrumb"
import { usePageChromeState } from "@/components/layout/page-chrome-provider"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { ROTAS_COM_TITULO_NA_BARRA } from "@/config/mobile-navigation"
import { APP_PAGE_TITLES, DASHBOARD_PAGE_TITLES, ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { publishPageTitle } from "@/hooks/use-page-title-dock"

/** Quanto a tela rola antes de o nome subir à barra: o tremor do dedo não o acende. */
const ROLAGEM_MINIMA = 8

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
    /** Tem voltar: é subpágina, e o nome só aparece na barra, depois de rolar. */
    subpagina: boolean
}

/**
 * O título grande das telas de aba no telefone: mora na casca, e não em cada página,
 * para aparecer no clique, antes do `AdiarMontagem`. O `<h1>` é o da barra do topo.
 * A página Você não o tem: quem a abre é a identidade da pessoa. A subpágina também
 * não: o nome dela sobe à barra ao rolar. No desktop cada tela revisada escreve o
 * próprio `PageHeader`.
 */
export function TituloDaTela({ pathname, titleMode, subpagina }: TituloDaTelaProps) {
    const chrome = usePageChromeState()
    const isMobile = useIsMobile()
    const titulo = chrome?.title ?? defaultMobileTitle(pathname, titleMode)

    useEffect(() => {
        if (!isMobile || !subpagina) return
        // As telas de configuração da Você e Membros: o nome já nasce no centro da barra.
        const fixo = ROTAS_COM_TITULO_NA_BARRA.includes(pathname)
        const publicar = () =>
            publishPageTitle(document, { text: titulo, docked: fixo || window.scrollY > ROLAGEM_MINIMA })
        publicar()
        window.addEventListener("scroll", publicar, { passive: true })
        return () => {
            window.removeEventListener("scroll", publicar)
            publishPageTitle(document, null)
        }
    }, [isMobile, subpagina, titulo, pathname])

    if (!isMobile || subpagina || pathname === ROUTES.ME) return null
    return (
        <PageHeader key={pathname} collapse>
            <PageHeaderTitle asChild>
                <p aria-hidden="true">{titulo}</p>
            </PageHeaderTitle>
        </PageHeader>
    )
}
