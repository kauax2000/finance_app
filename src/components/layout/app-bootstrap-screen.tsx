"use client"

import { AppLogo } from "@/components/layout/app-logo"
import { cn } from "@/lib/utils"

type AppBootstrapScreenProps = {
    className?: string
}

/**
 * Full-viewport loading state while auth (or similar) initializes the app shell.
 * Use instead of ad-hoc spinners so home + AuthGuard stay visually consistent.
 */
export function AppBootstrapScreen({ className }: AppBootstrapScreenProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-background",
                "h-[100dvh] min-h-[100dvh] supports-[height:100dvh]:h-[100dvh]",
                className,
            )}
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label="Carregando aplicativo"
            suppressHydrationWarning
        >
            <AppLogo size="xl" />
        </div>
    )
}
