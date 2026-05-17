"use client"

import { useQuery } from "@tanstack/react-query"
import { billsPageBundleKeys } from "@/lib/queries/keys"
import { fetchBillsPageBundle } from "@/lib/queries/fetch-bills-page-bundle"

export function useBillsPageBundleQuery(workspaceId: string | null) {
    return useQuery({
        queryKey: billsPageBundleKeys.bundle(workspaceId ?? "__none__"),
        queryFn: () => fetchBillsPageBundle(workspaceId!),
        enabled: Boolean(workspaceId),
        staleTime: 30_000,
    })
}
