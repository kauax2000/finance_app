/** "1.234,56" -> 1234.56; vazio ou lixo -> null. */
export function parseAmountFilter(raw: string): number | null {
    const t = raw.trim().replace(/\s/g, "")
    if (!t) return null
    const normalized = t.replace(/\./g, "").replace(",", ".")
    const n = Number(normalized)
    return Number.isFinite(n) ? n : null
}
