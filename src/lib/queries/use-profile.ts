"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type Profile } from "@/lib/supabase"
import { profileKeys } from "@/lib/queries/keys"
import { guardar, lerGuardado } from "@/lib/guardado"

// O perfil fica fora do IndexedDB (dados pessoais); a linha da própria pessoa
// vai ao localStorage (`lib/guardado`), onde a sessão do Supabase já guarda o
// mesmo e-mail e nome, para o avatar não esperar a busca na abertura.
const chave = (userId: string) => `perfil:${userId}`

export function useProfileQuery(userId: string | undefined) {
    return useQuery({
        queryKey: profileKeys.detail(userId ?? "__none__"),
        queryFn: async (): Promise<Profile | null> => {
            if (!userId) return null
            const { data, error } = await supabase
                .from("profiles")
                .select("avatar_color, avatar_url, created_at, email, full_name, id, updated_at")
                .eq("id", userId)
                .maybeSingle()
            if (error) throw new Error(error.message)
            guardar(chave(userId), data)
            return (data as Profile) ?? null
        },
        enabled: Boolean(userId),
        initialData: () => (userId ? lerGuardado<Profile>(chave(userId)) : undefined),
        // Velho de nascença: o guardado pinta, e a busca roda ao montar.
        initialDataUpdatedAt: 0,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    })
}
