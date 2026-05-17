import { cn } from "@/lib/utils"

/** Outer wrapper for centered onboarding card (wizard + loading shell). */
export const CATEGORIES_ONBOARDING_OUTER_CLASS =
    "flex w-full flex-col items-center px-3 py-6 sm:py-10"

/** Shared card chrome around the onboarding panel. */
export const CATEGORIES_ONBOARDING_PANEL_CARD_CLASS = cn(
    "rounded-2xl border bg-card text-card-foreground shadow-lg",
    "ring-1 ring-border/60 dark:ring-white/10",
    "overflow-hidden",
)

/** Max width / height constraints per wizard step (must stay in sync with wizard). */
export function categoriesOnboardingPanelShellClass(stepIndex: number): string {
    if (stepIndex <= 0) {
        return cn(
            "flex min-h-0 w-full max-w-[22rem] flex-col sm:max-w-md",
            "max-h-[min(75dvh,28rem)]",
        )
    }
    if (stepIndex === 1) {
        return cn(
            "flex min-h-0 w-full max-w-[22rem] flex-col sm:max-w-lg",
            "max-h-[min(88dvh,36rem)]",
        )
    }
    return cn(
        "flex min-h-0 w-full max-w-[22rem] flex-col sm:max-w-xl",
        "max-h-[min(88dvh,38rem)]",
    )
}
