import { syncBillMutation } from "@/lib/offline/handlers/bills"
import { syncBudgetMutation, syncCategoryMutation } from "@/lib/offline/handlers/categories"
import { syncCreditCardMutation } from "@/lib/offline/handlers/credit-cards"
import { syncSubscriptionMutation } from "@/lib/offline/handlers/subscriptions"
import { syncTransactionMutation } from "@/lib/offline/handlers/transactions"
import type { OfflineMutation } from "@/lib/offline/types"

export async function syncMutation(
    mutation: OfflineMutation
): Promise<{ ok: true } | { ok: false; error: string }> {
    switch (mutation.entity) {
        case "transaction":
            return syncTransactionMutation(mutation)
        case "category":
            return syncCategoryMutation(mutation)
        case "budget":
            return syncBudgetMutation(mutation)
        case "credit_card":
            return syncCreditCardMutation(mutation)
        case "bill":
        case "bill_instance":
            return syncBillMutation(mutation)
        case "subscription":
            return syncSubscriptionMutation(mutation)
        default:
            return { ok: false, error: `Entidade não suportada: ${mutation.entity}` }
    }
}
