"use client"

import { cn } from "@/lib/utils"
import { MonthNav } from "@/components/categories/categories-toolbar"

export function DashboardToolbar({
    calendarYm,
    onCalendarYmChange,
}: {
    calendarYm: string
    onCalendarYmChange: (ym: string) => void
}) {
    return (
        <div
            className={cn(
                "hidden min-w-0 max-w-full md:flex md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-3",
            )}
        >
            <MonthNav
                budgetMonthYm={calendarYm}
                onBudgetMonthYmChange={onCalendarYmChange}
                dense
                className="md:w-auto md:justify-end"
            />
        </div>
    )
}
