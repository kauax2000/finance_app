import { CREDIT_CARD_BRAND_PRESETS } from "@/components/credit-cards/credit-card-brand-picker"
import { CREDIT_CARD_BRAND_UNIDENTIFIED } from "@/lib/credit-card-number"

const PRESET_SET = new Set(
    CREDIT_CARD_BRAND_PRESETS.filter((v) => v !== "") as string[]
)

/** Returns the stored brand string when it matches a picker preset; otherwise `null` (custom or empty). */
export function matchPresetBrand(brand: string | null | undefined): string | null {
    const t = brand?.trim() ?? ""
    if (!t || !PRESET_SET.has(t)) return null
    return t
}

export type CreditCardBrandPalette = {
    accentA: string
    accentB: string
}

function hashString(input: string): number {
    // djb2 (small + stable; good enough for palette pick)
    let h = 5381
    for (let i = 0; i < input.length; i++) {
        h = ((h << 5) + h) ^ input.charCodeAt(i)
    }
    return h >>> 0
}

const PRESET_PALETTE: Record<string, CreditCardBrandPalette> = {
    Visa: { accentA: "oklch(0.58 0.22 260)", accentB: "oklch(0.86 0.16 95)" },
    Mastercard: { accentA: "oklch(0.62 0.25 25)", accentB: "oklch(0.74 0.17 60)" },
    "American Express": {
        accentA: "oklch(0.68 0.16 205)",
        accentB: "oklch(0.6 0.18 240)",
    },
    Discover: { accentA: "oklch(0.72 0.18 55)", accentB: "oklch(0.82 0.12 85)" },
    Elo: { accentA: "oklch(0.82 0.18 85)", accentB: "oklch(0.66 0.16 230)" },
    Hipercard: { accentA: "oklch(0.58 0.22 20)", accentB: "oklch(0.78 0.16 10)" },
    "Diners Club": { accentA: "oklch(0.62 0.12 220)", accentB: "oklch(0.84 0.05 210)" },
}

const FALLBACK_PALETTES: CreditCardBrandPalette[] = [
    { accentA: "oklch(0.64 0.2 155)", accentB: "oklch(0.78 0.16 185)" },
    { accentA: "oklch(0.62 0.24 30)", accentB: "oklch(0.78 0.18 55)" },
    { accentA: "oklch(0.6 0.2 255)", accentB: "oklch(0.82 0.12 300)" },
    { accentA: "oklch(0.62 0.22 330)", accentB: "oklch(0.82 0.1 15)" },
    { accentA: "oklch(0.58 0.18 210)", accentB: "oklch(0.78 0.12 240)" },
    { accentA: "oklch(0.66 0.2 95)", accentB: "oklch(0.78 0.16 130)" },
]

export function brandToPalette(brand: string | null | undefined): CreditCardBrandPalette {
    const t = brand?.trim() ?? ""
    const preset = matchPresetBrand(t)
    if (preset && PRESET_PALETTE[preset]) return PRESET_PALETTE[preset]!

    if (!t || t === CREDIT_CARD_BRAND_UNIDENTIFIED) {
        // Neutral, still has a subtle split (avoids looking flat)
        return { accentA: "oklch(0.72 0.03 260)", accentB: "oklch(0.86 0.02 80)" }
    }

    const idx = hashString(t.toLowerCase()) % FALLBACK_PALETTES.length
    return FALLBACK_PALETTES[idx]!
}
