"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/components/providers"
import { supabase, type CaptureToken } from "@/lib/supabase"

/** O authenticated só lê estas colunas: o hash nunca sai do banco, e `*` dá 42501. */
const COLUNAS = "id, user_id, workspace_id, name, created_at, last_used_at, revoked_at, atalho_versao"

/**
 * Os aparelhos de captura da pessoa (Atalho do iPhone, Apple Pay e compartilhar),
 * lidos por Lançar gastos pelo iPhone e por Lançar ao pagar. `ativos` são os não revogados.
 */
export function useAparelhosDeCaptura() {
    const { user } = useAuth()
    const lista = useQuery({
        queryKey: ["capture_tokens", user?.id],
        enabled: Boolean(user),
        retry: false,
        // A seção mostra o próprio erro: sem o toast global cru, em inglês.
        meta: { errorToast: false },
        queryFn: async () => {
            const { data, error } = await supabase
                .from("capture_tokens")
                .select(COLUNAS)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data as CaptureToken[]
        },
    })
    const ativos = (lista.data ?? []).filter((t) => t.revoked_at == null)
    return { ...lista, ativos }
}
