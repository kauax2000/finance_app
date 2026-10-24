"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { formatYearMonth } from "@/lib/budget-month"
import { garantirOrcamentosDoMes } from "@/lib/category-budget-ops"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"

/**
 * Ao abrir o Painel ou Categorias, garante os orçamentos que repetem do mês
 * anterior, uma vez por carteira e mês. `onCopied` deixa a tela com estado
 * próprio buscar de novo.
 */
export function useGarantirOrcamentosDoMes(workspaceId: string | null, onCopied?: () => void): void {
    const queryClient = useQueryClient()
    useEffect(() => {
        if (!workspaceId) return
        void garantirOrcamentosDoMes(workspaceId, formatYearMonth(new Date()), () => {
            void invalidateWorkspaceData(queryClient, workspaceId, { domains: ["categories"] })
            onCopied?.()
        })
        // onCopied muda de identidade com a tela; a chave por mês já barra a repetição.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId, queryClient])
}
