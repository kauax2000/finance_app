"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type Category } from "@/lib/supabase"
import { categoriesKeys } from "@/lib/queries/keys"

export function useCategoriesQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: categoriesKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<Category[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .eq("workspace_id", workspaceId)
                .order("type", { ascending: true })
                .order("name", { ascending: true })
            if (error) throw new Error(error.message)
            return (data as Category[]) ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
