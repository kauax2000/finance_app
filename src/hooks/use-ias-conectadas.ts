import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"

/** A chave da lista de IAs autorizadas, para quem invalida depois de revogar. */
export function chaveDasIas(uid?: string) {
    return ["oauth_grants", uid]
}

/** As IAs (Claude, ChatGPT) que a pessoa autorizou no MCP. */
export function useIasConectadas() {
    const { user } = useAuth()
    return useQuery({
        queryKey: chaveDasIas(user?.id),
        enabled: Boolean(user),
        retry: false,
        // Quem mostra a lista cuida do próprio erro: sem o toast global cru, em inglês.
        meta: { errorToast: false },
        queryFn: async () => {
            const { data, error } = await supabase.auth.oauth.listGrants()
            if (error) throw error
            return data ?? []
        },
    })
}
