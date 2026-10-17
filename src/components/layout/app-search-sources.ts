import { ClockIcon, ComputerDesktopIcon } from "@heroicons/react/16/solid"
import type { HeroIcon } from "@/types/navigation"
import { ACCOUNT_MENU_PROFILE_LINK_ITEMS } from "@/components/layout/account-menu-links"
import {
    APP_SUB_PAGE_TITLES,
    MAIN_NAVIGATION,
    MEMBERS_NAV_ITEM,
    ROUTES,
    SETTINGS_NAV_ITEM,
} from "@/config/navigation"
import { microIconFor } from "@/config/mobile-navigation"

/**
 * As telas que a paleta do app acha, cada uma com os sinônimos de quem não
 * lembra o nome ("fatura" acha Cartões). Os sinônimos são as `keywords` do
 * `commandFilter`: pesam menos que o nome. As ações moram na paleta, junto de
 * quem as executa.
 */

export type TelaBuscavel = {
    href: string
    name: string
    icon: HeroIcon
    palavras: string[]
}

/** Os sinônimos de cada tela, pelo `href`. */
const SINONIMOS: Record<string, string[]> = {
    [ROUTES.TRANSACTIONS]: ["lançamentos", "gastos", "extrato", "movimentações"],
    [ROUTES.CREDIT_CARDS]: ["fatura", "crédito"],
    [ROUTES.BILLS]: ["boletos", "despesas fixas", "vencimentos"],
    [ROUTES.SUBSCRIPTIONS]: ["recorrentes", "mensalidades"],
    [ROUTES.DASHBOARD]: ["início", "resumo", "dashboard"],
    [ROUTES.SETTINGS]: ["ajustes", "preferências"],
    [ROUTES.PLANS]: ["assinatura do app", "cobrança"],
    [ROUTES.MEMBERS]: ["convidar", "pessoas"],
}

/** Uma sub-página da conta, com o título que o cabeçalho dela mostra. */
function subPagina(href: string, icon: HeroIcon): TelaBuscavel {
    return { href, name: APP_SUB_PAGE_TITLES[href].title, icon, palavras: [] }
}

/**
 * As telas: a navegação lateral, o menu da conta, o perfil e as duas
 * sub-páginas da conta. A paleta desenha o ícone a 16px, então cada um vai ao
 * par micro (`16/solid`), como na barra lateral.
 */
export const TELAS_BUSCAVEIS: TelaBuscavel[] = [
    ...[
        ...MAIN_NAVIGATION,
        MEMBERS_NAV_ITEM,
        SETTINGS_NAV_ITEM,
        ...ACCOUNT_MENU_PROFILE_LINK_ITEMS.map(({ href, label, icon }) => ({
            href,
            name: label,
            icon,
        })),
    ].map(({ href, name, icon }) => ({
        href,
        name,
        icon: microIconFor(icon) ?? icon,
        palavras: SINONIMOS[href] ?? [],
    })),
    subPagina(ROUTES.ACCOUNT_SESSIONS, ComputerDesktopIcon),
    subPagina(ROUTES.ACCOUNT_ACTIVITY, ClockIcon),
]
