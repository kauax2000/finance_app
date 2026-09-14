import { supabase } from "@/lib/supabase"
import type { OfflineMutation } from "@/lib/offline/types"
import { deleteById, failure, updateById, type SyncResult } from "@/lib/offline/handlers/by-id"

export async function syncBillMutation(mutation: OfflineMutation): Promise<SyncResult> {
    const { operation, payload, entity } = mutation
    const table = entity === "bill_instance" ? "bill_instances" : "bills"

    if (operation === "delete") return deleteById(table, mutation)
    if (operation !== "insert") return updateById(table, mutation)

    const row = { ...payload } as Record<string, unknown>
    row.client_id = (row.client_id as string | undefined) ?? mutation.idempotencyKey
    const firstInstanceDue = row.first_instance_due as string | undefined
    delete row.first_instance_due

    const { data: bill, error } = await supabase
        .from(table)
        .upsert(row, { onConflict: "workspace_id,client_id" })
        .select("id, due_day_of_month, start_date")
        .single()

    if (error) return failure(error)
    if (!bill) return { ok: false, error: "Erro" }

    if (entity === "bill" && firstInstanceDue && bill.id) {
        // O replay é idempotente nos dois upserts: se a parcela falhar, tentar de novo é seguro.
        const { error: instanceError } = await supabase.from("bill_instances").upsert(
            {
                workspace_id: mutation.workspaceId,
                user_id: row.user_id,
                bill_id: (bill as { id: string }).id,
                due_date: firstInstanceDue,
                status: "pending",
                amount: null,
                client_id: `${mutation.idempotencyKey}-inst`,
            },
            { onConflict: "workspace_id,client_id", ignoreDuplicates: true }
        )
        if (instanceError) return failure(instanceError)
    }

    return { ok: true }
}
