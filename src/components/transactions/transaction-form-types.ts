import type { PaymentMethod } from "@/lib/payment-methods"

export type TransactionFormSavePayload = {
    editingId: string | null
    categoryId: string | null
    type: "income" | "expense"
    amount: number
    description: string | null
    dateIso: string
    isRecurring: boolean
    recurringInterval: "daily" | "weekly" | "monthly" | null
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string | null
}

export type InstallmentPlanFormSavePayload = {
    categoryId: string | null
    description: string | null
    /** Local calendar date `YYYY-MM-DD` for `next_billing_date`. */
    firstBillingYmd: string
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string | null
    totalInstallments: number
    installmentAmount: number
    finalInstallmentAmount: number
}

/** Update existing `workspace_installment_plans` row (edit from UI). */
export type InstallmentPlanUpdatePayload = {
    categoryId: string | null
    description: string | null
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string | null
    totalInstallments: number
    installmentAmount: number
    finalInstallmentAmount: number
    /** When plan is active; omit or null when inactive / completed. */
    nextBillingYmd: string | null
}
