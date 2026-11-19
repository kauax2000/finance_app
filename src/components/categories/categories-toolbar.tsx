"use client"

import { Toolbar, ToolbarActions, ToolbarButton } from "@/components/ui/toolbar"
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { useReducedMotion } from "motion/react"
import { TRAJETO_MACIO } from "@/lib/liquid-move"
import { usePageChromeFilter } from "@/components/layout/page-chrome-provider"
import { Button } from "@/components/ui/button"
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
 * O botão do mês do desktop não usa isto: a escada do `Button` o mede.
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

/**
 * O mês do desktop: uma pílula só, com ‹ e › dentro dela e o mês no centro, que abre
 * a grade de meses (sem chevron; `MonthNavPanel`, com as setas e "Este mês" no rodapé). Na fatura do telefone
 * (`fullWidth`) é o botão da faixa, sem fundo e sem setas.
 */
function MonthNavPicker({
    budgetMonthYm,
    onBudgetMonthYmChange,
    onJump,
    pickerAriaLabel,
    monthLabel,
    fullWidth,
}: {
    budgetMonthYm: string
    onBudgetMonthYmChange: (ym: string) => void
    onJump: () => void
    pickerAriaLabel: string
    monthLabel: string
    /** A faixa inteira (a fatura no telefone). */
    fullWidth?: boolean
}) {
    const [aberto, setAberto] = React.useState(false)
    const popover = (
        <Popover open={aberto} onOpenChange={setAberto}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="tertiary"
                    size={fullWidth ? undefined : "md"}
                    aria-label={pickerAriaLabel}
                    className={cn("min-w-0 gap-2 font-medium tabular-nums", fullWidth ? "flex-1" : "px-1.5 text-foreground")}
                >
                    <span className="min-w-0 truncate">{monthLabel}</span>
                    {/* Na pílula do desktop o mês dispensa o chevron: as setas ao lado já dizem que ele muda. */}
                    {fullWidth ? (
                        <ChevronDownIcon data-icon="inline-end" className="text-muted-foreground" aria-hidden />
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" size="auto" padding="none" label="Escolher mês">
                <MonthNavPanel
                    budgetMonthYm={budgetMonthYm}
                    onBudgetMonthYmChange={onBudgetMonthYmChange}
                    onJump={onJump}
                    fechar={() => setAberto(false)}
                />
            </PopoverContent>
        </Popover>
    )
    if (fullWidth) return popover
    // Uma pílula só, na pele do `floating`: as setas e o mês moram dentro dela, terciários (o fundo
    // de cada um só acende no cursor e no toque). Não é `ButtonGroup`: sem emendas entre as peças.
    return (
        <div className="flex items-center rounded-full bg-popover p-0.5 shadow-sm ring-1 ring-foreground/10">
            <Button
                type="button"
                variant="tertiary"
                size="icon-md"
                aria-label="Mês anterior"
                className="text-muted-foreground hover:text-foreground active:text-foreground"
                onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, -1))}
            >
                <ChevronLeftIcon aria-hidden />
            </Button>
            {popover}
            <Button
                type="button"
                variant="tertiary"
                size="icon-md"
                aria-label="Próximo mês"
                className="text-muted-foreground hover:text-foreground active:text-foreground"
                onClick={() => onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, 1))}
            >
                <ChevronRightIcon aria-hidden />
            </Button>
        </div>
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
    const reduzido = useReducedMotion() ?? false
    const fecharDepois = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    React.useEffect(() => () => {
        if (fecharDepois.current) clearTimeout(fecharDepois.current)
    }, [])
    return (
        <>
            <MonthGrid
                value={mesDoAnoMes(budgetMonthYm)}
                onChange={(d) => {
                    onBudgetMonthYmChange(formatYearMonth(d))
                    // Primeiro o marcador viaja até o mês tocado, depois o painel fecha: fechando
                    // junto, a saída do painel cortava a viagem.
                    if (fecharDepois.current) clearTimeout(fecharDepois.current)
                    fecharDepois.current = setTimeout(fechar, reduzido ? 0 : TRAJETO_MACIO.duration)
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
    /** O botão do mês ocupa a faixa inteira (a fatura no telefone). */
    mobileTriggerFullWidth?: boolean
}) {
    const [open, setOpen] = React.useState(false)
    const jump =
        onJumpToCurrentMonth ?? (() => onBudgetMonthYmChange(formatYearMonth(new Date())))
    const monthLabel = labelYearMonthPt(budgetMonthYm)
    const shortLabel = shortLabelYearMonthPt(budgetMonthYm)
    const pickerAriaLabel = `Escolher mês de referência. Mês selecionado: ${monthLabel}.`

    const seletorDoMes = (
        <MonthNavPicker
            budgetMonthYm={budgetMonthYm}
            onBudgetMonthYmChange={onBudgetMonthYmChange}
            onJump={jump}
            pickerAriaLabel={pickerAriaLabel}
            monthLabel={monthLabel}
            fullWidth={Boolean(mobileTriggerFullWidth)}
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
                    {seletorDoMes}
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
                        {seletorDoMes}
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
    ordem,
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
    /** A ordem da grade: no grupo da direita, antes do mês. */
    ordem?: React.ReactNode
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
                {ordem}
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
