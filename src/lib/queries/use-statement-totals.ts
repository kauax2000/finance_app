"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchStatementTotals } from "@/lib/credit-cards-workspace-transactions"
import { statementTotalsKeys } from "@/lib/queries/keys"

/** O total do banco de cada fatura da carteira. */
export function useStatementTotalsQuery(workspaceId: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: statementTotalsKeys.list(workspaceId ?? "__none__"),
        queryFn: () => fetchStatementTotals(workspaceId!),
        enabled: enabled && Boolean(workspaceId),
        staleTime: 60_000,
    })
}
