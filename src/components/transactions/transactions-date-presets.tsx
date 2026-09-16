"use client"

import { localYmdFromDate } from "@/lib/transaction-date"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { tagChipFilterIdle, tagChipFilterSelected } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type TransactionsDatePresetKey =
    | "last7"
    | "last15"
    | "last30"
    | "monthToToday"

function pad2(x: number) {
    return String(x).padStart(2, "0")
}

function startOfCurrentMonth(now: Date) {
    return new Date(now.getFullYear(), now.getMonth(), 1)
}

function startOfLastNDays(now: Date, days: number) {
    const d = new Date(now)
    d.setDate(d.getDate() - Math.max(0, days - 1))
    return d
}

export function getTransactionsPresetRange(
    preset: TransactionsDatePresetKey,
    now: Date = new Date()
): { from: string; to: string } {
    const to = localYmdFromDate(now)
    if (preset === "monthToToday") {
        return { from: localYmdFromDate(startOfCurrentMonth(now)), to }
    }

    const days = preset === "last7" ? 7 : preset === "last15" ? 15 : 30
    return { from: localYmdFromDate(startOfLastNDays(now, days)), to }
}

const PRESETS: Array<{
    key: TransactionsDatePresetKey
    label: string
    sheetLabel: string
}> = [
    { key: "last7", label: "7d", sheetLabel: "Últimos 7 dias" },
    { key: "last15", label: "15d", sheetLabel: "Últimos 15 dias" },
    { key: "last30", label: "30d", sheetLabel: "Últimos 30 dias" },
    { key: "monthToToday", label: "Mês", sheetLabel: "Mês atual" },
]

export function transactionsPresetSummaryLabel(
    preset: TransactionsDatePresetKey
): string {
    const row = PRESETS.find((p) => p.key === preset)
    return row?.sheetLabel ?? preset
}

export function TransactionsDatePresets({
    value,
    onChange,
    className,
    variant = "compact",
}: {
    value: TransactionsDatePresetKey | null
    onChange: (next: {
        preset: TransactionsDatePresetKey
        from: string
        to: string
    }) => void
    className?: string
    variant?: "compact" | "comfortable"
}) {
    const now = React.useMemo(() => new Date(), [])

    const applyPreset = (key: TransactionsDatePresetKey) => {
        const { from, to } = getTransactionsPresetRange(key, now)
        onChange({ preset: key, from, to })
    }

    if (variant === "comfortable") {
        return (
            <div
                className={cn(
                    "flex flex-wrap gap-1.5",
                    className
                )}
                role="group"
                aria-label="Filtros rápidos de período"
            >
                {PRESETS.map((p) => {
                    const selected = value === p.key
                    return (
                        <Button
                            key={p.key}
                            type="button"
                            variant="tertiary"
                            size="xs"
                            aria-pressed={selected}
                            className={cn(
                                "h-7 rounded-full px-2.5 text-2xs font-semibold shadow-none",
                                selected ? tagChipFilterSelected : tagChipFilterIdle
                            )}
                            onClick={() => applyPreset(p.key)}
                            title={p.sheetLabel}
                        >
                            {p.sheetLabel}
                        </Button>
                    )
                })}
            </div>
        )
    }

    // Fica à mão de propósito, e não virou `Tabs` com os quatro trilhos de
    // filtro: isto é um grupo de alternância (`role="group"` + `aria-pressed`)
    // que aplica um período e some quando o intervalo é personalizado, não uma
    // escolha entre visões. `Tabs` anunciaria abas sem painel para um atalho.
    return (
        <div
            className={cn(
                "inline-flex h-8 shrink-0 items-stretch gap-0.5 rounded-lg bg-muted/60 p-0.5 ring-1 ring-border/60 dark:bg-muted/40",
                className
            )}
            role="group"
            aria-label="Filtros rápidos de período"
        >
            {PRESETS.map((p) => {
                const selected = value === p.key
                return (
                    <Button
                        key={p.key}
                        type="button"
                        size="sm"
                        variant="tertiary"
                        aria-pressed={selected}
                        className={cn(
                            "h-full min-h-0 px-2.5 text-xs font-medium shadow-none",
                            selected
                                ? "relative z-[1] border border-border/80 bg-background text-foreground shadow-sm dark:bg-card dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]"
                                : "border border-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
                        )}
                        onClick={() => applyPreset(p.key)}
                    >
                        {p.label}
                    </Button>
                )
            })}
        </div>
    )
}

