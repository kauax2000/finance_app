"use client"

import { useMemo } from "react"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"
import {
    divisaoPorPagamento,
    maioresLancamentos,
    peso,
    type TipoDaCategoria,
} from "@/lib/categoria-detalhe"
import {
    compraTipica,
    concentracaoDasCompras,
    diaDeMaisGasto,
    maisFrequente,
    porDiaDaSemana,
    ritmoDoMes,
} from "@/lib/categoria-resumo"
import { shiftYearMonth } from "@/lib/budget-month"
import { transactionCountsInExpenseMonth, type CreditCardClosingLookup } from "@/lib/expense-month-attribution"
import type {
    Category,
    CreditCard,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"

/** O `?categoria=` do Painel: o id de uma categoria de despesa da carteira, ou null ("Todas"). */
export function categoriaDoParametro(
    param: string | null | undefined,
    categorias: Pick<Category, "id" | "type">[],
): string | null {
    if (!param) return null
    return categorias.some((c) => c.id === param && c.type === "expense") ? param : null
}

/**
 * A análise do mês do Painel: os mesmos dados que a página da categoria monta, na carteira
 * inteira ou numa categoria. `txs` é a janela do mês (com as pontas) e `txsAnterior` a do mês
 * anterior; as duas se juntam por id. Sem compra no mês, devolve null (o vazio da seção).
 */
export function analiseDoMes(args: {
    txs: Transaction[]
    txsAnterior: Transaction[]
    tipo: TipoDaCategoria
    yearMonth: string
    hojeYmd: string
    lookup: CreditCardClosingLookup
    cartoes: Pick<CreditCard, "id" | "name">[]
    categoriaId: string | null
    previsto: number
}) {
    const { tipo, yearMonth, hojeYmd, lookup, cartoes, categoriaId, previsto } = args
    const porId = new Map<string, Transaction>()
    for (const t of [...args.txsAnterior, ...args.txs]) porId.set(t.id, t)
    const linhas = [...porId.values()].filter((t) => categoriaId == null || t.category_id === categoriaId)
    const doMes = linhas.filter((t) => transactionCountsInExpenseMonth(t, yearMonth, lookup))
    const compras = doMes.filter((t) => peso(t, tipo) === 1).length
    if (compras === 0) return null
    return {
        ritmo: ritmoDoMes({ rows: linhas, tipo, yearMonth, hojeYmd, lookup, previsto }),
        porPagamento: divisaoPorPagamento(doMes, tipo, cartoes),
        // O mês anterior pelo mesmo corte do mês (fatura que fecha no mês).
        porPagamentoAnterior: divisaoPorPagamento(
            linhas.filter((t) => transactionCountsInExpenseMonth(t, shiftYearMonth(yearMonth, -1), lookup)),
            tipo,
            cartoes,
        ),
        diasDaSemana: porDiaDaSemana(doMes, tipo),
        concentracao: concentracaoDasCompras(doMes, tipo),
        maior: maioresLancamentos(doMes, tipo, 1)[0] ?? null,
        // com menos de 3 compras a mediana repete o maior e o total
        tipica: compras >= 3 ? compraTipica(doMes, tipo) : null,
        frequente: maisFrequente(doMes, tipo),
        diaDeMais: diaDeMaisGasto(doMes, tipo),
    }
}

export type AnaliseDoMes = NonNullable<ReturnType<typeof analiseDoMes>>

/** A análise da despesa do mês do Painel. `previstoDaCarteira` é o que falta lançar no mês (o do KPI). */
export function useAnaliseDoMes(args: {
    transactionsWide: Transaction[]
    prevTransactions: Transaction[]
    calendarYm: string
    todayYmd: string
    lookup: CreditCardClosingLookup
    creditCards: CreditCard[]
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
    previstoDaCarteira: number
    categoriaId: string | null
}) {
    const {
        transactionsWide,
        prevTransactions,
        calendarYm,
        todayYmd,
        lookup,
        creditCards,
        installmentPlans,
        subscriptions,
        previstoDaCarteira,
        categoriaId,
    } = args
    // Numa categoria, o previsto é o dela: as parcelas e as assinaturas do mês, como na página da categoria.
    const previsto = useMemo(() => {
        if (!categoriaId) return previstoDaCarteira
        const m = buildCategoryCommitmentsForMonth({
            yearMonth: calendarYm,
            transactions: transactionsWide,
            installmentPlans,
            subscriptions,
            creditCards,
        })[categoriaId]
        return (m?.projectedInstallmentsTotal ?? 0) + (m?.projectedSubscriptionsTotal ?? 0)
    }, [categoriaId, previstoDaCarteira, calendarYm, transactionsWide, installmentPlans, subscriptions, creditCards])

    return useMemo(
        () =>
            analiseDoMes({
                txs: transactionsWide,
                txsAnterior: prevTransactions,
                tipo: "expense",
                yearMonth: calendarYm,
                hojeYmd: todayYmd,
                lookup,
                cartoes: creditCards,
                categoriaId,
                previsto,
            }),
        [transactionsWide, prevTransactions, calendarYm, todayYmd, lookup, creditCards, categoriaId, previsto],
    )
}
