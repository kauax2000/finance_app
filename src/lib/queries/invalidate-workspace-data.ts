import type { QueryClient } from "@tanstack/react-query"
import {
    billsPageBundleKeys,
    categoriesKeys,
    creditCardExpenseRowsKeys,
    creditCardsKeys,
    installmentPlansKeys,
    memberDirectoryKeys,
    queryRoot,
    subscriptionsKeys,
    walletsKeys,
} from "@/lib/queries/keys"

export type WorkspaceDataDomain =
    | "transactions"
    | "categories"
    | "credit_cards"
    | "credit_card_expense_rows"
    | "subscriptions"
    | "installment_plans"
    | "member_directory"
    | "bills"
    | "wallets"
    | "all"

/**
 * Invalidates TanStack Query caches for a workspace after mutations or custom events.
 */
export async function invalidateWorkspaceData(
    queryClient: QueryClient,
    workspaceId: string,
    options?: { domains?: WorkspaceDataDomain[] },
): Promise<void> {
    const domains = options?.domains ?? ["all"]
    const all = domains.includes("all")

    const tasks: Promise<unknown>[] = []

    if (all || domains.includes("transactions")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: [queryRoot.transactionsSummary, workspaceId],
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: ["transactionsSummaryOnly", workspaceId],
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: [queryRoot.transactions, "list", workspaceId],
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: [queryRoot.transactionsWorkspaceAux, workspaceId],
            }),
        )
    }

    if (all || domains.includes("categories")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: categoriesKeys.list(workspaceId),
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: [queryRoot.categoryDetailBundle, workspaceId],
            }),
        )
    }
    if (all || domains.includes("credit_cards")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: creditCardsKeys.list(workspaceId),
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: [queryRoot.creditCardsPageBundle, workspaceId],
            }),
        )
    }
    if (all || domains.includes("credit_card_expense_rows")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: creditCardExpenseRowsKeys.pack(workspaceId),
            }),
        )
    }
    if (all || domains.includes("subscriptions")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: subscriptionsKeys.list(workspaceId),
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: [queryRoot.subscriptionsPageBundle, workspaceId],
            }),
        )
    }
    if (all || domains.includes("installment_plans")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: installmentPlansKeys.list(workspaceId),
            }),
        )
    }
    if (all || domains.includes("member_directory")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: memberDirectoryKeys.list(workspaceId),
            }),
        )
    }
    if (all || domains.includes("wallets")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: walletsKeys.list(workspaceId),
            }),
        )
    }
    if (all || domains.includes("bills")) {
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: billsPageBundleKeys.bundle(workspaceId),
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: ["dashboardPendingBills", workspaceId],
            }),
        )
        tasks.push(
            queryClient.invalidateQueries({
                queryKey: ["billDetail", workspaceId],
            }),
        )
    }

    await Promise.all(tasks)
}
