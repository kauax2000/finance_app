"use client"

import { invokeEdgeJson } from "@/lib/edge-invoke"
import { scheduleEvaluateCreditCardAlerts } from "@/lib/credit-card-notifications"
import type { Bill, BillInstance, TransactionPaymentMethod } from "@/lib/supabase"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { computeNextBillInstanceDueYmd } from "@/lib/bills/recurrence"
import type { VirtualCreditCardBill } from "@/lib/bills/credit-card-bill-projector"
import { calendarYmdToStorageIso } from "@/lib/transaction-date"
import { assertActionAllowedOffline } from "@/lib/offline/mutation-gateway"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

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

function fireBudgetAndCcAlerts(
    workspaceId: string,
    payload: PayBillPayload,
    dateIso: string
): void {
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
        assertActionAllowedOffline("pay_bill_edge", "Pagar conta")
    } catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : "Requer conexão.",
        }
    }

    const { supabase, workspaceId, input, payload } = options
    const paidYmd = payload.paidDateYmd.slice(0, 10)
    const dateIso = calendarYmdToStorageIso(paidYmd)

    if (input.kind === "virtual_cc") {
        // Pagar a fatura não é uma despesa: as compras já estão lançadas no
        // cartão, e o cartão não paga a própria fatura. Só marca como paga.
        const virt = input.virtual
        const { error } = await supabase
            .from("credit_card_invoice_payments")
            .upsert(
                {
                    workspace_id: workspaceId,
                    credit_card_id: virt.credit_card_id,
                    statement_close_date: virt.statement_close_date_ymd,
                    status: "paid",
                    created_by: options.user.id,
                    paid_at: dateIso,
                },
                { onConflict: "workspace_id,credit_card_id,statement_close_date" },
            )
        if (error) {
            return {
                ok: false,
                error: formatSupabasePostgrestError(error) ?? "Erro ao registrar fatura.",
            }
        }
        return { ok: true }
    }

    // Uma transação só no banco: parcela, despesa e próxima parcela.
    const { instance, bill } = input
    const { error } = await supabase.rpc("pay_bill_instance", {
        p_instance_id: instance.id,
        p_amount: payload.amount,
        p_paid_date: paidYmd,
        p_category_id: payload.categoryId,
        p_payment_method: payload.paymentMethod,
        p_payment_credit_card_id: payload.paymentCreditCardId,
        p_description: payload.description,
        p_next_due_date: computeNextBillInstanceDueYmd(bill, instance.due_date.slice(0, 10)),
    })
    if (error) {
        if (String(error.message ?? "").includes("BILL_INSTANCE_NOT_PENDING")) {
            return { ok: false, error: "Esta conta já foi paga." }
        }
        return {
            ok: false,
            error:
                formatSupabasePostgrestError(error) ?? "Não foi possível registrar o pagamento.",
        }
    }

    fireBudgetAndCcAlerts(workspaceId, payload, dateIso)
    return { ok: true }
}
