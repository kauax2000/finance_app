import type { CreditCard } from "@/lib/supabase"

const CHAVE = "tx:ultimo-cartao"

function lerMapa(): Record<string, unknown> {
    try {
        return JSON.parse(localStorage.getItem(CHAVE) ?? "{}")
    } catch {
        return {}
    }
}

/** Guarda o cartão escolhido por último em cada carteira, só neste navegador. */
export function gravarUltimoCartao(workspaceId: string, cardId: string) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify({ ...lerMapa(), [workspaceId]: cardId }))
    } catch {
        // Sem armazenamento (aba privada): só não há pré-escolha na próxima vez.
    }
}

/**
 * O cartão que vem escolhido ao pagar no crédito: o único ativo ou, com mais de
 * um, o último escolhido na carteira. `""` quando não há o que escolher.
 */
export function cartaoPreEscolhido(cards: CreditCard[]): string {
    const ativos = cards.filter((c) => c.is_active)
    if (ativos.length === 0) return ""
    if (ativos.length === 1) return ativos[0]!.id
    const ultimo = lerMapa()[ativos[0]!.workspace_id]
    return ativos.some((c) => c.id === ultimo) ? (ultimo as string) : ""
}
