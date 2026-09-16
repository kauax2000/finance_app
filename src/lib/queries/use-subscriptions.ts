"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type WorkspaceSubscription } from "@/lib/supabase"
import { subscriptionsKeys } from "@/lib/queries/keys"
import { isPostgrestRelationMissingError } from "@/lib/supabase-errors"

export function useSubscriptionsQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: subscriptionsKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<WorkspaceSubscription[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from("workspace_subscriptions")
                .select("amount, billing_anchor_day, billing_interval, category_id, created_at, currency, day_of_month, id, is_active, name, next_billing_date, notes, payment_credit_card_id, payment_method, start_date, updated_at, user_id, workspace_id")
                .eq("workspace_id", workspaceId)
                .order("name")
            if (error && isPostgrestRelationMissingError(error)) return []
            if (error) throw new Error(error.message)
            return (data as WorkspaceSubscription[]) ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
