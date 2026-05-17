"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type WorkspaceInstallmentPlan } from "@/lib/supabase"
import { installmentPlansKeys } from "@/lib/queries/keys"
import { isWorkspaceInstallmentPlansTableMissingError } from "@/lib/supabase-errors"

export function useInstallmentPlansQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: installmentPlansKeys.list(workspaceId ?? "__none__"),
        queryFn: async (): Promise<WorkspaceInstallmentPlan[]> => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from("workspace_installment_plans")
                .select("*")
                .eq("workspace_id", workspaceId)
                .order("next_billing_date", { ascending: true })
            if (error && isWorkspaceInstallmentPlansTableMissingError(error)) {
                return []
            }
            if (error) throw new Error(error.message)
            return (data as WorkspaceInstallmentPlan[]) ?? []
        },
        enabled: Boolean(workspaceId),
        staleTime: 60_000,
    })
}
