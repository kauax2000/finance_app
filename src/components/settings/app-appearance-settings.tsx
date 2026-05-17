"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SwatchIcon, SunIcon } from "@heroicons/react/24/outline"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function AppAppearanceSettings() {
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

    return (
        <Card size="sm" className="gap-0 py-0">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted shadow-sm">
                        <SwatchIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-base">Aparência do app</CardTitle>
                        <CardDescription className="text-xs leading-snug">
                            Tema claro ou escuro em todo o app (sua conta, não do
                            carteira).
                        </CardDescription>
                    </div>
                </div>
                <div className="shrink-0">
                    {mounted ? (
                        <div
                            className="flex w-fit max-w-full items-center gap-2.5 rounded-full border-0 bg-neutral-100 px-3 py-2 text-neutral-700 dark:bg-zinc-800 dark:text-zinc-200"
                            role="group"
                            aria-label="Alternar tema claro ou escuro"
                        >
                            <MoonIcon
                                className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    !isLight
                                        ? "text-foreground"
                                        : "text-muted-foreground/55"
                                )}
                                aria-hidden
                            />
                            <Switch
                                checked={isLight}
                                onCheckedChange={(on) =>
                                    setTheme(on ? "light" : "dark")
                                }
                                aria-label={
                                    isLight
                                        ? "Usar tema escuro"
                                        : "Usar tema claro"
                                }
                            />
                            <SunIcon
                                className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    isLight
                                        ? "text-foreground"
                                        : "text-muted-foreground/55"
                                )}
                                aria-hidden
                            />
                        </div>
                    ) : (
                        <Skeleton className="h-10 w-40 shrink-0 rounded-full" />
                    )}
                </div>
            </CardHeader>
        </Card>
    )
}
