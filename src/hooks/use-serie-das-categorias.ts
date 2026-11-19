"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { buildMonthlySeries } from "@/components/categories/detail/category-detail-utils"
import { periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { supabase, type Transaction } from "@/lib/supabase"

type TxDaSerie = Pick<
    Transaction,
    "date" | "amount" | "type" | "category_id" | "payment_method" | "payment_credit_card_id"
>
type Cartao = { id: string; closing_day: number }
type CategoriaDaSerie = { id: string; type: "income" | "expense" }

/** Os 5 meses anteriores a `ym`, do mais antigo ao mais novo, por categoria. */
export function historicoPorCategoria(a: {
    ym: string
    txs: TxDaSerie[]
    creditCards: Cartao[]
    categorias: CategoriaDaSerie[]
}): Record<string, number[]> {
    const base = shiftYearMonth(a.ym, -1)
    return Object.fromEntries(
        a.categorias.map((c) => [
            c.id,
            buildMonthlySeries(base, a.txs, c.id, c.type, 5, a.creditCards).map((p) =>
                Math.max(0, p.total),
            ),
        ]),
    )
}

export function useSerieDasCategorias(
    workspaceId: string | null,
    ym: string,
    categorias: CategoriaDaSerie[],
): { historico: Record<string, number[]> | undefined } {
    const { data, error } = useQuery({
        queryKey: ["categorias-serie", workspaceId, ym],
        enabled: !!workspaceId,
        staleTime: 60_000,
        meta: { errorToast: false },
        queryFn: async () => {
            // Um mês a mais atrás: o estorno no cartão cai no mês do fechamento.
            const inicio = periodBoundsFromYearMonth(shiftYearMonth(ym, -6)).period_start
            const fim = periodBoundsFromYearMonth(shiftYearMonth(ym, -1)).period_end
            const [txRes, cardsRes] = await Promise.all([
                supabase
                    .from("transactions")
                    .select("type,amount,date,category_id,payment_method,payment_credit_card_id")
                    .eq("workspace_id", workspaceId!)
                    .in("type", ["expense", "income"])
                    .gte("date", `${inicio}T00:00:00.000Z`)
                    .lte("date", `${fim}T23:59:59.999Z`),
                supabase.from("credit_cards").select("id, closing_day").eq("workspace_id", workspaceId!),
            ])
            if (txRes.error) throw txRes.error
            if (cardsRes.error) throw cardsRes.error
            return {
                txs: (txRes.data ?? []) as TxDaSerie[],
                creditCards: (cardsRes.data ?? []) as Cartao[],
            }
        },
    })

    if (error) console.error(error)

    const historico = useMemo(
        () => (data ? historicoPorCategoria({ ym, ...data, categorias }) : undefined),
        [data, ym, categorias],
    )
    return { historico }
}
