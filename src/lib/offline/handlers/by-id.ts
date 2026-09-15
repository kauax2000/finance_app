import type { PostgrestError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import type { OfflineMutation } from "@/lib/offline/types"

export type SyncResult = { ok: true } | { ok: false; error: string }

type Table =
    | "transactions"
    | "categories"
    | "budgets"
    | "credit_cards"
    | "workspace_subscriptions"
    | "bills"
    | "bill_instances"

type Row = Record<string, unknown>

export function failure(error: PostgrestError): SyncResult {
    return { ok: false, error: formatSupabasePostgrestError(error) ?? error.message }
}

function targetId(mutation: OfflineMutation) {
    return String(mutation.payload.serverId ?? mutation.payload.id ?? "")
}

/** Apagar o que já não existe chega ao mesmo fim: nenhuma linha afetada é sucesso. */
export async function deleteById(table: Table, mutation: OfflineMutation): Promise<SyncResult> {
    const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", targetId(mutation))
        .eq("workspace_id", mutation.workspaceId)
    return error ? failure(error) : { ok: true }
}

/**
 * Update sem linha afetada não é sucesso: o registro sumiu ou não é desta
 * carteira, e a RLS esconde isso sem erro. O `client_id` da fila não
 * sobrescreve o da linha.
 */
export async function updateById(
    table: Table,
    mutation: OfflineMutation,
    fallbackRow?: (row: Row, error: PostgrestError) => Row | null,
): Promise<SyncResult> {
    const row: Row = { ...mutation.payload }
    delete row.serverId
    delete row.id
    delete row.client_id

    const run = (values: Row) =>
        supabase
            .from(table)
            .update(values)
            .eq("id", targetId(mutation))
            .eq("workspace_id", mutation.workspaceId)
            .select("id")

    let { data, error } = await run(row)
    const retryRow = error ? fallbackRow?.(row, error) : null
    if (retryRow) ({ data, error } = await run(retryRow))

    if (error) return failure(error)
    if (!data?.length) return { ok: false, error: "Registro não encontrado nesta carteira." }
    return { ok: true }
}
