import type { QueryClient } from "@tanstack/react-query"
import { ROUTES } from "@/config/navigation"
import {
    billsPageBundleKeys,
    creditCardsPageBundleKeys,
    subscriptionsPageBundleKeys,
} from "@/lib/queries/keys"
import { fetchBillsPageBundle } from "@/lib/queries/fetch-bills-page-bundle"
import { fetchSubscriptionsPageBundle } from "@/lib/queries/fetch-subscriptions-page-bundle"
import { fetchCreditCardsPageBundle } from "@/lib/queries/fetch-credit-cards-page-bundle"

/** Prefetch heavy app-route bundles when the user hovers main nav links. */
export function prefetchNavRouteHref(
    queryClient: QueryClient,
    workspaceId: string | null,
    href: string,
): void {
    if (!workspaceId) return

    if (href === ROUTES.BILLS) {
        void queryClient.prefetchQuery({
            queryKey: billsPageBundleKeys.bundle(workspaceId),
            queryFn: () => fetchBillsPageBundle(workspaceId),
            staleTime: 30_000,
        })
        return
    }

    if (href === ROUTES.SUBSCRIPTIONS) {
        void queryClient.prefetchQuery({
            queryKey: subscriptionsPageBundleKeys.bundle(workspaceId),
            queryFn: () => fetchSubscriptionsPageBundle(workspaceId),
            staleTime: 60_000,
        })
        return
    }

    if (href === ROUTES.CREDIT_CARDS) {
        void queryClient.prefetchQuery({
            queryKey: creditCardsPageBundleKeys.bundle(workspaceId),
            queryFn: () => fetchCreditCardsPageBundle(workspaceId),
            staleTime: 60_000,
        })
    }
}
