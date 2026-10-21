import { describe, expect, it } from "vitest"
import { projectVirtualCreditCardBills } from "@/lib/bills/credit-card-bill-projector"
import type { CcTxRow } from "@/lib/credit-cards-workspace-transactions"
import type { CreditCard, CreditCardInvoicePayment, CreditCardStatementTotal } from "@/lib/supabase"

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

function projetar(
    ccRows: CcTxRow[],
    invoicePayments: CreditCardInvoicePayment[] = [],
    statementTotals: CreditCardStatementTotal[] = [],
) {
    return projectVirtualCreditCardBills({
        workspaceId: "ws-1",
        creditCards: [card],
        ccRows,
        installmentPlans: [],
        invoicePayments,
        statementTotals,
        today: hoje,
    })
}

function totalDoBanco(statement_close_date: string, bank_total: number) {
    return { credit_card_id: card.id, statement_close_date, bank_total } as CreditCardStatementTotal
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

    it("o total do banco vale sobre o calculado", () => {
        const [conta] = projetar([compra("2026-09-05", 200)], [], [totalDoBanco("2026-09-10", 233.5)])
        expect(conta.amount_estimated).toBe(233.5)
    })

    it("o total do banco de outro fechamento não conta", () => {
        const [conta] = projetar([compra("2026-09-05", 200)], [], [totalDoBanco("2026-08-10", 999)])
        expect(conta.amount_estimated).toBe(200)
    })

    it("com o total do banco, a conta existe mesmo sem compras lançadas", () => {
        const [conta] = projetar([], [], [totalDoBanco("2026-09-10", 80)])
        expect(conta.amount_estimated).toBe(80)
    })
})
