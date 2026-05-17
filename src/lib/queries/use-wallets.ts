"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type Wallet } from "@/lib/supabase"
import { walletsKeys } from "@/lib/queries/keys"

export function useWalletsQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: walletsKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<Wallet[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from("wallets")
                .select("*")
                .eq("workspace_id", workspaceId)
                .order("created_at", { ascending: false })
            if (error) throw new Error(error.message)
            return (data as Wallet[]) ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
