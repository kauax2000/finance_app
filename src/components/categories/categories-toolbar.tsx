"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BudgetMonthSelects } from "@/components/categories/budget-month-selects"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TransactionTypeSegment, type TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import { MOBILE_FLOATING_ACTION_BUTTON_CLASSNAME } from "@/components/layout/mobile-fab-button-classes"
import { useMobileFabSlot } from "@/components/layout/mobile-fab-provider"
import { formatYearMonth, labelYearMonthPt, shiftYearMonth, shortLabelYearMonthPt } from "@/lib/budget-month"
import { cn } from "@/lib/utils"

/** Dense toolbar sizing: h-10 on mobile (matches segment controls), h-8 from md up. */
const monthNavDenseButtonClassName =
    "h-10 px-2 text-sm md:h-8 md:px-2 md:text-xs"
const monthNavDenseIconButtonClassName = "size-10 md:size-8"
const monthNavDenseMonthPickerClassName =
    "h-10 flex-1 gap-2 px-3 text-sm md:h-8 md:gap-1.5 md:px-2 md:text-xs"
const monthNavDenseCalendarIconClassName = "size-4 md:size-3.5"

function MonthNavArrowControls({
    dense,
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJump,
    pickerAriaLabel,
    monthLabel,
    esteMesInsidePopoverOnNarrow,
}: {
    dense?: boolean
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJump: () => void
    pickerAriaLabel: string
    monthLabel: string
    /** Below `md`, hide row "Este mês" and show it inside the center month popover instead. */
    esteMesInsidePopoverOnNarrow?: boolean
}) {
    const [monthPickerOpen, setMonthPickerOpen] = React.useState(false)

    const popoverControlledProps = esteMesInsidePopoverOnNarrow
        ? {
              open: monthPickerOpen,
              onOpenChange: setMonthPickerOpen,
          }
        : {}

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                    "shrink-0 text-muted-foreground",
                    dense ? monthNavDenseButtonClassName : "h-10 px-2 text-sm",
                    esteMesInsidePopoverOnNarrow && "hidden md:inline-flex",
                )}
                onClick={() => onJump()}
            >
                Este mês
            </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn("shrink-0", dense ? monthNavDenseIconButtonClassName : "size-10")}
                aria-label="Mês anterior"
                onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, -1))}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div
                className={cn(
                    "flex min-w-0 flex-1 items-center justify-center gap-1.5",
                    dense ? "max-w-[min(100%,16rem)]" : "",
                )}
            >
                <Popover {...popoverControlledProps}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            aria-label={pickerAriaLabel}
                            className={cn(
                                "min-w-0 shrink font-medium capitalize tabular-nums",
                                dense
                                    ? monthNavDenseMonthPickerClassName
                                    : "h-10 flex-1 gap-2 px-3 text-sm",
                            )}
                        >
                            <CalendarIcon
                                className={cn(
                                    "shrink-0 opacity-80",
                                    dense ? monthNavDenseCalendarIconClassName : "size-4",
                                )}
                                aria-hidden
                            />
                            <span className="min-w-0 truncate">{monthLabel}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="center"
                        className="z-[100] w-auto p-0"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        <BudgetMonthSelects
                            valueYm={budgetMonthYm}
                            onChangeYm={onBudgetMonthYmChange}
                            dense={dense}
                            showFieldLabels
                            className="p-3"
                            afterChange={
                                esteMesInsidePopoverOnNarrow
                                    ? () => setMonthPickerOpen(false)
                                    : undefined
                            }
                        />
                        {esteMesInsidePopoverOnNarrow ? (
                            <div className="border-t border-border p-2 md:hidden">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        onJump()
                                        setMonthPickerOpen(false)
                                    }}
                                >
                                    Este mês
                                </Button>
                            </div>
                        ) : null}
                    </PopoverContent>
                </Popover>
            </div>

            <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn("shrink-0", dense ? monthNavDenseIconButtonClassName : "size-10")}
                aria-label="Próximo mês"
                onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, 1))}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </>
    )
}

export function MonthNav({
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJumpToCurrentMonth,
    dense,
    iconOnly,
    className,
    mobileTriggerFullWidth,
}: {
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJumpToCurrentMonth?: () => void
    dense?: boolean
    /** Mobile trigger: calendar + chevron only (no month label). */
    iconOnly?: boolean
    className?: string
    /** Mobile: same strip as desktop (Este mês, arrows, center month picker), full width. */
    mobileTriggerFullWidth?: boolean
}) {
    const [open, setOpen] = React.useState(false)
    const jump =
        onJumpToCurrentMonth ?? (() => onBudgetMonthYmChange(formatYearMonth(new Date())))
    const monthLabel = labelYearMonthPt(budgetMonthYm)
    const shortLabel = shortLabelYearMonthPt(budgetMonthYm)
    const pickerAriaLabel = `Escolher mês de referência. Mês selecionado: ${monthLabel}.`

    const arrowControls = (
        <MonthNavArrowControls
            dense={dense}
            budgetMonthYm={budgetMonthYm}
            onBudgetMonthYmChange={onBudgetMonthYmChange}
            onJump={jump}
            pickerAriaLabel={pickerAriaLabel}
            monthLabel={monthLabel}
            esteMesInsidePopoverOnNarrow={Boolean(mobileTriggerFullWidth)}
        />
    )

    return (
        <>
            {mobileTriggerFullWidth ? (
                <div
                    className={cn(
                        "flex w-full min-w-0 items-center justify-between gap-2",
                        dense && "md:w-auto md:justify-end md:gap-1.5",
                        className,
                    )}
                >
                    {arrowControls}
                </div>
            ) : (
                <>
                    <div className={cn("md:hidden", className)}>
                        <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size={iconOnly ? "icon-lg" : undefined}
                                aria-label={pickerAriaLabel}
                                aria-expanded={open}
                                className={cn(
                                    "font-medium capitalize tabular-nums text-muted-foreground hover:text-foreground",
                                    iconOnly
                                        ? cn(
                                              "w-auto shrink-0 gap-1.5 px-1.5",
                                              dense
                                                  ? "h-10 min-w-10 md:h-9 md:min-w-9"
                                                  : "h-9 min-w-9",
                                          )
                                        : cn(
                                              "gap-1.5",
                                              dense
                                                  ? monthNavDenseButtonClassName
                                                  : "h-9 px-2.5 text-sm",
                                          ),
                                )}
                            >
                                <CalendarIcon
                                    className={cn(
                                        "shrink-0 opacity-80",
                                        iconOnly ? "size-3.5" : "size-4",
                                    )}
                                    aria-hidden
                                />
                                {iconOnly ? null : (
                                    <span
                                        className={cn(
                                            "min-w-0 truncate",
                                            dense &&
                                                "max-w-[min(5.75rem,30vw)] sm:max-w-none",
                                        )}
                                    >
                                        {shortLabel}
                                    </span>
                                )}
                                <ChevronDown
                                    className={cn(
                                        "shrink-0 opacity-60",
                                        iconOnly ? "size-3" : "size-3.5",
                                    )}
                                    aria-hidden
                                />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className="z-[100] w-auto p-0"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <BudgetMonthSelects
                                valueYm={budgetMonthYm}
                                onChangeYm={onBudgetMonthYmChange}
                                showFieldLabels
                                afterChange={() => setOpen(false)}
                                className="p-3"
                            />
                            <div className="flex items-center justify-between border-t px-3 py-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Mês anterior"
                                    onClick={() =>
                                        onBudgetMonthYmChange(
                                            shiftYearMonth(budgetMonthYm, -1),
                                        )
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs text-muted-foreground"
                                    onClick={() => {
                                        jump()
                                        setOpen(false)
                                    }}
                                >
                                    Este mês
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Próximo mês"
                                    onClick={() =>
                                        onBudgetMonthYmChange(
                                            shiftYearMonth(budgetMonthYm, 1),
                                        )
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    </div>

                    <div
                        className={cn(
                            "hidden w-full min-w-0 items-center justify-between gap-2 md:flex",
                            dense && "md:w-auto md:justify-end md:gap-1.5",
                            className,
                        )}
                    >
                        {arrowControls}
                    </div>
                </>
            )}
        </>
    )
}

export function CategoriesToolbar({
    filterType,
    onFilterTypeChange,
    onNewCategory,
    showMonthControls,
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJumpToCurrentMonth,
    className,
    includeAll = true,
}: {
    filterType: TransactionFilterType
    onFilterTypeChange: (v: TransactionFilterType) => void
    onNewCategory: () => void
    showMonthControls: boolean
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJumpToCurrentMonth?: () => void
    className?: string
    includeAll?: boolean
}) {
    useMobileFabSlot(
        <Button
            type="button"
            variant="default"
            className={MOBILE_FLOATING_ACTION_BUTTON_CLASSNAME}
            onClick={onNewCategory}
        >
            <Plus className="size-4 shrink-0" />
            <span className="text-sm font-medium">Nova categoria</span>
        </Button>,
    )

    return (
        <div
            className={cn(
                "flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3",
                className,
            )}
        >
            <TransactionTypeSegment
                value={filterType}
                onChange={onFilterTypeChange}
                className="max-w-full shrink-0"
                includeAll={includeAll}
            />

            <div className="hidden shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                {showMonthControls ? (
                    <MonthNav
                        budgetMonthYm={budgetMonthYm}
                        onBudgetMonthYmChange={onBudgetMonthYmChange}
                        onJumpToCurrentMonth={onJumpToCurrentMonth}
                        dense
                    />
                ) : null}
                <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={onNewCategory}
                >
                    <Plus className="size-4 shrink-0" />
                    <span className="truncate">Nova categoria</span>
                </Button>
            </div>
        </div>
    )
}
