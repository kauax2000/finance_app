"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type WorkspaceSubscription } from "@/lib/supabase"
import { subscriptionsKeys } from "@/lib/queries/keys"
import { isPostgrestRelationMissingError } from "@/lib/supabase-errors"

export function useSubscriptionsQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: subscriptionsKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<WorkspaceSubscription[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from("workspace_subscriptions")
                .select("*")
                .eq("workspace_id", workspaceId)
                .order("name")
            if (error && isPostgrestRelationMissingError(error)) return []
            if (error) throw new Error(error.message)
            return (data as WorkspaceSubscription[]) ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
