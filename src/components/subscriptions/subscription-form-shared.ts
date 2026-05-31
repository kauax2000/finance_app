import type {
    Category,
    SubscriptionBillingInterval,
    TransactionPaymentMethod,
} from "@/lib/supabase"
import type { PaymentMethod } from "@/lib/payment-methods"

export const SUBSCRIPTION_SELECT_NONE = "__none__"

export const SUBSCRIPTION_BILLING_OPTIONS: {
    value: SubscriptionBillingInterval
    label: string
}[] = [
    { value: "monthly", label: "Mensal" },
    { value: "bimonthly", label: "Bimestral" },
    { value: "yearly", label: "Anual" },
    { value: "weekly", label: "Semanal" },
]

export function subscriptionBillingIntervalLabel(
    i: SubscriptionBillingInterval
): string {
    return SUBSCRIPTION_BILLING_OPTIONS.find((o) => o.value === i)?.label ?? i
}

export function subscriptionTodayIsoDate(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

export type SubscriptionFormPayload = {
    name: string
    amount: number
    billing_interval: SubscriptionBillingInterval
    currency: string
    start_date: string
    next_billing_date: string | null
    day_of_month: number | null
    category_id: string | null
    notes: string | null
    payment_method: TransactionPaymentMethod | null
    payment_credit_card_id: string | null
    is_active: boolean
}

/** Ordered labels for recurring charges (e.g. TED ≈ débito em conta / automático). */
export const SUBSCRIPTION_CHARGE_METHOD_OPTIONS: {
    value: PaymentMethod
    label: string
}[] = [
    { value: "credit_card", label: "Cartão de crédito" },
    { value: "ted", label: "Débito em conta / automático" },
    { value: "debit_card", label: "Cartão de débito" },
    { value: "pix", label: "PIX" },
    { value: "cash", label: "Dinheiro" },
    { value: "other", label: "Outro" },
]

export const SUBSCRIPTION_PAYMENT_NONE = "__none__" as const

function parseAmount(raw: string): number | null {
    const n = parseFloat(raw.trim().replace(",", "."))
    if (Number.isNaN(n) || n < 0) return null
    return n
}

/** One calendar date: stored as both `start_date` and `next_billing_date`. */
export function buildSubscriptionFormPayload(opts: {
    name: string
    amountStr: string
    billing: SubscriptionBillingInterval
    billingDate: string
    cId: string
    n: string
    active: boolean
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string
}):
    | { ok: true; payload: SubscriptionFormPayload }
    | { ok: false; error: string } {
    const amt = parseAmount(opts.amountStr)
    if (amt === null) {
        return { ok: false, error: "Informe um valor válido (ex.: 29,90)." }
    }
    if (!opts.name.trim()) {
        return { ok: false, error: "Informe o nome da assinatura." }
    }
    const ymd = opts.billingDate.trim()
    if (!ymd) {
        return {
            ok: false,
            error: "Informe a data da próxima cobrança.",
        }
    }
    const pm = opts.paymentMethod
    const pcc =
        pm === "credit_card"
            ? opts.paymentCreditCardId.trim() || null
            : null

    return {
        ok: true,
        payload: {
            name: opts.name.trim(),
            amount: amt,
            billing_interval: opts.billing,
            currency: "BRL",
            start_date: ymd,
            next_billing_date: ymd,
            day_of_month: null,
            category_id:
                opts.cId !== SUBSCRIPTION_SELECT_NONE ? opts.cId : null,
            notes: opts.n.trim() ? opts.n.trim() : null,
            payment_method: pm,
            payment_credit_card_id: pcc,
            is_active: opts.active,
        },
    }
}

export type ExpenseCategoryOption = Pick<Category, "id" | "name" | "color">
