"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchWorkspacesData } from "@/lib/queries/fetch-workspaces-data"
import { workspaceKeys } from "@/lib/queries/keys"
import type { User } from "@supabase/supabase-js"

export function useWorkspacesQuery(user: User | null) {
    const userId = user?.id
    return useQuery({
        queryKey: workspaceKeys.list(userId ?? "__none__"),
        queryFn: async () => {
            if (!user) throw new Error("Sem usuário")
            return fetchWorkspacesData(user)
        },
        enabled: Boolean(userId),
        staleTime: 5 * 60 * 1000,
    })
}
