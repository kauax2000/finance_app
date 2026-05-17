/**
 * Split a total BRL amount into N installments (first N-1 equal, last absorbs cent remainder).
 */
export function splitTotalAcrossInstallments(
    total: number,
    installmentCount: number
): { installmentAmount: number; finalInstallmentAmount: number } {
    const n = Math.floor(installmentCount)
    if (!Number.isFinite(total) || !Number.isFinite(n) || n < 2) {
        return { installmentAmount: 0, finalInstallmentAmount: 0 }
    }
    const totalCents = Math.round(total * 100)
    const baseCents = Math.floor(totalCents / n)
    const lastCents = totalCents - baseCents * (n - 1)
    return {
        installmentAmount: baseCents / 100,
        finalInstallmentAmount: lastCents / 100,
    }
}

/** Equal installments when user enters value per installment. */
export function equalInstallmentsFromPortion(
    portion: number,
    installmentCount: number
): { installmentAmount: number; finalInstallmentAmount: number } {
    const n = Math.floor(installmentCount)
    if (!Number.isFinite(portion) || !Number.isFinite(n) || n < 2 || portion <= 0) {
        return { installmentAmount: 0, finalInstallmentAmount: 0 }
    }
    const cents = Math.round(portion * 100)
    const p = cents / 100
    return { installmentAmount: p, finalInstallmentAmount: p }
}
