"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError, isPostgrestRelationMissingError } from "@/lib/supabase-errors"
import type { Insight } from "./acoes"

export const KINDS_DA_CATEGORIA = ["duplicidade", "sazonal", "recorrencia", "preco_assinatura"] as const

/** Os ids dos lançamentos que as duplicidades citam, sem repetir. */
export function idsDosLancamentos(linhas: Insight[]): string[] {
    const ids = new Set<string>()
    for (const l of linhas) {
        if (l.kind !== "duplicidade" || !Array.isArray(l.payload.ids)) continue
        for (const id of l.payload.ids) if (typeof id === "string") ids.add(id)
    }
    return [...ids]
}

type Dados = { linhas: Insight[]; categoriaDoLancamento: Record<string, string | null> }
const VAZIO: Dados = { linhas: [], categoriaDoLancamento: {} }

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
            const linhas = (data as Insight[]) ?? []
            const ids = idsDosLancamentos(linhas)
            if (ids.length === 0) return { linhas, categoriaDoLancamento: {} }
            const { data: lancs, error: erroLancs } = await supabase
                .from("transactions")
                .select("id,category_id")
                .in("id", ids)
            if (erroLancs) return { linhas, categoriaDoLancamento: {} }
            const categoriaDoLancamento: Record<string, string | null> = {}
            for (const t of (lancs as { id: string; category_id: string | null }[]) ?? []) {
                categoriaDoLancamento[t.id] = t.category_id
            }
            return { linhas, categoriaDoLancamento }
        },
    })

    const recarregar = useCallback(async () => {
        await Promise.all([
            qc.invalidateQueries({ queryKey: ["insights-da-categoria", workspaceId] }),
            qc.invalidateQueries({ queryKey: ["insights", workspaceId] }),
        ])
    }, [qc, workspaceId])

    const d = q.data ?? VAZIO
    return { linhas: d.linhas, categoriaDoLancamento: d.categoriaDoLancamento, recarregar }
}
