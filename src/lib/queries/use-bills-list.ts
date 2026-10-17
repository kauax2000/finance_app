"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { billsListKeys } from "@/lib/queries/keys"
import { isPostgrestRelationMissingError } from "@/lib/supabase-errors"

export type ContaListada = {
    id: string
    name: string
    amount_estimated: number | null
}

/** As contas do espaço, só o que a paleta mostra. `enabled` liga quando a paleta abre. */
export function useBillsListQuery(workspaceId: string | null, enabled: boolean) {
    return useQuery({
        queryKey: billsListKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<ContaListada[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from("bills")
                .select("id, name, amount_estimated")
                .eq("workspace_id", workspaceId)
                .order("name", { ascending: true })
            if (error) {
                if (isPostgrestRelationMissingError(error)) return []
                throw new Error(error.message)
            }
            return (data as ContaListada[]) ?? []
        },
        enabled: Boolean(workspaceId) && enabled,
        staleTime: 60_000,
    })
}
