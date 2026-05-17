"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchSubscriptionsPageBundle } from "@/lib/queries/fetch-subscriptions-page-bundle"
import { subscriptionsPageBundleKeys } from "@/lib/queries/keys"

export function useSubscriptionsPageBundle(
    workspaceId: string | null,
    enabled: boolean,
) {
    return useQuery({
        queryKey: subscriptionsPageBundleKeys.bundle(workspaceId ?? "__none__"),
        queryFn: () => fetchSubscriptionsPageBundle(workspaceId!),
        enabled: Boolean(workspaceId) && enabled,
        staleTime: 60_000,
    })
}
