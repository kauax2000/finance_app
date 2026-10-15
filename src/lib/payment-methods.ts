export const PAYMENT_METHOD_VALUES = [
    "pix",
    "ted",
    "debit_card",
    "credit_card",
    "cash",
    "other",
] as const

export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number]

const LABELS: Record<PaymentMethod, string> = {
    pix: "PIX",
    // Conta e assinatura escreviam "TED / Débito em conta" e "Débito em conta /
    // automático" nas próprias listas; o rótulo é um só, e diz as duas coisas.
    ted: "TED / débito em conta",
    debit_card: "Cartão de débito",
    credit_card: "Cartão de crédito",
    cash: "Dinheiro",
    other: "Outro",
}

export function paymentMethodLabel(method: PaymentMethod | null | undefined): string {
    if (!method) return ""
    return LABELS[method] ?? method
}

export function paymentMethodOptions(): { value: PaymentMethod; label: string }[] {
    return PAYMENT_METHOD_VALUES.map((value) => ({
        value,
        label: LABELS[value],
    }))
}

/**
 * As fichas do formulário de lançamento: rótulo curto e a ordem do uso, para as
 * seis caberem numa grade de 3 × 2 e escolher ser um toque só. Fora do
 * formulário vale o rótulo longo (`paymentMethodLabel`).
 */
const CHIP_ORDER: readonly PaymentMethod[] = ["pix", "credit_card", "debit_card", "cash", "ted", "other"]
const CHIP_LABELS: Record<PaymentMethod, string> = {
    pix: "Pix",
    credit_card: "Crédito",
    debit_card: "Débito",
    cash: "Dinheiro",
    ted: "Transferência",
    other: "Outro",
}

export function paymentMethodChipOptions(): { value: PaymentMethod; label: string }[] {
    return CHIP_ORDER.map((value) => ({ value, label: CHIP_LABELS[value] }))
}
