import type { SupabaseClient } from "@supabase/supabase-js"

import type { CreditCardStatementTotalSource } from "@/lib/supabase"

/** Grava o total do banco já aprovado (o mesmo upsert do total, com `approved_at`). */
export async function aprovarFatura(
    db: SupabaseClient,
    a: {
        workspaceId: string
        userId: string
        cardId: string
        fechamento: string
        bankTotal: number
        source: CreditCardStatementTotalSource
    },
): Promise<{ ok: true } | { ok: false; erro: string }> {
    const { error } = await db.from("credit_card_statement_totals").upsert(
        {
            workspace_id: a.workspaceId,
            credit_card_id: a.cardId,
            statement_close_date: a.fechamento,
            bank_total: a.bankTotal,
            source: a.source,
            created_by: a.userId,
            approved_at: new Date().toISOString(),
            approved_by: a.userId,
        },
        { onConflict: "workspace_id,credit_card_id,statement_close_date" },
    )
    return error ? { ok: false, erro: error.message } : { ok: true }
}
