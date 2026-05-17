/**
 * Validates `next` / post-login redirect paths to avoid open redirects.
 * Allows same-origin relative paths including query strings (e.g. /invites/accept?token=...).
 */
export function getSafeInternalNextPath(raw: string | null): string | null {
    if (raw == null || typeof raw !== "string") return null
    const t = raw.trim()
    if (!t.startsWith("/") || t.startsWith("//")) return null
    if (/[\r\n\0]/.test(t)) return null
    if (/^\/\w+:/i.test(t)) return null
    const lower = t.toLowerCase()
    if (
        lower.startsWith("/\\") ||
        lower.includes("://") ||
        lower.startsWith("/javascript:") ||
        lower.startsWith("/data:")
    ) {
        return null
    }
    if (t.length > 4096) return null
    return t
}
