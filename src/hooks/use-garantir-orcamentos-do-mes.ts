"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/components/workspace-provider"
import { formatYearMonth } from "@/lib/budget-month"
import { garantirOrcamentosDoMes } from "@/lib/category-budget-ops"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"

/**
 * Ao abrir o Painel ou Categorias, garante os orçamentos que repetem do mês
 * anterior, uma vez por carteira e mês. `onCopied` deixa a tela com estado
 * próprio buscar de novo. Só o adulto chama: o orçamento é da casa, e o
 * convidado (Bloco 7A) nem pede — com o papel a caminho, espera.
 */
export function useGarantirOrcamentosDoMes(workspaceId: string | null, onCopied?: () => void): void {
    const queryClient = useQueryClient()
    const { isAdulto } = useWorkspace()
    useEffect(() => {
        if (!workspaceId || !isAdulto) return
        void garantirOrcamentosDoMes(workspaceId, formatYearMonth(new Date()), () => {
            void invalidateWorkspaceData(queryClient, workspaceId, { domains: ["categories"] })
            onCopied?.()
        })
        // onCopied muda de identidade com a tela; a chave por mês já barra a repetição.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId, queryClient, isAdulto])
}
