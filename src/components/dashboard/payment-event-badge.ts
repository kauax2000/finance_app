import {
    tagChipDanger,
    tagChipInfo,
    tagChipNeutral,
    tagChipSuccess,
    tagChipWarning,
} from "@/components/ui/badge"
import {
    paymentEventHasMetaBadge,
    type PaymentEventKind,
} from "@/components/dashboard/payment-events"

/**
 * O chip de tipo de um evento do calendário. Estava copiado, com o mesmo corpo,
 * no calendário e na prévia do evento.
 */

function kindShortLabel(kind: PaymentEventKind): string {
    switch (kind) {
        case "subscription":
            return "Assinatura"
        case "installment":
            return "Parcelada"
        case "card_close":
            return "Fechamento"
        case "card_due":
            return "Vencimento"
        case "bill_due":
            return "Conta"
        case "posted_income":
            return "Receita"
        case "posted_expense":
            return "Despesa"
        default:
            return kind
    }
}

export function paymentEventChipClass(kind: PaymentEventKind): string {
    switch (kind) {
        case "subscription":
        case "bill_due":
            return tagChipInfo
        case "installment":
            return tagChipWarning
        case "posted_income":
            return tagChipSuccess
        case "posted_expense":
            return tagChipDanger
        default:
            return tagChipNeutral
    }
}

/**
 * O tom do evento na agenda (`CalendarEvent`, rodada 242): o mesmo mapa das
 * fichas, nos tons do design system. Lançamento ligado a um plano de parcelas
 * fala como parcela.
 */
export function paymentEventTone(
    kind: PaymentEventKind,
    installmentPlanId?: string | null
): "default" | "info" | "warning" | "income" | "expense" {
    if ((kind === "posted_income" || kind === "posted_expense") && installmentPlanId?.trim()) {
        return "warning"
    }
    switch (kind) {
        case "subscription":
        case "bill_due":
            return "info"
        case "installment":
            return "warning"
        case "posted_income":
            return "income"
        case "posted_expense":
            return "expense"
        default:
            return "default"
    }
}

/** “Parcelada” + warning para lançamento ligado a um plano de parcelas. */
export function paymentEventMetaBadge(
    kind: PaymentEventKind,
    installmentPlanId?: string | null
): { label: string; chipClass: string } | null {
    if (!paymentEventHasMetaBadge({ kind, installmentPlanId })) return null
    if ((kind === "posted_expense" || kind === "posted_income") && installmentPlanId?.trim()) {
        return { label: "Parcelada", chipClass: tagChipWarning }
    }
    return { label: kindShortLabel(kind), chipClass: paymentEventChipClass(kind) }
}
