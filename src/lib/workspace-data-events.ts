/** Dispatched after transaction/installment mutations so mounted lists can refresh. */
export const FINANCE_TRANSACTIONS_MUTATED_EVENT = "finance:transactions-mutated" as const

export function dispatchFinanceTransactionsMutated(): void {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(FINANCE_TRANSACTIONS_MUTATED_EVENT))
}

export const FINANCE_CATEGORIES_MUTATED_EVENT = "finance:categories-mutated" as const

export function dispatchFinanceCategoriesMutated(): void {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(FINANCE_CATEGORIES_MUTATED_EVENT))
}

export const FINANCE_SUBSCRIPTIONS_MUTATED_EVENT = "finance:subscriptions-mutated" as const

export function dispatchFinanceSubscriptionsMutated(): void {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(FINANCE_SUBSCRIPTIONS_MUTATED_EVENT))
}

export const FINANCE_CREDIT_CARDS_MUTATED_EVENT = "finance:credit-cards-mutated" as const

export function dispatchFinanceCreditCardsMutated(): void {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(FINANCE_CREDIT_CARDS_MUTATED_EVENT))
}

export const FINANCE_MEMBERS_MUTATED_EVENT = "finance:members-mutated" as const

export function dispatchFinanceMembersMutated(): void {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(FINANCE_MEMBERS_MUTATED_EVENT))
}
