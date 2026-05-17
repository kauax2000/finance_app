import {
    LayoutDashboard,
    ArrowLeftRight,
    PieChart,
    Users,
    Settings,
    Repeat,
    CreditCard,
    ListChecks,
} from "lucide-react"
import type { NavigationItem, SubPageMeta } from "@/types/navigation"

/** Canonical path constants for links and active-state checks */
export const ROUTES = {
    DASHBOARD: "/dashboard",
    /** Transações: rota de app (shell padrão), não sob /dashboard */
    TRANSACTIONS: "/transactions",
    DASHBOARD_CATEGORIES: "/categories",
    SETTINGS: "/settings",
    SETTINGS_CREDIT_CARDS: "/settings/credit-cards",
    CREDIT_CARDS: "/credit-cards",
    SUBSCRIPTIONS: "/subscriptions",
    BILLS: "/bills",
    NOTIFICATIONS: "/notifications",
    ACCOUNT: "/account",
    ACCOUNT_SESSIONS: "/account/sessions",
    ACCOUNT_ACTIVITY: "/account/activity",
    MEMBERS: "/members",
    PLANS: "/plans",
    LOGIN: "/login",
} as const

export function creditCardDetailPath(id: string): string {
    return `${ROUTES.CREDIT_CARDS}/${encodeURIComponent(id)}`
}

/** `/credit-cards/{id}` detail route (not list or settings). */
export function isCreditCardDetailPath(pathname: string): boolean {
    return /^\/credit-cards\/[^/]+$/.test(pathname)
}

/** Active sessions management under account settings. */
export function isAccountSessionsPath(pathname: string): boolean {
    return pathname === ROUTES.ACCOUNT_SESSIONS
}

/** Account activity log under account settings. */
export function isAccountActivityPath(pathname: string): boolean {
    return pathname === ROUTES.ACCOUNT_ACTIVITY
}

/** Plans and billing page. */
export function isPlansPath(pathname: string): boolean {
    return pathname === ROUTES.PLANS
}

/** Account hub (profile), not sub-routes like sessions or activity. */
export function isAccountHubPath(pathname: string): boolean {
    return pathname === ROUTES.ACCOUNT
}

/** Settings hub and nested settings routes. */
export function isSettingsPath(pathname: string): boolean {
    return (
        pathname === ROUTES.SETTINGS || pathname.startsWith(`${ROUTES.SETTINGS}/`)
    )
}

/** Workspace members and invites. */
export function isMembersPath(pathname: string): boolean {
    return pathname === ROUTES.MEMBERS
}

export function categoryDetailPath(
    categoryId: string,
    params?: { type?: "expense" | "income"; month?: string }
): string {
    const base = `${ROUTES.DASHBOARD_CATEGORIES}/${encodeURIComponent(categoryId)}`
    if (!params?.type && !params?.month) return base
    const q = new URLSearchParams()
    if (params.type) q.set("type", params.type)
    if (params.month) q.set("month", params.month)
    return `${base}?${q.toString()}`
}

export function transactionsHrefForCreditCard(cardId: string): string {
    const q = new URLSearchParams({
        card: cardId,
        preset: "last30",
    })
    return `${ROUTES.TRANSACTIONS}?${q.toString()}`
}

export const MAIN_NAVIGATION: NavigationItem[] = [
    { name: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: "Categorias", href: ROUTES.DASHBOARD_CATEGORIES, icon: PieChart },
    { name: "Transações", href: ROUTES.TRANSACTIONS, icon: ArrowLeftRight },
    { name: "Assinaturas", href: ROUTES.SUBSCRIPTIONS, icon: Repeat },
    {
        name: "Contas a pagar",
        href: ROUTES.BILLS,
        icon: ListChecks,
        beta: true,
    },
    {
        name: "Cartões de crédito",
        href: ROUTES.CREDIT_CARDS,
        icon: CreditCard,
    },
]

export const MEMBERS_NAV_ITEM: NavigationItem = {
    name: "Membros e convidados",
    href: ROUTES.MEMBERS,
    icon: Users,
}

export const SETTINGS_NAV_ITEM: NavigationItem = {
    name: "Configurações",
    href: ROUTES.SETTINGS,
    icon: Settings,
}

/** Header title for dashboard route group */
export const DASHBOARD_PAGE_TITLES: Record<string, string> = {
    [ROUTES.DASHBOARD]: "Dashboard",
    [ROUTES.DASHBOARD_CATEGORIES]: "Categorias",
    "/wallets": "Contas",
}

/** Header title for (app) route group (top-level pages) */
export const APP_PAGE_TITLES: Record<string, string> = {
    [ROUTES.ACCOUNT]: "Minha conta",
    [ROUTES.PLANS]: "Planos e pagamentos",
    [ROUTES.MEMBERS]: "Membros e convidados",
    [ROUTES.SETTINGS]: "Configurações",
    [ROUTES.TRANSACTIONS]: "Transações",
    [ROUTES.SUBSCRIPTIONS]: "Assinaturas",
    [ROUTES.BILLS]: "Contas a pagar",
    [ROUTES.CREDIT_CARDS]: "Cartões de crédito",
}

/** Sub-routes with breadcrumb + back button metadata */
export const APP_SUB_PAGE_TITLES: Record<string, SubPageMeta> = {
    [ROUTES.ACCOUNT_SESSIONS]: {
        parent: ROUTES.ACCOUNT,
        parentTitle: "Minha conta",
        title: "Sessões Ativas",
    },
    [ROUTES.ACCOUNT_ACTIVITY]: {
        parent: ROUTES.ACCOUNT,
        parentTitle: "Minha conta",
        title: "Atividade",
    },
    [ROUTES.SETTINGS_CREDIT_CARDS]: {
        parent: ROUTES.SETTINGS,
        parentTitle: "Configurações",
        title: "Cartões de crédito",
    },
}

export function isExactPath(pathname: string, href: string): boolean {
    return pathname === href
}
