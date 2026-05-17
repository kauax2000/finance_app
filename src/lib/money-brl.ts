/**
 * Parse and format money typed in Brazilian Portuguese (reais).
 *
 * - `3,06` means R$ 3,06 (three reais and six centavos), not “three thousand”.
 * - Thousands: `3000`, `3.000`, or `1.234,56` (milhar com ponto, decimal com vírgula).
 */

const THOUSANDS_GROUPS_DOT = /^\d{1,3}(\.\d{3})+$/
const DECIMAL_DOT_1_TO_2 = /^\d+\.\d{1,2}$/
const DIGITS_ONLY = /^\d+$/

/**
 * Normalizes user input to a finite number in reais, or null if invalid / empty.
 */
export function parseMoneyBrl(raw: string): number | null {
    let t = raw.trim().replace(/\s/g, "")
    t = t.replace(/^R\$\s?/i, "")
    if (!t) return null

    if (t.includes(",")) {
        const normalized = t.replace(/\./g, "").replace(",", ".")
        const n = Number(normalized)
        return Number.isFinite(n) ? n : null
    }

    if (THOUSANDS_GROUPS_DOT.test(t)) {
        const n = Number(t.replace(/\./g, ""))
        return Number.isFinite(n) ? n : null
    }
    if (DECIMAL_DOT_1_TO_2.test(t)) {
        const n = Number(t)
        return Number.isFinite(n) ? n : null
    }
    if (DIGITS_ONLY.test(t)) {
        const n = Number(t)
        return Number.isFinite(n) ? n : null
    }
    return null
}

const inputFmt = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

/** Value shown in text fields (pt-BR, always two decimal places). */
export function formatMoneyBrlInput(n: number): string {
    if (!Number.isFinite(n)) return ""
    return inputFmt.format(n)
}

/**
 * Mask for text inputs while typing (pt-BR currency).
 *
 * Keeps the value always formatted with thousands '.' and decimal ',' by
 * interpreting the typed digits as centavos (last two digits).
 *
 * Examples:
 * - "" -> ""
 * - "1" -> "0,01"
 * - "12" -> "0,12"
 * - "123" -> "1,23"
 * - "1234" -> "12,34"
 * - "123456" -> "1.234,56"
 */
export function formatMoneyBrlTyping(raw: string): string {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const cents = Number(digits)
    if (!Number.isFinite(cents)) return ""
    return formatMoneyBrlInput(cents / 100)
}
