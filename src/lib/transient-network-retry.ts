import type { PostgrestError } from "@supabase/supabase-js"

/** True when the client failed before a normal HTTP response (flaky network, ad blockers, etc.). */
export function isPostgrestTransientNetworkError(error: PostgrestError | null): boolean {
    if (!error) return false
    const blob = [error.message, error.details].filter(Boolean).join(" ")
    return /failed to fetch|networkerror|load failed|network request failed/i.test(blob)
}
