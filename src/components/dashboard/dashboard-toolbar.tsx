"use client"

import { MonthNav } from "@/components/categories/categories-toolbar"
import { Toolbar, ToolbarActions } from "@/components/ui/toolbar"

/**
 * A barra do painel — um grupo só, o seletor de mês.
 *
 * Ela escrevia `md:justify-end` na raiz. É exatamente o caso que o `ms-auto`
 * do `ToolbarActions` existe para cobrir: com um grupo só, `justify-between`
 * renderiza `flex-start` e a margem automática não.
 */
export function DashboardToolbar({
    calendarYm,
    onCalendarYmChange,
}: {
    calendarYm: string
    onCalendarYmChange: (ym: string) => void
}) {
    return (
        <Toolbar className="hidden max-w-full md:flex">
            <ToolbarActions>
                <MonthNav
                    budgetMonthYm={calendarYm}
                    onBudgetMonthYmChange={onCalendarYmChange}
                    dense
                    className="md:w-auto md:justify-end"
                />
            </ToolbarActions>
        </Toolbar>
    )
}
