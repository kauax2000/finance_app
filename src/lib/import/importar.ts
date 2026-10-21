import type { SupabaseClient } from "@supabase/supabase-js"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { calendarYmdToStorageIso } from "@/lib/transaction-date"
import type { TablesInsert } from "@/types/database"
import { sugerirCategoria } from "./categoria-pelo-historico"
import type { ItemBanco } from "./tipos"

export type DestinoImportacao =
    | { tipo: "cartao"; cardId: string }
    | { tipo: "conta"; paymentMethod: "debit_card" | "pix" | "other" }

export type ItemImportavel = ItemBanco & { clientId: string; categoryId: string | null }

type SourceImportacao = "import_pdf" | "import_sheet" | "import_statement"

const FATIA = 500

/**
 * O `clientId` nasce aqui, uma vez por item: repetir o envio do mesmo lote cai no
 * `upsert` por `(workspace_id, client_id)` e não duplica (Foco 3).
 */
export function prepararItens(
    itens: ItemBanco[],
    historico: Parameters<typeof sugerirCategoria>[1],
): ItemImportavel[] {
    return itens.map((i) => ({
        ...i,
        clientId: crypto.randomUUID(),
        categoryId: sugerirCategoria(i.descricao, historico),
    }))
}

/** Parcela importada é despesa simples com "(k/n)" na descrição (Decisão 4). */
export function linhasDeImportacao(
    ctx: { userId: string; workspaceId: string; batchId: string },
    itens: ItemImportavel[],
    destino: DestinoImportacao,
    source: SourceImportacao,
): TablesInsert<"transactions">[] {
    const cartao = destino.tipo === "cartao"
    return itens.map((i) => ({
        user_id: ctx.userId,
        workspace_id: ctx.workspaceId,
        type: i.estorno ? "income" : "expense",
        amount: i.valor,
        description: i.parcela ? `${i.descricao} (${i.parcela.k}/${i.parcela.n})` : i.descricao,
        date: calendarYmdToStorageIso(i.data),
        category_id: i.categoryId,
        payment_method: cartao ? "credit_card" : destino.paymentMethod,
        payment_credit_card_id: cartao ? destino.cardId : null,
        needs_review: true,
        import_batch_id: ctx.batchId,
        source,
        client_id: i.clientId,
    }))
}

/** Não chama `evaluate-budgets` nem os alertas do cartão (Decisão 5). */
export async function importarLancamentos(
    supabase: SupabaseClient,
    ctx: { userId: string; workspaceId: string },
    itens: ItemImportavel[],
    destino: DestinoImportacao,
    source: SourceImportacao,
    batchId: string,
): Promise<{ ok: true; inseridos: number } | { ok: false; erro: string }> {
    const linhas = linhasDeImportacao({ ...ctx, batchId }, itens, destino, source)
    for (let n = 0; n < linhas.length; n += FATIA) {
        const { error } = await supabase
            .from("transactions")
            .upsert(linhas.slice(n, n + FATIA), { onConflict: "workspace_id,client_id" })
        if (error) {
            return {
                ok: false,
                erro: formatSupabasePostgrestError(error) ?? "Não foi possível importar os lançamentos.",
            }
        }
    }
    return { ok: true, inseridos: linhas.length }
}

export async function desfazerImportacao(
    supabase: SupabaseClient,
    workspaceId: string,
    batchId: string,
): Promise<{ ok: boolean; erro?: string }> {
    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("import_batch_id", batchId)
    if (error) {
        return {
            ok: false,
            erro: formatSupabasePostgrestError(error) ?? "Não foi possível desfazer a importação.",
        }
    }
    return { ok: true }
}
