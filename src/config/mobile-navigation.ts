import {
    ArrowPathRoundedSquareIcon,
    QueueListIcon,
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
    QueueListIcon as QueueListSolid,
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
    QueueListIcon as QueueListMicro,
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
    ACCOUNT_MENU_PROFILE_LINK_ITEMS,
    ACCOUNT_MENU_WORKSPACE_LINK_ITEMS,
} from "@/components/layout/account-menu-links"
import {
    isAccountActivityPath,
    isAccountHubPath,
    isAccountSessionsPath,
    isExactPath,
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
 * pagou isso. Keyed pelo ícone, ela serve as abas **e** o slot da conta com uma
 * consulta só, e um ícone sem par cai no contorno em vez de quebrar.
 */
const ICONE_SOLIDO = new Map<HeroIcon, HeroIcon>([
    [Squares2X2Icon, Squares2X2Solid],
    [TagIcon, TagSolid],
    [QueueListIcon, QueueListSolid],
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
    [QueueListIcon, QueueListMicro],
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

/** Routes shown in the "Mais" menu instead of the island tabs. */
export function getMobileOverflowNav(): NavigationItem[] {
    return MAIN_NAVIGATION.filter((item) => !MOBILE_PRIMARY_HREFS.has(item.href))
}

export type MobileAccountMenuNavItem = {
    name: string
    href: string
    icon: NavigationItem["icon"] | HeroIcon
    beta?: boolean
}

/** All navigable routes in the mobile account popover (overflow + workspace + profile). */
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
