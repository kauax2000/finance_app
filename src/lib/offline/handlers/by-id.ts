import type { PostgrestError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError, NADA_MUDOU } from "@/lib/supabase-errors"
import type { OfflineMutation } from "@/lib/offline/types"

/** `somenteLeitura`: o gatilho barrou pela conta em "só leitura", lido do erro cru, antes da frase. */
export type SyncResult = { ok: true } | { ok: false; error: string; somenteLeitura?: boolean }

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
    return {
        ok: false,
        error: formatSupabasePostgrestError(error) ?? error.message,
        somenteLeitura: error.message === "workspace_somente_leitura",
    }
}

function targetId(mutation: OfflineMutation) {
    return String(mutation.payload.serverId ?? mutation.payload.id ?? "")
}

/**
 * Apagar o que já não existe chega ao mesmo fim: nenhuma linha afetada é
 * sucesso. Com `conferir`, 0 linhas relê a linha: se ela ainda está lá, a RLS
 * barrou sem erro (a privada de outra pessoa, Bloco 7B), e não é sucesso.
 */
export async function deleteById(
    table: Table,
    mutation: OfflineMutation,
    { conferir = false }: { conferir?: boolean } = {},
): Promise<SyncResult> {
    const id = targetId(mutation)
    const apagar = supabase.from(table).delete().eq("id", id).eq("workspace_id", mutation.workspaceId)
    if (!conferir) {
        const { error } = await apagar
        return error ? failure(error) : { ok: true }
    }
    const { data, error } = await apagar.select("id")
    if (error) return failure(error)
    if (data?.length) return { ok: true }
    const ainda = await supabase
        .from(table)
        .select("id")
        .eq("id", id)
        .eq("workspace_id", mutation.workspaceId)
        .maybeSingle()
    if (ainda.error) return failure(ainda.error)
    return ainda.data ? { ok: false, error: NADA_MUDOU } : { ok: true }
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
