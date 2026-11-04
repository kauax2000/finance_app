/**
 * As telas do convidado (Bloco 7A, spec §12): o Painel dele, as transações, as
 * categorias e os cartões só para ler, as telas da própria conta, os planos e o
 * Cofre (spec §15.6: exportar e apagar continuam sempre liberados). Orçamento,
 * previsão, contas, assinaturas, membros, o Piloto e as telas de fatura e
 * conferência (o detalhe do cartão, `/credit-cards/{id}`) ficam de fora — a RLS
 * já devolve vazio, e a navegação não as oferece.
 */
import { ROUTES } from "@/config/navigation"
import { ehAdulto } from "@/lib/papeis/papeis"
import type { WorkspaceRole } from "@/lib/supabase"

/** Com as subrotas. */
const COM_SUBROTAS: readonly string[] = [ROUTES.TRANSACTIONS, ROUTES.DASHBOARD_CATEGORIES, ROUTES.SETTINGS]
/** Só a própria rota: o detalhe do cartão é a fatura e a conferência. */
/** `/account` só redireciona (Você ou Painel): o link antigo do convidado chega lá. */
const EXATAS: readonly string[] = [ROUTES.DASHBOARD, ROUTES.CREDIT_CARDS, ROUTES.ME, ROUTES.PLANS, ROUTES.COFRE, ROUTES.ACCOUNT]
/** Subrotas que escrevem, dentro de uma rota permitida: criar categoria é do adulto. */
const DE_FORA: readonly string[] = [`${ROUTES.DASHBOARD_CATEGORIES}/new`]

export const ROTAS_DO_CONVIDADO: readonly string[] = [...EXATAS, ...COM_SUBROTAS]

/** A rota (com ou sem `?query` e `#hash`) que o convidado pode abrir. */
export function rotaPermitidaAoConvidado(pathname: string): boolean {
    const p = pathname.split(/[?#]/)[0].replace(/(.)\/+$/, "$1")
    if (DE_FORA.includes(p)) return false
    return EXATAS.includes(p) || COM_SUBROTAS.some((r) => p === r || p.startsWith(`${r}/`))
}

/**
 * Os itens de navegação que o papel vê. O adulto vê todos; o convidado, só os
 * da lista dele. **Com o papel a caminho (`null`), só os comuns aos dois** — os
 * da lista do convidado —, e os de adulto entram quando o papel chega: nada
 * aparece para o convidado e depois some.
 */
export function itensDeNavegacaoPara<T extends { href: string }>(papel: WorkspaceRole | null | undefined, itens: readonly T[]): T[] {
    return ehAdulto(papel) ? [...itens] : itens.filter((item) => rotaPermitidaAoConvidado(item.href))
}

/**
 * O que a guarda faz na rota: com o papel a caminho, espera (não redireciona
 * nem esconde); o convidado fora da lista vai ao Painel; o resto segue.
 */
export function decidirRotaDoConvidado(
    papel: WorkspaceRole | null | undefined,
    pathname: string,
): "esperar" | "ok" | "/dashboard" {
    if (papel == null) return "esperar"
    if (papel === "guest" && !rotaPermitidaAoConvidado(pathname)) return ROUTES.DASHBOARD
    return "ok"
}
