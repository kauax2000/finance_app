"use client"

import * as React from "react"
import {
    FilterChipRemoveButton,
} from "@/components/transactions/transactions-active-filters-chips"
import {
    Field,
    FieldControl,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"
import type { Category, CreditCard } from "@/lib/supabase"
import {
    PAYMENT_METHOD_VALUES,
    paymentMethodLabel,
    type PaymentMethod,
} from "@/lib/payment-methods"
import { TransactionsDatePresets } from "@/components/transactions/transactions-date-presets"
import type { TransactionsDatePresetKey } from "@/components/transactions/transactions-date-presets"
import { DatePicker } from "@/components/ui/date-picker"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ColorTile } from "@/components/ui/color-tile"
import {
    Combobox,
    ComboboxActions,
    ComboboxChips,
    ComboboxClear,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxField,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxSeparator,
    ComboboxTrigger,
    ComboboxValue,
} from "@/components/ui/combobox"
import { SearchInput } from "@/components/ui/search-input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDownIcon } from "@heroicons/react/16/solid"
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
// A régua atravessa o recuo da folha pelo `bleed` do `Separator`, que lê
// `--dialog-px`; aqui fica só o respiro.
const FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME = "my-2.5"

/** O valor da linha "Sem categoria" no combobox — nenhum id de categoria o usa. */
const SEM_CATEGORIA = "__sem_categoria__"

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

    const creditCardSelected = paymentMethods.includes("credit_card")

    const sortedCards = React.useMemo(
        () =>
            [...creditCards].sort((a, b) =>
                (a.name ?? "").localeCompare(b.name ?? "", "pt-BR")
            ),
        [creditCards]
    )

    const sortedCategories = React.useMemo(
        () =>
            [...categories].sort((a, b) =>
                (a.name ?? "").localeCompare(b.name ?? "", "pt-BR")
            ),
        [categories]
    )

    const orderedSelectedPaymentMethods = React.useMemo(
        () => PAYMENT_METHOD_VALUES.filter((pm) => paymentMethods.includes(pm)),
        [paymentMethods]
    )

    /* Os rótulos vêm daqui, e não dos itens: o `Combobox` só monta a lista com
       o painel aberto, e o campo e as fichas precisam do nome antes disso. */
    const cardLabel = (id: string) => {
        const c = creditCards.find((card) => card.id === id)
        return c ? `${c.name} · •••• ${c.last_four}` : "Cartão"
    }

    const categoryLabel = (id: string) =>
        id === SEM_CATEGORIA
            ? "Sem categoria"
            : categories.find((c) => c.id === id)?.name?.trim() || "Sem nome"

    // Os callbacks são de alternar um id; o combobox entrega o valor inteiro.
    const handleCardsChange = (next: string[]) => {
        for (const id of creditCardIds) if (!next.includes(id)) onToggleCreditCardId(id)
        for (const id of next) if (!creditCardIds.includes(id)) onToggleCreditCardId(id)
    }

    const categoriesValue = uncategorizedOnly ? [SEM_CATEGORIA] : categoryIds

    const handleCategoriesChange = (next: string[]) => {
        // A ausência é exclusiva no combobox: se está no valor, está sozinha.
        // Ligá-la já zera `categoryIds` em quem guarda o estado.
        if (next.includes(SEM_CATEGORIA)) {
            if (!uncategorizedOnly) onUncategorizedOnlyChange(true)
            return
        }
        if (uncategorizedOnly) onUncategorizedOnlyChange(false)
        if (next.length === 0) {
            if (categoryIds.length > 0) onClearAllCategories()
            return
        }
        for (const id of categoryIds) if (!next.includes(id)) onToggleCategory(id)
        for (const id of next) if (!categoryIds.includes(id)) onToggleCategory(id)
    }

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

                            {/* O período personalizado é um grupo com título: `fieldset` +
                                `legend`, e não uma caixa pintada sob um `<p>`. */}
                            <FieldSet className="gap-2">
                                <FieldLegend variant="label" className="text-2xs font-medium text-muted-foreground">
                                    Personalizado
                                </FieldLegend>
                                {/* O rascunho e o rodapé Limpar/Aplicar são do próprio
                                    `DatePicker` (`confirm`, rodada 210): eram um
                                    formulário à parte, com os botões escritos à mão. */}
                                <DatePicker
                                    id={`${periodIdPrefix}-from`}
                                    mode="range"
                                    confirm
                                    displayStyle="numeric"
                                    placeholder="Escolher período"
                                    value={
                                        periodDraftFrom
                                            ? {
                                                  from: parseYmdLocal(periodDraftFrom),
                                                  to: periodDraftTo
                                                      ? parseYmdLocal(periodDraftTo)
                                                      : undefined,
                                              }
                                            : undefined
                                    }
                                    onChange={(range) => {
                                        if (!range?.from) {
                                            onClearPeriodFilter()
                                            onPeriodDraftFromChange("")
                                            onPeriodDraftToChange("")
                                            return
                                        }
                                        const from = localYmdFromDate(range.from)
                                        const to = range.to ? localYmdFromDate(range.to) : ""
                                        onPeriodDraftFromChange(from)
                                        onPeriodDraftToChange(to)
                                        onDateRangeApply({ from, to })
                                    }}
                                />
                            </FieldSet>
                        </div>
                    </FilterSection>

                    <Separator tone="soft" bleed className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME} />
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
                                            <Field
                                                orientation="horizontal"
                                                key={pm}
                                                className="flex items-center gap-2 rounded-md px-2 py-1.5"
                                            >
                                                <FieldControl>
                                                <Checkbox
                                                    id={id}
                                                    checked={checked}
                                                    onCheckedChange={() =>
                                                        onTogglePaymentMethod(pm)
                                                    }
                                                />
                                                </FieldControl>
                                                <FieldLabel
                                                    className="cursor-pointer text-sm font-normal"
                                                >
                                                    {paymentMethodLabel(pm)}
                                                </FieldLabel>
                                            </Field>
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
                                        <FilterChipRemoveButton
                                            aria-label={`Remover ${label}`}
                                            onClick={() =>
                                                onTogglePaymentMethod(pm)
                                            }
                                        />
                                    </Badge>
                                )
                            })}
                        </div>
                    ) : null}

                    {creditCardSelected ? (
                        <div className="space-y-2.5">
                            <p
                                id={`${fieldUid}-cards-label`}
                                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                                Cartões
                            </p>

                            {/* O seletor de cartões é o `Combobox multiple`: a busca, o
                                "selecionar tudo / limpar" e as fichas são dele. Sem
                                cartão no espaço, o campo fica desligado e diz isso. */}
                            <Combobox
                                multiple
                                value={creditCardIds}
                                onValueChange={handleCardsChange}
                            >
                                <ComboboxField>
                                    <ComboboxTrigger
                                        size="xl"
                                        aria-labelledby={`${fieldUid}-cards-label`}
                                        disabled={sortedCards.length === 0}
                                    >
                                        <ComboboxValue
                                            placeholder={
                                                sortedCards.length === 0
                                                    ? "Nenhum cartão neste espaço"
                                                    : "Qualquer cartão"
                                            }
                                            overflowCount={Math.max(
                                                creditCardIds.length - 1,
                                                0
                                            )}
                                        >
                                            {creditCardIds[0]
                                                ? cardLabel(creditCardIds[0])
                                                : null}
                                        </ComboboxValue>
                                    </ComboboxTrigger>
                                    <ComboboxClear />
                                </ComboboxField>
                                <ComboboxContent>
                                    <ComboboxInput placeholder="Buscar cartão…" />
                                    <ComboboxActions />
                                    <ComboboxList>
                                        <ComboboxEmpty>
                                            Nenhum cartão encontrado.
                                        </ComboboxEmpty>
                                        <ComboboxGroup>
                                            {sortedCards.map((c) => (
                                                <ComboboxItem key={c.id} value={c.id}>
                                                    {cardLabel(c.id)}
                                                </ComboboxItem>
                                            ))}
                                        </ComboboxGroup>
                                    </ComboboxList>
                                </ComboboxContent>
                                {/* Verdes como as fichas de forma de pagamento do
                                    mesmo painel. */}
                                <ComboboxChips labelFor={cardLabel} tone="success" />
                            </Combobox>
                        </div>
                    ) : null}
                </div>
            </FilterSection>

            {!lockedCategoryId ? (
                <>
                    <Separator
                        bleed
                        className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME}
                    />

                    <FilterSection title="Categorias">
                        <div className="space-y-3">
                            {/* A categoria é o `Combobox multiple`. "Sem categoria" é a
                                linha de ausência — exclusiva: escolhê-la solta as
                                outras, e o contrário —, que é o que a caixa
                                desligada fazia antes. A tela guarda duas coisas
                                (`categoryIds` e `uncategorizedOnly`), e o
                                `handleCategoriesChange` traduz o valor único. */}
                            <Combobox
                                multiple
                                value={categoriesValue}
                                onValueChange={handleCategoriesChange}
                            >
                                <ComboboxField>
                                    <ComboboxTrigger size="xl" aria-label="Categorias">
                                        <ComboboxValue
                                            placeholder="Todas as categorias"
                                            none={uncategorizedOnly}
                                            overflowCount={Math.max(
                                                categoriesValue.length - 1,
                                                0
                                            )}
                                        >
                                            {categoriesValue[0]
                                                ? categoryLabel(categoriesValue[0])
                                                : null}
                                        </ComboboxValue>
                                    </ComboboxTrigger>
                                    <ComboboxClear />
                                </ComboboxField>
                                <ComboboxContent>
                                    <ComboboxInput placeholder="Buscar categoria…" />
                                    <ComboboxActions />
                                    <ComboboxList>
                                        <ComboboxEmpty>
                                            Nenhuma categoria encontrada.
                                        </ComboboxEmpty>
                                        <ComboboxGroup>
                                            <ComboboxItem
                                                value={SEM_CATEGORIA}
                                                variant="none"
                                            >
                                                Sem categoria
                                            </ComboboxItem>
                                        </ComboboxGroup>
                                        {sortedCategories.length > 0 ? (
                                            <>
                                                <ComboboxSeparator />
                                                <ComboboxGroup>
                                                    {sortedCategories.map((cat) => (
                                                        <ComboboxItem
                                                            key={cat.id}
                                                            value={cat.id}
                                                            media={
                                                                <ColorTile
                                                                    size="xs"
                                                                    color={cat.color}
                                                                />
                                                            }
                                                        >
                                                            {categoryLabel(cat.id)}
                                                        </ComboboxItem>
                                                    ))}
                                                </ComboboxGroup>
                                            </>
                                        ) : null}
                                    </ComboboxList>
                                </ComboboxContent>
                                <ComboboxChips
                                    labelFor={categoryLabel}
                                    tone="success"
                                    mediaFor={(id) =>
                                        id === SEM_CATEGORIA ? null : (
                                            <ColorTile
                                                size="xs"
                                                color={categories.find((c) => c.id === id)?.color}
                                                className="size-3.5"
                                            />
                                        )
                                    }
                                />
                            </Combobox>
                        </div>
                    </FilterSection>

                    <Separator
                        bleed
                        className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME}
                    />
                </>
            ) : null}

            <FilterSection title="Valor (R$)">
                <div className="grid grid-cols-2 gap-3">
                    <Field>
                        <FieldLabel
                            className="text-2xs text-muted-foreground"
                        >
                            Mínimo
                        </FieldLabel>
                        <FieldControl>
                        <Input
                            money
                            id={`${fieldUid}-amt-min`}
                            placeholder="0,00"
                            value={amountMin}
                            onValueChange={onAmountMinChange}
                        />
                        </FieldControl>
                    </Field>
                    <Field>
                        <FieldLabel
                            className="text-2xs text-muted-foreground"
                        >
                            Máximo
                        </FieldLabel>
                        <FieldControl>
                        <Input
                            money
                            id={`${fieldUid}-amt-max`}
                            placeholder="0,00"
                            value={amountMax}
                            onValueChange={onAmountMaxChange}
                        />
                        </FieldControl>
                    </Field>
                </div>
            </FilterSection>

            <Separator tone="soft" bleed className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME} />

            <FilterSection title="Descrição">
                <SearchInput
                    placeholder="Buscar na descrição…"
                    value={descriptionQuery}
                    onChange={(e) =>
                        onDescriptionQueryChange(e.target.value)
                    }
                    onClear={() => onDescriptionQueryChange("")}
                />
            </FilterSection>

            <Separator tone="soft" bleed className={FILTERS_DRAWER_SECTION_DIVIDER_CLASSNAME} />

            <FilterSection title="Origem">
                <div className="space-y-6">
                    <Field>
                        <FieldLabel
                            className="text-2xs text-muted-foreground"
                        >
                            Plano parcelado
                        </FieldLabel>
                        <Select
                            value={installmentPlanId ?? "__any__"}
                            onValueChange={(v) =>
                                onInstallmentPlanIdChange(
                                    v === "__any__" ? null : v
                                )
                            }
                        >
                            <FieldControl>
                            <SelectTrigger
                                id={`${fieldUid}-origem-plan`}
                                className="w-full min-w-0 tabular-nums"
                            >
                                <SelectValue placeholder="Qualquer" />
                            </SelectTrigger>
                            </FieldControl>
                            <SelectContent
                                sideOffset={8}
                                className="max-h-72"
                            >
                                <SelectItem value="__any__" variant="none">Qualquer plano</SelectItem>
                                {installmentPlans.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.description?.trim() ||
                                            `Plano ${p.id.slice(0, 8)}…`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field>
                        <FieldLabel
                            className="text-2xs text-muted-foreground"
                        >
                            Assinatura
                        </FieldLabel>
                        <Select
                            value={subscriptionId ?? "__any__"}
                            onValueChange={(v) =>
                                onSubscriptionIdChange(
                                    v === "__any__" ? null : v
                                )
                            }
                        >
                            <FieldControl>
                            <SelectTrigger
                                id={`${fieldUid}-origem-sub`}
                                className="w-full min-w-0 tabular-nums"
                            >
                                <SelectValue placeholder="Qualquer" />
                            </SelectTrigger>
                            </FieldControl>
                            <SelectContent
                                sideOffset={8}
                                className="max-h-72"
                            >
                                <SelectItem value="__any__" variant="none">
                                    Qualquer assinatura
                                </SelectItem>
                                {subscriptions.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </FilterSection>
        </div>
    )
}
