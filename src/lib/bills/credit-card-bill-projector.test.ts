import { describe, expect, it } from "vitest"
import { projectVirtualCreditCardBills } from "@/lib/bills/credit-card-bill-projector"
import type { CcTxRow } from "@/lib/credit-cards-workspace-transactions"
import type { CreditCard, CreditCardInvoicePayment } from "@/lib/supabase"

const card = {
    id: "card-1",
    workspace_id: "ws-1",
    user_id: "u-1",
    name: "Roxinho",
    last_four: "1111",
    brand: null,
    closing_day: 10,
    due_day: 15,
    credit_limit: null,
    is_active: true,
    created_at: "",
    updated_at: "",
} as CreditCard

function compra(ymd: string, amount: number): CcTxRow {
    return {
        type: "expense",
        amount,
        date: `${ymd}T12:00:00.000Z`,
        payment_method: "credit_card",
        payment_credit_card_id: card.id,
        installment_plan_id: null,
        installment_sequence: null,
    } as CcTxRow
}

const hoje = new Date(2026, 8, 14, 12)

function projetar(ccRows: CcTxRow[], invoicePayments: CreditCardInvoicePayment[] = []) {
    return projectVirtualCreditCardBills({
        workspaceId: "ws-1",
        creditCards: [card],
        ccRows,
        installmentPlans: [],
        invoicePayments,
        today: hoje,
    })
}

describe("projectVirtualCreditCardBills", () => {
    it("a conta é a fatura fechada, que vence no mês seguinte", () => {
        const [conta, ...resto] = projetar([compra("2026-09-05", 200), compra("2026-09-12", 50)])
        expect(resto).toHaveLength(0)
        expect(conta.statement_close_date_ymd).toBe("2026-09-10")
        expect(conta.due_date_ymd).toBe("2026-10-15")
        expect(conta.amount_estimated).toBe(200)
    })

    it("fatura fechada já paga sai da lista", () => {
        const pagamento = { credit_card_id: card.id, statement_close_date: "2026-09-10" } as CreditCardInvoicePayment
        expect(projetar([compra("2026-09-05", 200)], [pagamento])).toHaveLength(0)
    })

    it("compra só na fatura aberta ainda não vira conta", () => {
        expect(projetar([compra("2026-09-12", 50)])).toHaveLength(0)
    })
})
