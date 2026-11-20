import type { CreditCard, Transaction } from "@/lib/supabase"
import { shiftYearMonth } from "@/lib/budget-month"
import {
    buildCreditCardClosingLookup,
    expenseYearMonthKey,
    sinalNaDespesa,
    type CreditCardClosingLookup,
} from "@/lib/expense-month-attribution"
import { formatYearMonthShortPtBr, monthYearKeyFromTransactionDate } from "@/lib/transaction-date"

export function buildMonthlySeries(
    baseYm: string,
    txs: Pick<
        Transaction,
        "date" | "amount" | "type" | "category_id" | "payment_method" | "payment_credit_card_id"
    >[],
    categoryId: string,
    typeFilter: "income" | "expense" | null,
    monthsBack: number,
    creditCards?: Pick<CreditCard, "id" | "closing_day">[],
) {
    const months = Array.from({ length: monthsBack }, (_, i) =>
        // `shiftYearMonth` é local. A cópia anterior montava a data em UTC e lia
        // em hora local: em São Paulo cada mês da série saía um mês antes.
        shiftYearMonth(baseYm, -(monthsBack - 1 - i)),
    )
    const totals: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]))
    const closingLookup: CreditCardClosingLookup = buildCreditCardClosingLookup(
        creditCards ?? [],
    )

    for (const t of txs) {
        if (t.category_id !== categoryId) continue
        // Na categoria de despesa o estorno no cartão abate no mês do fechamento.
        const sinal = typeFilter === "expense" ? sinalNaDespesa(t) : !typeFilter || t.type === typeFilter ? 1 : 0
        if (!sinal) continue
        const mk =
            typeFilter === "expense"
                ? expenseYearMonthKey({ ...t, type: "expense" }, closingLookup)
                : monthYearKeyFromTransactionDate(t.date)
        if (!mk) continue
        if (totals[mk] === undefined) continue
        totals[mk] += sinal * Number(t.amount)
    }

    return months.map((ym) => ({ name: formatYearMonthShortPtBr(ym), total: totals[ym] ?? 0 }))
}
