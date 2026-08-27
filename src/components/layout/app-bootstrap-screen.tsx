"use client"

import { AppWordmark } from "@/components/layout/app-wordmark"
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
                "fixed inset-0 z-(--z-modal) flex items-center justify-center bg-background",
                "h-[100dvh] min-h-[100dvh] supports-[height:100dvh]:h-[100dvh]",
                className,
            )}
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label="Carregando aplicativo"
            suppressHydrationWarning
        >
            <AppWordmark size="xl" aria-hidden />
        </div>
    )
}
