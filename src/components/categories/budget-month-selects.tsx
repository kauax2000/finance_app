"use client"

import { formatMonthLongPtBr } from "@/lib/transaction-date"
import { formatYearMonth, parseYearMonth } from "@/lib/budget-month"
import { cn } from "@/lib/utils"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function calendarMonthOptionsPtBr(): { value: string; label: string }[] {
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(2024, i, 1)
        const label = formatMonthLongPtBr(d)
        return { value: String(i + 1).padStart(2, "0"), label }
    })
}

export function yearInclusiveOptions(minYear: number, maxYear: number): { value: string; label: string }[] {
    const out: { value: string; label: string }[] = []
    for (let y = minYear; y <= maxYear; y += 1) {
        out.push({ value: String(y), label: String(y) })
    }
    return out
}

const DEFAULT_BEFORE = 6
const DEFAULT_AFTER = 2

export function BudgetMonthSelects({
    valueYm,
    onChangeYm,
    dense = false,
    className,
    minYear: minYearProp,
    maxYear: maxYearProp,
    showFieldLabels = false,
    afterChange,
}: {
    valueYm: string
    onChangeYm: (ym: string) => void
    dense?: boolean
    className?: string
    minYear?: number
    maxYear?: number
    showFieldLabels?: boolean
    afterChange?: () => void
}) {
    const cy = new Date().getFullYear()
    const { y, m } = parseYearMonth(valueYm)
    const minDefault = cy - DEFAULT_BEFORE
    const maxDefault = cy + DEFAULT_AFTER
    const minYear = minYearProp ?? Math.min(minDefault, y)
    const maxYear = maxYearProp ?? Math.max(maxDefault, y)
    const monthValue = String(m).padStart(2, "0")
    const yearValue = String(y)
    const months = calendarMonthOptionsPtBr()
    const years = yearInclusiveOptions(minYear, maxYear)

    const emit = (nextYm: string) => {
        onChangeYm(nextYm)
        afterChange?.()
    }

    const onMonthValue = (v: string) => {
        const monthNum = Number(v)
        if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return
        emit(formatYearMonth(new Date(y, monthNum - 1, 1)))
    }

    const onYearValue = (v: string) => {
        const yearNum = Number(v)
        if (!Number.isFinite(yearNum)) return
        emit(formatYearMonth(new Date(yearNum, m - 1, 1)))
    }

    const triggerSize = dense ? "sm" : "md"
    const monthLabelCurrent = months.find((o) => o.value === monthValue)?.label ?? "Mês"
    const monthTriggerClass = dense
        ? "h-7 min-w-[8.5rem] max-w-[12rem] capitalize"
        : "min-w-[9.5rem] max-w-[13rem] capitalize"
    const yearTriggerClass = dense ? "h-7 min-w-[4.25rem] tabular-nums" : "min-w-[4.5rem] tabular-nums"

    return (
        // "Mês e ano" nomeia o par, não um controle: é legenda de conjunto, e
        // não `<label>` (cada `Select` já tem o próprio `aria-label`). O `mb-2` é
        // porque a legenda renderizada não é item de flex e o `gap` não a alcança.
        <FieldSet size="sm" className={cn("gap-2", className)}>
            {showFieldLabels ? (
                <FieldLegend variant="label" className="mb-2 leading-none text-foreground">
                    Mês e ano
                </FieldLegend>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                    <Select value={monthValue} onValueChange={onMonthValue}>
                        <SelectTrigger
                            size={triggerSize}
                            aria-label="Mês"
                            className={cn(monthTriggerClass)}
                        >
                            <SelectValue placeholder="Mês">{monthLabelCurrent}</SelectValue>
                        </SelectTrigger>
                        <SelectContent
                            side="bottom"
                            align="start"
                            sideOffset={6}
                            className="max-h-64"
                        >
                            {months.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="capitalize"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                    <Select value={yearValue} onValueChange={onYearValue}>
                        <SelectTrigger
                            size={triggerSize}
                            aria-label="Ano"
                            className={yearTriggerClass}
                        >
                            <SelectValue placeholder="Ano">{yearValue}</SelectValue>
                        </SelectTrigger>
                        <SelectContent
                            side="bottom"
                            align="start"
                            sideOffset={6}
                            className="max-h-56"
                        >
                            {years.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="nums"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </FieldSet>
    )
}
