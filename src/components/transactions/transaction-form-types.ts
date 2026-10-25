import type { PaymentMethod } from "@/lib/payment-methods"
import type { TransactionSource } from "@/lib/supabase"

/** O número de parcelas com que a Parcelada abre. */
export const DEFAULT_INSTALLMENT_COUNT = "12"

/** O assunto dos toasts do formulário: o "Transação criada" toma o lugar do erro de validação. */
export const TRANSACTION_SAVE_TOAST_ID = "salvar-transacao"

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
    /** Só na criação; sem ele, o padrão do banco (`app`). */
    source?: TransactionSource
    /** Só na criação; a edição grava sempre `false`. */
    needsReview?: boolean
    /** Gasto privado (Bloco 7B); sem ele, a coluna fica como está. */
    isPrivate?: boolean
}

/**
 * O que o salvar de um lançamento devolve: `false` na falha; no sucesso, o
 * `id` quando a criação foi online (editando ou na fila offline, sem `id`).
 */
export type TransactionSaveResult = false | { id?: string }

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
    /** A origem da frase ou da IA: marca as parcelas lançadas na hora. */
    source?: TransactionSource
    needsReview?: boolean
}

/** O que criar a compra parcelada devolve: `false` na falha; o `planId` da RPC no sucesso. */
export type InstallmentPlanSaveResult = false | { planId?: string }

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
