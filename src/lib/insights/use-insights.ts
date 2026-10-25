"use client"

import { useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import type { DadosDaPrevisao } from "@/lib/previsao/tipos"
import { seguroParaGastar } from "@/lib/previsao/fluxo"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError, isPostgrestRelationMissingError } from "@/lib/supabase-errors"
import { localYmdFromDate } from "@/lib/transaction-date"
import { filtroDaCaixa, marcarInsight, seguroEstaBaixo, type Insight } from "./acoes"

const chave = (workspaceId: string | null) => ["insights", workspaceId] as const

/** Os ids já marcados `seen` nesta sessão, para não repetir a chamada a cada leitura. */
const vistos = new Set<string>()
/** `{carteira}:{mês}` do seguro baixo já registrado nesta sessão. */
const segurosRegistrados = new Set<string>()

/**
 * A caixa de insights da carteira: os `new` e `seen`, até 20, do mais novo ao mais velho (a RLS
 * já tira os de outra pessoa e os tipos que a pessoa silenciou; o `filtroDaCaixa`, o seguro baixo
 * de outro mês). Os novos que aparecem viram `seen`.
 */
export function useInsights(workspaceId: string | null) {
    const { user } = useAuth()
    const qc = useQueryClient()
    const q = useQuery({
        queryKey: chave(workspaceId),
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
        queryFn: async (): Promise<Insight[]> => {
            const { data, error } = await supabase
                .from("insights")
                .select("id,workspace_id,kind,dedupe_key,payload,status,created_at")
                .eq("workspace_id", workspaceId!)
                .in("status", ["new", "seen"])
                .or(filtroDaCaixa(localYmdFromDate(new Date())))
                .order("created_at", { ascending: false })
                .limit(20)
            // Até a migração subir, a tabela não existe: a caixa fica vazia.
            if (error && isPostgrestRelationMissingError(error)) return []
            if (error) throw new Error(formatSupabasePostgrestError(error) ?? "Não foi possível ler os insights.")
            return (data as Insight[]) ?? []
        },
    })

    useEffect(() => {
        for (const i of q.data ?? []) {
            if (i.status !== "new" || vistos.has(i.id)) continue
            vistos.add(i.id)
            void marcarInsight(i.id, "seen")
        }
    }, [q.data])

    const recarregar = useCallback(() => qc.invalidateQueries({ queryKey: chave(workspaceId) }), [qc, workspaceId])

    const marcar = useCallback(
        async (id: string, status: "dismissed" | "acted") => {
            const erro = await marcarInsight(id, status)
            await recarregar()
            return erro
        },
        [recarregar],
    )

    const silenciar = useCallback(
        async (kind: string): Promise<string | null> => {
            if (!user) return "Sessão expirada. Entre novamente."
            const { error } = await supabase.from("insights_silenciados").insert({ user_id: user.id, kind })
            await recarregar()
            // Já silenciado (outra aba) é o mesmo que silenciar agora.
            if (error && error.code !== "23505") return formatSupabasePostgrestError(error) ?? "Não foi possível silenciar."
            return null
        },
        [user, recarregar],
    )

    return {
        itens: q.data ?? [],
        carregando: q.isPending && Boolean(workspaceId),
        erro: q.error ? q.error.message : null,
        entendi: (id: string) => marcar(id, "dismissed"),
        agir: (id: string) => marcar(id, "acted"),
        silenciar,
        recarregar,
    }
}

/**
 * O seguro baixo é produzido aqui, ao abrir o Painel no mês corrente: uma vez por sessão, carteira
 * e mês. A RPC ignora o repetido e o tipo silenciado. O seguro é da casa: o convidado (Bloco 7A)
 * não registra, e com o papel a caminho ninguém registra.
 */
export function useSeguroBaixo(workspaceId: string | null, dados: DadosDaPrevisao | null, aoRegistrar: () => void) {
    const { isAdulto } = useWorkspace()
    useEffect(() => {
        if (!workspaceId || !dados || !isAdulto) return
        const ym = dados.hojeYmd.slice(0, 7)
        const id = `${workspaceId}:${ym}`
        if (segurosRegistrados.has(id)) return
        const s = seguroParaGastar(dados)
        if (!seguroEstaBaixo(s)) return
        segurosRegistrados.add(id)
        const renda = s.receitas.recebidas + s.receitas.previstas
        void supabase
            .rpc("registrar_insight", {
                p_workspace_id: workspaceId,
                p_kind: "seguro_baixo",
                p_dedupe_key: `seguro:${ym}`,
                p_payload: { seguro: s.seguro, renda, ym },
            })
            .then(({ data, error }) => {
                if (!error && data) aoRegistrar()
            })
    }, [workspaceId, dados, aoRegistrar, isAdulto])
}
