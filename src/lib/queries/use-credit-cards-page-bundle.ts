"use client"

import { useQuery } from "@tanstack/react-query"
import { creditCardsPageBundleKeys } from "@/lib/queries/keys"
import {
    fetchCreditCardsPageBundle,
    type CreditCardsPageBundle,
} from "@/lib/queries/fetch-credit-cards-page-bundle"

export type { CreditCardsPageBundle }

export function useCreditCardsPageBundle(
    workspaceId: string | null,
    enabled: boolean,
) {
    return useQuery({
        queryKey: creditCardsPageBundleKeys.bundle(workspaceId ?? "__none__"),
        queryFn: (): Promise<CreditCardsPageBundle> =>
            workspaceId
                ? fetchCreditCardsPageBundle(workspaceId)
                : Promise.resolve({
                      cards: [],
                      ccTransactions: [],
                      installmentPlans: [],
                      creditCardsTableMissing: false,
                  }),
        enabled: Boolean(workspaceId) && enabled,
        staleTime: 60_000,
    })
}
