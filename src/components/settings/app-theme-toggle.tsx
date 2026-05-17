"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const tabBaseClass =
    "relative z-[1] h-full min-h-0 w-9 rounded-full px-0 shadow-none transition-colors"
const tabSelectedClass = "text-foreground hover:bg-transparent"
const tabIdleClass =
    "text-muted-foreground hover:bg-transparent hover:text-foreground"

export function AppThemeToggle({
    className,
}: {
    /** Classes para o contentor do segmented control. */
    className?: string
}) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- client-only mounted gate for next-themes */
        setMounted(true)
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [])

    const effective =
        theme === "light" || theme === "dark" ? theme : resolvedTheme
    const isLight = mounted && effective === "light"

    // next-themes is configured with `disableTransitionOnChange`, which briefly injects
    // `* { transition: none !important }` while swapping the theme class. Applying the
    // translate-x change two frames later lets the slide happen after that style is
    // removed, so the indicator visibly animates between Moon and Sun.
    const [indicatorIsLight, setIndicatorIsLight] = useState(isLight)

    useEffect(() => {
        let raf2: number | null = null
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setIndicatorIsLight(isLight))
        })
        return () => {
            cancelAnimationFrame(raf1)
            if (raf2 !== null) cancelAnimationFrame(raf2)
        }
    }, [isLight])

    if (!mounted) {
        return (
            <Skeleton
                className={cn("h-8 w-[4.5rem] shrink-0 rounded-full", className)}
            />
        )
    }

    return (
        <div
            className={cn(
                "relative inline-flex h-8 items-stretch rounded-full bg-muted/60 p-0.5 ring-1 ring-border/60 dark:bg-muted/40",
                className,
            )}
            role="group"
            aria-label="Alternar tema claro ou escuro"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <span
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-y-0.5 left-0.5 w-9 rounded-full border border-border/80 bg-background shadow-sm transform-gpu will-change-transform transition-[transform,background-color,box-shadow] duration-300 ease-in-out dark:bg-card dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]",
                    indicatorIsLight ? "translate-x-full" : "translate-x-0",
                )}
            />
            <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={!isLight}
                aria-label="Usar tema escuro"
                onClick={() => setTheme("dark")}
                className={cn(tabBaseClass, !isLight ? tabSelectedClass : tabIdleClass)}
            >
                <MoonIcon className="size-4" aria-hidden />
            </Button>
            <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={isLight}
                aria-label="Usar tema claro"
                onClick={() => setTheme("light")}
                className={cn(tabBaseClass, isLight ? tabSelectedClass : tabIdleClass)}
            >
                <SunIcon className="size-4" aria-hidden />
            </Button>
        </div>
    )
}
