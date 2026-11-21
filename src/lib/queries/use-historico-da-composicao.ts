"use client"

import { useQuery } from "@tanstack/react-query"
import { periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { categoryDetailBundleKeys } from "@/lib/queries/keys"
import { supabase, type Transaction } from "@/lib/supabase"

/**
 * O histórico do "Do que é feito o mês": os 7 meses antes do mês da tela, com a descrição e o
 * vínculo de parcela ou assinatura, que a série do bundle não traz (o RPC só devolve valor, data
 * e pagamento). A chave mora sob a do bundle: invalidar o bundle invalida este também.
 */
export function useHistoricoDaComposicaoQuery(args: {
    workspaceId: string | null
    categoryId: string
    yearMonth: string
    enabled: boolean
}) {
    const { workspaceId, categoryId, yearMonth, enabled } = args
    return useQuery({
        queryKey: [...categoryDetailBundleKeys.bundle(workspaceId ?? "__none__", categoryId, yearMonth), "composicao"],
        queryFn: async (): Promise<Transaction[]> => {
            // Um mês a mais em cada ponta: a compra no cartão conta no mês da fatura.
            const inicio = periodBoundsFromYearMonth(shiftYearMonth(yearMonth, -7)).period_start
            const fim = periodBoundsFromYearMonth(yearMonth).period_end
            const { data, error } = await supabase
                .from("transactions")
                .select("date,amount,type,category_id,payment_method,payment_credit_card_id,description,installment_plan_id,subscription_id")
                .eq("workspace_id", workspaceId!)
                .eq("category_id", categoryId)
                .gte("date", `${inicio}T00:00:00.000Z`)
                .lte("date", `${fim}T23:59:59.999Z`)
            if (error) throw new Error(error.message)
            return (data ?? []) as Transaction[]
        },
        enabled: Boolean(workspaceId && enabled),
        staleTime: 60_000,
    })
}
