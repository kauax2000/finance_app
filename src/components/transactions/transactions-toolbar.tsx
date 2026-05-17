"use client"

import * as React from "react"
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline"
import {
    TransactionTypeSegment,
    type TransactionFilterType,
} from "@/components/transactions/transaction-type-segment"
import {
    type TransactionsDatePresetKey,
    transactionsPresetSummaryLabel,
} from "@/components/transactions/transactions-date-presets"
import {
    TransactionsFiltersPanel,
    type TransactionsFiltersPanelBaseProps,
} from "@/components/transactions/transactions-filters-panel"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetTitle,
} from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { mobileSheetChromeBelowHeaderClassName } from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export type NewTransactionMode = "expense" | "income" | "installment"

function typeSummary(filterType: TransactionFilterType): string {
    if (filterType === "all") return "Todos os tipos"
    if (filterType === "expense") return "Despesas"
    return "Receitas"
}

function filtersSummaryLine(args: {
    filterType: TransactionFilterType
    fullPeriod: boolean
    datePreset: TransactionsDatePresetKey | null
    filterDateFrom: string
    filterDateTo: string
}): string {
    const t = typeSummary(args.filterType)
    if (args.fullPeriod) return `${t} · Todo o período`
    if (args.datePreset) {
        return `${t} · ${transactionsPresetSummaryLabel(args.datePreset)}`
    }
    if (args.filterDateFrom && args.filterDateTo) {
        return `${t} · ${args.filterDateFrom} → ${args.filterDateTo}`
    }
    if (args.filterDateFrom) return `${t} · De ${args.filterDateFrom}`
    if (args.filterDateTo) return `${t} · Até ${args.filterDateTo}`
    return `${t} · Período personalizado`
}

function filtersAreNonDefault(args: {
    filterType: TransactionFilterType
    /** Usually `"all"`; category embedded may pass `income` or `expense` when the type is fixed. */
    baselineFilterType: TransactionFilterType
    fullPeriod: boolean
    advancedFiltersActive: boolean
    /** When true, period is controlled by the host (e.g. category month); do not treat `!fullPeriod` as active. */
    treatPeriodAsAlwaysDefault?: boolean
}): boolean {
    const periodNonDefault = args.treatPeriodAsAlwaysDefault ? false : !args.fullPeriod
    return (
        args.filterType !== args.baselineFilterType ||
        periodNonDefault ||
        args.advancedFiltersActive
    )
}

export function TransactionsToolbar({
    filterType,
    onFilterTypeChange,
    fullPeriod,
    filterDateFrom,
    filterDateTo,
    datePreset,
    onSelectFullPeriod,
    onPresetChange,
    onDateRangeApply,
    onClearPeriodFilter,
    resetAllFilters,
    advancedFiltersActive,
    filtersPanel,
    onFiltersSheetOpenChange,
    activeFiltersChips,
    showTransactionTypeSegment = true,
    baselineTransactionFilterType = "all" satisfies TransactionFilterType,
    hidePeriodInFilters = false,
    treatPeriodAsAlwaysDefault = false,
    toolbarLeading,
    toolbarAfterFilters,
    toolbarTrailing,
}: {
    filterType: TransactionFilterType
    onFilterTypeChange: (next: TransactionFilterType) => void
    fullPeriod: boolean
    filterDateFrom: string
    filterDateTo: string
    datePreset: TransactionsDatePresetKey | null
    onSelectFullPeriod: () => void
    onPresetChange: (next: {
        preset: TransactionsDatePresetKey
        from: string
        to: string
    }) => void
    onDateRangeApply: (next: { from: string; to: string }) => void
    onClearPeriodFilter: () => void
    resetAllFilters: () => void
    advancedFiltersActive: boolean
    filtersPanel: TransactionsFiltersPanelBaseProps
    onFiltersSheetOpenChange?: (open: boolean) => void
    activeFiltersChips?: React.ReactNode
    showTransactionTypeSegment?: boolean
    baselineTransactionFilterType?: TransactionFilterType
    /** Omit período presets/range from the filters sheet (host owns the month). */
    hidePeriodInFilters?: boolean
    /** Mobile filter button: do not count period as “non-default”. */
    treatPeriodAsAlwaysDefault?: boolean
    /** Optional content to the left of the filter control (e.g. deep-link out). Factory allows separate trees for mobile vs desktop rows. */
    toolbarLeading?: () => React.ReactNode
    /** Optional content immediately to the right of the Filters control (desktop button + mobile icon). */
    toolbarAfterFilters?: () => React.ReactNode
    /** Right of chips + Filtros on desktop; before the filter icon on mobile. Omit on category embedded lists. */
    toolbarTrailing?: () => React.ReactNode
}) {
    const isMobile = useIsMobile()
    const [filtersSheetOpen, setFiltersSheetOpen] = React.useState(false)

    const rangeFrom = fullPeriod ? "" : filterDateFrom
    const rangeTo = fullPeriod ? "" : filterDateTo

    const summary = filtersSummaryLine({
        filterType,
        fullPeriod,
        datePreset,
        filterDateFrom,
        filterDateTo,
    })
    const active = filtersAreNonDefault({
        filterType,
        baselineFilterType: baselineTransactionFilterType,
        fullPeriod,
        advancedFiltersActive,
        treatPeriodAsAlwaysDefault,
    })

    const closeMobileSheet = React.useCallback(() => {
        setFiltersSheetOpen(false)
    }, [])

    const panelMobile = (
        <TransactionsFiltersPanel
            {...filtersPanel}
            includePeriod={!hidePeriodInFilters}
            onPresetChange={(next) => {
                filtersPanel.onPresetChange(next)
                closeMobileSheet()
            }}
            onDateRangeApply={(next) => {
                filtersPanel.onDateRangeApply(next)
                closeMobileSheet()
            }}
        />
    )

    const panelDesktop = (
        <TransactionsFiltersPanel
            {...filtersPanel}
            periodIdPrefix="tx-range-drawer-desk"
            includePeriod={!hidePeriodInFilters}
        />
    )

    const stackMobileLeadingRow = Boolean(toolbarLeading) && Boolean(toolbarAfterFilters)

    const mobileFiltersSheetTrigger = (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative size-10 shrink-0 md:hidden"
            onClick={() => setFiltersSheetOpen(true)}
            aria-label={
                active
                    ? `Filtros: ${summary}${
                          advancedFiltersActive ? " e mais filtros ativos" : ""
                      }`
                    : "Filtros"
            }
        >
            <AdjustmentsHorizontalIcon className="size-4 opacity-80" />
            {active ? (
                <span
                    className="pointer-events-none absolute -top-1 -right-1 z-10 size-3 rounded-full border-2 border-background bg-primary"
                    aria-hidden
                />
            ) : null}
        </Button>
    )

    return (
        <>
            <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div className="flex min-w-0 max-w-full items-center gap-2 md:contents">
                    {showTransactionTypeSegment ? (
                        <TransactionTypeSegment
                            value={filterType}
                            onChange={onFilterTypeChange}
                            className="min-w-0 flex-1 shrink md:max-w-fit md:shrink-0"
                        />
                    ) : null}
                    {!stackMobileLeadingRow ? mobileFiltersSheetTrigger : null}
                </div>

                {(toolbarLeading || toolbarAfterFilters) ? (
                    <div className="min-w-0 w-full md:hidden">
                        {stackMobileLeadingRow ? (
                            <div className="flex min-w-0 w-full flex-col gap-2">
                                <div className="min-w-0">{toolbarLeading?.()}</div>
                                <div className="flex min-w-0 w-full flex-1 items-center gap-2">
                                    {toolbarAfterFilters?.()}
                                    {mobileFiltersSheetTrigger}
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "flex min-w-0 w-full flex-row items-stretch gap-2",
                                    toolbarLeading && "justify-between",
                                    !toolbarLeading && "justify-end",
                                )}
                            >
                                {toolbarLeading ? (
                                    <div className="min-w-0 shrink">{toolbarLeading()}</div>
                                ) : null}
                                {toolbarAfterFilters ? (
                                    <div className="min-w-0 shrink-0">{toolbarAfterFilters()}</div>
                                ) : null}
                            </div>
                        )}
                    </div>
                ) : null}

                <div
                    className={cn(
                        "hidden min-w-0 max-w-full flex-1 md:flex md:flex-wrap md:items-center md:gap-2",
                        toolbarLeading
                            ? "md:justify-between"
                            : "md:justify-end"
                    )}
                >
                    {toolbarLeading ? (
                        <div className="shrink-0">{toolbarLeading()}</div>
                    ) : null}
                    <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-2 md:flex-nowrap">
                        {activeFiltersChips ? (
                            <div className="min-w-0 max-w-full flex-1 overflow-hidden">
                                {activeFiltersChips}
                            </div>
                        ) : null}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="relative h-8 shrink-0 gap-2 text-xs"
                            onClick={() => setFiltersSheetOpen(true)}
                            aria-label={
                                advancedFiltersActive
                                    ? "Filtros avançados ativos"
                                    : "Filtros avançados"
                            }
                        >
                            <AdjustmentsHorizontalIcon className="size-4 opacity-80" />
                            <span className="hidden sm:inline">Filtros</span>
                            {advancedFiltersActive ? (
                                <span
                                    className="absolute top-1 right-1 size-2 rounded-full bg-primary sm:top-1.5 sm:right-1.5"
                                    aria-hidden
                                />
                            ) : null}
                        </Button>
                        {toolbarAfterFilters ? (
                            <div className="shrink-0">{toolbarAfterFilters()}</div>
                        ) : null}
                    </div>
                    {toolbarTrailing ? (
                        <div className="flex shrink-0 items-stretch gap-2">
                            {toolbarTrailing()}
                        </div>
                    ) : null}
                </div>
            </div>

            <Sheet
                open={filtersSheetOpen}
                onOpenChange={(open) => {
                    setFiltersSheetOpen(open)
                    onFiltersSheetOpenChange?.(open)
                }}
            >
                <SheetContent
                    side={isMobile ? "bottom" : "right"}
                    fillMobileViewport={isMobile}
                    showCloseButton={false}
                    className={cn(
                        "flex w-full flex-col gap-0 overflow-hidden p-0",
                        isMobile
                            ? "min-h-0 rounded-t-2xl"
                            : "h-full max-h-[100dvh] border-l sm:max-w-sm"
                    )}
                >
                    <div className="flex h-full flex-col">
                        <SheetTitle className="sr-only">Filtros</SheetTitle>
                        <SheetDescription className="sr-only">
                            {hidePeriodInFilters
                                ? "Origem, pagamento, categorias e mais."
                                : "Período, origem, pagamento, categorias e mais."}
                        </SheetDescription>
                        {isMobile ? <SheetDragHandle /> : null}
                        <div
                            className={cn(
                                "flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 sm:px-5",
                                mobileSheetChromeBelowHeaderClassName,
                                isMobile && "pt-1"
                            )}
                        >
                            <p className="font-heading min-w-0 flex-1 truncate text-base font-medium leading-tight text-foreground">
                                Filtros
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0"
                                onClick={() => setFiltersSheetOpen(false)}
                                aria-label="Fechar"
                            >
                                <XMarkIcon className="h-5 w-5" aria-hidden />
                            </Button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                            <div className="space-y-6">
                                {isMobile ? panelMobile : panelDesktop}
                            </div>
                        </div>

                        <SheetFooter
                            className={cn(
                                "gap-2 border-t bg-background px-4 py-3 sm:px-5",
                                !isMobile && "flex-row justify-end"
                            )}
                        >
                            <Button
                                type="button"
                                variant="destructive"
                                size={isMobile ? "lg" : "default"}
                                className={isMobile ? "w-full" : undefined}
                                onClick={() => {
                                    resetAllFilters()
                                }}
                            >
                                Limpar tudo
                            </Button>
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
