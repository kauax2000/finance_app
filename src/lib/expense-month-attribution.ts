import { statementCloseYmdForPurchaseDate } from "@/lib/credit-card-billing"
import type {
    CreditCard,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import { monthYearKeyFromTransactionDate } from "@/lib/transaction-date"

export type CreditCardClosingLookup = Map<string, number>

export type ExpenseMonthTx = Pick<
    Transaction,
    "type" | "date" | "payment_method" | "payment_credit_card_id"
>

export type ExpenseMonthAmountTx = ExpenseMonthTx & Pick<Transaction, "amount">

export function buildCreditCardClosingLookup(
    cards: Pick<CreditCard, "id" | "closing_day">[],
): CreditCardClosingLookup {
    const lookup: CreditCardClosingLookup = new Map()
    for (const card of cards) {
        lookup.set(card.id, card.closing_day)
    }
    return lookup
}

/** Calendar `YYYY-MM` for income and non–credit-card expenses. */
export function calendarYearMonthKeyFromTransactionDate(isoOrString: string): string {
    return monthYearKeyFromTransactionDate(isoOrString)
}

/**
 * Expense month key: billing close month for credit card, calendar month otherwise.
 * Returns null when the row is not an expense or the date is invalid.
 */
export function expenseYearMonthKey(
    tx: ExpenseMonthTx,
    lookup: CreditCardClosingLookup,
): string | null {
    if (tx.type !== "expense") return null
    if (tx.payment_method === "credit_card" && tx.payment_credit_card_id) {
        const closingDay = lookup.get(tx.payment_credit_card_id)
        if (closingDay != null) {
            const closeYmd = statementCloseYmdForPurchaseDate(tx.date, closingDay)
            if (closeYmd) return closeYmd.slice(0, 7)
        }
    }
    const cal = calendarYearMonthKeyFromTransactionDate(tx.date)
    return cal || null
}

export function transactionCountsInExpenseMonth(
    tx: ExpenseMonthTx,
    yearMonth: string,
    lookup: CreditCardClosingLookup,
): boolean {
    if (tx.type === "income") {
        return calendarYearMonthKeyFromTransactionDate(tx.date) === yearMonth
    }
    if (tx.type !== "expense") return false
    return expenseYearMonthKey(tx, lookup) === yearMonth
}

export function aggregateIncomeExpenseForMonth(
    transactions: ExpenseMonthAmountTx[],
    yearMonth: string,
    lookup: CreditCardClosingLookup,
): { income: number; expense: number; net: number } {
    let income = 0
    let expense = 0
    for (const t of transactions) {
        if (!transactionCountsInExpenseMonth(t, yearMonth, lookup)) continue
        const n = Number(t.amount)
        if (!Number.isFinite(n)) continue
        if (t.type === "income") income += n
        else expense += n
    }
    return { income, expense, net: income - expense }
}

export function projectedChargeCountsInExpenseMonth(
    chargeDate: Date,
    plan: Pick<
        WorkspaceInstallmentPlan,
        "payment_method" | "payment_credit_card_id"
    >,
    yearMonth: string,
    lookup: CreditCardClosingLookup,
): boolean {
    const iso = chargeDateToExpenseIso(chargeDate)
    const tx: ExpenseMonthTx = {
        type: "expense",
        date: iso,
        payment_method: plan.payment_method,
        payment_credit_card_id: plan.payment_credit_card_id,
    }
    return expenseYearMonthKey(tx, lookup) === yearMonth
}

export function projectedSubscriptionCountsInExpenseMonth(
    chargeDate: Date,
    sub: Pick<
        WorkspaceSubscription,
        "payment_method" | "payment_credit_card_id"
    >,
    yearMonth: string,
    lookup: CreditCardClosingLookup,
): boolean {
    const iso = chargeDateToExpenseIso(chargeDate)
    const tx: ExpenseMonthTx = {
        type: "expense",
        date: iso,
        payment_method: sub.payment_method,
        payment_credit_card_id: sub.payment_credit_card_id,
    }
    return expenseYearMonthKey(tx, lookup) === yearMonth
}

export function chargeDateToExpenseIso(chargeDate: Date): string {
    const y = chargeDate.getFullYear()
    const mo = chargeDate.getMonth() + 1
    const d = chargeDate.getDate()
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00.000Z`
}
