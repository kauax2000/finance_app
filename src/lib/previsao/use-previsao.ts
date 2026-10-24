"use client"

import { useMemo } from "react"

import { useWorkspace } from "@/components/workspace-provider"
import { periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { statementTotalKey } from "@/lib/fatura/total-com-banco"
import { usePendingBillsDashboardQuery } from "@/lib/queries/fetch-bills-dashboard"
import { useBillsPageBundleQuery } from "@/lib/queries/use-bills-page-bundle"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useInstallmentPlansQuery } from "@/lib/queries/use-installment-plans"
import { useStatementTotalsQuery } from "@/lib/queries/use-statement-totals"
import { useSubscriptionsQuery } from "@/lib/queries/use-subscriptions"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"
import { userFacingFetchError } from "@/lib/supabase-errors"
import { filterRangeEndIso, filterRangeStartIso, localYmdFromDate } from "@/lib/transaction-date"
import type { DadosDaPrevisao } from "./tipos"

/**
 * Tudo o que `fluxoDoMes`, `seguroParaGastar` e `projecaoMensal` leem, pelos mesmos hooks (e
 * `queryKey`) do Painel. Só as transações pedem uma janela própria (outra chave do mesmo helper):
 * do dia 1 de dois meses atrás, porque a fatura que vence neste mês fechou no anterior e a janela
 * dela começa antes, até o fim do sexto mês à frente, o último da linha do tempo.
 */
export function usePrevisao(workspaceId: string | null): {
    dados: DadosDaPrevisao | null
    carregando: boolean
    erro: string | null
} {
    const { workspaces } = useWorkspace()
    const hojeYmd = useMemo(() => localYmdFromDate(new Date()), [])
    const janela = useMemo(() => {
        const mes = hojeYmd.slice(0, 7)
        return {
            from: filterRangeStartIso(periodBoundsFromYearMonth(shiftYearMonth(mes, -2)).period_start),
            to: filterRangeEndIso(periodBoundsFromYearMonth(shiftYearMonth(mes, 6)).period_end),
        }
    }, [hojeYmd])

    const ligado = Boolean(workspaceId)
    const transacoes = useTransactionsRangeQuery(workspaceId, janela, { enabled: ligado })
    const cartoes = useCreditCardsQuery(workspaceId)
    const assinaturas = useSubscriptionsQuery(workspaceId)
    const planos = useInstallmentPlansQuery(workspaceId)
    const totais = useStatementTotalsQuery(workspaceId, ligado)
    const aux = useTransactionsWorkspaceAuxQuery(workspaceId, ligado)
    const pendentes = usePendingBillsDashboardQuery(workspaceId, ligado)
    const contas = useBillsPageBundleQuery(workspaceId)

    const consultas = [transacoes, cartoes, assinaturas, planos, totais, aux, pendentes, contas]
    const carregando = ligado && consultas.some((q) => q.isPending)
    const falha = consultas.find((q) => q.isError)?.error
    const erro = falha ? userFacingFetchError(falha, "Não foi possível carregar a previsão.") : null

    const reservaBruta = workspaces.find((w) => w.id === workspaceId)?.monthly_savings_target
    const reserva = reservaBruta != null ? Number(reservaBruta) : null

    const dados = useMemo((): DadosDaPrevisao | null => {
        if (!transacoes.data || !cartoes.data || !assinaturas.data || !planos.data) return null
        if (!totais.data || !aux.data || !pendentes.data || !contas.data) return null
        const faturasPagas = new Set<string>()
        for (const p of aux.data.invoicePayments) {
            if (p.status === "paid") faturasPagas.add(statementTotalKey(p.credit_card_id, p.statement_close_date))
        }
        return {
            hojeYmd,
            transacoes: transacoes.data,
            assinaturas: assinaturas.data,
            planos: planos.data,
            cartoes: cartoes.data.filter((c) => c.is_active),
            totaisDoBanco: totais.data,
            faturasPagas,
            contas: contas.data.bills,
            contasPendentes: pendentes.data,
            reserva,
        }
    }, [
        hojeYmd,
        transacoes.data,
        cartoes.data,
        assinaturas.data,
        planos.data,
        totais.data,
        aux.data,
        pendentes.data,
        contas.data,
        reserva,
    ])

    return { dados, carregando, erro }
}
