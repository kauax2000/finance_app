"use client"

import * as React from "react"
import { CalendarIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { tagChipSuccessMenuTrigger } from "@/lib/tag-chip-classes"
import { cn } from "@/lib/utils"
import { TransactionsDateRangeForm } from "@/components/transactions/transactions-date-range-form"
import {
    getTransactionsPresetRange,
    type TransactionsDatePresetKey,
    transactionsPresetSummaryLabel,
} from "@/components/transactions/transactions-date-presets"

const PRESET_KEYS: TransactionsDatePresetKey[] = [
    "last7",
    "last15",
    "last30",
    "monthToToday",
]

function formatPeriodLabel(from: string, to: string) {
    if (!from && !to) return "Período"
    if (from && !to) return `De ${from}`
    if (!from && to) return `Até ${to}`
    return `${from} → ${to}`
}

function periodTriggerLabel(args: {
    fullPeriod: boolean
    datePreset: TransactionsDatePresetKey | null
    from: string
    to: string
}): string {
    if (args.fullPeriod) return "Todo o período"
    if (args.datePreset) return transactionsPresetSummaryLabel(args.datePreset)
    return formatPeriodLabel(args.from, args.to)
}

export function TransactionsDateRangeMenu({
    fullPeriod,
    datePreset,
    from,
    to,
    disabled,
    onSelectFullPeriod,
    onPresetChange,
    onApply,
    onClearPeriod,
    className,
    idPrefix = "tx-range-desk",
    iconOnly,
}: {
    fullPeriod: boolean
    datePreset: TransactionsDatePresetKey | null
    from: string
    to: string
    disabled?: boolean
    onSelectFullPeriod: () => void
    onPresetChange: (next: {
        preset: TransactionsDatePresetKey
        from: string
        to: string
    }) => void
    onApply: (next: { from: string; to: string }) => void
    /** Clears preset and range (todo o período). */
    onClearPeriod: () => void
    className?: string
    idPrefix?: string
    /** Compact trigger: calendar icon only. */
    iconOnly?: boolean
}) {
    const [open, setOpen] = React.useState(false)
    const [draftFrom, setDraftFrom] = React.useState(from)
    const [draftTo, setDraftTo] = React.useState(to)

    React.useEffect(() => {
        if (!open) return
        setDraftFrom(from)
        setDraftTo(to)
    }, [open, from, to])

    const label = periodTriggerLabel({
        fullPeriod,
        datePreset,
        from,
        to,
    })
    const periodActive = !fullPeriod

    const now = React.useMemo(() => new Date(), [])

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <Button
                    type="button"
                    size={iconOnly ? "icon" : "sm"}
                    variant="outline"
                    className={cn(
                        iconOnly
                            ? "size-9 shrink-0"
                            : "h-8 gap-2 text-xs",
                        periodActive && tagChipSuccessMenuTrigger,
                        className
                    )}
                    aria-label={`Período: ${label}`}
                >
                    <CalendarIcon className="size-4" />
                    {iconOnly ? null : (
                        <span className="max-w-[12rem] truncate">{label}</span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                side="bottom"
                className="flex max-h-[min(70vh,28rem)] w-[min(100vw-2rem,20rem)] flex-col gap-3 overflow-y-auto p-3"
                onCloseAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                    const el = e.target as HTMLElement
                    if (
                        el.closest('[data-slot="popover-content"]') ||
                        el.closest('[data-slot="popover-trigger"]')
                    ) {
                        e.preventDefault()
                    }
                }}
            >
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Período
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-pressed={fullPeriod}
                        className={cn(
                            "h-9 w-full justify-start text-sm font-medium",
                            fullPeriod &&
                                "border border-border/80 bg-muted/50 text-foreground"
                        )}
                        onClick={() => {
                            onSelectFullPeriod()
                            setOpen(false)
                        }}
                    >
                        Todo o período
                    </Button>
                    <div
                        className="grid grid-cols-2 gap-1.5 rounded-lg border border-border/60 bg-muted/25 p-1.5 dark:bg-muted/15"
                        role="group"
                        aria-label="Períodos rápidos"
                    >
                        {PRESET_KEYS.map((key) => {
                            const selected = !fullPeriod && datePreset === key
                            const { from: pf, to: pt } =
                                getTransactionsPresetRange(key, now)
                            return (
                                <Button
                                    key={key}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    aria-pressed={selected}
                                    className={cn(
                                        "h-9 justify-center px-2 text-xs font-medium shadow-none",
                                        selected
                                            ? "border border-border/80 bg-background text-foreground shadow-sm dark:bg-card"
                                            : "border border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                    onClick={() => {
                                        onPresetChange({
                                            preset: key,
                                            from: pf,
                                            to: pt,
                                        })
                                        setOpen(false)
                                    }}
                                >
                                    {transactionsPresetSummaryLabel(key)}
                                </Button>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-2 border-t border-border/60 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Personalizado
                    </p>
                    <TransactionsDateRangeForm
                        idPrefix={idPrefix}
                        draftFrom={draftFrom}
                        draftTo={draftTo}
                        onDraftFromChange={setDraftFrom}
                        onDraftToChange={setDraftTo}
                        onApply={() => {
                            onApply({
                                from: draftFrom,
                                to: draftTo,
                            })
                            setOpen(false)
                        }}
                        onClear={() => {
                            onClearPeriod()
                            setDraftFrom("")
                            setDraftTo("")
                            setOpen(false)
                        }}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
