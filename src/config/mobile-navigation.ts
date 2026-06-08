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

export function getActiveMobileAccountMenuNavItem(
    pathname: string
): MobileAccountMenuNavItem | null {
    return (
        getMobileAccountMenuNavItems().find((item) =>
            isMobileAccountMenuNavItemActive(pathname, item)
        ) ?? null
    )
}
