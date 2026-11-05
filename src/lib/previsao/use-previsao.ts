"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { useWorkspace } from "@/components/workspace-provider"
import { periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { chavesDeFaturasPagas } from "@/lib/fatura/total-com-banco"
import { usePendingBillsDashboardQuery } from "@/lib/queries/fetch-bills-dashboard"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useInstallmentPlansQuery } from "@/lib/queries/use-installment-plans"
import { useStatementTotalsQuery } from "@/lib/queries/use-statement-totals"
import { useSubscriptionsQuery } from "@/lib/queries/use-subscriptions"
import type { TransactionsRangeKey } from "@/lib/queries/keys"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"
import { supabase } from "@/lib/supabase"
import { isPostgrestRelationMissingError, userFacingFetchError } from "@/lib/supabase-errors"
import { filterRangeEndIso, filterRangeStartIso, localYmdFromDate } from "@/lib/transaction-date"
import type { ContaDaPrevisao, DadosDaPrevisao } from "./tipos"

const COLUNAS_DA_CONTA = "id, name, amount_estimated, frequency, due_day_of_month, end_date, is_active"

/** Só as colunas que a previsão lê, das contas ativas: o pacote da tela de contas é pesado demais. */
function useContasDaPrevisaoQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: ["previsaoContas", workspaceId],
        queryFn: async (): Promise<ContaDaPrevisao[]> => {
            const { data, error } = await supabase
                .from("bills")
                .select(COLUNAS_DA_CONTA)
                .eq("workspace_id", workspaceId!)
                .eq("is_active", true)
            if (error && isPostgrestRelationMissingError(error)) return []
            if (error) throw new Error(error.message)
            return (data as ContaDaPrevisao[]) ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}

/** A janela de transações da previsão; o Painel a reusa (`cover`) para não pedir as dele à parte. */
export function janelaDaPrevisao(hojeYmd: string): TransactionsRangeKey {
    const mes = hojeYmd.slice(0, 7)
    return {
        from: filterRangeStartIso(periodBoundsFromYearMonth(shiftYearMonth(mes, -2)).period_start),
        to: filterRangeEndIso(periodBoundsFromYearMonth(shiftYearMonth(mes, 6)).period_end),
    }
}

/**
 * Tudo o que `fluxoDoMes`, `seguroParaGastar` e `projecaoMensal` leem, pelos mesmos hooks (e
 * `queryKey`) do Painel, mais as contas (`useContasDaPrevisaoQuery`). As transações pedem uma janela própria (outra chave do mesmo helper):
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
    const janela = useMemo(() => janelaDaPrevisao(hojeYmd), [hojeYmd])

    const ligado = Boolean(workspaceId)
    const transacoes = useTransactionsRangeQuery(workspaceId, janela, { enabled: ligado })
    const cartoes = useCreditCardsQuery(workspaceId)
    const assinaturas = useSubscriptionsQuery(workspaceId)
    const planos = useInstallmentPlansQuery(workspaceId)
    const totais = useStatementTotalsQuery(workspaceId, ligado)
    const aux = useTransactionsWorkspaceAuxQuery(workspaceId, ligado)
    const pendentes = usePendingBillsDashboardQuery(workspaceId, ligado)
    const contas = useContasDaPrevisaoQuery(workspaceId)

    const consultas = [transacoes, cartoes, assinaturas, planos, totais, aux, pendentes, contas]
    const carregando = ligado && consultas.some((q) => q.isPending)
    const falha = consultas.find((q) => q.isError)?.error
    const erro = falha ? userFacingFetchError(falha, "Não foi possível carregar a previsão.") : null

    const reservaBruta = workspaces.find((w) => w.id === workspaceId)?.monthly_savings_target
    const reserva = reservaBruta != null ? Number(reservaBruta) : null

    const dados = useMemo((): DadosDaPrevisao | null => {
        if (!transacoes.data || !cartoes.data || !assinaturas.data || !planos.data) return null
        if (!totais.data || !aux.data || !pendentes.data || !contas.data) return null
        return {
            hojeYmd,
            transacoes: transacoes.data,
            assinaturas: assinaturas.data,
            planos: planos.data,
            cartoes: cartoes.data.filter((c) => c.is_active),
            totaisDoBanco: totais.data,
            faturasPagas: chavesDeFaturasPagas(aux.data.invoicePayments),
            contas: contas.data,
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
