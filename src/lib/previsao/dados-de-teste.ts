/** Fábricas dos testes da previsão: só o que muda entre os casos é escrito no teste. */
import type {
    Bill,
    BillInstance,
    CreditCard,
    CreditCardStatementTotal,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import type { DadosDaPrevisao } from "./tipos"

const base = { workspace_id: "w", user_id: "u", created_at: "", updated_at: "" }

export function dados(over: Partial<DadosDaPrevisao> & { hojeYmd: string }): DadosDaPrevisao {
    return {
        transacoes: [],
        assinaturas: [],
        planos: [],
        cartoes: [],
        totaisDoBanco: [],
        faturasPagas: new Set(),
        contas: [],
        contasPendentes: [],
        reserva: null,
        ...over,
    }
}

let seq = 0

export function tx(
    type: Transaction["type"],
    amount: number,
    ymd: string,
    over: Partial<Transaction> = {},
): Transaction {
    return {
        ...base,
        id: `tx-${++seq}`,
        category_id: null,
        type,
        amount,
        description: null,
        date: `${ymd}T12:00:00.000Z`,
        is_recurring: false,
        recurring_interval: null,
        payment_method: "pix",
        payment_credit_card_id: null,
        subscription_id: null,
        installment_plan_id: null,
        installment_sequence: null,
        source: "app",
        needs_review: false,
        import_batch_id: null,
        ...over,
    }
}

/** Compra (ou estorno, com `income`) no cartão. */
export function noCartao(
    type: Transaction["type"],
    amount: number,
    ymd: string,
    cardId: string,
    over: Partial<Transaction> = {},
): Transaction {
    return tx(type, amount, ymd, {
        payment_method: "credit_card",
        payment_credit_card_id: cardId,
        ...over,
    })
}

export function cartao(id: string, closing_day: number, due_day: number): CreditCard {
    return {
        ...base,
        id,
        name: `Cartão ${id}`,
        last_four: "0000",
        brand: null,
        closing_day,
        due_day,
        credit_limit: null,
        is_active: true,
    }
}

export function assinatura(over: Partial<WorkspaceSubscription> & { id: string }): WorkspaceSubscription {
    return {
        ...base,
        name: over.id,
        amount: 0,
        billing_interval: "monthly",
        currency: "BRL",
        start_date: "2026-01-01",
        next_billing_date: null,
        day_of_month: null,
        billing_anchor_day: null,
        category_id: null,
        notes: null,
        payment_method: "pix",
        payment_credit_card_id: null,
        is_active: true,
        kind: "expense",
        ...over,
    }
}

export function plano(
    over: Partial<WorkspaceInstallmentPlan> & { id: string },
): WorkspaceInstallmentPlan {
    return {
        ...base,
        category_id: null,
        description: over.id,
        payment_method: "pix",
        payment_credit_card_id: null,
        total_installments: 1,
        generated_count: 0,
        installment_amount: 0,
        final_installment_amount: 0,
        next_billing_date: "2026-01-01",
        billing_anchor_day: null,
        is_active: true,
        ...over,
    }
}

export function conta(over: Partial<Bill> & { id: string }): Bill {
    return {
        ...base,
        name: over.id,
        description: null,
        notes: null,
        icon: null,
        category_id: null,
        frequency: "monthly",
        due_day_of_month: 1,
        amount_estimated: null,
        valor_variavel: false,
        start_date: "2026-01-01",
        end_date: null,
        default_payment_method: null,
        default_payment_credit_card_id: null,
        reminder_days_before: [],
        is_active: true,
        ...over,
    }
}

export function pendente(bill_id: string, due_date: string, amount: number | null = null): BillInstance {
    return {
        ...base,
        id: `inst-${bill_id}-${due_date}`,
        bill_id,
        due_date,
        amount,
        status: "pending",
        paid_at: null,
        paid_amount: null,
        payment_method: null,
        payment_credit_card_id: null,
        transaction_id: null,
        notes: null,
    }
}

export function totalDoBanco(
    credit_card_id: string,
    statement_close_date: string,
    bank_total: number,
): CreditCardStatementTotal {
    return {
        ...base,
        id: `banco-${credit_card_id}-${statement_close_date}`,
        credit_card_id,
        statement_close_date,
        bank_total,
        source: "manual",
        created_by: "u",
        approved_at: null,
        approved_by: null,
    }
}
