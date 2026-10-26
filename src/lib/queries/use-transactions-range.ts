"use client"

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

export function useTransactionsRangeQuery(
    workspaceId: string | null,
    range: TransactionsRangeKey,
    options?: { enabled?: boolean },
) {
    const enabled =
        (options?.enabled ?? true) && Boolean(workspaceId) && Boolean(range.from)

    return useQuery({
        queryKey: transactionsKeys.summary(workspaceId ?? "__none__", range),
        queryFn: async (): Promise<Transaction[]> => {
            if (!workspaceId) return []
            return fetchAllRows<Transaction>((from, to) =>
                supabase
                    .from("transactions")
                    .select(TRANSACTION_RANGE_COLUMNS)
                    .eq("workspace_id", workspaceId)
                    .gte("date", range.from)
                    .lte("date", range.to)
                    .order("date", { ascending: false })
                    .order("created_at", { ascending: false })
                    .order("id", { ascending: false })
                    .range(from, to)
                    .returns<Transaction[]>(),
            )
        },
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
