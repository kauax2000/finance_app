"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchTransactionsWorkspaceAux } from "@/lib/queries/fetch-transactions-workspace-aux"
import { transactionsWorkspaceAuxKeys } from "@/lib/queries/keys"

export function useTransactionsWorkspaceAuxQuery(
    workspaceId: string | null,
    enabled: boolean,
) {
    return useQuery({
        queryKey: transactionsWorkspaceAuxKeys.detail(workspaceId ?? "__none__"),
        queryFn: () => fetchTransactionsWorkspaceAux(workspaceId!),
        enabled: Boolean(workspaceId) && enabled,
        staleTime: 60_000,
    })
}
