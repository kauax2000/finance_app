"use client"

import * as React from "react"
import { ChevronDown, Plus, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { mobileSheetChromeBelowHeaderClassName } from "@/components/ui/mobile-sheet-form-chrome"
import {
    transactionSegmentContainerClassName,
    transactionSegmentTabClassName,
} from "@/components/transactions/transaction-type-segment"
import { cn } from "@/lib/utils"

export type BillsPageMode = "pending" | "bills"

export type BillsPendingFilter = "all" | "overdue" | "soon"

export type BillsModelFilter = "all" | "active" | "inactive"

export type BillsSortKey = "due_date" | "amount" | "name"

export type BillsSortDir = "asc" | "desc"

const MODE_TABS: { value: BillsPageMode; label: string }[] = [
    { value: "bills", label: "Contas" },
    { value: "pending", label: "Pendentes" },
]

const PENDING_FILTER: { value: BillsPendingFilter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "overdue", label: "Atrasadas" },
    { value: "soon", label: "Próximos 30 dias" },
]

const MODEL_FILTER: { value: BillsModelFilter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Ativas" },
    { value: "inactive", label: "Inativas" },
]

function sortSummaryLabel(
    mode: BillsPageMode,
    key: BillsSortKey,
    dir: BillsSortDir
): string {
    if (key === "name")
        return `Nome (${dir === "asc" ? "A–Z" : "Z–A"})`
    if (key === "due_date")
        return `Vencimento (${dir === "asc" ? "mais antigo primeiro" : "mais recente primeiro"})`
    return `Valor (${dir === "asc" ? "menor primeiro" : "maior primeiro"})`
}

function filterLabel(
    mode: BillsPageMode,
    pendingFilter: BillsPendingFilter,
    modelFilter: BillsModelFilter
): string {
    if (mode === "pending") {
        return PENDING_FILTER.find((f) => f.value === pendingFilter)?.label ?? "Filtrar"
    }
    return MODEL_FILTER.find((f) => f.value === modelFilter)?.label ?? "Filtrar"
}

function filtersActive(
    mode: BillsPageMode,
    pendingFilter: BillsPendingFilter,
    modelFilter: BillsModelFilter
): boolean {
    if (mode === "pending") return pendingFilter !== "all"
    return modelFilter !== "all"
}

function sortOptionsForMode(mode: BillsPageMode): readonly (readonly [BillsSortKey, BillsSortDir])[] {
    if (mode === "bills") {
        return [
            ["name", "asc"],
            ["name", "desc"],
            ["amount", "desc"],
            ["amount", "asc"],
        ] as const
    }
    return [
        ["due_date", "asc"],
        ["due_date", "desc"],
        ["amount", "desc"],
        ["amount", "asc"],
    ] as const
}

type BillsToolbarProps = {
    mode: BillsPageMode
    onModeChange: (m: BillsPageMode) => void
    pendingFilter: BillsPendingFilter
    onPendingFilterChange: (f: BillsPendingFilter) => void
    modelFilter: BillsModelFilter
    onModelFilterChange: (f: BillsModelFilter) => void
    sortKey: BillsSortKey
    sortDir: BillsSortDir
    onSortChange: (key: BillsSortKey, dir: BillsSortDir) => void
    onNewBill: () => void
    hasTable: boolean
    filtersSheetOpen?: boolean
    onFiltersSheetOpenChange?: (open: boolean) => void
    mobileFiltersTrigger?: "toolbar" | "external"
}

export function BillsToolbar({
    mode,
    onModeChange,
    pendingFilter,
    onPendingFilterChange,
    modelFilter,
    onModelFilterChange,
    sortKey,
    sortDir,
    onSortChange,
    onNewBill,
    hasTable,
    filtersSheetOpen,
    onFiltersSheetOpenChange,
    mobileFiltersTrigger = "toolbar",
}: BillsToolbarProps) {
    const [internalSheetOpen, setInternalSheetOpen] = React.useState(false)
    const sheetControlled =
        typeof filtersSheetOpen === "boolean" &&
        typeof onFiltersSheetOpenChange === "function"
    const sheetOpen = sheetControlled ? filtersSheetOpen : internalSheetOpen
    const setSheetOpen = sheetControlled ? onFiltersSheetOpenChange! : setInternalSheetOpen

    const active = filtersActive(mode, pendingFilter, modelFilter)
    const sortOpts = sortOptionsForMode(mode)

    return (
        <>
            <div className="flex flex-row flex-wrap items-center gap-2 md:gap-3">
                <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2">
                    <div
                        className={cn(
                            transactionSegmentContainerClassName,
                            "w-fit max-w-full shrink-0",
                            !hasTable && "pointer-events-none opacity-50"
                        )}
                        role="tablist"
                        aria-label="Modo de visualização"
                    >
                        <ButtonGroup className="h-full min-h-0 w-fit gap-0.5">
                            {MODE_TABS.map((tab) => {
                                const selected = mode === tab.value
                                return (
                                    <Button
                                        key={tab.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        size="sm"
                                        variant="ghost"
                                        disabled={!hasTable}
                                        className={cn(
                                            transactionSegmentTabClassName(
                                                selected
                                            ),
                                            "flex-none"
                                        )}
                                        onClick={() => onModeChange(tab.value)}
                                    >
                                        {tab.label}
                                    </Button>
                                )
                            })}
                        </ButtonGroup>
                    </div>
                    <Badge
                        size="xs"
                        variant="primary"
                        className="shrink-0"
                    >
                        Beta
                    </Badge>
                </div>

                <div className="ml-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
                    <div className="flex flex-row items-stretch gap-2 md:hidden">
                        <Button
                            type="button"
                            variant="default"
                            className="h-10 min-w-0 flex-1 gap-2 text-sm"
                            onClick={onNewBill}
                            disabled={!hasTable}
                        >
                            <Plus className="size-4 shrink-0" />
                            Nova conta
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={cn(
                                "relative size-10 shrink-0",
                                mobileFiltersTrigger === "external" && "hidden",
                            )}
                            onClick={() => setSheetOpen(true)}
                            disabled={!hasTable}
                            aria-label={
                                active || sheetOpen
                                    ? "Filtros e ordenação"
                                    : "Filtros e ordenação"
                            }
                        >
                            <SlidersHorizontal className="size-4 opacity-80" />
                            {active ? (
                                <span
                                    className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary"
                                    aria-hidden
                                />
                            ) : null}
                        </Button>
                    </div>

                    <div className="hidden shrink-0 md:flex md:flex-wrap md:items-center md:gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    disabled={!hasTable}
                                >
                                    Filtrar: {filterLabel(mode, pendingFilter, modelFilter)}
                                    <ChevronDown className="size-3.5 opacity-70" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {mode === "pending"
                                    ? PENDING_FILTER.map((f) => (
                                          <DropdownMenuItem
                                              key={f.value}
                                              onClick={() =>
                                                  onPendingFilterChange(f.value)
                                              }
                                          >
                                              {f.label}
                                          </DropdownMenuItem>
                                      ))
                                    : MODEL_FILTER.map((f) => (
                                          <DropdownMenuItem
                                              key={f.value}
                                              onClick={() =>
                                                  onModelFilterChange(f.value)
                                              }
                                          >
                                              {f.label}
                                          </DropdownMenuItem>
                                      ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    disabled={!hasTable}
                                >
                                    Ordenar
                                    <ChevronDown className="size-3.5 opacity-70" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {sortOpts.map(([k, d]) => (
                                    <DropdownMenuItem
                                        key={`${k}-${d}`}
                                        onClick={() => onSortChange(k, d)}
                                    >
                                        {sortSummaryLabel(mode, k, d)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="h-8 gap-2 text-xs"
                            onClick={onNewBill}
                            disabled={!hasTable}
                        >
                            <Plus className="size-4 shrink-0" />
                            Nova conta
                        </Button>
                    </div>
                </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton
                    className="flex w-full flex-col rounded-t-2xl px-4 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
                >
                    <SheetDragHandle />
                    <SheetHeader
                        className={cn(
                            "shrink-0 px-0 pt-1 pb-3 text-left",
                            mobileSheetChromeBelowHeaderClassName,
                        )}
                    >
                        <SheetTitle>Filtros e ordenação</SheetTitle>
                        <SheetDescription>
                            Ajuste o que aparece na lista e a ordem dos itens.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="space-y-6 pb-2">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Filtrar
                            </p>
                            <div className="grid gap-2">
                                {mode === "pending"
                                    ? PENDING_FILTER.map((f) => (
                                          <Button
                                              key={f.value}
                                              type="button"
                                              variant={
                                                  pendingFilter === f.value
                                                      ? "secondary"
                                                      : "outline"
                                              }
                                              size="sm"
                                              className="h-10 justify-start text-sm"
                                              onClick={() =>
                                                  onPendingFilterChange(f.value)
                                              }
                                          >
                                              {f.label}
                                          </Button>
                                      ))
                                    : MODEL_FILTER.map((f) => (
                                          <Button
                                              key={f.value}
                                              type="button"
                                              variant={
                                                  modelFilter === f.value
                                                      ? "secondary"
                                                      : "outline"
                                              }
                                              size="sm"
                                              className="h-10 justify-start text-sm"
                                              onClick={() =>
                                                  onModelFilterChange(f.value)
                                              }
                                          >
                                              {f.label}
                                          </Button>
                                      ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Ordenar por
                            </p>
                            <div className="grid gap-2">
                                {sortOpts.map(([k, d]) => (
                                    <Button
                                        key={`${k}-${d}`}
                                        type="button"
                                        variant={
                                            sortKey === k && sortDir === d
                                                ? "secondary"
                                                : "outline"
                                        }
                                        size="sm"
                                        className="h-10 justify-start text-sm"
                                        onClick={() => onSortChange(k, d)}
                                    >
                                        {sortSummaryLabel(mode, k, d)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button
                            type="button"
                            className="h-10 w-full"
                            onClick={() => setSheetOpen(false)}
                        >
                            Concluir
                        </Button>
                    </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
