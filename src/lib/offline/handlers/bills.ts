import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import type { OfflineMutation } from "@/lib/offline/types"

export async function syncBillMutation(
    mutation: OfflineMutation
): Promise<{ ok: true } | { ok: false; error: string }> {
    const { operation, payload, entity } = mutation
    const table = entity === "bill_instance" ? "bill_instances" : "bills"

    if (operation === "delete") {
        const id = String(payload.serverId ?? payload.id ?? "")
        const { error } = await supabase.from(table).delete().eq("id", id)
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
        const firstInstanceDue = row.first_instance_due as string | undefined
        delete row.first_instance_due

        const { data: bill, error } = await supabase
            .from(table)
            .upsert(row, { onConflict: "client_id" })
            .select("id, due_day_of_month, start_date")
            .single()

        if (error || !bill) {
            return {
                ok: false,
                error: formatSupabasePostgrestError(error) ?? error?.message ?? "Erro",
            }
        }

        if (entity === "bill" && firstInstanceDue && bill.id) {
            const billRow = bill as { id: string }
            await supabase.from("bill_instances").upsert(
                {
                    workspace_id: mutation.workspaceId,
                    user_id: row.user_id,
                    bill_id: billRow.id,
                    due_date: firstInstanceDue,
                    status: "pending",
                    amount: null,
                    client_id: `${mutation.idempotencyKey}-inst`,
                },
                { onConflict: "client_id", ignoreDuplicates: true }
            )
        }

        return { ok: true }
    }

    const serverId = String(payload.serverId ?? payload.id ?? "")
    delete row.serverId
    delete row.id
    const { error } = await supabase.from(table).update(row).eq("id", serverId)
    if (error) {
        return {
            ok: false,
            error: formatSupabasePostgrestError(error) ?? error.message,
        }
    }
    return { ok: true }
}
