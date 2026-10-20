"use client"

import * as React from "react"
import { AppCommandPalette } from "@/components/layout/app-command-palette"
import { NotificationBellButton, useUnreadBellCount } from "@/components/layout/notification-bell-link"
import { AdjustmentsHorizontalIcon, CalendarIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PageHeaderBack } from "@/components/ui/page-header"
import { ToolbarFilterIndicator } from "@/components/ui/toolbar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
    TopBar,
    TopBarAction,
    TopBarActionGroup,
    TopBarActionSwap,
    TopBarActions,
    TopBarContent,
    TopBarSearch,
    TopBarStart,
} from "@/components/ui/top-bar"
import { resolveAppSubPageMeta } from "@/components/layout/breadcrumb"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { filtroDoCabecalho, usePageChromeFilterFor, usePageChromeState } from "@/components/layout/page-chrome-provider"
import { useBuscaDoCabecalho } from "@/hooks/use-busca-do-cabecalho"
import {
    APP_PAGE_TITLES,
    DASHBOARD_PAGE_TITLES,
    ROUTES,
} from "@/config/navigation"
import { mobileHeaderFilterFor, voceBackHref } from "@/config/mobile-navigation"

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
    // Planos e pagamentos só se abre de Minha conta no telefone; no desktop a
    // migalha não o põe debaixo dela (por isso não está em APP_SUB_PAGE_TITLES).
    if (pathname === ROUTES.PLANS) return ROUTES.ACCOUNT
    // Por último: as telas listadas na página Você voltam a ela (não são
    // subpáginas de ninguém, então nada acima as reconhece).
    return voceBackHref(pathname)
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
 * centro da barra (ícone, nome e chevron, como o "Instagram ⌄"), com o sino à
 * esquerda e a lupa à direita; nas subpáginas o voltar toma o lugar do sino, e
 * as telas abertas pela página Você voltam a ela. A tela que tem filtro o
 * publica (`usePageChromeFilter`), e ele cola na lupa, numa cápsula. O mês
 * das telas que o têm mora no topo do conteúdo. No desktop, só o gatilho da
 * barra lateral.
 *
 * Trocar de tela no telefone é líquido: o sino e o voltar dividem um vidro só
 * (`TopBarActionSwap`), que afunda e volta enquanto o ícone troca, e o filtro
 * pinga da lupa e volta a ela (`TopBarActionGroup morph`). Montar não anima.
 */
export function AppHeader({ pathname, titleMode }: AppHeaderProps) {
    const chromeSlot = usePageChromeState()
    const filtro = filtroDoCabecalho(mobileHeaderFilterFor(pathname), usePageChromeFilterFor(pathname))
    // Uma sondagem só: o sino aparece no telefone (esquerda) e no desktop (direita).
    useUnreadBellCount()
    // A busca tem um gatilho (lupa no telefone, pílula no desktop) e uma
    // paleta só, que também abre por ⌘K. Ela mora aqui porque a barra existe
    // em toda tela da casca.
    const [searchOpen, setSearchOpen] = React.useState(false)
    const openSearch = () => setSearchOpen(true)
    // Do `lg` para cima a busca é a pílula no centro ou a lupa colada ao sino,
    // pela escolha em Configurações › Aparência (neste aparelho).
    const [busca] = useBuscaDoCabecalho()
    // A lupa do telefone é a origem da busca: a pílula nasce dela e volta a ela.
    const lupaRef = React.useRef<HTMLButtonElement>(null)
    // O filtro colado à lupa é a origem do ×: a cápsula se divide em duas
    // bolhas. Fica no botão, dentro da gota da cápsula. Nas telas sem filtro o
    // React zera o ref quando a gota volta à lupa, e a lupa se divide.
    const filtroRef = React.useRef<HTMLButtonElement>(null)

    const pageTitle =
        chromeSlot?.title ?? defaultMobileTitle(pathname, titleMode)
    const mobileBackHref =
        chromeSlot?.backHref ?? defaultMobileBackHref(pathname)
    // A lupa de ação (o círculo de vidro branco), a mesma no telefone e no desktop.
    // `origem`: é a do telefone, de onde a busca nasce.
    const lupa = (origem = false) => (
        <TopBarAction
            ref={origem ? lupaRef : undefined}
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
    )
    // O filtro da tela no telefone: abre a folha da tela, ou o popover que ela
    // entrega (o calendário do mês), ancorado no próprio botão. O ponto no
    // canto diz que há filtro fora do padrão.
    const [filtroAberto, setFiltroAberto] = React.useState(false)
    const botaoDoFiltro = filtro ? (
        <TopBarAction
            ref={filtroRef}
            type="button"
            label={filtro.label}
            plate
            tooltip={false}
            aria-haspopup="dialog"
            aria-expanded={filtro.popover ? filtroAberto : undefined}
            disabled={filtro.disabled}
            onClick={filtro.popover ? undefined : filtro.onOpen}
        >
            {filtro.icon === "month" ? (
                <CalendarIcon className="size-4" />
            ) : (
                <AdjustmentsHorizontalIcon className="size-4" />
            )}
            {filtro.active ? <ToolbarFilterIndicator className="top-2 right-2" /> : null}
        </TopBarAction>
    ) : null
    const filtroNoCabecalho =
        filtro?.popover && botaoDoFiltro ? (
            <Popover open={filtroAberto} onOpenChange={setFiltroAberto}>
                <PopoverTrigger asChild>{botaoDoFiltro}</PopoverTrigger>
                <PopoverContent align="end" size="auto" padding="none" label={filtro.label}>
                    {filtro.popover(() => setFiltroAberto(false))}
                </PopoverContent>
            </Popover>
        ) : (
            botaoDoFiltro
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
                    // Um vidro só para o sino e o voltar: trocar de um para o
                    // outro afunda o círculo e troca o ícone dentro dele. O vidro
                    // é do swap, e nenhum dos dois desenha o próprio.
                    <TopBarActionSwap swapKey={mobileBackHref ? "voltar" : "sino"}>
                        {mobileBackHref ? (
                            // O voltar pelo histórico (rodada 232) fica desligado aqui:
                            // ligá-lo muda o destino do voltar do telefone, e isso é
                            // mudança de jornada (docs/JORNADAS.md e o Atlas).
                            <PageHeaderBack href={mobileBackHref} history={false} className="ms-0" />
                        ) : (
                            <NotificationBellButton />
                        )}
                    </TopBarActionSwap>
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
                            lado com uma ação em cada ponta; 7rem quando a direita
                            tem a lupa e o filtro. */}
                        <div
                            className={cn(
                                "absolute flex justify-center",
                                filtro ? "inset-x-28" : "inset-x-16"
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
                    // No telefone a lupa é o `TopBarAction` branco, na ponta
                    // direita: esta, cinza,
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
            <TopBarActions
                className="lg:flex-1 lg:basis-0 lg:justify-end"
                phone={
                    // No telefone, a lupa à direita; com o filtro da tela, os
                    // dois colam numa cápsula, a lupa primeiro. O grupo é o
                    // mesmo com ou sem filtro: ele pinga da lupa ao chegar e
                    // volta a ela ao sair, e a identidade (`month`, `filter`)
                    // troca o ícone no lugar.
                    <TopBarActionGroup morph trailingKey={filtro?.icon ?? undefined}>
                        {lupa(true)}
                        {filtroNoCabecalho}
                    </TopBarActionGroup>
                }
            >
                {/* Do `md` para cima, o sino; com a busca em "Botão", a lupa
                    cola nele numa cápsula. */}
                {busca === "botao" ? (
                    <TopBarActionGroup>
                        {lupa()}
                        <NotificationBellButton />
                    </TopBarActionGroup>
                ) : (
                    <NotificationBellButton />
                )}
            </TopBarActions>

            {/* Portalizada: não ocupa lugar na linha do `TopBar`. */}
            <AppCommandPalette
                open={searchOpen}
                onOpenChange={setSearchOpen}
                origin={lupaRef}
                closeOrigin={filtroRef}
            />
        </TopBar>
    )
}
