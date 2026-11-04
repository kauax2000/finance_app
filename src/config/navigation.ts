import { ArrowPathRoundedSquareIcon, RectangleStackIcon, ClipboardDocumentCheckIcon, Cog6ToothIcon, CreditCardIcon, FolderIcon, Squares2X2Icon, TagIcon, UserGroupIcon } from "@heroicons/react/24/outline"
import type { NavigationItem } from "@/types/navigation"

/** Canonical path constants for links and active-state checks */
export const ROUTES = {
    DASHBOARD: "/dashboard",
    /** Transações: rota de app (shell padrão), não sob /dashboard */
    TRANSACTIONS: "/transactions",
    DASHBOARD_CATEGORIES: "/categories",
    SETTINGS: "/settings",
    /** Telas de Configurações que o telefone abre pela página Você. */
    SETTINGS_LANCAR: "/settings/lancar-pelo-iphone",
    SETTINGS_IAS: "/settings/ias",
    SETTINGS_NOTIFICACOES: "/settings/notificacoes",
    CREDIT_CARDS: "/credit-cards",
    SUBSCRIPTIONS: "/subscriptions",
    BILLS: "/bills",
    NOTIFICATIONS: "/notifications",
    /** A aba "Você" do telefone: a página que lista as telas fora da barra. */
    ME: "/me",
    ACCOUNT: "/account",
    MEMBERS: "/members",
    PLANS: "/plans",
    /** Os preços, públicos, fora da casca do app (Bloco 4). */
    PRECOS: "/precos",
    /** O Piloto Automático: o que o app lançou sozinho, com desfazer (Bloco 4). Sem entrada no menu. */
    PILOTO: "/piloto",
    /** O Cofre aberto: o que guardamos, exportar tudo e apagar a conta (Bloco 4). */
    COFRE: "/cofre",
    /** A previsão: o seguro para gastar e a linha do tempo de 6 meses (Bloco 5). Sem entrada no menu. */
    PREVISAO: "/previsao",
    /** A jornada de 4 passos do que o app faz sozinho (Bloco 4). Sem entrada no menu. */
    COMECAR: "/comecar",
    /** Os projetos da carteira, com o resumo de cada um (Bloco 7C). Só do adulto. */
    PROJETOS: "/projetos",
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    INVITE_ACCEPT: "/invites/accept",
    /** A política de privacidade: pública, fora da casca do app (Bloco 3B). */
    PRIVACY: "/privacidade",
} as const

export function projetoDetailPath(id: string): string {
    return `${ROUTES.PROJETOS}/${encodeURIComponent(id)}`
}

export function creditCardDetailPath(id: string): string {
    return `${ROUTES.CREDIT_CARDS}/${encodeURIComponent(id)}`
}

/** `/credit-cards/{id}` detail route (not list or settings). */
export function isCreditCardDetailPath(pathname: string): boolean {
    return /^\/credit-cards\/[^/]+$/.test(pathname)
}

/** Plans and billing page. */
export function isPlansPath(pathname: string): boolean {
    return pathname === ROUTES.PLANS
}

/** Account hub (profile) only, not other account-adjacent routes. */
export function isAccountHubPath(pathname: string): boolean {
    return pathname === ROUTES.ACCOUNT
}

/** Cog6ToothIcon hub and nested settings routes. */
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
    { name: "Painel", href: ROUTES.DASHBOARD, icon: Squares2X2Icon },
    // Transações em segundo, como na barra de baixo do telefone: é o que mais se usa.
    { name: "Transações", href: ROUTES.TRANSACTIONS, icon: RectangleStackIcon },
    // A etiqueta e não a pizza: a pizza lia como relatório, e categoria é o rótulo que se põe no lançamento.
    { name: "Categorias", href: ROUTES.DASHBOARD_CATEGORIES, icon: TagIcon },
    { name: "Assinaturas", href: ROUTES.SUBSCRIPTIONS, icon: ArrowPathRoundedSquareIcon },
    {
        name: "Contas a pagar",
        href: ROUTES.BILLS,
        icon: ClipboardDocumentCheckIcon,
    },
    {
        // O rótulo da barra é curto; o título da página continua "Cartões de crédito".
        name: "Cartões",
        href: ROUTES.CREDIT_CARDS,
        icon: CreditCardIcon,
    },
    // Só do adulto: `/projetos` fica fora da lista do convidado (Ruling 3).
    { name: "Projetos", href: ROUTES.PROJETOS, icon: FolderIcon },
]

export const MEMBERS_NAV_ITEM: NavigationItem = {
    // Curto na barra; o título da página continua "Membros e convidados".
    name: "Membros",
    href: ROUTES.MEMBERS,
    icon: UserGroupIcon,
}

export const SETTINGS_NAV_ITEM: NavigationItem = {
    name: "Configurações",
    href: ROUTES.SETTINGS,
    icon: Cog6ToothIcon,
}

/** Header title for dashboard route group */
export const DASHBOARD_PAGE_TITLES: Record<string, string> = {
    [ROUTES.DASHBOARD]: "Painel",
    [ROUTES.DASHBOARD_CATEGORIES]: "Categorias",
}

/** Header title for (app) route group (top-level pages) */
export const APP_PAGE_TITLES: Record<string, string> = {
    [ROUTES.ME]: "Você",
    [ROUTES.ACCOUNT]: "Minha conta",
    [ROUTES.PLANS]: "Planos e pagamentos",
    [ROUTES.PILOTO]: "Piloto Automático",
    [ROUTES.COFRE]: "Cofre aberto",
    [ROUTES.PREVISAO]: "Previsão",
    [ROUTES.COMECAR]: "Começar",
    [ROUTES.PROJETOS]: "Projetos",
    [ROUTES.MEMBERS]: "Membros e convidados",
    [ROUTES.SETTINGS]: "Configurações",
    [ROUTES.SETTINGS_LANCAR]: "Lançar pelo iPhone",
    [ROUTES.SETTINGS_IAS]: "IAs conectadas",
    [ROUTES.SETTINGS_NOTIFICACOES]: "Notificações",
    [ROUTES.TRANSACTIONS]: "Transações",
    [ROUTES.SUBSCRIPTIONS]: "Assinaturas",
    [ROUTES.BILLS]: "Contas a pagar",
    [ROUTES.CREDIT_CARDS]: "Cartões de crédito",
}

export function isExactPath(pathname: string, href: string): boolean {
    return pathname === href
}
