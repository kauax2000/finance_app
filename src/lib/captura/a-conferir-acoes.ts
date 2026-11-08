import type { SupabaseClient } from "@supabase/supabase-js"
import { desfazerImportacao } from "@/lib/import/importar"
import { normalizeSearchText } from "@/lib/command-filter"

/** `credit_cards_wallet_alias_check`: de 1 a 60 caracteres. */
export const ALIAS_MAX = 60

/**
 * As três ações do "a conferir" no detalhe (spec §8.3), tiradas do wireframe
 * do Bloco 2/3A com as mesmas regras. Cada uma lança na falha: quem chama
 * mostra a mensagem.
 */

/** Tira o `needs_review`. Sem uma linha de volta (apagada, fora da RLS), nada foi gravado. */
export async function confirmarLancamento(db: SupabaseClient, id: string): Promise<void> {
    const { data, error } = await db.from("transactions").update({ needs_review: false }).eq("id", id).select("id")
    if (error) throw new Error(`Não foi possível confirmar: ${error.message}`)
    if (data?.length !== 1) throw new Error("Não foi possível confirmar o lançamento.")
}

/** O apelido da Wallet já gravado no cartão, ou `null`. */
export async function lerAliasDoCartao(db: SupabaseClient, cardId: string): Promise<string | null> {
    const { data, error } = await db.from("credit_cards").select("wallet_alias").eq("id", cardId).maybeSingle()
    if (error) throw error
    return (data as { wallet_alias: string | null } | null)?.wallet_alias ?? null
}

/** O nome da Wallet já é o apelido do cartão (sem caixa nem acento). */
export function jaLembrado(aliasAtual: string | null | undefined, walletCard: string): boolean {
    return aliasAtual != null && normalizeSearchText(aliasAtual.trim()) === normalizeSearchText(walletCard.trim())
}

/** Grava o nome da Wallet como `wallet_alias` do cartão; a próxima captura casa. Devolve o que gravou. */
export async function lembrarCartaoDaWallet(db: SupabaseClient, cardId: string, alias: string): Promise<string> {
    const valor = alias.trim().slice(0, ALIAS_MAX)
    if (!valor) throw new Error("Não foi possível lembrar o cartão.")
    const { data, error } = await db
        .from("credit_cards")
        .update({ wallet_alias: valor })
        .eq("id", cardId)
        .select("id")
    if (error || data?.length !== 1) throw new Error("Não foi possível lembrar o cartão.")
    return valor
}

/** Quantos lançamentos o lote tem, para a pergunta do "Desfazer importação". */
export async function contarLote(db: SupabaseClient, workspaceId: string, batchId: string): Promise<number> {
    const { count, error } = await db
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("import_batch_id", batchId)
    if (error) throw error
    return count ?? 0
}

/** Apaga o lote inteiro da importação. */
export async function desfazerLote(db: SupabaseClient, workspaceId: string, batchId: string): Promise<void> {
    const r = await desfazerImportacao(db, workspaceId, batchId)
    if (!r.ok) throw new Error(r.erro ?? "Não foi possível desfazer a importação.")
}
