import type {
    BillFrequency,
    TransactionPaymentMethod,
} from "@/lib/supabase"
import type { PaymentMethod } from "@/lib/payment-methods"
import { parseMoneyBrl } from "@/lib/money-brl"
import { normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"

export const BILL_CATEGORY_NONE = "__none__"

export const BILL_FREQUENCY_OPTIONS: {
    value: BillFrequency
    label: string
}[] = [
    { value: "monthly", label: "Mensal" },
    { value: "bimonthly", label: "Bimestral" },
    { value: "quarterly", label: "Trimestral" },
    { value: "yearly", label: "Anual" },
    { value: "one_time", label: "Única" },
]

export function billFrequencyLabel(f: BillFrequency): string {
    return BILL_FREQUENCY_OPTIONS.find((o) => o.value === f)?.label ?? f
}

export const BILL_PAYMENT_OPTIONS: {
    value: PaymentMethod
    label: string
}[] = [
    { value: "pix", label: "PIX" },
    { value: "ted", label: "TED / Débito em conta" },
    { value: "debit_card", label: "Cartão de débito" },
    { value: "credit_card", label: "Cartão de crédito" },
    { value: "cash", label: "Dinheiro" },
    { value: "other", label: "Outro" },
]

export const BILL_PAYMENT_NONE = "__none__"

export type BillFormPayloadForSave = {
    name: string
    description: string | null
    notes: string | null
    /** Normalized category-style icon id (persisted on `bills.icon`). */
    icon: string
    category_id: string | null
    frequency: BillFrequency
    due_day_of_month: number
    amount_estimated: number | null
    start_date: string
    end_date: string | null
    default_payment_method: TransactionPaymentMethod | null
    default_payment_credit_card_id: string | null
    reminder_days_before: number[]
    is_active: boolean
}

export function billTodayYmd(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

export function buildBillFormPayload(opts: {
    name: string
    description: string
    notes: string
    icon: string
    categoryId: string
    frequency: BillFrequency
    dueDayOfMonth: number
    amountEstimatedStr: string
    startDateYmd: string
    endDateYmd: string
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string
    reminder3: boolean
    reminder0: boolean
    isActive: boolean
}):
    | { ok: true; payload: BillFormPayloadForSave }
    | { ok: false; error: string } {
    if (!opts.name.trim()) {
        return { ok: false, error: "Informe o nome da conta." }
    }
    if (!opts.startDateYmd.trim()) {
        return { ok: false, error: "Informe a data de início." }
    }
    if (opts.dueDayOfMonth < 1 || opts.dueDayOfMonth > 31) {
        return { ok: false, error: "Dia de vencimento inválido (1–31)." }
    }

    let amount_estimated: number | null = null
    const est = opts.amountEstimatedStr.trim()
    if (est) {
        const p = parseMoneyBrl(est)
        if (p == null || p < 0) {
            return { ok: false, error: "Valor estimado inválido." }
        }
        amount_estimated = p
    }

    const pm = opts.paymentMethod
    const pcc =
        pm === "credit_card"
            ? opts.paymentCreditCardId.trim() || null
            : null
    if (pm === "credit_card" && !pcc) {
        return { ok: false, error: "Selecione o cartão de crédito." }
    }

    const reminder_days_before: number[] = []
    if (opts.reminder3) reminder_days_before.push(3)
    if (opts.reminder0) reminder_days_before.push(0)
    if (reminder_days_before.length === 0) {
        return {
            ok: false,
            error: "Marque pelo menos um lembrete (ex.: 3 dias antes ou no dia).",
        }
    }
    reminder_days_before.sort((a, b) => b - a)

    const end =
        opts.endDateYmd.trim().length === 0 ? null : opts.endDateYmd.trim()

    const iconNorm = normalizeCategoryIcon(opts.icon)

    return {
        ok: true,
        payload: {
            name: opts.name.trim(),
            description: opts.description.trim() || null,
            notes: opts.notes.trim() || null,
            icon: iconNorm,
            category_id:
                opts.categoryId !== BILL_CATEGORY_NONE ? opts.categoryId : null,
            frequency: opts.frequency,
            due_day_of_month: opts.dueDayOfMonth,
            amount_estimated,
            start_date: opts.startDateYmd.trim(),
            end_date: end,
            default_payment_method: pm,
            default_payment_credit_card_id: pcc,
            reminder_days_before,
            is_active: opts.isActive,
        },
    }
}
