import {
    estimatedDueDateForClose,
    invoiceWindowForPurchaseDate,
    localNoonDate,
} from "@/lib/credit-card-billing"

export type BillingFormPreview = {
    closeDate: Date
    dueDate: Date
}

/** Valid calendar day 1–31 for form fields. */
export function isValidBillingDay(n: number): boolean {
    return Number.isFinite(n) && n >= 1 && n <= 31
}

/**
 * Example dates if the user made a purchase on `referenceDate` (default: today, local calendar).
 */
export function computeBillingFormPreview(
    closingDay: number,
    dueDay: number,
    referenceDate: Date = new Date()
): BillingFormPreview | null {
    if (!isValidBillingDay(closingDay) || !isValidBillingDay(dueDay)) {
        return null
    }
    const purchase = localNoonDate(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate()
    )
    const { end } = invoiceWindowForPurchaseDate(purchase, closingDay)
    const dueDate = estimatedDueDateForClose(end, dueDay)
    return { closeDate: end, dueDate }
}
