"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"

type Acesso = { ultimoAcessoEm: string | null; appAbertoEm: string | null }

/**
 * O acesso como estava ANTES da gravação do dia: por isso `staleTime: Infinity`
 * e ninguém invalida. O diálogo de volta decide por este valor.
 */
export function useAcesso(): { carregando: boolean; erro: boolean } & Acesso {
    const { user } = useAuth()
    const { data, isPending, isError } = useQuery({
        queryKey: ["acesso", user?.id],
        enabled: !!user,
        staleTime: Infinity,
        queryFn: async (): Promise<Acesso> => {
            const { data, error } = await supabase
                .from("user_settings")
                .select("ultimo_acesso_em, app_aberto_em")
                .eq("user_id", user!.id)
                .maybeSingle()
            if (error) throw error
            const linha = data as { ultimo_acesso_em: string | null; app_aberto_em: string | null } | null
            return {
                ultimoAcessoEm: linha?.ultimo_acesso_em ?? null,
                appAbertoEm: linha?.app_aberto_em ?? null,
            }
        },
    })
    return {
        carregando: !user || isPending,
        erro: isError,
        ultimoAcessoEm: data?.ultimoAcessoEm ?? null,
        appAbertoEm: data?.appAbertoEm ?? null,
    }
}
