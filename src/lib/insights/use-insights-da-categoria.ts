"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError, isPostgrestRelationMissingError } from "@/lib/supabase-errors"
import type { Insight } from "./acoes"

export const KINDS_DA_CATEGORIA = ["duplicidade", "sazonal", "recorrencia", "preco_assinatura"] as const

type Dados = { linhas: Insight[] }
const VAZIO: Dados = { linhas: [] }

/**
 * A caixa de insights da carteira, lida para o detalhe da categoria cortar por categoria. Só lê:
 * não marca `seen` (o Painel é quem mostra a caixa). Sem a tabela ou com erro, devolve vazio.
 */
export function useInsightsDaCaixa(workspaceId: string | null) {
    const qc = useQueryClient()
    const q = useQuery({
        queryKey: ["insights-da-categoria", workspaceId],
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
        queryFn: async (): Promise<Dados> => {
            const { data, error } = await supabase
                .from("insights")
                .select("id,workspace_id,kind,dedupe_key,payload,status,created_at")
                .eq("workspace_id", workspaceId!)
                .in("kind", KINDS_DA_CATEGORIA)
                .in("status", ["new", "seen"])
            // Até a migração subir a tabela não existe; a falha da caixa não derruba o detalhe.
            if (error) {
                if (!isPostgrestRelationMissingError(error)) console.warn(formatSupabasePostgrestError(error))
                return VAZIO
            }
            return { linhas: (data as Insight[]) ?? [] }
        },
    })

    const recarregar = useCallback(async () => {
        await Promise.all([
            qc.invalidateQueries({ queryKey: ["insights-da-categoria", workspaceId] }),
            qc.invalidateQueries({ queryKey: ["insights", workspaceId] }),
        ])
    }, [qc, workspaceId])

    const d = q.data ?? VAZIO
    return { linhas: d.linhas, recarregar }
}
