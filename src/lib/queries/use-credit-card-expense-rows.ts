"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { creditCardExpenseRowsKeys } from "@/lib/queries/keys"
import {
    fetchCreditCardExpenseRows,
    type CcTxRow,
} from "@/lib/credit-cards-workspace-transactions"

export function useCreditCardExpenseRowsQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: creditCardExpenseRowsKeys.pack(workspaceId ?? "__none__"),
        queryFn: async (): Promise<CcTxRow[]> => {
            if (!workspaceId) return []
            const pack = await fetchCreditCardExpenseRows(supabase, workspaceId)
            if (pack.error) throw new Error(pack.error.message)
            return pack.rows ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
