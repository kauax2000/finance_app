"use client"

import {
    CATEGORIES_ONBOARDING_OUTER_CLASS,
    CATEGORIES_ONBOARDING_PANEL_CARD_CLASS,
    categoriesOnboardingPanelShellClass,
} from "@/components/categories/categories-onboarding-panel-styles"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function shellClasses() {
    return cn(
        categoriesOnboardingPanelShellClass(0),
        CATEGORIES_ONBOARDING_PANEL_CARD_CLASS,
    )
}

/** Same pattern as `StepDots` with step 0 active (first stage). */
function stepZeroDots() {
    return (
        <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25" />
        </div>
    )
}

export function CategoriesOnboardingLoadingShell() {
    return (
        <div className={CATEGORIES_ONBOARDING_OUTER_CLASS}>
            <h2 className="sr-only">Carregando categorias</h2>
            <div className={shellClasses()} aria-busy aria-live="polite">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 px-4 py-2.5 sm:px-5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        1/3
                    </span>
                    {stepZeroDots()}
                </div>

                <div className="shrink-0 space-y-1 border-b border-border/80 px-4 py-3 sm:px-5">
                    <Skeleton className="h-5 w-36 rounded-md" />
                    <Skeleton className="h-3 w-full max-w-[17.5rem] rounded-md" />
                    <Skeleton className="h-3 w-full max-w-[13rem] rounded-md" />
                </div>

                <div className="shrink-0 space-y-2 px-4 py-3 sm:px-5">
                    <Skeleton className="h-3 w-40 rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                </div>

                <div className="w-full shrink-0 border-t border-border/80 bg-muted/25 px-4 py-3 sm:px-5">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <div className="flex justify-center">
                            <Skeleton className="h-3 w-32 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
                Carregando configuração inicial…
            </p>
        </div>
    )
}
