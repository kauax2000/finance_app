"use client"

import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { XMarkIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
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
    // Um campo só, e o calendário marca a faixa entre as pontas. Com dois
    // `DatePicker` independentes o fim podia ficar antes do início, e havia um
    // alerta para isso; o intervalo torna esse estado impossível. O preço é
    // aceito: não dá mais para escolher só o "até", e "Limpar" apaga as duas
    // pontas. O `id` do campo é o do antigo "De".
    const fieldId = `${idPrefix}-from`

    return (
        <div className={cn("space-y-3", className)}>
            <Field size="sm">
                <FieldLabel className="text-2xs text-muted-foreground">
                    Período
                </FieldLabel>
                <FieldControl>
                    <DatePicker
                        id={fieldId}
                        mode="range"
                        displayStyle="numeric"
                        placeholder="—"
                        value={
                            draftFrom
                                ? {
                                      from: parseYmdLocal(draftFrom),
                                      to: draftTo ? parseYmdLocal(draftTo) : undefined,
                                  }
                                : undefined
                        }
                        onChange={(range) => {
                            onDraftFromChange(range?.from ? localYmdFromDate(range.from) : "")
                            onDraftToChange(range?.to ? localYmdFromDate(range.to) : "")
                        }}
                    />
                </FieldControl>
            </Field>
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
                        onClick={() => onApply()}
                    >
                        Aplicar
                    </Button>
                </div>
            </div>
        </div>
    )
}
