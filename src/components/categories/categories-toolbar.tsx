"use client"

import { Toolbar, ToolbarActions, ToolbarButton } from "@/components/ui/toolbar"
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { usePageChromeFilter } from "@/components/layout/page-chrome-provider"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { MonthGrid } from "@/components/ui/date-picker"
import {
    Popover,
    PopoverContent,
    PopoverFooter,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TransactionTypeSegment, type TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import { formatYearMonth, labelYearMonthPt, parseYearMonth, shiftYearMonth, shortLabelYearMonthPt } from "@/lib/budget-month"
import { cn } from "@/lib/utils"

/**
 * A altura do gatilho compacto do telefone (o ramo que não é a cápsula): quem
 * responde é `--toolbar-control`, que o `Toolbar` publica — com o degrau padrão
 * (32) como reserva, porque duas telas usam este seletor fora de uma barra.
 * A cápsula `‹ mês ›` não usa isto: o `ButtonGroup` e a `Toolbar` a medem.
 */
const DENSO_H = "h-[var(--toolbar-control,--spacing(8))]"

const monthNavDenseButtonClassName = cn(DENSO_H, "px-2 text-xs")

/**
 * Inside the TopBar: the system default step (`lg`, 36) at every width. The
 * dense sizing above is 40 on mobile to match the toolbar segment controls;
 * the bar is 48 tall and every button in it is `lg`.
 */
const monthNavBarButtonClassName = "h-9 px-2 text-xs"

/** "2026-04" → o primeiro dia de abril, o valor do `MonthGrid`. */
function mesDoAnoMes(ym: string) {
    const { y, m } = parseYearMonth(ym)
    return new Date(y, m - 1, 1)
}

function MonthNavArrowControls({
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJump,
    pickerAriaLabel,
    monthLabel,
    esteMesInsidePopoverOnNarrow,
    currentYm = formatYearMonth(new Date()),
}: {
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJump: () => void
    pickerAriaLabel: string
    monthLabel: string
    /** Below `md`, hide row "Este mês" and show it inside the center month popover instead. */
    esteMesInsidePopoverOnNarrow?: boolean
    /** O "mês atual" que o atalho compara; a fatura passa o ciclo atual. */
    currentYm?: string
}) {
    const [monthPickerOpen, setMonthPickerOpen] = React.useState(false)

    const popoverControlledProps = esteMesInsidePopoverOnNarrow
        ? {
              open: monthPickerOpen,
              onOpenChange: setMonthPickerOpen,
          }
        : {}

    const foraDoMesAtual = budgetMonthYm !== currentYm

    return (
        <>
            {foraDoMesAtual ? (
                <Button
                    type="button"
                    variant="tertiary"
                    className={cn(
                        "shrink-0 text-muted-foreground",
                        esteMesInsidePopoverOnNarrow && "hidden md:inline-flex",
                    )}
                    onClick={() => onJump()}
                >
                    Voltar a este mês
                </Button>
            ) : null}
            <ButtonGroup
                aria-label="Mês de referência"
                variant="rail"
                className={cn("min-w-0", esteMesInsidePopoverOnNarrow && "flex-1")}
            >
                <Button
                    type="button"
                    variant="tertiary"
                    size="icon-md"
                    aria-label="Mês anterior"
                    onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, -1))}
                >
                    <ChevronLeftIcon />
                </Button>
                <Popover {...popoverControlledProps}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="tertiary"
                            aria-label={pickerAriaLabel}
                            className={cn(
                                "min-w-0 gap-2 font-medium tabular-nums",
                                esteMesInsidePopoverOnNarrow && "flex-1",
                            )}
                        >
                            <CalendarIcon className="shrink-0 opacity-80" aria-hidden />
                            <span className="min-w-0 truncate">{monthLabel}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="center"
                        size="auto"
                        padding="none"
                        label="Escolher mês"
                    >
                        {/* A grade de meses do design system (rodada 210): eram dois
                            `Select` de mês e ano lado a lado. */}
                        <MonthGrid
                            value={mesDoAnoMes(budgetMonthYm)}
                            onChange={(d) => {
                                onBudgetMonthYmChange(formatYearMonth(d))
                                if (esteMesInsidePopoverOnNarrow) setMonthPickerOpen(false)
                            }}
                        />
                        {esteMesInsidePopoverOnNarrow && foraDoMesAtual ? (
                            <PopoverFooter className="md:hidden">
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    className="h-8 w-full text-xs text-muted-foreground hover:text-foreground active:text-foreground"
                                    onClick={() => {
                                        onJump()
                                        setMonthPickerOpen(false)
                                    }}
                                >
                                    Voltar a este mês
                                </Button>
                            </PopoverFooter>
                        ) : null}
                    </PopoverContent>
                </Popover>
                <Button
                    type="button"
                    variant="tertiary"
                    size="icon-md"
                    aria-label="Próximo mês"
                    onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, 1))}
                >
                    <ChevronRightIcon />
                </Button>
            </ButtonGroup>
        </>
    )
}

/** A grade de meses com o rodapé (anterior, "Este mês", próximo): o miolo do popover do mês. */
function MonthNavPanel({
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJump,
    fechar,
}: {
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJump: () => void
    fechar: () => void
}) {
    return (
        <>
            <MonthGrid
                value={mesDoAnoMes(budgetMonthYm)}
                onChange={(d) => {
                    onBudgetMonthYmChange(formatYearMonth(d))
                    fechar()
                }}
            />
            {/* 12 embaixo, como dos lados e no topo da grade: as setas dos cantos
                de baixo ficam à mesma distância da borda que as do ano em cima
                (com 8, o círculo de 44 do toque ficava espremido no canto). */}
            <PopoverFooter className="justify-between pb-3">
                <Button
                    type="button"
                    variant="outline"
                    size="icon-md"
                    aria-label="Mês anterior"
                    onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, -1))}
                >
                    <ChevronLeftIcon />
                </Button>
                <Button
                    type="button"
                    variant="tertiary"
                    className="h-8 px-2 text-xs text-muted-foreground pointer-coarse:h-11 pointer-coarse:px-4 pointer-coarse:text-base"
                    onClick={() => {
                        onJump()
                        fechar()
                    }}
                >
                    Este mês
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-md"
                    aria-label="Próximo mês"
                    onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, 1))}
                >
                    <ChevronRightIcon />
                </Button>
            </PopoverFooter>
        </>
    )
}

/**
 * O mês da tela no cabeçalho do telefone: o calendário colado à lupa, que abre
 * a grade de meses (`usePageChromeFilter`). O ponto acende fora do mês atual.
 * No desktop o mês segue na barra da tela.
 */
export function useMonthInHeader({
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJumpToCurrentMonth,
    enabled = true,
}: {
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJumpToCurrentMonth?: () => void
    enabled?: boolean
}) {
    const jump =
        onJumpToCurrentMonth ?? (() => onBudgetMonthYmChange(formatYearMonth(new Date())))
    usePageChromeFilter(
        {
            label: `Mês: ${labelYearMonthPt(budgetMonthYm)}`,
            active: budgetMonthYm !== formatYearMonth(new Date()),
            icon: "month",
            popover: (fechar) => (
                <MonthNavPanel
                    budgetMonthYm={budgetMonthYm}
                    onBudgetMonthYmChange={onBudgetMonthYmChange}
                    onJump={jump}
                    fechar={fechar}
                />
            ),
        },
        enabled
    )
}

export function MonthNav({
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJumpToCurrentMonth,
    dense,
    inBar,
    iconOnly,
    className,
    mobileTriggerFullWidth,
    currentYm,
}: {
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJumpToCurrentMonth?: () => void
    dense?: boolean
    /** Sizing for the `TopBar`: every control at `md` (32), at every width. */
    inBar?: boolean
    /** Mobile trigger: calendar + chevron only (no month label). */
    iconOnly?: boolean
    className?: string
    /** Mobile: same strip as desktop (Este mês, arrows, center month picker), full width. */
    mobileTriggerFullWidth?: boolean
    /** O mês que "Voltar a este mês" considera o atual (padrão: o do calendário). */
    currentYm?: string
}) {
    const [open, setOpen] = React.useState(false)
    const jump =
        onJumpToCurrentMonth ?? (() => onBudgetMonthYmChange(formatYearMonth(new Date())))
    const monthLabel = labelYearMonthPt(budgetMonthYm)
    const shortLabel = shortLabelYearMonthPt(budgetMonthYm)
    const pickerAriaLabel = `Escolher mês de referência. Mês selecionado: ${monthLabel}.`

    const arrowControls = (
        <MonthNavArrowControls
            budgetMonthYm={budgetMonthYm}
            onBudgetMonthYmChange={onBudgetMonthYmChange}
            onJump={jump}
            pickerAriaLabel={pickerAriaLabel}
            monthLabel={monthLabel}
            esteMesInsidePopoverOnNarrow={Boolean(mobileTriggerFullWidth)}
            currentYm={currentYm}
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
                    <div className={cn(className, "md:hidden")}>
                        <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="tertiary"
                                size={iconOnly ? "icon-xl" : undefined}
                                aria-label={pickerAriaLabel}
                                aria-expanded={open}
                                className={cn(
                                    "font-medium tabular-nums text-muted-foreground hover:text-foreground",
                                    iconOnly
                                        ? cn(
                                              "w-auto shrink-0 gap-1.5 px-1.5",
                                              dense
                                                  ? "h-10 min-w-10 md:h-9 md:min-w-9"
                                                  : "h-9 min-w-9",
                                          )
                                        : cn(
                                              "gap-1.5",
                                              inBar
                                                  ? monthNavBarButtonClassName
                                                  : dense
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
                                            (dense || inBar) &&
                                                "max-w-[min(5.75rem,30vw)] sm:max-w-none",
                                        )}
                                    >
                                        {shortLabel}
                                    </span>
                                )}
                                <ChevronDownIcon
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
                            size="auto"
                            padding="none"
                            label="Escolher mês"
                        >
                            <MonthNavPanel
                                budgetMonthYm={budgetMonthYm}
                                onBudgetMonthYmChange={onBudgetMonthYmChange}
                                onJump={jump}
                                fechar={() => setOpen(false)}
                            />
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
    /** Sem ele (o convidado, Bloco 7A), a barra não cria categoria. */
    onNewCategory?: () => void
    showMonthControls: boolean
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJumpToCurrentMonth?: () => void
    className?: string
    includeAll?: boolean
}) {
    // O `justify-between` saiu: com o `ms-auto` do `ToolbarActions` o grupo da
    // direita vai à borda sozinho, e com um grupo só ele continua lá — que é o
    // caso desta barra quando o seletor de mês não aparece.
    return (
        <Toolbar className={cn("max-w-full", className)}>
            <TransactionTypeSegment
                value={filterType}
                onChange={onFilterTypeChange}
                className="min-w-0 flex-1 md:max-w-full md:flex-none"
                includeAll={includeAll}
            />

            <ToolbarActions>
                {showMonthControls ? (
                    <MonthNav
                        budgetMonthYm={budgetMonthYm}
                        onBudgetMonthYmChange={onBudgetMonthYmChange}
                        onJumpToCurrentMonth={onJumpToCurrentMonth}
                        dense
                        className="hidden md:flex"
                    />
                ) : null}
                {onNewCategory ? (
                    <ToolbarButton
                        type="button"
                        variant="tertiary"
                        collapse
                        icon={<PlusIcon aria-hidden />}
                        label="Nova categoria"
                        onClick={onNewCategory}
                    />
                ) : null}
            </ToolbarActions>
        </Toolbar>
    )
}
