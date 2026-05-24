"use client"

import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { AppLogo } from "@/components/layout/app-logo"
import { Muted } from "@/components/ui/typography"

type AppBootstrapScreenProps = {
    /** Optional short line under the spinner (e.g. redirect status). Hidden by default. */
    message?: string
    className?: string
}

/**
 * Full-viewport loading state while auth (or similar) initializes the app shell.
 * Use instead of ad-hoc spinners so home + AuthGuard stay visually consistent.
 */
export function AppBootstrapScreen({
    message,
    className,
}: AppBootstrapScreenProps) {
    return (
        <div
            className={
                className ??
                "flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4"
            }
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label={message ?? "Carregando aplicativo"}
            suppressHydrationWarning
        >
            <AppLogo size="xl" />
            <ArrowPathIcon
                className="size-6 shrink-0 animate-spin text-muted-foreground"
                aria-hidden
            />
            {message ? (
                <Muted className="text-center text-sm" suppressHydrationWarning>
                    {message}
                </Muted>
            ) : null}
        </div>
    )
}
