"use client"

import { Toolbar, ToolbarActions, ToolbarButton } from "@/components/ui/toolbar"
import { ArrowsUpDownIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        <Toolbar>
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

            {/* Um "Ordenar" só: rotulado a partir de `md`, só o ícone abaixo
                (era um par `md:hidden` / `hidden md:flex`). "Nova assinatura"
                continua só a partir de `md`, como antes. */}
            <ToolbarActions>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <ToolbarButton
                            type="button"
                            collapse
                            icon={<ArrowsUpDownIcon aria-hidden />}
                            label="Ordenar"
                        >
                            <ChevronDownIcon aria-hidden className="opacity-70" />
                        </ToolbarButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" size="xl">
                        <SortPresetDropdownItems onPick={onSortChange} />
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    type="button"
                    variant="primary"
                    className="max-md:hidden"
                    onClick={onNewSubscription}
                >
                    <PlusIcon aria-hidden />
                    Nova assinatura
                </Button>
            </ToolbarActions>
        </Toolbar>
    )
}
