"use client"

import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase, type Transaction } from "@/lib/supabase"
import { transactionsKeys, type TransactionsRangeKey } from "@/lib/queries/keys"
import { fetchAllRows } from "@/lib/queries/fetch-all-rows"

/**
 * Dashboard / calendar (category joined client-side). `*` e não a lista: uma
 * coluna de um bloco ainda não aplicado no banco só não vem, em vez de
 * derrubar a consulta (Ruling 8 do 7B).
 */
const TRANSACTION_RANGE_COLUMNS = "*"

/** `range` cabe inteira em `cover`? Comparado como instante, não como texto. */
export function rangeDentroDe(range: TransactionsRangeKey, cover: TransactionsRangeKey): boolean {
    return Date.parse(cover.from) <= Date.parse(range.from) && Date.parse(range.to) <= Date.parse(cover.to)
}

/**
 * `cover`: uma janela maior que outra tela já pede (a da previsão, no Painel).
 * Se `range` cabe nela, a consulta é a da janela — a mesma chave, um pedido só —
 * e as linhas de fora de `range` saem no `select`.
 */
export function useTransactionsRangeQuery(
    workspaceId: string | null,
    range: TransactionsRangeKey,
    options?: { enabled?: boolean; cover?: TransactionsRangeKey },
) {
    const enabled =
        (options?.enabled ?? true) && Boolean(workspaceId) && Boolean(range.from)
    const cover = options?.cover && rangeDentroDe(range, options.cover) ? options.cover : null
    const busca = cover ?? range
    const de = Date.parse(range.from)
    const ate = Date.parse(range.to)
    const recortar = useCallback(
        (rows: Transaction[]) =>
            rows.filter((t) => {
                const d = Date.parse(t.date)
                return d >= de && d <= ate
            }),
        [de, ate],
    )

    return useQuery({
        queryKey: transactionsKeys.summary(workspaceId ?? "__none__", busca),
        queryFn: async (): Promise<Transaction[]> => {
            if (!workspaceId) return []
            return fetchAllRows<Transaction>((from, to) =>
                supabase
                    .from("transactions")
                    .select(TRANSACTION_RANGE_COLUMNS)
                    .eq("workspace_id", workspaceId)
                    .gte("date", busca.from)
                    .lte("date", busca.to)
                    .order("date", { ascending: false })
                    .order("created_at", { ascending: false })
                    .order("id", { ascending: false })
                    .range(from, to)
                    .returns<Transaction[]>(),
            )
        },
        select: cover ? recortar : undefined,
        enabled,
        staleTime: 60_000,
    })
}

/** KPI previous period: only type + amount */
export function useTransactionsSummaryRangeQuery(
    workspaceId: string | null,
    range: TransactionsRangeKey | null,
) {
    const enabled = Boolean(workspaceId) && Boolean(range?.from)

    return useQuery({
        queryKey:
            range && workspaceId
                ? ([
                      "transactionsSummaryOnly",
                      workspaceId,
                      range.from,
                      range.to,
                  ] as const)
                : (["transactionsSummaryOnly", "__none__", "", ""] as const),
        queryFn: async (): Promise<Pick<Transaction, "type" | "amount">[]> => {
            if (!workspaceId || !range) return []
            return fetchAllRows<Pick<Transaction, "type" | "amount">>((from, to) =>
                supabase
                    .from("transactions")
                    .select("type,amount")
                    .eq("workspace_id", workspaceId)
                    .gte("date", range.from)
                    .lte("date", range.to)
                    .order("id")
                    .range(from, to)
                    .returns<Pick<Transaction, "type" | "amount">[]>(),
            )
        },
        enabled,
        staleTime: 60_000,
    })
}
