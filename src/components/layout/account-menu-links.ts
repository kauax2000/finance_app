import { Cog6ToothIcon, SparklesIcon, UserCircleIcon, UserGroupIcon } from "@heroicons/react/24/outline"
import type { HeroIcon } from "@/types/navigation"
import { ROUTES } from "@/config/navigation"

export type AccountMenuLinkItem = {
    href: string
    label: string
    icon: HeroIcon
}

/** Profile / billing links (UserMenu dropdown + mobile scroll section) */
export const ACCOUNT_MENU_PROFILE_LINK_ITEMS: AccountMenuLinkItem[] = [
    // A pessoa, e não o selo de verificado; o plano com o brilho, e não o cartão,
    // que é o ícone de "Cartões" na barra.
    { href: ROUTES.ACCOUNT, label: "Minha conta", icon: UserCircleIcon },
    { href: ROUTES.PLANS, label: "Planos e pagamentos", icon: SparklesIcon },
]

/** Workspace links (sidebar + mobile pinned top section) */
export const ACCOUNT_MENU_WORKSPACE_LINK_ITEMS: AccountMenuLinkItem[] = [
    { href: ROUTES.MEMBERS, label: "Membros e convidados", icon: UserGroupIcon },
    { href: ROUTES.SETTINGS, label: "Configurações", icon: Cog6ToothIcon },
]

/** Shared account / settings links for UserMenu dropdown and mobile “Mais” sheet */
export const ACCOUNT_MENU_LINK_ITEMS: AccountMenuLinkItem[] = [
    ...ACCOUNT_MENU_PROFILE_LINK_ITEMS,
    ...ACCOUNT_MENU_WORKSPACE_LINK_ITEMS,
]
