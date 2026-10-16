"use client"

import * as React from "react"
import { AppCommandPalette } from "@/components/layout/app-command-palette"
import { NotificationBellLink } from "@/components/layout/notification-bell-link"
import { PageHeaderBack } from "@/components/ui/page-header"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    TopBar,
    TopBarActions,
    TopBarContent,
    TopBarSearch,
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
        return DASHBOARD_PAGE_TITLES[pathname] ?? "Painel"
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
 * vidro depois que a tela rola. No desktop ela corre por trás da placa
 * flutuante da barra lateral, e a trilha segue começando na coluna do
 * conteúdo. Do `lg` para cima são três colunas de peso igual — trilha, busca
 * do catálogo no meio, sino à direita.
 *
 * Uma árvore só: cada ponta diz o que mostra no telefone pelo `phone`, e os
 * `children` valem de `md` para cima — no telefone o voltar (ou a carteira) e
 * o título; no desktop o gatilho da barra lateral e a trilha.
 */
export function AppHeader({ pathname, titleMode }: AppHeaderProps) {
    const chromeSlot = usePageChromeState()
    // A busca tem um gatilho (lupa no telefone, pílula no desktop) e uma
    // paleta só, que também abre por ⌘K. Ela mora aqui porque a barra existe
    // em toda tela da casca.
    const [searchOpen, setSearchOpen] = React.useState(false)
    const openSearch = () => setSearchOpen(true)

    const mobileTitle =
        chromeSlot?.title ?? defaultMobileTitle(pathname, titleMode)
    const mobileBackHref =
        chromeSlot?.backHref ?? defaultMobileBackHref(pathname)

    return (
        <TopBar position="auto" surface="scroll">
            <TopBarStart
                phone={
                    mobileBackHref ? (
                        // O voltar pelo histórico (rodada 232) fica desligado aqui:
                        // ligá-lo muda o destino do voltar do telefone, e isso é
                        // mudança de jornada (docs/JORNADAS.md e o Atlas).
                        <PageHeaderBack href={mobileBackHref} history={false} />
                    ) : (
                        <WorkspaceSwitcher appearance="header" />
                    )
                }
            >
                <SidebarTrigger className="-ml-2" />
            </TopBarStart>
            {/* O título do telefone mora no meio, e não numa ponta própria:
                uma segunda peça `flex-1` vazia dividiria a linha e o título
                truncaria antes. */}
            <TopBarContent phone={<TopBarTitle>{mobileTitle}</TopBarTitle>}>
                {titleMode === "dashboard" ? (
                    <DashboardPageTitle pathname={pathname} />
                ) : (
                    <AppBreadcrumbNav pathname={pathname} />
                )}
            </TopBarContent>
            {/* A busca é a do catálogo e mora no meio: o título (`flex-1`, base
                0) e as ações (`lg:flex-1 lg:basis-0`) têm peso igual, e a
                pílula, de largura própria, fica no centro da barra. Abaixo de
                `lg` é a lupa. O recorte de tempo do telefone mora aqui, antes
                da lupa, para a ordem ficar recorte, lupa, sino; o `-me-1`
                devolve os 4px que a lupa tinha do sino. Fica fora do `phone`:
                lá o sino e a busca montariam duas vezes. */}
            <div className="flex shrink-0 items-center gap-1 max-lg:-me-1 lg:w-full lg:max-w-sm lg:justify-center">
                <span className="contents md:hidden">{chromeSlot?.dateFilter}</span>
                {/* A paleta já escuta ⌘K; o `/` ela não escuta, então a
                    pílula não o anuncia. */}
                <TopBarSearch
                    onOpen={openSearch}
                    listen={false}
                    slash={false}
                    collapse="lg"
                    glow
                    placeholder="Buscar telas e ações…"
                />
            </div>
            <TopBarActions className="lg:flex-1 lg:basis-0 lg:justify-end">
                <NotificationBellLink />
            </TopBarActions>

            {/* Portalizada: não ocupa lugar na linha do `TopBar`. */}
            <AppCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </TopBar>
    )
}
