"use client"

import { invokeEdgeJson } from "@/lib/edge-invoke"
import { scheduleEvaluateCreditCardAlerts } from "@/lib/credit-card-notifications"
import type { Bill, TransactionPaymentMethod } from "@/lib/supabase"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { computeNextBillInstanceDueYmd } from "@/lib/bills/recurrence"
import type { VirtualCreditCardBill } from "@/lib/bills/credit-card-bill-projector"
import { calendarYmdToStorageIso } from "@/lib/transaction-date"
import type { BillInstance } from "@/lib/supabase"
import { assertOnline } from "@/lib/offline/mutation-gateway"

export type PayBillRegularInput = {
    kind: "regular"
    instance: BillInstance
    bill: Bill
}

export type PayBillVirtualCcInput = {
    kind: "virtual_cc"
    virtual: VirtualCreditCardBill
}

export type PayBillInput = PayBillRegularInput | PayBillVirtualCcInput

export type PayBillPayload = {
    amount: number
    /** yyyy-mm-dd */
    paidDateYmd: string
    categoryId: string | null
    paymentMethod: TransactionPaymentMethod | null
    paymentCreditCardId: string | null
    description: string | null
}

function stripPm<T extends Record<string, unknown>>(row: T): Omit<
    T,
    "payment_method" | "payment_credit_card_id"
> {
    const { payment_method, payment_credit_card_id, ...rest } = row as T & {
        payment_method?: unknown
        payment_credit_card_id?: unknown
    }
    void payment_method
    void payment_credit_card_id
    return rest as Omit<T, "payment_method" | "payment_credit_card_id">
}

async function insertExpenseTransaction(opts: {
    supabase: SupabaseClient
    user: User
    workspaceId: string
    payload: PayBillPayload
    dateIso: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    const { supabase, user, workspaceId, payload, dateIso } = opts
    const txRow = {
        user_id: user.id,
        workspace_id: workspaceId,
        category_id: payload.categoryId,
        type: "expense" as const,
        amount: payload.amount,
        description: payload.description,
        date: dateIso,
        is_recurring: false,
        recurring_interval: null as string | null,
        payment_method: payload.paymentMethod,
        payment_credit_card_id: payload.paymentCreditCardId,
    }

    let res = await supabase.from("transactions").insert(txRow).select("id").single()

    if (
        res.error &&
        String(res.error.message ?? "").toLowerCase().includes("payment")
    ) {
        res = await supabase
            .from("transactions")
            .insert(stripPm(txRow))
            .select("id")
            .single()
    }

    if (res.error || !res.data?.id) {
        return {
            ok: false,
            error: res.error?.message ?? "Não foi possível criar a transação.",
        }
    }

    return { ok: true, id: String(res.data.id) }
}

async function fireBudgetAndCcAlerts(
    workspaceId: string,
    payload: PayBillPayload,
    dateIso: string
): Promise<void> {
    void invokeEdgeJson("evaluate-budgets", {
        body: {
            category_id: payload.categoryId,
            occurred_at: dateIso,
        },
    }).catch(() => {})
    scheduleEvaluateCreditCardAlerts({
        workspaceId,
        type: "expense",
        paymentMethod: payload.paymentMethod,
        paymentCreditCardId: payload.paymentCreditCardId,
        categoryId: payload.categoryId,
        dateIso,
    })
}

export async function executePayBillFlow(options: {
    supabase: SupabaseClient
    user: User
    workspaceId: string
    input: PayBillInput
    payload: PayBillPayload
}): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        assertOnline("Pagar conta")
    } catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : "Requer conexão.",
        }
    }

    const { supabase, user, workspaceId, input, payload } = options
    const dateIso = calendarYmdToStorageIso(payload.paidDateYmd.slice(0, 10))

    const inserted = await insertExpenseTransaction({
        supabase,
        user,
        workspaceId,
        payload,
        dateIso,
    })
    if (!inserted.ok) return inserted

    if (input.kind === "regular") {
        const { instance, bill } = input

        const { error: upErr } = await supabase
            .from("bill_instances")
            .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                paid_amount: payload.amount,
                payment_method: payload.paymentMethod,
                payment_credit_card_id: payload.paymentCreditCardId,
                transaction_id: inserted.id,
                amount: payload.amount,
            })
            .eq("id", instance.id)
            .eq("workspace_id", workspaceId)

        if (upErr) {
            return { ok: false, error: upErr.message }
        }

        const nextYmd = computeNextBillInstanceDueYmd(
            bill,
            instance.due_date.slice(0, 10),
        )
        if (nextYmd) {
            const { error: nextErr } = await supabase.from("bill_instances").insert({
                workspace_id: workspaceId,
                user_id: user.id,
                bill_id: bill.id,
                due_date: nextYmd,
                status: "pending",
                amount: null,
            })
            if (nextErr && nextErr.code !== "23505") {
                return { ok: false, error: nextErr.message }
            }
        }
    } else {
        const virt = input.virtual
        const { error: ccPayErr } = await supabase
            .from("credit_card_invoice_payments")
            .upsert(
                {
                    workspace_id: workspaceId,
                    credit_card_id: virt.credit_card_id,
                    statement_close_date: virt.statement_close_date_ymd,
                    status: "paid",
                    created_by: user.id,
                    paid_at: new Date().toISOString(),
                },
                {
                    onConflict: "workspace_id,credit_card_id,statement_close_date",
                },
            )

        if (ccPayErr) {
            return { ok: false, error: ccPayErr.message ?? "Erro ao registrar fatura." }
        }
    }

    await fireBudgetAndCcAlerts(workspaceId, payload, dateIso)
    return { ok: true }
}
