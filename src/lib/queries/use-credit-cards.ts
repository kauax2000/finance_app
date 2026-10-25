"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type CreditCard } from "@/lib/supabase"
import { creditCardsKeys } from "@/lib/queries/keys"
import { isPostgrestRelationMissingError } from "@/lib/supabase-errors"

export function useCreditCardsQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: creditCardsKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<CreditCard[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from("credit_cards")
                .select("*")
                .eq("workspace_id", workspaceId)
                .order("name")
            if (error && isPostgrestRelationMissingError(error)) return []
            if (error) throw new Error(error.message)
            return (data as CreditCard[]) ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
