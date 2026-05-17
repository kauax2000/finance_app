import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import type { OfflineMutation } from "@/lib/offline/types"

export async function syncCategoryMutation(
    mutation: OfflineMutation
): Promise<{ ok: true } | { ok: false; error: string }> {
    const { operation, payload } = mutation

    if (operation === "delete") {
        const id = String(payload.serverId ?? payload.id ?? "")
        const { error } = await supabase.from("categories").delete().eq("id", id)
        if (error) {
            return {
                ok: false,
                error: formatSupabasePostgrestError(error) ?? error.message,
            }
        }
        return { ok: true }
    }

    const row = { ...payload } as Record<string, unknown>
    row.client_id = (row.client_id as string | undefined) ?? mutation.idempotencyKey

    if (operation === "insert") {
        const { error } = await supabase.from("categories").upsert(row, {
            onConflict: "client_id",
        })
        if (error) {
            return {
                ok: false,
                error: formatSupabasePostgrestError(error) ?? error.message,
            }
        }
        return { ok: true }
    }

    const serverId = String(payload.serverId ?? payload.id ?? "")
    delete row.serverId
    delete row.id
    const { error } = await supabase.from("categories").update(row).eq("id", serverId)
    if (error) {
        return {
            ok: false,
            error: formatSupabasePostgrestError(error) ?? error.message,
        }
    }
    return { ok: true }
}

export async function syncBudgetMutation(
    mutation: OfflineMutation
): Promise<{ ok: true } | { ok: false; error: string }> {
    const { operation, payload } = mutation

    if (operation === "delete") {
        const id = String(payload.serverId ?? payload.id ?? "")
        const { error } = await supabase.from("budgets").delete().eq("id", id)
        if (error) {
            return {
                ok: false,
                error: formatSupabasePostgrestError(error) ?? error.message,
            }
        }
        return { ok: true }
    }

    const row = { ...payload } as Record<string, unknown>
    row.client_id = (row.client_id as string | undefined) ?? mutation.idempotencyKey

    if (operation === "insert") {
        const { error } = await supabase.from("budgets").upsert(row, {
            onConflict: "client_id",
        })
        if (error) {
            return {
                ok: false,
                error: formatSupabasePostgrestError(error) ?? error.message,
            }
        }
        return { ok: true }
    }

    const serverId = String(payload.serverId ?? payload.id ?? "")
    delete row.serverId
    delete row.id
    const { error } = await supabase.from("budgets").update(row).eq("id", serverId)
    if (error) {
        return {
            ok: false,
            error: formatSupabasePostgrestError(error) ?? error.message,
        }
    }
    return { ok: true }
}
