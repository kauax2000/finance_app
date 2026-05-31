import type { PostgrestError } from "@supabase/supabase-js"

const TRANSIENT_NETWORK_RE =
    /failed to fetch|networkerror|load failed|network request failed|no-response|fetchevent\.respondwith|respondwith received/i

/** True when the client failed before a normal HTTP response (flaky network, SW no-response, etc.). */
export function isPostgrestTransientNetworkError(
    error: PostgrestError | null | unknown,
): boolean {
    if (error == null) return false
    if (error instanceof Error) {
        return TRANSIENT_NETWORK_RE.test(error.message)
    }
    if (typeof error === "string") {
        return TRANSIENT_NETWORK_RE.test(error)
    }
    if (typeof error !== "object") return false
    const e = error as { message?: string; details?: string }
    const blob = [e.message, e.details].filter(Boolean).join(" ")
    return TRANSIENT_NETWORK_RE.test(blob)
}
