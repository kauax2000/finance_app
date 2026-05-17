"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"

/**
 * Fire-and-forget billing catch-up on dashboard mount.
 *
 * Calls `catch_up_recurring_billing()` (scoped to the user's workspaces)
 * and invalidates transaction/plan caches when new rows are generated.
 * Idempotent — safe if cron also ran today.
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

        let cancelled = false

        ;(async () => {
            try {
                const { data, error } = await supabase.rpc(
                    "catch_up_recurring_billing",
                )
                if (cancelled || error) return

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
