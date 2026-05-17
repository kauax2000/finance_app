"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type Profile } from "@/lib/supabase"
import { profileKeys } from "@/lib/queries/keys"

export function useProfileQuery(userId: string | undefined) {
    return useQuery({
        queryKey: profileKeys.detail(userId ?? "__none__"),
        queryFn: async (): Promise<Profile | null> => {
            if (!userId) return null
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return (data as Profile) ?? null
        },
        enabled: Boolean(userId),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    })
}
