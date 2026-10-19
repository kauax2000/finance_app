"use client"

import * as React from "react"
import { AppCommandPalette } from "@/components/layout/app-command-palette"
import { NotificationBellLink } from "@/components/layout/notification-bell-link"
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { PageHeaderBack } from "@/components/ui/page-header"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
    TopBar,
    TopBarAction,
    TopBarActionGroup,
    TopBarActions,
    TopBarContent,
    TopBarSearch,
    TopBarStart,
    topBarPlateClassName,
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
 * segura, grudada no desktop, 56 no telefone e 52 no desktop — aberta ou
 * recolhida a barra lateral —, e sem tinta nem fio: o conteúdo que passa por
 * baixo some no borrão progressivo (`surface="edge"`), mais forte junto à
 * borda. No desktop ela corre por trás da placa flutuante da barra lateral e
 * não diz o nome da tela: do `lg` para cima são três colunas de peso igual —
 * vazio, busca do catálogo no meio, sino à direita.
 *
 * Uma árvore só: cada ponta diz o que mostra no telefone pelo `phone`, e os
 * `children` valem de `md` para cima. No telefone a carteira é o título, no
 * centro da barra (ícone, nome e chevron, como o "Instagram ⌄"), com a lupa
 * numa ponta e o sino na outra; nas subpáginas o voltar ocupa a esquerda e a
 * lupa volta para perto do sino. O mês das telas que o têm mora no topo do
 * conteúdo. No desktop, só o gatilho da barra lateral.
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
    // No telefone, nas telas raiz, a lupa vai à ponta esquerda e o sino fica só
    // na direita (como o "+" e o ♡ do Instagram): pontas iguais deixam o centro
    // largo para o nome da carteira. Nas subpáginas o voltar ocupa a esquerda,
    // e a lupa volta para perto do sino.
    const lupaNaEsquerda = !mobileBackHref
    // A lupa de ação (o círculo de vidro branco), a mesma nas três posições.
    const lupa = (className?: string) => (
        <TopBarAction
            type="button"
            label="Buscar"
            plate
            tooltip={false}
            shortcut="mod+k"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            onClick={openSearch}
            className={className}
        >
            <MagnifyingGlassIcon className="size-4" />
        </TopBarAction>
    )

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
                        <PageHeaderBack
                            href={mobileBackHref}
                            history={false}
                            // O mesmo círculo de vidro da lupa e do sino.
                            className={cn("ms-0", topBarPlateClassName)}
                        />
                    ) : (
                        lupa()
                    )
                }
            >
                <SidebarTrigger size="icon-lg" className="-ml-2 w-9" />
            </TopBarStart>
            {/* A barra não mostra o nome da tela, nem no telefone (lá quem diz
                onde se está é a barra de baixo; no desktop, a lateral): ele fica
                só para o leitor de tela, o `<h1>` da página. O meio segue como o
                par elástico da esquerda para a busca cair no centro. */}
            <TopBarContent
                phone={
                    <>
                        <h1 className="sr-only">{pageTitle}</h1>
                        {/* A carteira é o título visível do telefone, no centro da
                            barra. A largura deixa as pontas livres: 4rem de cada
                            lado com uma ação em cada ponta; 7rem nas subpáginas,
                            onde a direita tem a lupa e o sino. */}
                        <div
                            className={cn(
                                "absolute flex justify-center",
                                lupaNaEsquerda ? "inset-x-16" : "inset-x-28"
                            )}
                        >
                            <WorkspaceSwitcher appearance="header" />
                        </div>
                    </>
                }
                className="lg:flex-none lg:-me-2"
            >
                <h1 className="sr-only">{pageTitle}</h1>
            </TopBarContent>
            {/* A busca é a do catálogo e mora no meio: o título (`flex-1`, base
                0) e as ações (`lg:flex-1 lg:basis-0`) têm peso igual, e a
                pílula, de largura própria, fica no centro da barra. Abaixo de
                `lg` é a lupa; o `-me-1` devolve os 4px que a lupa tinha do
                sino. Fica fora do `phone`: lá o sino e a busca montariam duas
                vezes. */}
            <div className="flex shrink-0 items-center gap-1 max-lg:-me-1 lg:w-full lg:max-w-xs xl:max-w-sm lg:justify-center">
                {/* A paleta já escuta ⌘K; o `/` ela não escuta, então a
                    pílula não o anuncia. */}
                {busca === "barra" ? (
                    // No telefone a lupa é o `TopBarAction` branco (na ponta
                    // esquerda, ou ao lado do sino nas subpáginas): esta, cinza,
                    // fica para o tablet e o desktop. O `contents` não mexe no layout.
                    <span className="contents max-md:hidden">
                        <TopBarSearch
                            onOpen={openSearch}
                            listen={false}
                            slash={false}
                            collapse="lg"
                            glow
                            plate
                            placeholder="Buscar telas e ações…"
                        />
                    </span>
                ) : null}
            </div>
            <TopBarActions className="lg:flex-1 lg:basis-0 lg:justify-end">
                {/* Lupa e sino lado a lado colam numa cápsula, como no desktop;
                    `join` diz de que lado da quebra os dois existem juntos. */}
                {busca === "botao" ? (
                    <TopBarActionGroup join={lupaNaEsquerda ? "desktop" : "always"}>
                        {lupa(cn(lupaNaEsquerda && "max-md:hidden"))}
                        <NotificationBellLink />
                    </TopBarActionGroup>
                ) : lupaNaEsquerda ? (
                    <NotificationBellLink />
                ) : (
                    <TopBarActionGroup join="phone">
                        {lupa("md:hidden")}
                        <NotificationBellLink />
                    </TopBarActionGroup>
                )}
            </TopBarActions>

            {/* Portalizada: não ocupa lugar na linha do `TopBar`. */}
            <AppCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </TopBar>
    )
}
