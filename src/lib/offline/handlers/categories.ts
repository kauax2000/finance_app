import { supabase } from "@/lib/supabase"
import type { OfflineMutation } from "@/lib/offline/types"
import { deleteById, failure, updateById, type SyncResult } from "@/lib/offline/handlers/by-id"

export async function syncCategoryMutation(mutation: OfflineMutation): Promise<SyncResult> {
    const { operation, payload } = mutation

    if (operation === "delete") return deleteById("categories", mutation)
    if (operation !== "insert") return updateById("categories", mutation)

    const row = { ...payload } as Record<string, unknown>
    row.client_id = (row.client_id as string | undefined) ?? mutation.idempotencyKey
    const { error } = await supabase.from("categories").upsert(row, {
        onConflict: "workspace_id,client_id",
    })
    return error ? failure(error) : { ok: true }
}

export async function syncBudgetMutation(mutation: OfflineMutation): Promise<SyncResult> {
    const { operation, payload } = mutation

    if (operation === "delete") return deleteById("budgets", mutation)
    if (operation !== "insert") return updateById("budgets", mutation)

    const row = { ...payload } as Record<string, unknown>
    row.client_id = (row.client_id as string | undefined) ?? mutation.idempotencyKey
    // Replay usa a unicidade de negócio (workspace, categoria, mês): se o
    // mesmo orçamento foi criado em outro device, atualiza em vez de colidir.
    const { error } = await supabase.from("budgets").upsert(row, {
        onConflict: "workspace_id,category_id,period_start",
    })
    return error ? failure(error) : { ok: true }
}
