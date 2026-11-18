/**
 * Quanto cada categoria de receita rende no mês: o que já entrou (`recebido`) e o que ainda vem
 * (`previsto`). Mesma regra de `fluxoDoMes` (Previsão), repartida por categoria. Em reais.
 */
import { periodBoundsFromYearMonth } from "@/lib/budget-month"
import { centavos, cobrancasLancadas, cobrancasPorLancar } from "@/lib/previsao/fatura-prevista"
import type { Transaction, WorkspaceSubscription } from "@/lib/supabase"
import { compareYmd, transactionLocalYmd } from "@/lib/transaction-date"

export type ReceitaDoMes = { recebido: number; previsto: number }

export function receitasDoMesPorCategoria(args: {
    yearMonth: string
    hojeYmd: string
    transactions: Pick<Transaction, "type" | "amount" | "date" | "category_id" | "subscription_id" | "payment_method">[]
    subscriptions: WorkspaceSubscription[]
}): Record<string, ReceitaDoMes> {
    const { yearMonth, hojeYmd, transactions, subscriptions } = args
    const { period_start: inicio, period_end: fim } = periodBoundsFromYearMonth(yearMonth)
    const cents: Record<string, { recebido: number; previsto: number }> = {}
    const somar = (cat: string, campo: "recebido" | "previsto", v: number) => {
        cents[cat] ??= { recebido: 0, previsto: 0 }
        cents[cat][campo] += v
    }

    for (const t of transactions) {
        if (t.type !== "income" || !t.category_id || t.payment_method === "credit_card") continue
        const ymd = transactionLocalYmd(t.date)
        if (!ymd || compareYmd(ymd, inicio) < 0 || compareYmd(ymd, fim) > 0) continue
        somar(t.category_id, compareYmd(ymd, hojeYmd) <= 0 ? "recebido" : "previsto", centavos(t.amount))
    }

    if (compareYmd(hojeYmd, fim) <= 0) {
        const lancadas = cobrancasLancadas(transactions)
        for (const sub of subscriptions) {
            if (sub.kind !== "income" || !sub.is_active || !sub.category_id || sub.payment_method === "credit_card") continue
            for (const v of cobrancasPorLancar(sub, inicio, fim, lancadas)) somar(sub.category_id, "previsto", centavos(v))
        }
    }

    return Object.fromEntries(
        Object.entries(cents).map(([id, c]) => [id, { recebido: c.recebido / 100, previsto: c.previsto / 100 }]),
    )
}
