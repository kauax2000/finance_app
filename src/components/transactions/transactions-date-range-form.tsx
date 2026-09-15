"use client"

import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { XMarkIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

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
    // YYYY-MM-DD compara como texto. Um período ao contrário filtrava tudo fora.
    const invertido = Boolean(draftFrom && draftTo && draftFrom > draftTo)

    return (
        <div className={cn("space-y-3", className)}>
            <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                    <Label
                        htmlFor={fromId}
                        className="text-2xs text-muted-foreground"
                    >
                        De
                    </Label>
                    <DatePicker
                        id={fromId}
                        displayStyle="numeric"
                        placeholder="—"
                        value={
                            draftFrom ? parseYmdLocal(draftFrom) : undefined
                        }
                        onChange={(d) =>
                            onDraftFromChange(d ? localYmdFromDate(d) : "")
                        }
                    />
                </div>
                <div className="min-w-0 space-y-1">
                    <Label
                        htmlFor={toId}
                        className="text-2xs text-muted-foreground"
                    >
                        Até
                    </Label>
                    <DatePicker
                        id={toId}
                        displayStyle="numeric"
                        placeholder="—"
                        value={draftTo ? parseYmdLocal(draftTo) : undefined}
                        onChange={(d) =>
                            onDraftToChange(d ? localYmdFromDate(d) : "")
                        }
                    />
                </div>
            </div>
            {invertido ? (
                <p role="alert" className="text-xs text-destructive">
                    A data inicial é depois da final.
                </p>
            ) : null}
            <div
                className={cn(
                    "flex flex-wrap items-center justify-between gap-2",
                    footerClassName
                )}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="tertiary"
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
                        disabled={invertido}
                        onClick={() => onApply()}
                    >
                        Aplicar
                    </Button>
                </div>
            </div>
        </div>
    )
}
