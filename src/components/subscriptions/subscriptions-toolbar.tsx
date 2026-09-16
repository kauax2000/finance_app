"use client"

import {
    Toolbar,
    ToolbarActions,
    toolbarControlClassName,
    toolbarIconControlClassName,
    ToolbarRow,
} from "@/components/ui/toolbar"
import { ArrowsUpDownIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
            <Toolbar>
                <ToolbarRow>
                    <Tabs
                        value={statusFilter}
                        onValueChange={(next) =>
                            onStatusFilterChange(next as typeof statusFilter)
                        }
                        className="min-w-0 flex-1 md:flex-initial md:shrink-0"
                    >
                        <TabsList aria-label="Status da assinatura" className="w-full md:w-auto">
                            {STATUS_TABS.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value}>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-lg"
                                className={cn(toolbarIconControlClassName, "shrink-0 md:hidden")}
                                aria-label="Ordenar"
                            >
                                <ArrowsUpDownIcon className="size-4 opacity-80" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" size="xl">
                            <SortPresetDropdownItems onPick={onSortChange} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ToolbarRow>

                <ToolbarActions className="hidden md:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(toolbarControlClassName, "gap-1.5 text-xs")}
                            >
                                Ordenar
                                <ChevronDownIcon className="size-3.5 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" size="xl">
                            <SortPresetDropdownItems onPick={onSortChange} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className={cn(toolbarControlClassName, "gap-2 text-xs")}
                        onClick={onNewSubscription}
                    >
                        <PlusIcon className="size-4 shrink-0" />
                        Nova assinatura
                    </Button>
                </ToolbarActions>
            </Toolbar>
        </>
    )
}
