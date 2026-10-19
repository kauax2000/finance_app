"use client"

import * as React from "react"
import { AppCommandPalette } from "@/components/layout/app-command-palette"
import { NotificationBellLink } from "@/components/layout/notification-bell-link"
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { PageHeaderBack } from "@/components/ui/page-header"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    TopBar,
    TopBarAction,
    TopBarActionGroup,
    TopBarActions,
    TopBarContent,
    TopBarSearch,
    TopBarStart,
    TopBarTitle,
} from "@/components/ui/top-bar"
import { resolveAppSubPageMeta } from "@/components/layout/breadcrumb"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { usePageChromeState } from "@/components/layout/page-chrome-provider"
import { useBuscaDoCabecalho } from "@/hooks/use-busca-do-cabecalho"
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
 * segura, grudada no desktop, 48 no telefone e 52 no desktop — aberta ou
 * recolhida a barra lateral —, e sem tinta nem fio: o conteúdo que passa por
 * baixo some no borrão progressivo (`surface="edge"`), mais forte junto à
 * borda. No desktop ela corre por trás da placa flutuante da barra lateral e
 * não diz o nome da tela: do `lg` para cima são três colunas de peso igual —
 * vazio, busca do catálogo no meio, sino à direita.
 *
 * Uma árvore só: cada ponta diz o que mostra no telefone pelo `phone`, e os
 * `children` valem de `md` para cima — no telefone o voltar (ou a carteira) e
 * o título; no desktop só o gatilho da barra lateral.
 */
export function AppHeader({ pathname, titleMode }: AppHeaderProps) {
    const chromeSlot = usePageChromeState()
    // A busca tem um gatilho (lupa no telefone, pílula no desktop) e uma
    // paleta só, que também abre por ⌘K. Ela mora aqui porque a barra existe
    // em toda tela da casca.
    const [searchOpen, setSearchOpen] = React.useState(false)
    const openSearch = () => setSearchOpen(true)
    // Do `lg` para cima a busca é a pílula no centro ou a lupa colada ao sino,
    // pela escolha em Configurações › Aparência (neste aparelho).
    const [busca] = useBuscaDoCabecalho()

    const pageTitle =
        chromeSlot?.title ?? defaultMobileTitle(pathname, titleMode)
    const mobileBackHref =
        chromeSlot?.backHref ?? defaultMobileBackHref(pathname)

    return (
        <TopBar position="auto" surface="edge">
            {/* O botão de recolher mora aqui, à esquerda, nos dois estados
                (`toggle="header"`): a pílula da placa, 36 como o sino, e a 16px da
                placa como o sino está da borda direita (o recuo de 16 da barra
                menos os 8 da calha que a folga inclui). Do `lg` para
                cima a ponta pesa o mesmo que a do sino (`flex-1`, base 0), para a
                busca seguir no centro. */}
            <TopBarStart
                className="lg:flex-1 lg:basis-0"
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
                <SidebarTrigger size="icon-lg" className="-ml-2 w-9" />
            </TopBarStart>
            {/* O título do telefone mora no meio, e não numa ponta própria:
                uma segunda peça `flex-1` vazia dividiria a linha e o título
                truncaria antes. No desktop a barra não mostra o nome da tela (a
                lateral marca onde se está): ele fica só para o leitor de tela, o
                `<h1>` da página. O meio segue como o par elástico da esquerda
                para a busca cair no centro. */}
            <TopBarContent phone={<TopBarTitle>{pageTitle}</TopBarTitle>} className="lg:flex-none lg:-me-2">
                <h1 className="sr-only">{pageTitle}</h1>
            </TopBarContent>
            {/* A busca é a do catálogo e mora no meio: o título (`flex-1`, base
                0) e as ações (`lg:flex-1 lg:basis-0`) têm peso igual, e a
                pílula, de largura própria, fica no centro da barra. Abaixo de
                `lg` é a lupa. O recorte de tempo do telefone mora aqui, antes
                da lupa, para a ordem ficar recorte, lupa, sino; o `-me-1`
                devolve os 4px que a lupa tinha do sino. Fica fora do `phone`:
                lá o sino e a busca montariam duas vezes. */}
            <div className="flex shrink-0 items-center gap-1 max-lg:-me-1 lg:w-full lg:max-w-xs xl:max-w-sm lg:justify-center">
                <span className="contents md:hidden">{chromeSlot?.dateFilter}</span>
                {/* A paleta já escuta ⌘K; o `/` ela não escuta, então a
                    pílula não o anuncia. */}
                {busca === "barra" ? (
                    <TopBarSearch
                        onOpen={openSearch}
                        listen={false}
                        slash={false}
                        collapse="lg"
                        glow
                        plate
                        placeholder="Buscar telas e ações…"
                    />
                ) : null}
            </div>
            <TopBarActions className="lg:flex-1 lg:basis-0 lg:justify-end">
                {busca === "botao" ? (
                    <TopBarActionGroup>
                        <TopBarAction
                            type="button"
                            label="Buscar"
                            plate
                            tooltip={false}
                            shortcut="mod+k"
                            aria-haspopup="dialog"
                            aria-expanded={searchOpen}
                            onClick={openSearch}
                        >
                            <MagnifyingGlassIcon className="size-4" />
                        </TopBarAction>
                        <NotificationBellLink />
                    </TopBarActionGroup>
                ) : (
                    <NotificationBellLink />
                )}
            </TopBarActions>

            {/* Portalizada: não ocupa lugar na linha do `TopBar`. */}
            <AppCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </TopBar>
    )
}
