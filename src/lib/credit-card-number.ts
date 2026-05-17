/** Persisted when BIN detection does not match a known network preset. */
export const CREDIT_CARD_BRAND_UNIDENTIFIED = "Bandeira não identificada"

const MIN_CARD_DIGITS = 13
const MAX_CARD_DIGITS = 19

/** Brand strings aligned with `CREDIT_CARD_BRAND_PRESETS` in credit-card-brand-picker. */
export type DetectedCreditCardBrand =
    | "American Express"
    | "Elo"
    | "Mastercard"
    | "Visa"
    | "Hipercard"
    | "Diners Club"
    | "Discover"

export function normalizeCardDigits(raw: string): string {
    return raw.replace(/\D/g, "").slice(0, MAX_CARD_DIGITS)
}

export function formatCardNumberGroups(digits: string): string {
    const d = normalizeCardDigits(digits)
    return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

export function isValidCardLength(digits: string): boolean {
    const len = normalizeCardDigits(digits).length
    return len >= MIN_CARD_DIGITS && len <= MAX_CARD_DIGITS
}

export function passesLuhn(digits: string): boolean {
    const d = normalizeCardDigits(digits)
    if (d.length < MIN_CARD_DIGITS) return false
    let sum = 0
    let alternate = false
    for (let i = d.length - 1; i >= 0; i--) {
        let n = parseInt(d.charAt(i), 10)
        if (alternate) {
            n *= 2
            if (n > 9) n -= 9
        }
        sum += n
        alternate = !alternate
    }
    return sum % 10 === 0
}

export function extractLastFour(digits: string): string | null {
    const d = normalizeCardDigits(digits)
    if (d.length < 4) return null
    return d.slice(-4)
}

function inRange(prefix: number, min: number, max: number): boolean {
    return prefix >= min && prefix <= max
}

function detectElo(digits: string): boolean {
    if (digits.length < 6) return false
    const six = parseInt(digits.slice(0, 6), 10)
    const eloSix = [
        401178, 401179, 431274, 438935, 451416, 457393, 457631, 457632, 504175,
        506699, 506770, 506771, 506772, 506773, 506774, 506775, 506776, 506777,
        506778, 627780, 636297, 636368, 650031, 650032, 650033, 650034, 650035,
        650036, 650037, 650038, 650039,
    ]
    if (eloSix.includes(six)) return true
    if (digits.startsWith("509") && digits.length >= 6) return true
    const four = parseInt(digits.slice(0, 4), 10)
    if (inRange(four, 5067, 5069)) return true
    return false
}

/**
 * Detect card network from BIN/prefix. Returns preset brand string or null if unknown.
 */
export function detectCreditCardBrand(digits: string): DetectedCreditCardBrand | null {
    const d = normalizeCardDigits(digits)
    if (d.length < 2) return null

    if (detectElo(d)) return "Elo"
    if (d.startsWith("606282")) return "Hipercard"

    const two = parseInt(d.slice(0, 2), 10)
    if (two === 34 || two === 37) return "American Express"

    if (two === 36 || two === 38) return "Diners Club"
    if (d.length >= 3) {
        const three = parseInt(d.slice(0, 3), 10)
        if (inRange(three, 300, 305)) return "Diners Club"
    }

    if (d.startsWith("6011")) return "Discover"
    if (d.length >= 6) {
        const six = parseInt(d.slice(0, 6), 10)
        if (inRange(six, 622126, 622925)) return "Discover"
    }
    if (d.length >= 3) {
        const three = parseInt(d.slice(0, 3), 10)
        if (inRange(three, 644, 649)) return "Discover"
    }
    if (d.startsWith("65")) return "Discover"

    if (inRange(two, 51, 55)) return "Mastercard"
    if (d.length >= 4) {
        const four = parseInt(d.slice(0, 4), 10)
        if (inRange(four, 2221, 2720)) return "Mastercard"
    }

    if (d.startsWith("4")) return "Visa"

    return null
}

export function brandForDigits(digits: string): string {
    return detectCreditCardBrand(digits) ?? CREDIT_CARD_BRAND_UNIDENTIFIED
}

export type ResolveCreditCardForSaveInput = {
    digits: string
    mode: "create" | "edit"
    existing?: { last_four: string; brand: string | null }
}

export type ResolveCreditCardForSaveResult =
    | { ok: true; lastFour: string; brand: string; luhnWarning?: boolean }
    | { ok: false; message: string }

export function resolveCreditCardForSave(
    input: ResolveCreditCardForSaveInput
): ResolveCreditCardForSaveResult {
    const digits = normalizeCardDigits(input.digits)

    if (input.mode === "edit" && digits.length === 0) {
        if (!input.existing?.last_four) {
            return {
                ok: false,
                message: "Informe o número do cartão ou mantenha o cartão salvo.",
            }
        }
        const lastFour = input.existing.last_four.replace(/\D/g, "").slice(-4)
        if (lastFour.length !== 4) {
            return { ok: false, message: "Cartão salvo inválido." }
        }
        const brand =
            input.existing.brand?.trim() || CREDIT_CARD_BRAND_UNIDENTIFIED
        return { ok: true, lastFour, brand }
    }

    if (!isValidCardLength(digits)) {
        return {
            ok: false,
            message: `Informe o número completo do cartão (${MIN_CARD_DIGITS} a ${MAX_CARD_DIGITS} dígitos).`,
        }
    }

    const lastFour = extractLastFour(digits)
    if (!lastFour || lastFour.length !== 4) {
        return { ok: false, message: "Número do cartão inválido." }
    }

    const brand = brandForDigits(digits)
    const luhnWarning = !passesLuhn(digits)

    return { ok: true, lastFour, brand, ...(luhnWarning ? { luhnWarning: true } : {}) }
}
