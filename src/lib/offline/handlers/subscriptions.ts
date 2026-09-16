import { supabase } from "@/lib/supabase"
import type { OfflineMutation } from "@/lib/offline/types"
import { deleteById, failure, updateById, type SyncResult } from "@/lib/offline/handlers/by-id"

export async function syncSubscriptionMutation(mutation: OfflineMutation): Promise<SyncResult> {
    const { operation, payload } = mutation

    if (operation === "delete") return deleteById("workspace_subscriptions", mutation)
    if (operation !== "insert") return updateById("workspace_subscriptions", mutation)

    const row = { ...payload } as Record<string, unknown>
    row.client_id = (row.client_id as string | undefined) ?? mutation.idempotencyKey
    const { error } = await supabase.from("workspace_subscriptions").upsert(row, {
        onConflict: "workspace_id,client_id",
    })
    return error ? failure(error) : { ok: true }
}
