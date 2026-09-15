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
