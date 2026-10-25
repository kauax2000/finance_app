/**
 * As telas do convidado (Bloco 7A, spec §12): o Painel dele, as transações, as
 * categorias e os cartões só para ler, e as telas da própria conta. Orçamento,
 * previsão, contas, assinaturas, membros, planos e as telas de fatura e
 * conferência (o detalhe do cartão, `/credit-cards/{id}`) ficam de fora — a RLS
 * já devolve vazio, e a navegação não as oferece.
 */
import { ROUTES } from "@/config/navigation"
import type { WorkspaceRole } from "@/lib/supabase"

/** Com as subrotas. */
const COM_SUBROTAS: readonly string[] = [ROUTES.TRANSACTIONS, ROUTES.DASHBOARD_CATEGORIES, ROUTES.SETTINGS, ROUTES.ACCOUNT]
/** Só a própria rota: o detalhe do cartão é a fatura e a conferência. */
const EXATAS: readonly string[] = [ROUTES.DASHBOARD, ROUTES.CREDIT_CARDS, ROUTES.ME]
/** Subrotas que escrevem, dentro de uma rota permitida: criar categoria é do adulto. */
const DE_FORA: readonly string[] = [`${ROUTES.DASHBOARD_CATEGORIES}/new`]

export const ROTAS_DO_CONVIDADO: readonly string[] = [...EXATAS, ...COM_SUBROTAS]

/** A rota (com ou sem `?query` e `#hash`) que o convidado pode abrir. */
export function rotaPermitidaAoConvidado(pathname: string): boolean {
    const p = pathname.split(/[?#]/)[0].replace(/(.)\/+$/, "$1")
    if (DE_FORA.includes(p)) return false
    return EXATAS.includes(p) || COM_SUBROTAS.some((r) => p === r || p.startsWith(`${r}/`))
}

/** Os itens de navegação que o papel vê: o convidado, só os da lista dele; os outros, todos. */
export function itensDeNavegacaoPara<T extends { href: string }>(papel: WorkspaceRole | null | undefined, itens: readonly T[]): T[] {
    return papel === "guest" ? itens.filter((item) => rotaPermitidaAoConvidado(item.href)) : [...itens]
}
