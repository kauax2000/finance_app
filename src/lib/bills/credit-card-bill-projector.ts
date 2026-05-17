import {
    buildCardCycleSnapshot,
    estimatedDueDateForClose,
} from "@/lib/credit-card-billing"
import type {
    CreditCard,
    CreditCardInvoicePayment,
    Transaction,
    WorkspaceInstallmentPlan,
} from "@/lib/supabase"
import type { CcTxRow } from "@/lib/credit-cards-workspace-transactions"
import { localYmdFromDate } from "@/lib/transaction-date"

export type VirtualCreditCardBill = {
    kind: "credit_card_invoice"
    id: string
    workspace_id: string
    credit_card_id: string
    cardName: string
    last_four: string
    due_date_ymd: string
    statement_close_date_ymd: string
    amount_estimated: number
    alreadyPaid: boolean
}

function pickTxForSnapshot(row: CcTxRow): Pick<
    Transaction,
    | "type"
    | "amount"
    | "date"
    | "payment_method"
    | "payment_credit_card_id"
    | "installment_plan_id"
    | "installment_sequence"
> {
    return {
        type: row.type,
        amount: row.amount,
        date: row.date,
        payment_method: row.payment_method ?? null,
        payment_credit_card_id: row.payment_credit_card_id ?? null,
        installment_plan_id: row.installment_plan_id ?? null,
        installment_sequence: row.installment_sequence ?? null,
    }
}

export function projectVirtualCreditCardBills(args: {
    workspaceId: string
    creditCards: CreditCard[]
    ccRows: CcTxRow[]
    installmentPlans: WorkspaceInstallmentPlan[]
    invoicePayments: CreditCardInvoicePayment[]
    today?: Date
}): VirtualCreditCardBill[] {
    const today = args.today ?? new Date()
    const byCard = new Map<string, CreditCardInvoicePayment[]>()
    for (const p of args.invoicePayments) {
        const list = byCard.get(p.credit_card_id) ?? []
        list.push(p)
        byCard.set(p.credit_card_id, list)
    }

    const out: VirtualCreditCardBill[] = []

    for (const card of args.creditCards) {
        if (!card.is_active) continue
        const cardTx = args.ccRows
            .filter((r) => r.payment_credit_card_id === card.id)
            .map(pickTxForSnapshot)

        const plansForCard = args.installmentPlans.filter(
            (p) =>
                p.is_active &&
                p.payment_method === "credit_card" &&
                (p.payment_credit_card_id === card.id ||
                    p.payment_credit_card_id == null),
        )

        const snap = buildCardCycleSnapshot(
            card,
            cardTx,
            today,
            { installmentPlans: plansForCard },
        )

        const closeYmd = localYmdFromDate(snap.nextClose)
        const cardPayments = byCard.get(card.id) ?? []
        const alreadyPaid = cardPayments.some(
            (p) => p.statement_close_date === closeYmd,
        )
        if (alreadyPaid) continue

        const due = estimatedDueDateForClose(snap.nextClose, card.due_day)
        const dueYmd = localYmdFromDate(due)

        out.push({
            kind: "credit_card_invoice",
            id: `virtual-cc:${card.id}:${closeYmd}`,
            workspace_id: args.workspaceId,
            credit_card_id: card.id,
            cardName: card.name,
            last_four: card.last_four,
            due_date_ymd: dueYmd,
            statement_close_date_ymd: closeYmd,
            amount_estimated: snap.committedOpenTotal,
            alreadyPaid: false,
        })
    }

    return out.sort((a, b) => a.due_date_ymd.localeCompare(b.due_date_ymd))
}
