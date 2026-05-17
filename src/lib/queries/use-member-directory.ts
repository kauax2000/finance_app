"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { memberDirectoryKeys } from "@/lib/queries/keys"

export type MemberDirectoryRow = {
    user_id: string
    email: string
    full_name: string | null
    avatar_url?: string | null
    avatar_color?: string | null
}

export function useMemberDirectoryQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: memberDirectoryKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<MemberDirectoryRow[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase.rpc("workspace_member_directory", {
                p_workspace_id: workspaceId,
            })
            if (error) throw new Error(error.message)
            if (!Array.isArray(data)) return []
            return data as MemberDirectoryRow[]
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
