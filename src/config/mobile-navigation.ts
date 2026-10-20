import {
    ArrowPathRoundedSquareIcon,
    RectangleStackIcon,
    ClipboardDocumentCheckIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    SparklesIcon,
    Squares2X2Icon,
    TagIcon,
    UserCircleIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline"
import {
    ArrowPathRoundedSquareIcon as ArrowPathRoundedSquareSolid,
    RectangleStackIcon as RectangleStackSolid,
    ClipboardDocumentCheckIcon as ClipboardDocumentCheckSolid,
    Cog6ToothIcon as Cog6ToothSolid,
    CreditCardIcon as CreditCardSolid,
    SparklesIcon as SparklesSolid,
    Squares2X2Icon as Squares2X2Solid,
    TagIcon as TagSolid,
    UserCircleIcon as UserCircleSolid,
    UserGroupIcon as UserGroupSolid,
} from "@heroicons/react/24/solid"
import {
    ArrowPathRoundedSquareIcon as ArrowPathRoundedSquareMicro,
    RectangleStackIcon as RectangleStackMicro,
    ClipboardDocumentCheckIcon as ClipboardDocumentCheckMicro,
    Cog6ToothIcon as Cog6ToothMicro,
    CreditCardIcon as CreditCardMicro,
    SparklesIcon as SparklesMicro,
    Squares2X2Icon as Squares2X2Micro,
    TagIcon as TagMicro,
    UserCircleIcon as UserCircleMicro,
    UserGroupIcon as UserGroupMicro,
} from "@heroicons/react/16/solid"
import {
    ArrowPathRoundedSquareIcon as ArrowPathRoundedSquareMini,
    RectangleStackIcon as RectangleStackMini,
    ClipboardDocumentCheckIcon as ClipboardDocumentCheckMini,
    Cog6ToothIcon as Cog6ToothMini,
    CreditCardIcon as CreditCardMini,
    SparklesIcon as SparklesMini,
    Squares2X2Icon as Squares2X2Mini,
    TagIcon as TagMini,
    UserCircleIcon as UserCircleMini,
    UserGroupIcon as UserGroupMini,
} from "@heroicons/react/20/solid"
import {
    ACCOUNT_MENU_PROFILE_LINK_ITEMS,
    ACCOUNT_MENU_WORKSPACE_LINK_ITEMS,
} from "@/components/layout/account-menu-links"
import {
    isAccountActivityPath,
    isAccountHubPath,
    isAccountSessionsPath,
    isExactPath,
    isPlansPath,
    isSettingsPath,
    MAIN_NAVIGATION,
    ROUTES,
} from "@/config/navigation"
import type { HeroIcon, NavigationItem } from "@/types/navigation"

/**
 * O par sólido de cada ícone da navegação — a aba ativa preenche.
 *
 * É a convenção de tab bar do iOS, e ela **não é a regra G ao contrário**:
 * aquela existe porque os conjuntos 24, 20 e 16 são *redesenhos* para tamanhos
 * diferentes, e trocar de grade a 24px entrega um desenho que não cabe. Aqui a
 * grade é a mesma — 24 dos dois lados —, e o que muda é o preenchimento. O
 * auditor concorda: ele compara o número do conjunto, não o traço.
 *
 * **A chave é o componente, e não o `href`.** Uma tabela por rota seria uma
 * segunda lista de rotas para sair de sincronia com a primeira; esta casa já
 * pagou isso. Keyed pelo ícone, ela serve as abas da barra **e** as linhas da
 * página Você com uma consulta só, e um ícone sem par cai no contorno em vez de
 * quebrar.
 */
const ICONE_SOLIDO = new Map<HeroIcon, HeroIcon>([
    [Squares2X2Icon, Squares2X2Solid],
    [TagIcon, TagSolid],
    [RectangleStackIcon, RectangleStackSolid],
    [ArrowPathRoundedSquareIcon, ArrowPathRoundedSquareSolid],
    [ClipboardDocumentCheckIcon, ClipboardDocumentCheckSolid],
    [CreditCardIcon, CreditCardSolid],
    [UserGroupIcon, UserGroupSolid],
    [Cog6ToothIcon, Cog6ToothSolid],
    [UserCircleIcon, UserCircleSolid],
    [SparklesIcon, SparklesSolid],
])

/** O par sólido, ou `undefined` — quem não tem par continua de contorno. */
export function solidIconFor(icon: HeroIcon): HeroIcon | undefined {
    return ICONE_SOLIDO.get(icon)
}

/**
 * O par micro (`16/solid`) de cada ícone da navegação, para quem o desenha a
 * 16px — a barra lateral e o menu da conta. Keyed pelo componente, como o sólido.
 */
const ICONE_MICRO = new Map<HeroIcon, HeroIcon>([
    [Squares2X2Icon, Squares2X2Micro],
    [TagIcon, TagMicro],
    [RectangleStackIcon, RectangleStackMicro],
    [ArrowPathRoundedSquareIcon, ArrowPathRoundedSquareMicro],
    [ClipboardDocumentCheckIcon, ClipboardDocumentCheckMicro],
    [CreditCardIcon, CreditCardMicro],
    [UserGroupIcon, UserGroupMicro],
    [Cog6ToothIcon, Cog6ToothMicro],
    [UserCircleIcon, UserCircleMicro],
    [SparklesIcon, SparklesMicro],
])

/** O par micro, ou `undefined` — quem não tem par continua no de 24. */
export function microIconFor(icon: HeroIcon): HeroIcon | undefined {
    return ICONE_MICRO.get(icon)
}

/**
 * O par mini (`20/solid`), para quem o desenha a 20px — as linhas da página
 * Você (`/me`), que só o telefone abre pela aba, com o ícone a 20 (rodada 346).
 */
const ICONE_MINI = new Map<HeroIcon, HeroIcon>([
    [Squares2X2Icon, Squares2X2Mini],
    [TagIcon, TagMini],
    [RectangleStackIcon, RectangleStackMini],
    [ArrowPathRoundedSquareIcon, ArrowPathRoundedSquareMini],
    [ClipboardDocumentCheckIcon, ClipboardDocumentCheckMini],
    [CreditCardIcon, CreditCardMini],
    [UserGroupIcon, UserGroupMini],
    [Cog6ToothIcon, Cog6ToothMini],
    [UserCircleIcon, UserCircleMini],
    [SparklesIcon, SparklesMini],
])

/** O par mini, ou `undefined` — quem não tem par continua no de 24. */
export function miniIconFor(icon: HeroIcon): HeroIcon | undefined {
    return ICONE_MINI.get(icon)
}

/** Primary tabs shown inside the floating island. */
export const MOBILE_TAB_NAV = [
    ROUTES.DASHBOARD,
    ROUTES.TRANSACTIONS,
    ROUTES.DASHBOARD_CATEGORIES,
] as const

const MOBILE_PRIMARY_HREFS = new Set<string>([...MOBILE_TAB_NAV])

function resolveNavItems(hrefs: readonly string[]): NavigationItem[] {
    return hrefs.flatMap((href) => {
        const item = MAIN_NAVIGATION.find((nav) => nav.href === href)
        return item ? [item] : []
    })
}

export function getMobileNavTabs(): NavigationItem[] {
    return resolveNavItems(MOBILE_TAB_NAV)
}

/** As telas da navegação que não são abas da barra: a página Você as lista. */
export function getMobileOverflowNav(): NavigationItem[] {
    return MAIN_NAVIGATION.filter((item) => !MOBILE_PRIMARY_HREFS.has(item.href))
}

export type MobileAccountMenuNavItem = {
    name: string
    href: string
    icon: NavigationItem["icon"] | HeroIcon
    beta?: boolean
}

/** Todas as telas que a página Você pode abrir (as de fora da barra, a carteira e o perfil). */
export function getMobileAccountMenuNavItems(): MobileAccountMenuNavItem[] {
    return [
        ...getMobileOverflowNav(),
        ...ACCOUNT_MENU_WORKSPACE_LINK_ITEMS.map(({ href, label, icon }) => ({
            href,
            name: label,
            icon,
        })),
        ...ACCOUNT_MENU_PROFILE_LINK_ITEMS.map(({ href, label, icon }) => ({
            href,
            name: label,
            icon,
        })),
    ]
}

export function getMobileAccountMenuPinnedNavItems(): MobileAccountMenuNavItem[] {
    return getMobileAccountMenuNavItems().filter(
        (item) =>
            !ACCOUNT_MENU_PROFILE_LINK_ITEMS.some(
                (profileItem) => profileItem.href === item.href
            )
    )
}

export function isMobileAccountMenuNavItemActive(
    pathname: string,
    item: Pick<MobileAccountMenuNavItem, "href">
): boolean {
    switch (item.href) {
        case ROUTES.CREDIT_CARDS:
        case ROUTES.DASHBOARD_CATEGORIES:
            return (
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`)
            )
        case ROUTES.SETTINGS:
            return isSettingsPath(pathname)
        case ROUTES.ACCOUNT:
            return (
                isAccountHubPath(pathname) ||
                isAccountSessionsPath(pathname) ||
                isAccountActivityPath(pathname)
            )
        default:
            return isExactPath(pathname, item.href)
    }
}

export type VoceGroup = {
    id: "carteira" | "conta"
    label: string
    items: MobileAccountMenuNavItem[]
}

/**
 * Os dois grupos da página Você (`/me`) — a mesma composição que o menu "Mais"
 * fazia: em cima a carteira (as abas que não couberam na barra, depois as telas
 * fixadas), embaixo a conta e, por último, as configurações. Planos e pagamentos
 * mora em Minha conta, no telefone. `abasFora` são os `href` das abas que a barra
 * não coube; a ordem delas é a da barra.
 */
export function getVoceGroups(abasFora: readonly string[]): VoceGroup[] {
    const fixadas = getMobileAccountMenuPinnedNavItems()
    const telas = [
        ...getMobileNavTabs()
            .filter((tab) => abasFora.includes(tab.href))
            .map(({ name, href, icon }) => ({ name, href, icon })),
        ...fixadas,
    ].filter((item, i, todas) => todas.findIndex((o) => o.href === item.href) === i)
    const configuracoes = telas.filter((item) => item.href === ROUTES.SETTINGS)

    return [
        {
            id: "carteira",
            label: "Carteira",
            items: telas.filter((item) => item.href !== ROUTES.SETTINGS),
        },
        {
            id: "conta",
            label: "Conta",
            items: [
                ...ACCOUNT_MENU_PROFILE_LINK_ITEMS.filter((item) => item.href !== ROUTES.PLANS).map(
                    ({ href, label, icon }) => ({ href, name: label, icon })
                ),
                ...configuracoes,
            ],
        },
    ]
}

/**
 * Você acende na própria página, em qualquer tela que ela abre e em Planos e
 * pagamentos, que no telefone só se alcança por Minha conta.
 */
export function isVoceTabActive(pathname: string, abasFora: readonly string[]): boolean {
    return (
        pathname === ROUTES.ME ||
        isPlansPath(pathname) ||
        getVoceGroups(abasFora).some((grupo) =>
            grupo.items.some((item) => isMobileAccountMenuNavItemActive(pathname, item))
        )
    )
}

/**
 * Para onde o voltar do telefone leva: a Você, só quando a rota é **exatamente**
 * uma tela que ela lista. Uma subpágina (`/settings/aparencia`, `/account/sessions`)
 * tem o próprio pai e não passa por aqui.
 */
export function voceBackHref(pathname: string): string | undefined {
    const listada = getVoceGroups([]).some((grupo) =>
        grupo.items.some((item) => item.href === pathname)
    )
    return listada ? ROUTES.ME : undefined
}

/** O botão do filtro à direita do cabeçalho: o ajuste da folha ou o calendário do mês. */
export type MobileHeaderFilterIcon = "month" | "filter"

/**
 * Qual filtro o cabeçalho do telefone desenha em cada rota. A tela só publica o
 * dela (`usePageChromeFilter`) depois de montar, e atrás do `AdiarMontagem` isso
 * chega até ~700ms depois do clique: se o cabeçalho esperasse a publicação, a
 * cápsula da lupa mudaria de forma tarde, em cima de uma tela já trocada. A rota
 * declara o que a tela vai publicar, e o cabeçalho já nasce na forma final.
 * `mobile-navigation.test.ts` cobra a tabela contra as telas.
 */
export function mobileHeaderFilterFor(pathname: string): MobileHeaderFilterIcon | null {
    if (pathname === ROUTES.DASHBOARD || pathname === ROUTES.DASHBOARD_CATEGORIES) return "month"
    if (
        pathname.startsWith(`${ROUTES.DASHBOARD_CATEGORIES}/`) &&
        pathname !== `${ROUTES.DASHBOARD_CATEGORIES}/new`
    ) {
        return "month"
    }
    if (pathname === ROUTES.TRANSACTIONS || pathname === ROUTES.BILLS) return "filter"
    return null
}
