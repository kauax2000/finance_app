import type { HeroIcon } from "@/types/navigation"
import { MAIN_NAVIGATION, MEMBERS_NAV_ITEM, ROUTES } from "@/config/navigation"
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
    [ROUTES.MEMBERS]: ["convidar", "pessoas"],
}

/**
 * As telas: as da carteira, da barra lateral, mais Membros. Ficam de fora, por
 * decisão do dono, o Painel, Configurações, as páginas da conta (Minha conta,
 * Planos e pagamentos, Sessões ativas, Atividade) e as Notificações. A paleta
 * desenha o ícone a 16px, então cada um vai ao par micro (`16/solid`), como na
 * barra lateral.
 */
export const TELAS_BUSCAVEIS: TelaBuscavel[] = [
    ...MAIN_NAVIGATION.filter((item) => item.href !== ROUTES.DASHBOARD),
    MEMBERS_NAV_ITEM,
].map(({ href, name, icon }) => ({
    href,
    name,
    icon: microIconFor(icon) ?? icon,
    palavras: SINONIMOS[href] ?? [],
}))
