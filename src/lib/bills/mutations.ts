"use client"

import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { BillFormPayloadForSave as SavePayload } from "@/components/bills/bill-form-shared"
import type { Bill as BillRow } from "@/lib/supabase"
import {
    billStartYmd,
    computeFirstDueYmd,
    computeNextBillInstanceDueYmd,
} from "@/lib/bills/recurrence"
import { CAMPOS_DA_AGENDA, reprogramarPendenteDaConta, type AgendaDaConta } from "@/lib/bills/reprogramar"
import { localYmdFromDate } from "@/lib/transaction-date"
import { executeMutation } from "@/lib/offline/mutation-gateway"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

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
        valor_variavel: p.valor_variavel,
    }
}

/** O primeiro vencimento, ou `null` quando ele já passa do fim: a conta nasce sem instância. */
function primeiraInstanciaYmd(p: Pick<SavePayload, "start_date" | "due_day_of_month" | "end_date">): string | null {
    const due = computeFirstDueYmd({ startYmd: p.start_date.slice(0, 10), dueDayOfMonth: p.due_day_of_month })
    return p.end_date && due > p.end_date.slice(0, 10) ? null : due
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
        .select("amount_estimated, category_id, created_at, default_payment_credit_card_id, default_payment_method, description, due_day_of_month, end_date, frequency, icon, id, is_active, name, notes, reminder_days_before, start_date, updated_at, user_id, valor_variavel, workspace_id")
        .single()

    if (billErr || !bill) {
        return { ok: false, error: billErr?.message ?? "Erro ao criar conta." }
    }

    const b = bill as BillRow
    const dueYmd = primeiraInstanciaYmd({ ...b, start_date: billStartYmd(b) })
    if (!dueYmd) return { ok: true, bill: b }

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
    const dueYmdPreview = primeiraInstanciaYmd(payload)

    const gateway = await executeMutation({
        entity: "bill",
        operation: "insert",
        workspaceId,
        idempotencyKey: clientId,
        offlinePayload: {
            ...row,
            client_id: clientId,
            user_id: user.id,
            ...(dueYmdPreview ? { first_instance_due: dueYmdPreview } : {}),
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
    /** Quem cria a próxima pendente ao reativar (a RLS pede `user_id = auth.uid()`). */
    userId: string
    payload: SavePayload
}): Promise<{ ok: true; queued?: boolean } | { ok: false; error: string }> {
    const { supabase, workspaceId, billId, userId, payload } = opts

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
        valor_variavel: payload.valor_variavel,
    }

    const gateway = await executeMutation({
        entity: "bill",
        operation: "update",
        workspaceId,
        offlinePayload: { ...updateRow, serverId: billId },
        onlineFn: async () => {
            const { data: antes, error: readErr } = await supabase
                .from("bills")
                .select(CAMPOS_DA_AGENDA)
                .eq("id", billId)
                .eq("workspace_id", workspaceId)
                .single()
            if (readErr || !antes) {
                throw new Error(formatSupabasePostgrestError(readErr) ?? "Conta não encontrada nesta carteira.")
            }
            const { error } = await supabase
                .from("bills")
                .update(updateRow)
                .eq("id", billId)
                .eq("workspace_id", workspaceId)
            if (error) throw new Error(formatSupabasePostgrestError(error) ?? "Não foi possível salvar a conta.")
            const erro = await reprogramarPendenteDaConta(supabase, {
                workspaceId,
                billId,
                userId,
                antes: antes as AgendaDaConta,
                depois: updateRow,
                hojeYmd: localYmdFromDate(new Date()),
            })
            if (erro) throw new Error(erro)
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
            if (error) throw new Error(formatSupabasePostgrestError(error) ?? "Não foi possível excluir a conta.")
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
    const { supabase, instanceId, bill, currentDueYmd } = opts

    // Uma transação só: pula a instância e cria a próxima (Bloco 6A, decisão 5).
    const { error } = await supabase.rpc("pular_instancia_da_conta", {
        p_instance_id: instanceId,
        p_next_due_date: computeNextBillInstanceDueYmd(bill, currentDueYmd),
    })
    if (error) {
        if (String(error.message ?? "").includes("BILL_INSTANCE_NOT_PENDING")) {
            return { ok: false, error: "Esta conta já foi paga ou pulada." }
        }
        return { ok: false, error: formatSupabasePostgrestError(error) ?? "Não foi possível pular a conta." }
    }
    return { ok: true }
}
