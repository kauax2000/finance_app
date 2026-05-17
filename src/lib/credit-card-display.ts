import type { CreditCardInvoiceSlot } from "@/lib/credit-card-billing"
import {
    tagChipDanger,
    tagChipSuccess,
    tagChipWarning,
} from "@/lib/tag-chip-classes"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

/** Short table / inline pill label for invoice cycle vs “today”. */
export function creditInvoiceSlotCompactLabel(
    slot: CreditCardInvoiceSlot
): string {
    switch (slot) {
        case "open":
            return "Aberta"
        case "last_closed":
            return "Fechada"
        case "older":
            return "Anterior"
        default:
            return slot
    }
}

/** Green (open) / amber (last closed) / red (older) — matches status semantics in the UI. */
export function creditInvoiceSlotStatusChipClass(
    slot: CreditCardInvoiceSlot
): string {
    switch (slot) {
        case "open":
            return tagChipSuccess
        case "last_closed":
            return tagChipWarning
        case "older":
            return tagChipDanger
        default:
            return tagChipWarning
    }
}

/** Subtitle line: brand · •••• last_four (matches credit card detail header). */
export function creditCardIdentitySubtitle(card: {
    brand: string | null
    last_four: string
}): string {
    const subtitleParts = [
        card.brand?.trim() || null,
        `•••• ${card.last_four}`,
    ].filter(Boolean)
    return subtitleParts.join(" · ")
}

/** "Limite R$ …" or null when missing/invalid (matches credit card detail header). */
export function creditCardLimitLine(
    creditLimit: string | number | null | undefined
): string | null {
    if (creditLimit == null) return null
    const limitNum = Number(creditLimit)
    if (Number.isNaN(limitNum)) return null
    return `Limite ${currencyFmt.format(limitNum)}`
}
