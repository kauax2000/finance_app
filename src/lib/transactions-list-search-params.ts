import { PAYMENT_METHOD_VALUES, type PaymentMethod } from "@/lib/payment-methods"
import type { TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import type { TransactionsDatePresetKey } from "@/components/transactions/transactions-date-presets"

export function buildTransactionsListSearchParams(args: {
    filterType: TransactionFilterType
    /** When enabled, show only rows with an installment plan attached. */
    filterInstallmentsOnly: boolean
    fullPeriod: boolean
    datePreset: TransactionsDatePresetKey | null
    filterDateFrom: string
    filterDateTo: string
    filterCreditCardIds: string[]
    filterPaymentMethods: PaymentMethod[]
    filterCategoryIds: string[]
    filterUncategorizedOnly: boolean
    filterAmountMin: string
    filterAmountMax: string
    filterDescriptionQuery: string
    filterInstallmentPlanId: string | null
    filterSubscriptionId: string | null
    /** When set, category filters are enforced in-query and must not be represented in the URL. */
    lockedCategoryId?: string | null
}): URLSearchParams {
    const p = new URLSearchParams()
    if (args.filterType !== "all") p.set("type", args.filterType)
    if (args.filterInstallmentsOnly) p.set("inst", "1")
    if (!args.fullPeriod && args.datePreset) {
        p.set("preset", args.datePreset)
    }
    if (
        !args.fullPeriod &&
        !args.datePreset &&
        (args.filterDateFrom || args.filterDateTo)
    ) {
        if (args.filterDateFrom) p.set("from", args.filterDateFrom)
        if (args.filterDateTo) p.set("to", args.filterDateTo)
    }
    if (args.filterPaymentMethods.length) {
        p.set("pm", args.filterPaymentMethods.join(","))
    }
    if (args.filterCreditCardIds.length) {
        p.set("card", args.filterCreditCardIds.join(","))
    }
    if (!args.lockedCategoryId) {
        if (args.filterCategoryIds.length) {
            p.set("cats", args.filterCategoryIds.join(","))
        }
        if (args.filterUncategorizedOnly) p.set("uncat", "1")
    }
    if (args.filterAmountMin.trim()) p.set("min", args.filterAmountMin.trim())
    if (args.filterAmountMax.trim()) p.set("max", args.filterAmountMax.trim())
    if (args.filterDescriptionQuery.trim()) {
        p.set("q", args.filterDescriptionQuery.trim())
    }
    if (args.filterInstallmentPlanId) {
        p.set("plan", args.filterInstallmentPlanId)
    }
    if (args.filterSubscriptionId) p.set("sub", args.filterSubscriptionId)
    return p
}

export const TRANSACTIONS_URL_MANAGED_KEYS = [
    "type",
    "inst",
    "preset",
    "from",
    "to",
    "card",
    "pm",
    "cats",
    "uncat",
    "min",
    "max",
    "q",
    "plan",
    "sub",
] as const

export function mergeTransactionsSearchParams(
    current: URLSearchParams,
    next: URLSearchParams
): URLSearchParams {
    const out = new URLSearchParams(current.toString())
    for (const k of TRANSACTIONS_URL_MANAGED_KEYS) {
        out.delete(k)
    }
    next.forEach((v, k) => {
        out.set(k, v)
    })
    return out
}

export { PAYMENT_METHOD_VALUES }
