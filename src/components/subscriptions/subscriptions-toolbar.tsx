"use client"

import { Plus, ArrowUpDown, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    transactionSegmentContainerClassName,
    transactionSegmentTabClassName,
} from "@/components/transactions/transaction-type-segment"
import { cn } from "@/lib/utils"

export type SubscriptionStatusFilter = "all" | "active" | "inactive"

export type SubscriptionSortKey = "name" | "amount" | "next_billing_date"

export type SubscriptionSortDir = "asc" | "desc"

const STATUS_TABS: { value: SubscriptionStatusFilter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Ativas" },
    { value: "inactive", label: "Inativas" },
]

const SORT_PRESETS = [
    ["name", "asc"],
    ["name", "desc"],
    ["amount", "desc"],
    ["amount", "asc"],
    ["next_billing_date", "asc"],
    ["next_billing_date", "desc"],
] as const satisfies ReadonlyArray<
    readonly [SubscriptionSortKey, SubscriptionSortDir]
>

function sortSummaryLabel(key: SubscriptionSortKey, dir: SubscriptionSortDir): string {
    if (key === "name") return `Nome (${dir === "asc" ? "A–Z" : "Z–A"})`
    if (key === "amount")
        return `Valor (${dir === "asc" ? "menor primeiro" : "maior primeiro"})`
    return `Próx. cobrança (${dir === "asc" ? "mais antiga" : "mais recente"})`
}

function SortPresetDropdownItems({
    onPick,
}: {
    onPick: (key: SubscriptionSortKey, dir: SubscriptionSortDir) => void
}) {
    return SORT_PRESETS.map(([k, d]) => (
        <DropdownMenuItem key={`${k}-${d}`} onClick={() => onPick(k, d)}>
            {sortSummaryLabel(k, d)}
        </DropdownMenuItem>
    ))
}

export function SubscriptionsToolbar({
    statusFilter,
    onStatusFilterChange,
    sortKey: _sortKey,
    sortDir: _sortDir,
    onSortChange,
    onResetFilters: _onResetFilters,
    onNewSubscription,
}: {
    statusFilter: SubscriptionStatusFilter
    onStatusFilterChange: (v: SubscriptionStatusFilter) => void
    sortKey: SubscriptionSortKey
    sortDir: SubscriptionSortDir
    onSortChange: (key: SubscriptionSortKey, dir: SubscriptionSortDir) => void
    onResetFilters: () => void
    onNewSubscription: () => void
}) {
    return (
        <>
            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div className="flex min-w-0 flex-row items-center gap-2 md:contents">
                    <div
                        className={cn(
                            transactionSegmentContainerClassName,
                            "min-w-0 flex-1 md:flex-initial md:shrink-0"
                        )}
                        role="tablist"
                        aria-label="Status da assinatura"
                    >
                        <ButtonGroup className="h-full min-h-0 w-full gap-0.5 md:w-auto">
                            {STATUS_TABS.map((tab) => {
                                const selected = statusFilter === tab.value
                                return (
                                    <Button
                                        key={tab.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        size="sm"
                                        variant="ghost"
                                        className={transactionSegmentTabClassName(
                                            selected
                                        )}
                                        onClick={() =>
                                            onStatusFilterChange(tab.value)
                                        }
                                    >
                                        {tab.label}
                                    </Button>
                                )
                            })}
                        </ButtonGroup>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-10 shrink-0 md:hidden"
                                aria-label="Ordenar"
                            >
                                <ArrowUpDown className="size-4 opacity-80" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <SortPresetDropdownItems onPick={onSortChange} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="hidden shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                            >
                                Ordenar
                                <ChevronDown className="size-3.5 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <SortPresetDropdownItems onPick={onSortChange} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="h-8 gap-2 text-xs"
                        onClick={onNewSubscription}
                    >
                        <Plus className="size-4 shrink-0" />
                        Nova assinatura
                    </Button>
                </div>
            </div>
        </>
    )
}
