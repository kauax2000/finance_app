"use client"

import { formatYmdPtBr } from "@/lib/transaction-date"
import * as React from "react"
import { XMarkIcon } from "@heroicons/react/16/solid"
import type { Category, CreditCard } from "@/lib/supabase"
import {
    paymentMethodLabel,
    type PaymentMethod,
} from "@/lib/payment-methods"
import { Button } from "@/components/ui/button"
import { ToolbarChips, type ToolbarChip } from "@/components/ui/toolbar"
import {
    transactionsPresetSummaryLabel,
    type TransactionsDatePresetKey,
} from "@/components/transactions/transactions-date-presets"
import type { TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import { cn } from "@/lib/utils"

type InstallmentPlanLite = { id: string; description: string | null }
type SubscriptionLite = { id: string; name: string }

function typeLabelPt(filterType: TransactionFilterType): string {
    if (filterType === "expense") return "Despesas"
    if (filterType === "income") return "Receitas"
    return "Todos"
}

function compactId(id: string): string {
    return `${id.slice(0, 8)}…`
}

/**
 * O × de um selo de filtro. Eram quatro `<button>` crus iguais, aqui e no
 * painel de filtros. O `size-5` fica: o × mora dentro do `Badge`, e o
 * `icon-xs` (24px) esticaria o selo.
 */
export function FilterChipRemoveButton(
    props: Omit<React.ComponentProps<typeof Button>, "children" | "variant" | "size">
) {
    return (
        <Button
            type="button"
            variant="tertiary"
            size="icon-xs"
            {...props}
            className={cn(
                "size-5 shrink-0 rounded-full text-current opacity-70 hover:opacity-100 active:opacity-100 [--button-bloom-fill:color-mix(in_oklab,var(--success)_20%,transparent)] dark:[--button-bloom-fill:color-mix(in_oklab,var(--success)_20%,transparent)]",
                props.className
            )}
        >
            <XMarkIcon className="size-3.5" aria-hidden />
        </Button>
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
    onClearAll,
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
    /** O "Limpar tudo" da linha — o mesmo da folha de filtros. */
    onClearAll?: () => void
    className?: string
}) {
    const filterChipItems = React.useMemo((): ToolbarChip[] => {
        const out: ToolbarChip[] = []

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
                label = `Período: ${formatYmdPtBr(filterDateFrom)} → ${formatYmdPtBr(filterDateTo)}`
            } else if (filterDateFrom) {
                label = `Período: De ${formatYmdPtBr(filterDateFrom)}`
            } else if (filterDateTo) {
                label = `Período: Até ${formatYmdPtBr(filterDateTo)}`
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

    // A linha é do `Toolbar`: renderizada como filha direta dele, ela ocupa a
    // linha de baixo inteira, e o que passa de seis recolhe no `+N`.
    return (
        <ToolbarChips
            items={filterChipItems}
            onClearAll={onClearAll}
            className={className}
        />
    )
}
