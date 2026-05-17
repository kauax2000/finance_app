import { supabase } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isTransactionsPaymentColumnsUnsupportedError,
} from "@/lib/supabase-errors"
import type { OfflineMutation } from "@/lib/offline/types"

function stripPaymentColumns<T extends Record<string, unknown>>(row: T) {
    const next = { ...row } as Record<string, unknown>
    delete next.payment_method
    delete next.payment_credit_card_id
    return next
}

export async function syncTransactionMutation(
    mutation: OfflineMutation
): Promise<{ ok: true } | { ok: false; error: string }> {
    const { operation, payload } = mutation

    if (operation === "delete") {
        const id = String(payload.serverId ?? payload.id ?? "")
        const { error } = await supabase.from("transactions").delete().eq("id", id)
        if (error) {
            return {
                ok: false,
                error: formatSupabasePostgrestError(error) ?? error.message,
            }
        }
        return { ok: true }
    }

    const row = { ...payload } as Record<string, unknown>
    const clientId = (row.client_id as string | undefined) ?? mutation.idempotencyKey
    row.client_id = clientId

    if (operation === "insert") {
        let { error } = await supabase.from("transactions").upsert(row, {
            onConflict: "client_id",
            ignoreDuplicates: false,
        })

        if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
            const retry = await supabase
                .from("transactions")
                .upsert(stripPaymentColumns(row), { onConflict: "client_id" })
            error = retry.error
        }

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

    let { error } = await supabase.from("transactions").update(row).eq("id", serverId)

    if (error && isTransactionsPaymentColumnsUnsupportedError(error)) {
        const retry = await supabase
            .from("transactions")
            .update(stripPaymentColumns(row))
            .eq("id", serverId)
        error = retry.error
    }

    if (error) {
        return {
            ok: false,
            error: formatSupabasePostgrestError(error) ?? error.message,
        }
    }

    return { ok: true }
}
