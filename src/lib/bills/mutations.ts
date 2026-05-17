"use client"

import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { BillFormPayloadForSave as SavePayload } from "@/components/bills/bill-form-shared"
import type { Bill as BillRow } from "@/lib/supabase"
import {
    billStartYmd,
    computeFirstDueYmd,
    computeNextBillInstanceDueYmd,
} from "@/lib/bills/recurrence"
import { executeMutation } from "@/lib/offline/mutation-gateway"

/** Re-export save payload typing for callers (single source). */
export type { SavePayload }

function mapBillInsertPayload(
    userId: string,
    workspaceId: string,
    p: SavePayload
): Omit<
    BillRow,
    | "id"
    | "created_at"
    | "updated_at"
    | "category"
> {
    return {
        workspace_id: workspaceId,
        user_id: userId,
        name: p.name,
        description: p.description,
        notes: p.notes,
        category_id: p.category_id,
        frequency: p.frequency,
        due_day_of_month: p.due_day_of_month,
        amount_estimated: p.amount_estimated,
        start_date: p.start_date,
        end_date: p.end_date,
        default_payment_method: p.default_payment_method,
        default_payment_credit_card_id: p.default_payment_credit_card_id,
        reminder_days_before: p.reminder_days_before,
        is_active: p.is_active,
        icon: p.icon,
    }
}

async function insertBillWithFirstInstanceOnline(opts: {
    supabase: SupabaseClient
    user: User
    workspaceId: string
    payload: SavePayload
    clientId: string
}): Promise<{ ok: true; bill: BillRow } | { ok: false; error: string }> {
    const { supabase, user, workspaceId, payload, clientId } = opts
    const row = { ...mapBillInsertPayload(user.id, workspaceId, payload), client_id: clientId }

    const { data: bill, error: billErr } = await supabase
        .from("bills")
        .insert(row)
        .select("*")
        .single()

    if (billErr || !bill) {
        return { ok: false, error: billErr?.message ?? "Erro ao criar conta." }
    }

    const b = bill as BillRow
    const dueYmd = computeFirstDueYmd({
        startYmd: billStartYmd(b),
        dueDayOfMonth: b.due_day_of_month,
    })

    const { error: instErr } = await supabase.from("bill_instances").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        bill_id: b.id,
        due_date: dueYmd,
        status: "pending",
        amount: null,
    })

    if (instErr && instErr.code !== "23505") {
        await supabase.from("bills").delete().eq("id", b.id)
        return { ok: false, error: instErr.message }
    }

    return { ok: true, bill: b }
}

export async function insertBillWithFirstInstance(opts: {
    supabase: SupabaseClient
    user: User
    workspaceId: string
    payload: SavePayload
}): Promise<
    | { ok: true; bill: BillRow; queued?: boolean }
    | { ok: false; error: string }
> {
    const { supabase, user, workspaceId, payload } = opts
    const clientId = crypto.randomUUID()
    const row = mapBillInsertPayload(user.id, workspaceId, payload)
    const dueYmdPreview = computeFirstDueYmd({
        startYmd: payload.start_date,
        dueDayOfMonth: payload.due_day_of_month,
    })

    const gateway = await executeMutation({
        entity: "bill",
        operation: "insert",
        workspaceId,
        idempotencyKey: clientId,
        offlinePayload: {
            ...row,
            client_id: clientId,
            user_id: user.id,
            first_instance_due: dueYmdPreview,
        },
        onlineFn: async () => {
            const result = await insertBillWithFirstInstanceOnline({
                supabase,
                user,
                workspaceId,
                payload,
                clientId,
            })
            if (!result.ok) {
                throw new Error(result.error)
            }
            return result
        },
    })

    if (!gateway.ok) {
        return { ok: false, error: gateway.errorMessage }
    }
    if ("queued" in gateway && gateway.queued) {
        return {
            ok: true,
            queued: true,
            bill: { ...row, id: clientId, client_id: clientId } as unknown as BillRow,
        }
    }
    if ("data" in gateway) {
        return gateway.data
    }
    return { ok: false, error: "Resposta inesperada ao salvar conta." }
}

export async function updateBillRow(opts: {
    supabase: SupabaseClient
    workspaceId: string
    billId: string
    payload: SavePayload
}): Promise<{ ok: true; queued?: boolean } | { ok: false; error: string }> {
    const { supabase, workspaceId, billId, payload } = opts

    const updateRow = {
        name: payload.name,
        description: payload.description,
        notes: payload.notes,
        category_id: payload.category_id,
        frequency: payload.frequency,
        due_day_of_month: payload.due_day_of_month,
        amount_estimated: payload.amount_estimated,
        start_date: payload.start_date,
        end_date: payload.end_date,
        default_payment_method: payload.default_payment_method,
        default_payment_credit_card_id: payload.default_payment_credit_card_id,
        reminder_days_before: payload.reminder_days_before,
        is_active: payload.is_active,
        icon: payload.icon,
    }

    const gateway = await executeMutation({
        entity: "bill",
        operation: "update",
        workspaceId,
        offlinePayload: { ...updateRow, serverId: billId },
        onlineFn: async () => {
            const { error } = await supabase
                .from("bills")
                .update(updateRow)
                .eq("id", billId)
                .eq("workspace_id", workspaceId)
            if (error) throw new Error(error.message)
            return { ok: true as const }
        },
    })

    if (!gateway.ok) return { ok: false, error: gateway.errorMessage }
    if ("queued" in gateway && gateway.queued) return { ok: true, queued: true }
    return { ok: true }
}

export async function deleteBillCascade(opts: {
    supabase: SupabaseClient
    workspaceId: string
    billId: string
}): Promise<{ ok: true; queued?: boolean } | { ok: false; error: string }> {
    const { supabase, workspaceId, billId } = opts

    const gateway = await executeMutation({
        entity: "bill",
        operation: "delete",
        workspaceId,
        offlinePayload: { serverId: billId, id: billId },
        onlineFn: async () => {
            const { error } = await supabase
                .from("bills")
                .delete()
                .eq("id", billId)
                .eq("workspace_id", workspaceId)
            if (error) throw new Error(error.message)
            return { ok: true as const }
        },
    })

    if (!gateway.ok) return { ok: false, error: gateway.errorMessage }
    if ("queued" in gateway && gateway.queued) return { ok: true, queued: true }
    return { ok: true }
}

export async function skipBillInstance(opts: {
    supabase: SupabaseClient
    user: User
    workspaceId: string
    instanceId: string
    bill: BillRow
    currentDueYmd: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
    const { supabase, user, workspaceId, instanceId, bill, currentDueYmd } =
        opts

    const { error: upErr } = await supabase
        .from("bill_instances")
        .update({ status: "skipped" })
        .eq("id", instanceId)
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")

    if (upErr) return { ok: false, error: upErr.message }

    const nextYmd = computeNextBillInstanceDueYmd(bill, currentDueYmd)
    if (nextYmd) {
        await supabase.from("bill_instances").insert({
            workspace_id: workspaceId,
            user_id: user.id,
            bill_id: bill.id,
            due_date: nextYmd,
            status: "pending",
            amount: null,
        })
    }

    return { ok: true }
}
