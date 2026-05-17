"use client"

import * as React from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

import type { Category, CreditCard } from "@/lib/supabase"
import {
    paymentMethodLabel,
    type PaymentMethod,
} from "@/lib/payment-methods"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    transactionsPresetSummaryLabel,
    type TransactionsDatePresetKey,
} from "@/components/transactions/transactions-date-presets"
import type { TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import { cn } from "@/lib/utils"

type InstallmentPlanLite = { id: string; description: string | null }
type SubscriptionLite = { id: string; name: string }

/** Tailwind `gap-2` default. */
const CHIP_ROW_GAP_PX = 8

type ActiveFilterChipItem = {
    key: string
    label: string
    title?: string
    onRemove: () => void
}

function typeLabelPt(filterType: TransactionFilterType): string {
    if (filterType === "expense") return "Despesas"
    if (filterType === "income") return "Receitas"
    return "Todos"
}

function compactId(id: string): string {
    return `${id.slice(0, 8)}…`
}

function Chip({
    label,
    title,
    onRemove,
    className,
}: {
    label: string
    title?: string
    onRemove: () => void
    className?: string
}) {
    return (
        <Badge
            variant="success"
            className={cn(
                "inline-flex max-w-[9.5rem] shrink-0 items-center gap-1.5 pr-1.5 sm:max-w-[11rem]",
                "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                "dark:bg-emerald-950 dark:text-emerald-100 dark:hover:bg-emerald-900",
                className
            )}
            title={title ?? label}
        >
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <button
                type="button"
                className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                    "text-emerald-700/80 hover:bg-emerald-200/60 hover:text-emerald-950",
                    "dark:text-emerald-100/80 dark:hover:bg-emerald-800/60 dark:hover:text-emerald-50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                )}
                aria-label={`Remover filtro: ${label}`}
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
            >
                <XMarkIcon className="size-3.5" aria-hidden />
            </button>
        </Badge>
    )
}

export function TransactionsActiveFiltersChips({
    filterType,
    onClearType,
    fullPeriod,
    datePreset,
    filterDateFrom,
    filterDateTo,
    onClearPeriod,
    filterCreditCardIds,
    onRemoveCreditCardId,
    creditCards,
    filterPaymentMethods,
    onRemovePaymentMethod,
    filterInstallmentsOnly,
    onClearInstallmentsOnly,
    filterInstallmentPlanId,
    onClearInstallmentPlan,
    installmentPlans,
    filterSubscriptionId,
    onClearSubscription,
    subscriptions,
    filterCategoryIds,
    onRemoveCategoryId,
    categories,
    filterUncategorizedOnly,
    onClearUncategorizedOnly,
    filterAmountMin,
    filterAmountMax,
    onClearAmount,
    filterDescriptionQuery,
    onClearDescriptionQuery,
    hideCategoryFilters = false,
    hideTypeFilter = false,
    hidePeriodFilter = false,
    className,
}: {
    filterType: TransactionFilterType
    onClearType: () => void
    fullPeriod: boolean
    datePreset: TransactionsDatePresetKey | null
    filterDateFrom: string
    filterDateTo: string
    onClearPeriod: () => void
    filterCreditCardIds: string[]
    onRemoveCreditCardId: (id: string) => void
    creditCards: CreditCard[]
    filterPaymentMethods: PaymentMethod[]
    onRemovePaymentMethod: (method: PaymentMethod) => void
    filterInstallmentsOnly: boolean
    onClearInstallmentsOnly: () => void
    filterInstallmentPlanId: string | null
    onClearInstallmentPlan: () => void
    installmentPlans: InstallmentPlanLite[]
    filterSubscriptionId: string | null
    onClearSubscription: () => void
    subscriptions: SubscriptionLite[]
    filterCategoryIds: string[]
    onRemoveCategoryId: (id: string) => void
    categories: Category[]
    filterUncategorizedOnly: boolean
    onClearUncategorizedOnly: () => void
    filterAmountMin: string
    filterAmountMax: string
    onClearAmount: () => void
    filterDescriptionQuery: string
    onClearDescriptionQuery: () => void
    /** Hide category + uncategorized chips (e.g. category is locked elsewhere). */
    hideCategoryFilters?: boolean
    /** Hide the receita/despesa type chip (e.g. type is fixed to the page category). */
    hideTypeFilter?: boolean
    /** Hide the período chip (e.g. month is fixed by the category page header). */
    hidePeriodFilter?: boolean
    className?: string
}) {
    const filterChipItems = React.useMemo((): ActiveFilterChipItem[] => {
        const out: ActiveFilterChipItem[] = []

        if (!hideTypeFilter && filterType !== "all") {
            const label = `Tipo: ${typeLabelPt(filterType)}`
            out.push({
                key: "type",
                label,
                onRemove: onClearType,
            })
        }

        if (!hidePeriodFilter && !fullPeriod) {
            let label = "Período: Personalizado"
            if (datePreset) {
                label = `Período: ${transactionsPresetSummaryLabel(datePreset)}`
            } else if (filterDateFrom && filterDateTo) {
                label = `Período: ${filterDateFrom} → ${filterDateTo}`
            } else if (filterDateFrom) {
                label = `Período: De ${filterDateFrom}`
            } else if (filterDateTo) {
                label = `Período: Até ${filterDateTo}`
            }
            out.push({
                key: "period",
                label,
                onRemove: onClearPeriod,
            })
        }

        if (filterPaymentMethods.length) {
            for (const pm of filterPaymentMethods) {
                const label = `Pagamento: ${paymentMethodLabel(pm)}`
                out.push({
                    key: `pm:${pm}`,
                    label,
                    onRemove: () => onRemovePaymentMethod(pm),
                })
            }
        }

        if (
            filterPaymentMethods.includes("credit_card") &&
            filterCreditCardIds.length
        ) {
            for (const id of filterCreditCardIds) {
                const card = creditCards.find((c) => c.id === id)
                const name = card
                    ? `${card.name} · •••• ${card.last_four}`
                    : `Cartão ${compactId(id)}`
                const label = `Cartão: ${name}`
                out.push({
                    key: `card:${id}`,
                    label,
                    title: label,
                    onRemove: () => onRemoveCreditCardId(id),
                })
            }
        }

        if (filterInstallmentsOnly) {
            const label = "Compras parceladas"
            out.push({
                key: "inst",
                label,
                onRemove: onClearInstallmentsOnly,
            })
        }

        if (filterInstallmentPlanId) {
            const p = installmentPlans.find(
                (x) => x.id === filterInstallmentPlanId
            )
            const name =
                p?.description?.trim() ||
                `Plano ${compactId(filterInstallmentPlanId)}`
            const label = `Plano: ${name}`
            out.push({
                key: "plan",
                label,
                title: label,
                onRemove: onClearInstallmentPlan,
            })
        }

        if (filterSubscriptionId) {
            const s = subscriptions.find((x) => x.id === filterSubscriptionId)
            const label = `Assinatura: ${s?.name ?? `Assinatura ${compactId(filterSubscriptionId)}`}`
            out.push({
                key: "sub",
                label,
                title: label,
                onRemove: onClearSubscription,
            })
        }

        if (!hideCategoryFilters) {
            if (filterCategoryIds.length) {
                for (const id of filterCategoryIds) {
                    const cat = categories.find((c) => c.id === id)
                    const label = `Categoria: ${cat?.name ?? `Categoria ${compactId(id)}`}`
                    out.push({
                        key: `cat:${id}`,
                        label,
                        title: label,
                        onRemove: () => onRemoveCategoryId(id),
                    })
                }
            }

            if (filterUncategorizedOnly) {
                out.push({
                    key: "uncat",
                    label: "Sem categoria",
                    onRemove: onClearUncategorizedOnly,
                })
            }
        }

        const min = filterAmountMin.trim()
        const max = filterAmountMax.trim()
        if (min || max) {
            let label = "Valor: —"
            if (min && max) label = `Valor: ${min} → ${max}`
            else if (min) label = `Valor: ≥ ${min}`
            else label = `Valor: ≤ ${max}`
            out.push({ key: "amt", label, onRemove: onClearAmount })
        }

        const q = filterDescriptionQuery.trim()
        if (q) {
            const label = `Descrição: ${q}`
            out.push({
                key: "q",
                label,
                title: label,
                onRemove: onClearDescriptionQuery,
            })
        }

        return out
    }, [
        categories,
        creditCards,
        datePreset,
        filterAmountMax,
        filterAmountMin,
        filterCategoryIds,
        filterCreditCardIds,
        filterDateFrom,
        filterDateTo,
        filterDescriptionQuery,
        filterInstallmentsOnly,
        filterInstallmentPlanId,
        filterPaymentMethods,
        filterSubscriptionId,
        filterType,
        filterUncategorizedOnly,
        hideCategoryFilters,
        hideTypeFilter,
        hidePeriodFilter,
        fullPeriod,
        installmentPlans,
        onClearAmount,
        onClearDescriptionQuery,
        onClearInstallmentsOnly,
        onClearInstallmentPlan,
        onClearPeriod,
        onClearSubscription,
        onClearType,
        onClearUncategorizedOnly,
        onRemoveCategoryId,
        onRemoveCreditCardId,
        onRemovePaymentMethod,
        subscriptions,
    ])

    const chipItemsKey = React.useMemo(
        () => filterChipItems.map((x) => x.key).join("\0"),
        [filterChipItems]
    )

    const chipSlotRef = React.useRef<HTMLDivElement>(null)
    const measureRef = React.useRef<HTMLDivElement>(null)

    const [inlineCount, setInlineCount] = React.useState(
        () => filterChipItems.length
    )

    React.useLayoutEffect(() => {
        if (filterChipItems.length === 0) {
            setInlineCount(0)
            return
        }

        const run = () => {
            const slot = chipSlotRef.current
            const measure = measureRef.current
            const n = filterChipItems.length
            if (!slot || !measure || n === 0) return

            const available = slot.clientWidth
            if (available <= 0) return

            const children = measure.children
            if (children.length !== n) return

            const widths: number[] = []
            for (let i = 0; i < n; i++) {
                widths.push(
                    (children[i] as HTMLElement).getBoundingClientRect().width
                )
            }

            const gap = CHIP_ROW_GAP_PX
            let bestK = 0
            for (let k = n; k >= 0; k--) {
                let rowW = 0
                for (let i = 0; i < k; i++) rowW += widths[i]!
                if (k >= 2) rowW += (k - 1) * gap
                if (rowW <= available + 0.5) {
                    bestK = k
                    break
                }
            }
            setInlineCount((prev) => (prev === bestK ? prev : bestK))
        }

        run()
        const slot = chipSlotRef.current
        if (!slot || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => run())
        ro.observe(slot)
        return () => ro.disconnect()
    }, [chipItemsKey, filterChipItems])

    if (filterChipItems.length === 0) return null

    const inline = filterChipItems.slice(
        0,
        Math.min(inlineCount, filterChipItems.length)
    )
    const overflow = filterChipItems.slice(inline.length)

    return (
        <div
            className={cn(
                "relative flex w-full min-w-0 max-w-full items-center justify-end gap-2",
                className
            )}
        >
            <div
                ref={measureRef}
                aria-hidden
                className="invisible pointer-events-none absolute top-0 -left-[9999px] z-[-1] flex w-max flex-nowrap items-center gap-2"
            >
                {filterChipItems.map((item) => (
                    <Chip
                        key={item.key}
                        label={item.label}
                        title={item.title}
                        onRemove={() => {}}
                    />
                ))}
            </div>
            <div
                ref={chipSlotRef}
                className="min-w-0 max-w-full flex-1 overflow-hidden"
            >
                <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2">
                    {inline.map((item) => (
                        <Chip
                            key={item.key}
                            label={item.label}
                            title={item.title}
                            onRemove={item.onRemove}
                        />
                    ))}
                </div>
            </div>
            {overflow.length > 0 ? (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 shrink-0 px-2.5 text-xs"
                            aria-label={`Ver mais ${overflow.length} filtros ativos`}
                        >
                            +{overflow.length}{" "}
                            {overflow.length === 1 ? "filtro" : "filtros"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="end"
                        className="w-max max-w-[min(100vw-2rem,20rem)] gap-0 p-0"
                    >
                        <div className="border-b border-border/60 px-2 py-1.5">
                            <p className="text-[11px] font-medium leading-tight text-muted-foreground">
                                Mais filtros ativos
                            </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1.5">
                            <div className="inline-flex max-w-full flex-col items-stretch gap-1.5">
                                {overflow.map((item) => (
                                    <Chip
                                        key={item.key}
                                        label={item.label}
                                        title={item.title}
                                        onRemove={item.onRemove}
                                        className="flex w-full min-w-0 max-w-none justify-between"
                                    />
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            ) : null}
        </div>
    )
}
