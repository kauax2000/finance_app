"use client"

import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { Muted } from "@/components/ui/typography"

type AppBootstrapScreenProps = {
    /** Optional short line under the spinner (e.g. “Carregando…”). */
    message?: string
    className?: string
}

/**
 * Full-viewport loading state while auth (or similar) initializes the app shell.
 * Use instead of ad-hoc spinners so home + AuthGuard stay visually consistent.
 */
export function AppBootstrapScreen({
    message = "Carregando…",
    className,
}: AppBootstrapScreenProps) {
    return (
        <div
            className={
                className ??
                "flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4"
            }
            role="status"
            aria-busy="true"
            aria-live="polite"
            suppressHydrationWarning
        >
            <ArrowPathIcon
                className="size-9 shrink-0 animate-spin text-primary"
                aria-hidden
            />
            {message ? (
                <Muted className="text-center text-sm" suppressHydrationWarning>{message}</Muted>
            ) : null}
        </div>
    )
}
