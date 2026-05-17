"use client"

import { formatYearMonth, parseYearMonth } from "@/lib/budget-month"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
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
        const label = d.toLocaleDateString("pt-BR", { month: "long" })
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

    const triggerSize = dense ? "sm" : "default"
    const monthLabelCurrent = months.find((o) => o.value === monthValue)?.label ?? "Mês"
    const monthTriggerClass = dense
        ? "h-7 min-w-[8.5rem] max-w-[12rem] capitalize"
        : "min-w-[9.5rem] max-w-[13rem] capitalize"
    const yearTriggerClass = dense ? "h-7 min-w-[4.25rem] tabular-nums" : "min-w-[4.5rem] tabular-nums"

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {showFieldLabels ? (
                <Label className="text-xs font-medium leading-none text-foreground">
                    Mês e ano
                </Label>
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
                            className="z-[220] max-h-64 min-w-[calc(var(--radix-select-trigger-width)+0.5rem)] p-1"
                        >
                            {months.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="cursor-pointer py-2.5 pl-3 pr-9 text-sm capitalize"
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
                            className="z-[220] max-h-56 min-w-[var(--radix-select-trigger-width)] p-1"
                        >
                            {years.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="cursor-pointer py-2 pl-3 pr-9 text-sm tabular-nums"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
