"use client"

import { useQuery } from "@tanstack/react-query"
import {
    fetchBillDetailBundle,
    type BillRowWithCategory,
} from "@/lib/queries/fetch-bills-page-bundle"
import type { BillInstance } from "@/lib/supabase"

export type BillDetailBundleQuery = {
    bill: BillRowWithCategory | null
    instances: BillInstance[]
}

export function useBillDetailBundleQuery(
    workspaceId: string | null,
    billId: string | null
) {
    return useQuery({
        queryKey: ["billDetail", workspaceId ?? "", billId ?? ""] as const,
        queryFn: (): Promise<BillDetailBundleQuery> =>
            fetchBillDetailBundle(workspaceId!, billId!),
        enabled: Boolean(workspaceId && billId),
        staleTime: 20_000,
    })
}
