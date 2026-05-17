"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function ymdToLocalDate(s: string): Date | undefined {
    if (!s) return undefined
    const parts = s.split("-").map((p) => parseInt(p, 10))
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined
    const [y, m, d] = parts
    return new Date(y, m - 1, d)
}

function localDateToYmd(d: Date | undefined): string {
    if (!d) return ""
    const y = d.getFullYear()
    const mo = d.getMonth() + 1
    const day = d.getDate()
    return `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function TransactionsDateRangeForm({
    idPrefix,
    draftFrom,
    draftTo,
    onDraftFromChange,
    onDraftToChange,
    onApply,
    onClear,
    onCancel,
    showCancel = true,
    className,
    footerClassName,
}: {
    idPrefix: string
    draftFrom: string
    draftTo: string
    onDraftFromChange: (v: string) => void
    onDraftToChange: (v: string) => void
    onApply: () => void
    onClear: () => void
    onCancel?: () => void
    showCancel?: boolean
    className?: string
    footerClassName?: string
}) {
    const fromId = `${idPrefix}-from`
    const toId = `${idPrefix}-to`

    return (
        <div className={cn("space-y-3", className)}>
            <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                    <Label
                        htmlFor={fromId}
                        className="text-[11px] text-muted-foreground"
                    >
                        De
                    </Label>
                    <DatePicker
                        id={fromId}
                        displayStyle="numeric"
                        placeholder="—"
                        value={
                            draftFrom ? ymdToLocalDate(draftFrom) : undefined
                        }
                        onChange={(d) =>
                            onDraftFromChange(d ? localDateToYmd(d) : "")
                        }
                    />
                </div>
                <div className="min-w-0 space-y-1">
                    <Label
                        htmlFor={toId}
                        className="text-[11px] text-muted-foreground"
                    >
                        Até
                    </Label>
                    <DatePicker
                        id={toId}
                        displayStyle="numeric"
                        placeholder="—"
                        value={draftTo ? ymdToLocalDate(draftTo) : undefined}
                        onChange={(d) =>
                            onDraftToChange(d ? localDateToYmd(d) : "")
                        }
                    />
                </div>
            </div>
            <div
                className={cn(
                    "flex flex-wrap items-center justify-between gap-2",
                    footerClassName
                )}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-muted-foreground"
                    onClick={() => onClear()}
                >
                    <XMarkIcon className="mr-1 size-3.5" />
                    Limpar
                </Button>
                <div className="flex items-center gap-2">
                    {showCancel && onCancel ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => onCancel()}
                        >
                            Cancelar
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => onApply()}
                    >
                        Aplicar
                    </Button>
                </div>
            </div>
        </div>
    )
}
