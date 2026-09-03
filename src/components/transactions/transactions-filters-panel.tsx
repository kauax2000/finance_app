"use client"

import * as React from "react"
import type { Category, CreditCard } from "@/lib/supabase"
import {
    PAYMENT_METHOD_VALUES,
    paymentMethodLabel,
    type PaymentMethod,
} from "@/lib/payment-methods"
import { TransactionsDatePresets } from "@/components/transactions/transactions-date-presets"
import type { TransactionsDatePresetKey } from "@/components/transactions/transactions-date-presets"
import { TransactionsDateRangeForm } from "@/components/transactions/transactions-date-range-form"
import { Badge } from "@/components/ui/badge"
import { MoneyInput } from "@/components/ui/money-input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/16/solid"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

/* A régua sangra para fora do padding da gaveta, por isso a largura calculada.
   Ela precisava copiar o prefixo `data-[orientation=horizontal]:` para vencer o
   `w-full` da base — agora a base é classe crua e a daqui ganha sozinha. O
   `opacity-60` virou `tone="soft"`, que é o mesmo peso com nome. */
const FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME =
    "my-2.5 -mx-4 max-w-none w-[calc(100%+2rem)] sm:-mx-5 sm:w-[calc(100%+2.5rem)]"

/** Full-width selects aligned with compact drawer inputs (border, radius, focus). */
const FILTERS_DRAWER_SELECT_TRIGGER_CLASSNAME =
    "w-full min-w-0 justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm font-normal tabular-nums text-foreground transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground dark:bg-input-fill/30 dark:hover:bg-input-fill/50 [&_svg]:size-4 [&_svg]:shrink-0"

function FilterSection({
    title,
    children,
    right,
    className,
}: {
    title: string
    children: React.ReactNode
    right?: React.ReactNode
    className?: string
}) {
    return (
        <section className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </p>
                {right ? (
                    <div className="shrink-0">{right}</div>
                ) : null}
            </div>
            {children}
        </section>
    )
}

export interface TransactionsFiltersPanelProps {
    includePeriod: boolean
    datePreset: TransactionsDatePresetKey | null
    periodDraftFrom: string
    periodDraftTo: string
    onPeriodDraftFromChange: (v: string) => void
    onPeriodDraftToChange: (v: string) => void
    onPresetChange: (next: {
        preset: TransactionsDatePresetKey
        from: string
        to: string
    }) => void
    onDateRangeApply: (next: { from: string; to: string }) => void
    onClearPeriodFilter: () => void
    periodIdPrefix: string

    paymentMethods: PaymentMethod[]
    onTogglePaymentMethod: (method: PaymentMethod) => void

    creditCardIds: string[]
    onToggleCreditCardId: (id: string) => void
    creditCards: CreditCard[]

    categoryIds: string[]
    onToggleCategory: (id: string) => void
    onClearAllCategories: () => void
    uncategorizedOnly: boolean
    onUncategorizedOnlyChange: (v: boolean) => void
    categories: Category[]

    amountMin: string
    amountMax: string
    onAmountMinChange: (v: string) => void
    onAmountMaxChange: (v: string) => void

    descriptionQuery: string
    onDescriptionQueryChange: (v: string) => void

    installmentPlanId: string | null
    onInstallmentPlanIdChange: (v: string | null) => void
    installmentPlans: { id: string; description: string | null }[]

    subscriptionId: string | null
    onSubscriptionIdChange: (v: string | null) => void
    subscriptions: { id: string; name: string }[]

    /**
     * When set, the category/uncategorized controls are hidden because the list is
     * constrained elsewhere (e.g. category detail screen).
     */
    lockedCategoryId?: string

    className?: string
}

export type TransactionsFiltersPanelBaseProps = Omit<
    TransactionsFiltersPanelProps,
    "includePeriod"
>

export function TransactionsFiltersPanel({
    includePeriod,
    datePreset,
    periodDraftFrom,
    periodDraftTo,
    onPeriodDraftFromChange,
    onPeriodDraftToChange,
    onPresetChange,
    onDateRangeApply,
    onClearPeriodFilter,
    periodIdPrefix,
    paymentMethods,
    onTogglePaymentMethod,
    creditCardIds,
    onToggleCreditCardId,
    creditCards,
    categoryIds,
    onToggleCategory,
    onClearAllCategories,
    uncategorizedOnly,
    onUncategorizedOnlyChange,
    categories,
    amountMin,
    amountMax,
    onAmountMinChange,
    onAmountMaxChange,
    descriptionQuery,
    onDescriptionQueryChange,
    installmentPlanId,
    onInstallmentPlanIdChange,
    installmentPlans,
    subscriptionId,
    onSubscriptionIdChange,
    subscriptions,
    lockedCategoryId,
    className,
}: TransactionsFiltersPanelProps) {
    const fieldUid = React.useId()
    const [categoryQuery, setCategoryQuery] = React.useState("")
    const [cardQuery, setCardQuery] = React.useState("")

    const creditCardSelected = paymentMethods.includes("credit_card")

    const sortedCards = React.useMemo(
        () =>
            [...creditCards].sort((a, b) =>
                (a.name ?? "").localeCompare(b.name ?? "", "pt-BR")
            ),
        [creditCards]
    )

    const filteredCards = React.useMemo(() => {
        const q = cardQuery.trim().toLowerCase()
        if (!q) return sortedCards
        return sortedCards.filter((c) =>
            (c.name ?? "").toLowerCase().includes(q)
        )
    }, [cardQuery, sortedCards])

    const sortedCategories = React.useMemo(
        () =>
            [...categories].sort((a, b) =>
                (a.name ?? "").localeCompare(b.name ?? "", "pt-BR")
            ),
        [categories]
    )

    const filteredCategories = React.useMemo(() => {
        const q = categoryQuery.trim().toLowerCase()
        if (!q) return sortedCategories
        return sortedCategories.filter((cat) =>
            (cat.name ?? "").toLowerCase().includes(q)
        )
    }, [categoryQuery, sortedCategories])

    const allCategoryIds = React.useMemo(
        () => sortedCategories.map((c) => c.id),
        [sortedCategories]
    )

    const orderedSelectedPaymentMethods = React.useMemo(
        () => PAYMENT_METHOD_VALUES.filter((pm) => paymentMethods.includes(pm)),
        [paymentMethods]
    )

    const orderedSelectedCategories = React.useMemo(
        () => sortedCategories.filter((c) => categoryIds.includes(c.id)),
        [sortedCategories, categoryIds]
    )

    const categoriesTriggerLabel = React.useMemo(() => {
        if (uncategorizedOnly) return "Sem categoria"
        if (categoryIds.length === 0) return "Todas as categorias"
        return "Adicionar ou remover categorias"
    }, [uncategorizedOnly, categoryIds.length])

    return (
        <div className={cn("space-y-6 pb-1", className)}>
            {includePeriod ? (
                <>
                    <FilterSection title="Período">
                        <div className="space-y-3">
                            <div>
                                <p className="mb-2 text-2xs font-medium text-muted-foreground">
                                    Rápido
                                </p>
                                <TransactionsDatePresets
                                    value={datePreset}
                                    onChange={(next) => {
                                        onPresetChange(next)
                                        onPeriodDraftFromChange(next.from)
                                        onPeriodDraftToChange(next.to)
                                    }}
                                    variant="comfortable"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <p className="mb-2 text-2xs font-medium text-muted-foreground">
                                    Personalizado
                                </p>
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
                                    <TransactionsDateRangeForm
                                        idPrefix={periodIdPrefix}
                                        draftFrom={periodDraftFrom}
                                        draftTo={periodDraftTo}
                                        onDraftFromChange={onPeriodDraftFromChange}
                                        onDraftToChange={onPeriodDraftToChange}
                                        onApply={() =>
                                            onDateRangeApply({
                                                from: periodDraftFrom,
                                                to: periodDraftTo,
                                            })
                                        }
                                        onClear={() => {
                                            onClearPeriodFilter()
                                            onPeriodDraftFromChange("")
                                            onPeriodDraftToChange("")
                                        }}
                                        onCancel={undefined}
                                        showCancel={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </FilterSection>

                    <Separator tone="soft" className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME} />
                </>
            ) : null}

            <FilterSection title="Formas de pagamento">
                <div className="space-y-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="xl"
                                className="w-full justify-between gap-2 px-3 font-normal"
                            >
                                <span className="truncate text-left">
                                    {paymentMethods.length === 0
                                        ? "Todas as formas"
                                        : "Adicionar ou remover formas"}
                                </span>
                                <ChevronDownIcon
                                    className="size-4 shrink-0 opacity-60"
                                    aria-hidden
                                />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-1.5rem,22rem)] flex flex-col gap-0 overflow-hidden p-0"
                        >
                            <div className="max-h-64 overflow-y-auto p-2">
                                <div className="space-y-0.5">
                                    {PAYMENT_METHOD_VALUES.map((pm) => {
                                        const checked =
                                            paymentMethods.includes(pm)
                                        const id = `${fieldUid}-pm-${pm}`
                                        return (
                                            <div
                                                key={pm}
                                                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                                            >
                                                <Checkbox
                                                    id={id}
                                                    checked={checked}
                                                    onCheckedChange={() =>
                                                        onTogglePaymentMethod(pm)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={id}
                                                    className="cursor-pointer text-sm font-normal"
                                                >
                                                    {paymentMethodLabel(pm)}
                                                </Label>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {orderedSelectedPaymentMethods.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {orderedSelectedPaymentMethods.map((pm) => {
                                const label = paymentMethodLabel(pm)
                                return (
                                    <Badge
                                        key={pm}
                                        tone="success"
                                        className="inline-flex items-center gap-1.5 pr-1.5"
                                        title={label}
                                    >
                                        <span className="min-w-0 max-w-[12rem] truncate">
                                            {label}
                                        </span>
                                        <button
                                            type="button"
                                            className={cn(
                                                "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                                                "opacity-70 hover:bg-success/20 hover:opacity-100 active:bg-success/25 active:opacity-100",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                                            )}
                                            aria-label={`Remover ${label}`}
                                            onClick={() =>
                                                onTogglePaymentMethod(pm)
                                            }
                                        >
                                            <XMarkIcon className="size-3.5" aria-hidden />
                                        </button>
                                    </Badge>
                                )
                            })}
                        </div>
                    ) : null}

                    {creditCardSelected ? (
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Cartões
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="sm"
                                        className="h-7 px-2 text-2xs text-muted-foreground hover:text-foreground"
                                        disabled={sortedCards.length === 0}
                                        onClick={() => {
                                            for (const c of sortedCards) {
                                                if (!creditCardIds.includes(c.id)) {
                                                    onToggleCreditCardId(c.id)
                                                }
                                            }
                                        }}
                                    >
                                        Selecionar tudo
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="sm"
                                        className="h-7 px-2 text-2xs text-muted-foreground hover:text-foreground"
                                        disabled={creditCardIds.length === 0}
                                        onClick={() => {
                                            for (const id of creditCardIds) {
                                                onToggleCreditCardId(id)
                                            }
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/60 bg-muted/10 p-3 dark:bg-muted/10">
                                <Input
                                    type="search"
                                    placeholder="Buscar cartão…"
                                    value={cardQuery}
                                    onChange={(e) => setCardQuery(e.target.value)}
                                    disabled={sortedCards.length === 0}
                                />
                                {creditCardIds.length === 0 ? (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Qualquer cartão
                                    </p>
                                ) : null}
                            </div>

                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-2 dark:bg-muted/10">
                                {sortedCards.length === 0 ? (
                                    <p className="px-2 py-2 text-xs text-muted-foreground">
                                        Nenhum cartão neste espaço.
                                    </p>
                                ) : filteredCards.length === 0 ? (
                                    <p className="px-2 py-2 text-xs text-muted-foreground">
                                        Nenhum cartão encontrado.
                                    </p>
                                ) : (
                                    filteredCards.map((c) => {
                                        const checked = creditCardIds.includes(c.id)
                                        const id = `${fieldUid}-card-${c.id}`
                                        return (
                                            <div
                                                key={c.id}
                                                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"
                                            >
                                                <Checkbox
                                                    id={id}
                                                    checked={checked}
                                                    onCheckedChange={() =>
                                                        onToggleCreditCardId(c.id)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={id}
                                                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-normal"
                                                >
                                                    <span className="truncate">
                                                        {c.name} · •••• {c.last_four}
                                                    </span>
                                                </Label>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </FilterSection>

            {!lockedCategoryId ? (
                <>
                    <Separator
                        className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME}
                    />

                    <FilterSection title="Categorias">
                        <div className="space-y-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="xl"
                                        className="w-full justify-between gap-2 px-3 font-normal"
                                    >
                                        <span className="truncate text-left">
                                            {categoriesTriggerLabel}
                                        </span>
                                        <ChevronDownIcon
                                            className="size-4 shrink-0 opacity-60"
                                            aria-hidden
                                        />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-1.5rem,22rem)] flex flex-col gap-0 overflow-hidden p-0"
                                >
                                    <PopoverHeader className="gap-2.5">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="tertiary"
                                                size="sm"
                                                className="h-7 px-2 text-2xs text-muted-foreground hover:text-foreground"
                                                disabled={
                                                    uncategorizedOnly ||
                                                    allCategoryIds.length === 0
                                                }
                                                onClick={() => {
                                                    for (const id of allCategoryIds) {
                                                        if (!categoryIds.includes(id))
                                                            onToggleCategory(id)
                                                    }
                                                }}
                                            >
                                                Selecionar tudo
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="tertiary"
                                                size="sm"
                                                className="h-7 px-2 text-2xs text-muted-foreground hover:text-foreground"
                                                disabled={categoryIds.length === 0}
                                                onClick={() => {
                                                    for (const id of categoryIds)
                                                        onToggleCategory(id)
                                                }}
                                            >
                                                Limpar
                                            </Button>
                                        </div>
                                        <Input
                                            type="search"
                                            placeholder="Buscar categoria…"
                                            value={categoryQuery}
                                            onChange={(e) =>
                                                setCategoryQuery(e.target.value)
                                            }
                                            disabled={sortedCategories.length === 0}
                                        />
                                    </PopoverHeader>
                                    <div className="max-h-56 overflow-y-auto p-2">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                                                <Checkbox
                                                    id={`${fieldUid}-uncat`}
                                                    checked={uncategorizedOnly}
                                                    onCheckedChange={(v) => {
                                                        const next = v === true
                                                        onUncategorizedOnlyChange(next)
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={`${fieldUid}-uncat`}
                                                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-normal"
                                                >
                                                    <span
                                                        className="size-2 shrink-0 rounded-full border border-dashed border-muted-foreground/60 bg-muted/30"
                                                        aria-hidden
                                                    />
                                                    <span className="truncate">
                                                        Sem categoria
                                                    </span>
                                                </Label>
                                            </div>
                                            {sortedCategories.length === 0 ? (
                                                <p className="px-2 py-2 text-xs text-muted-foreground">
                                                    Nenhuma categoria neste espaço.
                                                </p>
                                            ) : filteredCategories.length === 0 ? (
                                                <p className="px-2 py-2 text-xs text-muted-foreground">
                                                    Nenhuma categoria encontrada.
                                                </p>
                                            ) : (
                                                filteredCategories.map((cat) => {
                                                    const checked = categoryIds.includes(
                                                        cat.id
                                                    )
                                                    return (
                                                        <div
                                                            key={cat.id}
                                                            className={cn(
                                                                "flex items-center gap-2 rounded-md px-2 py-1.5",
                                                                uncategorizedOnly
                                                                    ? "opacity-60"
                                                                    : "hover:bg-muted/50"
                                                            )}
                                                        >
                                                            <Checkbox
                                                                id={`${fieldUid}-cat-${cat.id}`}
                                                                checked={checked}
                                                                disabled={
                                                                    uncategorizedOnly
                                                                }
                                                                onCheckedChange={() =>
                                                                    onToggleCategory(
                                                                        cat.id
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`${fieldUid}-cat-${cat.id}`}
                                                                className={cn(
                                                                    "flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-normal",
                                                                    uncategorizedOnly &&
                                                                        "cursor-not-allowed"
                                                                )}
                                                            >
                                                                <span
                                                                    className="size-2 shrink-0 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            cat.color ||
                                                                            "var(--muted-foreground)",
                                                                    }}
                                                                    aria-hidden
                                                                />
                                                                <span className="truncate">
                                                                    {cat.name}
                                                                </span>
                                                            </Label>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {orderedSelectedCategories.length >= 2 ? (
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="sm"
                                        className="h-8 px-2 text-2xs text-muted-foreground hover:text-foreground"
                                        disabled={uncategorizedOnly}
                                        onClick={onClearAllCategories}
                                        aria-label="Limpar todas as categorias selecionadas"
                                    >
                                        Limpar todas as categorias
                                    </Button>
                                </div>
                            ) : null}

                            {uncategorizedOnly ||
                            orderedSelectedCategories.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {uncategorizedOnly ? (
                                        <Badge
                                            tone="success"
                                            className="inline-flex items-center gap-1.5 pr-1.5"
                                            title="Sem categoria"
                                        >
                                            <span className="min-w-0 max-w-[12rem] truncate">
                                                Sem categoria
                                            </span>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                                                    "opacity-70 hover:bg-success/20 hover:opacity-100 active:bg-success/25 active:opacity-100",
                                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                                                )}
                                                aria-label="Remover filtro sem categoria"
                                                onClick={() =>
                                                    onUncategorizedOnlyChange(false)
                                                }
                                            >
                                                <XMarkIcon className="size-3.5" aria-hidden />
                                            </button>
                                        </Badge>
                                    ) : null}
                                    {orderedSelectedCategories.map((cat) => {
                                        const name =
                                            cat.name?.trim() || "Sem nome"
                                        return (
                                            <Badge
                                                key={cat.id}
                                                tone="success"
                                                className="inline-flex items-center gap-1.5 pr-1.5"
                                                title={name}
                                            >
                                                <span
                                                    className="size-2 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            cat.color ||
                                                            "var(--muted-foreground)",
                                                    }}
                                                    aria-hidden
                                                />
                                                <span className="min-w-0 max-w-[12rem] truncate">
                                                    {name}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                                                        "opacity-70 hover:bg-success/20 hover:opacity-100 active:bg-success/25 active:opacity-100",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                                                    )}
                                                    aria-label={`Remover ${name}`}
                                                    onClick={() =>
                                                        onToggleCategory(cat.id)
                                                    }
                                                >
                                                    <XMarkIcon
                                                        className="size-3.5"
                                                        aria-hidden
                                                    />
                                                </button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </FilterSection>

                    <Separator
                        className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME}
                    />
                </>
            ) : null}

            <FilterSection title="Valor (R$)">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label
                            htmlFor={`${fieldUid}-amt-min`}
                            className="text-2xs text-muted-foreground"
                        >
                            Mínimo
                        </Label>
                        <MoneyInput
                            id={`${fieldUid}-amt-min`}
                            placeholder="0,00"
                            value={amountMin}
                            
                        onValueChange={onAmountMinChange}
                            />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor={`${fieldUid}-amt-max`}
                            className="text-2xs text-muted-foreground"
                        >
                            Máximo
                        </Label>
                        <MoneyInput
                            id={`${fieldUid}-amt-max`}
                            placeholder="0,00"
                            value={amountMax}
                            
                        onValueChange={onAmountMaxChange}
                            />
                    </div>
                </div>
            </FilterSection>

            <Separator tone="soft" className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME} />

            <FilterSection title="Descrição">
                <Input
                    type="search"
                    placeholder="Buscar na descrição…"
                    value={descriptionQuery}
                    onChange={(e) =>
                        onDescriptionQueryChange(e.target.value)
                    }
                />
            </FilterSection>

            <Separator tone="soft" className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME} />

            <FilterSection title="Origem">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label
                            htmlFor={`${fieldUid}-origem-plan`}
                            className="text-2xs text-muted-foreground"
                        >
                            Plano parcelado
                        </Label>
                        <Select
                            value={installmentPlanId ?? "__any__"}
                            onValueChange={(v) =>
                                onInstallmentPlanIdChange(
                                    v === "__any__" ? null : v
                                )
                            }
                        >
                            <SelectTrigger
                                id={`${fieldUid}-origem-plan`}
                                className={FILTERS_DRAWER_SELECT_TRIGGER_CLASSNAME}
                            >
                                <SelectValue placeholder="Qualquer" />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                sideOffset={8}
                                collisionPadding={16}
                                className="max-h-72 z-(--z-sheet) p-1"
                            >
                                <SelectItem value="__any__">Qualquer plano</SelectItem>
                                {installmentPlans.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.description?.trim() ||
                                            `Plano ${p.id.slice(0, 8)}…`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor={`${fieldUid}-origem-sub`}
                            className="text-2xs text-muted-foreground"
                        >
                            Assinatura
                        </Label>
                        <Select
                            value={subscriptionId ?? "__any__"}
                            onValueChange={(v) =>
                                onSubscriptionIdChange(
                                    v === "__any__" ? null : v
                                )
                            }
                        >
                            <SelectTrigger
                                id={`${fieldUid}-origem-sub`}
                                className={FILTERS_DRAWER_SELECT_TRIGGER_CLASSNAME}
                            >
                                <SelectValue placeholder="Qualquer" />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                sideOffset={8}
                                collisionPadding={16}
                                className="max-h-72 z-(--z-sheet) p-1"
                            >
                                <SelectItem value="__any__">
                                    Qualquer assinatura
                                </SelectItem>
                                {subscriptions.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FilterSection>
        </div>
    )
}
