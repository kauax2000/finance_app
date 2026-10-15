"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { localYmdFromDate } from "@/lib/transaction-date"

const CHAVE = "finance_app_billing_catchup"

/** Já rodou hoje para esta carteira neste navegador? */
function rodouHoje(workspaceId: string, hoje: string): boolean {
    try {
        return localStorage.getItem(`${CHAVE}:${workspaceId}`) === hoje
    } catch {
        return false
    }
}

function marcarHoje(workspaceId: string, hoje: string): void {
    try {
        localStorage.setItem(`${CHAVE}:${workspaceId}`, hoje)
    } catch {
        /* sem armazenamento: roda de novo na próxima visita */
    }
}

/**
 * Fire-and-forget billing catch-up on dashboard mount.
 *
 * Calls `catch_up_recurring_billing()` (scoped to the user's workspaces)
 * and invalidates transaction/plan caches when new rows are generated.
 * Idempotent — safe if cron also ran today.
 *
 * Uma vez por dia por carteira neste navegador: rodava a cada visita ao
 * painel (o ref vive só enquanto o painel está montado), e cada chamada
 * custava ~400 ms de banco. O `pg_cron` cobra todo dia; isto só adianta a
 * cobrança do dia para quem abre o app antes dele.
 */
export function useRecurringBillingCatchup(
    workspaceId: string | null | undefined,
    enabled: boolean,
) {
    const queryClient = useQueryClient()
    const didRunRef = useRef<string | null>(null)

    useEffect(() => {
        if (!enabled || !workspaceId) return
        if (didRunRef.current === workspaceId) return
        didRunRef.current = workspaceId
        const hoje = localYmdFromDate(new Date())
        if (rodouHoje(workspaceId, hoje)) return

        let cancelled = false

        ;(async () => {
            try {
                const { data, error } = await supabase.rpc(
                    "catch_up_recurring_billing",
                )
                if (error) return
                marcarHoje(workspaceId, hoje)
                if (cancelled) return

                const result = data as {
                    subscriptions: number
                    installments: number
                } | null
                if (!result) return

                const billed =
                    (result.subscriptions ?? 0) + (result.installments ?? 0)
                if (billed > 0) {
                    await invalidateWorkspaceData(queryClient, workspaceId, {
                        domains: [
                            "transactions",
                            "subscriptions",
                            "installment_plans",
                            "credit_card_expense_rows",
                        ],
                    })
                }
            } catch {
                // Non-critical — cron will pick it up eventually
            }
        })()

        return () => {
            cancelled = true
        }
    }, [enabled, workspaceId, queryClient])
}
