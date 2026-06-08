"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/components/workspace-provider"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import type { WorkspaceDataDomain } from "@/lib/queries/invalidate-workspace-data"
import {
    FINANCE_CATEGORIES_MUTATED_EVENT,
    FINANCE_CREDIT_CARDS_MUTATED_EVENT,
    FINANCE_MEMBERS_MUTATED_EVENT,
    FINANCE_SUBSCRIPTIONS_MUTATED_EVENT,
    FINANCE_TRANSACTIONS_MUTATED_EVENT,
} from "@/lib/workspace-data-events"

function domainsForEvent(type: string): WorkspaceDataDomain[] {
    switch (type) {
        case FINANCE_TRANSACTIONS_MUTATED_EVENT:
            return [
                "transactions",
                "categories",
                "credit_card_expense_rows",
                "credit_cards",
                "bills",
                "installment_plans",
            ]
        case FINANCE_CATEGORIES_MUTATED_EVENT:
            return ["categories", "transactions"]
        case FINANCE_SUBSCRIPTIONS_MUTATED_EVENT:
            return ["subscriptions", "transactions"]
        case FINANCE_CREDIT_CARDS_MUTATED_EVENT:
            return ["credit_cards", "credit_card_expense_rows", "installment_plans"]
        case FINANCE_MEMBERS_MUTATED_EVENT:
            return ["member_directory"]
        default:
            return ["all"]
    }
}

/**
 * Keeps TanStack Query caches in sync when legacy code dispatches `finance:*` CustomEvents.
 */
export function WorkspaceQueryInvalidationBridge() {
    const queryClient = useQueryClient()
    const { currentWorkspaceId } = useWorkspace()

    useEffect(() => {
        if (!currentWorkspaceId) return

        const handler = (e: Event) => {
            const domains = domainsForEvent(e.type)
            void invalidateWorkspaceData(queryClient, currentWorkspaceId, {
                domains,
            })
        }

        window.addEventListener(FINANCE_TRANSACTIONS_MUTATED_EVENT, handler)
        window.addEventListener(FINANCE_CATEGORIES_MUTATED_EVENT, handler)
        window.addEventListener(FINANCE_SUBSCRIPTIONS_MUTATED_EVENT, handler)
        window.addEventListener(FINANCE_CREDIT_CARDS_MUTATED_EVENT, handler)
        window.addEventListener(FINANCE_MEMBERS_MUTATED_EVENT, handler)

        return () => {
            window.removeEventListener(FINANCE_TRANSACTIONS_MUTATED_EVENT, handler)
            window.removeEventListener(FINANCE_CATEGORIES_MUTATED_EVENT, handler)
            window.removeEventListener(FINANCE_SUBSCRIPTIONS_MUTATED_EVENT, handler)
            window.removeEventListener(FINANCE_CREDIT_CARDS_MUTATED_EVENT, handler)
            window.removeEventListener(FINANCE_MEMBERS_MUTATED_EVENT, handler)
        }
    }, [currentWorkspaceId, queryClient])

    return null
}
