"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CreditCardIcon } from "@heroicons/react/16/solid"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
} from "@/components/ui/empty-state"
import {
    Field,
    FieldControl,
    FieldLabel,
    FieldRow,
    FieldTitle,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ColorTile } from "@/components/ui/color-tile"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import Link from "next/link"
import type { Category, CreditCard } from "@/lib/supabase"
import { paymentMethodOptions, type PaymentMethod } from "@/lib/payment-methods"
import {
    calendarYmdToStorageIso,
    localYmdFromDate,
    parseYmdLocal,
} from "@/lib/transaction-date"
import {
    creditCardInvoiceHintForPurchase,
    creditCardInvoiceSlotLabelPt,
    formatDatePtBr,
} from "@/lib/credit-card-billing"
import {
    creditInvoiceSlotCompactLabel,
    creditInvoiceSlotStatusChipClass,
} from "@/lib/credit-card-display"
import {
    TransactionFormKindSegment,
    TransactionFormScopeSegment,
    TransactionFormTypeSegment,
    type TransactionFormKind,
} from "@/components/transactions/transaction-type-segment"
import { splitTotalAcrossInstallments } from "@/lib/installment-amounts"
import { parseMoneyBrl } from "@/lib/money-brl"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import {
    FormPickerPopoverContent,
    FormPickerPopoverFooter,
    FormPickerPopoverFooterAction,
    FormPickerPopoverItem,
    FormPickerPopoverList,
    FormPickerPopoverSearch,
    FormPickerPopoverTrigger,
} from "@/components/ui/form"
import { Popover } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { currencyBRL } from "@/lib/formatters"

// O Radix não aceita valor vazio: o "nenhuma" do Select é um sentinela.
const PAYMENT_NONE = "__none__"

function CategoryRows({
    categories,
    search,
    value,
    onPick,
    embedInScrollContainer = false,
}: {
    categories: Category[]
    search: string
    value: string
    onPick: (id: string) => void
    embedInScrollContainer?: boolean
}) {
    const q = search.trim().toLowerCase()
    const filtered = useMemo(
        () =>
            q
                ? categories.filter((c) => c.name.toLowerCase().includes(q))
                : categories,
        [categories, q]
    )

    if (filtered.length === 0) {
        return (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Nenhuma categoria encontrada.
            </p>
        )
    }

    return (
        <ul
            className={cn(
                "flex flex-col gap-0.5 pr-1",
                !embedInScrollContainer &&
                    "max-h-[min(50dvh,320px)] overflow-y-auto",
            )}
        >
            {filtered.map((c) => {
                const selected = c.id === value
                return (
                    <li key={c.id}>
                        <FormPickerPopoverItem
                            selected={selected}
                            onClick={() => onPick(c.id)}
                        >
                            <ColorTile size="xs" color={c.color} className="shrink-0">
                                <CategoryIconPreview name={normalizeCategoryIcon(c.icon)} />
                            </ColorTile>
                            <span className="min-w-0 truncate">{c.name}</span>
                        </FormPickerPopoverItem>
                    </li>
                )
            })}
        </ul>
    )
}

function CreditCardRows({
    cards,
    value,
    onPick,
    embedInScrollContainer = false,
}: {
    cards: CreditCard[]
    value: string
    onPick: (id: string) => void
    embedInScrollContainer?: boolean
}) {
    const active = cards.filter((c) => c.is_active)
    if (active.length === 0) {
        return (
            <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum cartão cadastrado nesta carteira.
            </p>
        )
    }
    return (
        <ul
            className={cn(
                "flex flex-col gap-0.5 pr-1",
                !embedInScrollContainer &&
                    "max-h-[min(44dvh,280px)] overflow-y-auto",
            )}
        >
            {active.map((c) => {
                const selected = c.id === value
                return (
                    <li key={c.id}>
                        <FormPickerPopoverItem
                            selected={selected}
                            onClick={() => onPick(c.id)}
                        >
                            <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="truncate">{c.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    •••• {c.last_four}
                                    {c.brand ? ` · ${c.brand}` : ""}
                                </span>
                            </span>
                        </FormPickerPopoverItem>
                    </li>
                )
            })}
        </ul>
    )
}

export type InstallmentValueMode = "total" | "per_installment"

export type TransactionFormFieldsProps = {
    segmentMode: "create" | "edit"
    formKind: TransactionFormKind
    setFormKind: (k: TransactionFormKind) => void
    type: "income" | "expense"
    setType: (t: "income" | "expense") => void
    amount: string
    setAmount: (v: string) => void
    description: string
    setDescription: (v: string) => void
    categoryId: string
    setCategoryId: (id: string) => void
    dateYmd: string
    setDateYmd: (ymd: string) => void
    paymentMethod: PaymentMethod | null
    setPaymentMethod: (m: PaymentMethod | null) => void
    paymentCreditCardId: string
    setPaymentCreditCardId: (id: string) => void
    categories: Category[]
    creditCards: CreditCard[]
    categoriesHref: string
    creditCardsHref: string
    categoryPopoverOpen: boolean
    setCategoryPopoverOpen: (o: boolean) => void
    creditCardPopoverOpen: boolean
    setCreditCardPopoverOpen: (o: boolean) => void
    installmentValueMode: InstallmentValueMode
    setInstallmentValueMode: (m: InstallmentValueMode) => void
    installmentTotal: string
    setInstallmentTotal: (s: string) => void
    installmentPerAmount: string
    setInstallmentPerAmount: (s: string) => void
    installmentCount: string
    setInstallmentCount: (s: string) => void
    /** Edit flow: transaction belongs to a compra parcelada */
    hasInstallmentPlan?: boolean
    installmentEditScope?: "slice" | "plan"
    setInstallmentEditScope?: (s: "slice" | "plan") => void
    planIsActive?: boolean
}

export function TransactionFormFields(props: TransactionFormFieldsProps) {
    const {
        segmentMode,
        formKind,
        setFormKind,
        type,
        setType,
        amount,
        setAmount,
        description,
        setDescription,
        categoryId,
        setCategoryId,
        dateYmd,
        setDateYmd,
        paymentMethod,
        setPaymentMethod,
        paymentCreditCardId,
        setPaymentCreditCardId,
        categories,
        creditCards,
        categoriesHref,
        creditCardsHref,
        categoryPopoverOpen,
        setCategoryPopoverOpen,
        creditCardPopoverOpen,
        setCreditCardPopoverOpen,
        installmentValueMode,
        setInstallmentValueMode,
        installmentTotal,
        setInstallmentTotal,
        installmentPerAmount,
        setInstallmentPerAmount,
        installmentCount,
        setInstallmentCount,
        hasInstallmentPlan = false,
        installmentEditScope = "slice",
        setInstallmentEditScope,
        planIsActive = false,
    } = props

    const isMobile = useIsMobile()
    const [categorySearch, setCategorySearch] = useState("")

    // O foco no valor vale uma vez por montagem do formulário: trocar Despesa e
    // Parcelada remonta o campo, e o foco não volta do trilho do tipo.
    const focoInicial = useRef(segmentMode === "create" && !isMobile)
    useEffect(() => {
        focoInicial.current = false
    }, [])

    const filteredCategories = useMemo(
        () => categories.filter((c) => c.type === type),
        [categories, type]
    )

    const showInstallmentFields =
        (segmentMode === "create" && formKind === "installment") ||
        (segmentMode === "edit" &&
            hasInstallmentPlan &&
            installmentEditScope === "plan")

    const installmentPreview = useMemo(() => {
        if (!showInstallmentFields) return null
        const n = Math.floor(Number.parseInt(installmentCount, 10))
        if (!Number.isFinite(n) || n < 2) return null
        if (installmentValueMode === "total") {
            const total = parseMoneyBrl(installmentTotal)
            if (total === null || total <= 0) return null
            const { installmentAmount, finalInstallmentAmount } =
                splitTotalAcrossInstallments(total, n)
            if (installmentAmount <= 0) return null
            const same = installmentAmount === finalInstallmentAmount
            return same
                ? `${n} parcelas de ${currencyBRL(installmentAmount)}`
                : `${n - 1} × ${currencyBRL(installmentAmount)} + última ${currencyBRL(finalInstallmentAmount)}`
        }
        const per = parseMoneyBrl(installmentPerAmount)
        if (per === null || per <= 0) return null
        return `${n} parcelas de ${currencyBRL(per)}`
    }, [
        showInstallmentFields,
        installmentValueMode,
        installmentTotal,
        installmentPerAmount,
        installmentCount,
    ])

    const selectedCategory = useMemo(
        () => filteredCategories.find((c) => c.id === categoryId),
        [filteredCategories, categoryId]
    )

    const selectedCard = useMemo(
        () => creditCards.find((c) => c.id === paymentCreditCardId),
        [creditCards, paymentCreditCardId]
    )

    const creditInvoiceFormHint = useMemo(() => {
        if (
            type !== "expense" ||
            paymentMethod !== "credit_card" ||
            !selectedCard ||
            !dateYmd.trim()
        ) {
            return null
        }
        const iso = calendarYmdToStorageIso(dateYmd)
        return creditCardInvoiceHintForPurchase(iso, selectedCard)
    }, [type, paymentMethod, selectedCard, dateYmd])

    const activeCards = useMemo(
        () => creditCards.filter((c) => c.is_active),
        [creditCards]
    )

    const handleCategoryPopoverOpenChange = (open: boolean) => {
        setCategoryPopoverOpen(open)
        if (open) {
            setCategorySearch("")
            requestAnimationFrame(() => {
                document
                    .getElementById("tx-category")
                    ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            })
        }
    }

    const handleCreditCardPopoverOpenChange = (open: boolean) => {
        setCreditCardPopoverOpen(open)
        if (open) {
            requestAnimationFrame(() => {
                document
                    .getElementById("tx-credit-card")
                    ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            })
        }
    }

    const pickCategory = (id: string) => {
        setCategoryId(id)
        setCategoryPopoverOpen(false)
    }

    const pickCard = (id: string) => {
        setPaymentCreditCardId(id)
        setCreditCardPopoverOpen(false)
    }

    const showInstallmentEditScopePicker =
        segmentMode === "edit" &&
        hasInstallmentPlan &&
        typeof setInstallmentEditScope === "function"

    const mostraForma = type === "expense" || showInstallmentFields

    const dataField = (
        <Field size="sm">
            {/* Com o plano concluído não há controle, só um aviso: o `for` apontava
                para um `<p>`, que não é rotulável. Ali o rótulo vira título. */}
            {showInstallmentFields && segmentMode === "edit" && !planIsActive ? (
                <FieldTitle>Data de cobrança</FieldTitle>
            ) : (
                <FieldLabel>
                    {showInstallmentFields
                        ? segmentMode === "edit"
                            ? planIsActive
                                ? "Próxima cobrança"
                                : "Data de cobrança"
                            : "Primeira cobrança"
                        : "Data"}
                </FieldLabel>
            )}
            {showInstallmentFields &&
            segmentMode === "edit" &&
            !planIsActive ? (
                // À mão de propósito: ocupa o lugar do seletor de data e imita a
                // superfície dele, sem ser controle.
                <p
                    id="tx-date"
                    className="rounded-row border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
                >
                    Plano concluído — não há próxima cobrança agendada.
                </p>
            ) : (
                <FieldControl>
                    <DatePicker
                        id="tx-date"
                        value={parseYmdLocal(dateYmd)}
                        onChange={(d) =>
                            setDateYmd(
                                d
                                    ? localYmdFromDate(d)
                                    : localYmdFromDate(new Date())
                            )
                        }
                        placeholder="Selecione a data"
                        // "numeric" é o estilo da linha apertada: a Data divide a fileira com a forma
                        // (3fr/2fr) e "Hoje · …" não cabe ali. Receita (largura toda) e telefone ficam no relativo.
                        displayStyle={mostraForma && !isMobile ? "numeric" : "relative"}
                        presets
                    />
                </FieldControl>
            )}
        </Field>
    )

    return (
        <div className="space-y-4 py-1 pb-2">
            {showInstallmentEditScopePicker ? (
                <TransactionFormScopeSegment
                    value={installmentEditScope}
                    onChange={(next) => setInstallmentEditScope?.(next)}
                />
            ) : null}

            {segmentMode === "edit" && hasInstallmentPlan ? null : segmentMode === "edit" ? (
                <TransactionFormTypeSegment value={type} onChange={setType} />
            ) : (
                <TransactionFormKindSegment value={formKind} onChange={setFormKind} />
            )}

            {showInstallmentFields && segmentMode === "edit" ? (
                <Alert tone="warning" size="sm">
                    <AlertDescription>
                        Parcelas já lançadas no extrato não mudam automaticamente;
                        só as próximas cobranças usam os novos valores do plano.
                    </AlertDescription>
                </Alert>
            ) : null}

            {showInstallmentFields ? (
                <div className="space-y-2">
                    <ToggleGroup
                        type="single"
                        variant="segmented"
                        size="sm"
                        aria-label="Como informar o valor"
                        value={installmentValueMode}
                        onValueChange={(next) => setInstallmentValueMode(next as InstallmentValueMode)}
                    >
                        <ToggleGroupItem value="total">Total</ToggleGroupItem>
                        <ToggleGroupItem value="per_installment">Por parcela</ToggleGroupItem>
                    </ToggleGroup>
                    <FieldRow stack={false} className="grid-cols-[minmax(0,1fr)_6rem]">
                        <FormInput
                            money
                            fieldSize="sm"
                            label={installmentValueMode === "total" ? "Valor total" : "Valor da parcela"}
                            size="xl"
                            value={installmentValueMode === "total" ? installmentTotal : installmentPerAmount}
                            onValueChange={
                                installmentValueMode === "total"
                                    ? setInstallmentTotal
                                    : setInstallmentPerAmount
                            }
                            placeholder={installmentValueMode === "total" ? "1.200,00" : "100,00"}
                            className="text-base"
                            autoFocus={focoInicial.current}
                            aria-describedby="tx-inst-preview"
                        />
                        <FormInput
                            id="tx-inst-n"
                            fieldSize="sm"
                            label="Parcelas"
                            size="xl"
                            type="number"
                            min={2}
                            step={1}
                            value={installmentCount}
                            onChange={(e) => setInstallmentCount(e.target.value)}
                            placeholder="12"
                            className="text-base tabular-nums"
                            aria-describedby="tx-inst-preview"
                        />
                    </FieldRow>
                    <p id="tx-inst-preview" className="text-sm text-muted-foreground tabular-nums">
                        {installmentPreview}
                    </p>
                </div>
            ) : (
                <FormInput
                    money
                    fieldSize="sm"
                    label="Valor"
                    size="xl"
                    value={amount}
                    onValueChange={setAmount}
                    placeholder="0,00"
                    className="text-base"
                    autoFocus={focoInicial.current}
                    required={segmentMode === "edit" || formKind !== "installment"}
                />
            )}

            <Field size="sm">
                <FieldLabel htmlFor="tx-category">Categoria</FieldLabel>
                <Popover
                    modal={isMobile}
                    open={categoryPopoverOpen}
                    onOpenChange={handleCategoryPopoverOpenChange}
                >
                    <FormPickerPopoverTrigger id="tx-category">
                        {selectedCategory ? (
                            <>
                                <ColorTile size="xs" color={selectedCategory.color} className="shrink-0">
                                    <CategoryIconPreview
                                        name={normalizeCategoryIcon(selectedCategory.icon)}
                                    />
                                </ColorTile>
                                <span className="truncate">
                                    {selectedCategory.name}
                                </span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">
                                Selecione uma categoria
                            </span>
                        )}
                    </FormPickerPopoverTrigger>
                    <FormPickerPopoverContent>
                        <FormPickerPopoverSearch
                            value={categorySearch}
                            onChange={(e) =>
                                setCategorySearch(e.target.value)
                            }
                            onClear={() => setCategorySearch("")}
                            placeholder="Buscar categoria..."
                        />
                        <FormPickerPopoverList>
                            <CategoryRows
                                categories={filteredCategories}
                                search={categorySearch}
                                value={categoryId}
                                onPick={pickCategory}
                                embedInScrollContainer
                            />
                        </FormPickerPopoverList>
                        <FormPickerPopoverFooter>
                            <FormPickerPopoverFooterAction className="text-xs">
                                <Link href={categoriesHref}>
                                    Gerenciar categorias
                                </Link>
                            </FormPickerPopoverFooterAction>
                        </FormPickerPopoverFooter>
                    </FormPickerPopoverContent>
                </Popover>
            </Field>

            <FormInput
                id="tx-description"
                fieldSize="sm"
                label="Descrição"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDescription(e.target.value)
                }
                className="text-sm"
                placeholder="Ex: Supermercado"
            />

            <Separator>Detalhes</Separator>

            {mostraForma ? (
                <FieldRow>
                    {dataField}
                    <Field size="sm">
                        <FieldLabel optional>Forma de pagamento</FieldLabel>
                        <Select
                            value={paymentMethod ?? PAYMENT_NONE}
                            onValueChange={(v) => {
                                const next = v === PAYMENT_NONE ? null : (v as PaymentMethod)
                                setPaymentMethod(next)
                                if (next !== "credit_card") setPaymentCreditCardId("")
                            }}
                        >
                            <FieldControl>
                                <SelectTrigger id="tx-payment-method" className="w-full min-w-0">
                                    <SelectValue placeholder="Sem forma" />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent align="start" sideOffset={6}>
                                <SelectItem value={PAYMENT_NONE} variant="none">
                                    Sem forma
                                </SelectItem>
                                {paymentMethodOptions().map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldRow>
            ) : (
                dataField
            )}

            {mostraForma && paymentMethod === "credit_card" ? (
                <Field size="sm">
                    {activeCards.length === 0 ? (
                        <FieldTitle>Cartão</FieldTitle>
                    ) : (
                        <FieldLabel htmlFor="tx-credit-card">Cartão</FieldLabel>
                    )}
                    {activeCards.length === 0 ? (
                        <EmptyState size="sm" layout="inline">
                            <EmptyStateIcon>
                                <CreditCardIcon aria-hidden />
                            </EmptyStateIcon>
                            <EmptyStateDescription>
                                Nenhum cartão cadastrado para vincular esta despesa.
                            </EmptyStateDescription>
                            <EmptyStateActions>
                                <Button variant="link" asChild>
                                    <Link href={creditCardsHref}>Cadastrar cartão</Link>
                                </Button>
                            </EmptyStateActions>
                        </EmptyState>
                    ) : (
                        <Popover
                            modal={isMobile}
                            open={creditCardPopoverOpen}
                            onOpenChange={
                                handleCreditCardPopoverOpenChange
                            }
                        >
                            <FormPickerPopoverTrigger id="tx-credit-card">
                                <span className="min-w-0 truncate">
                                    {selectedCard ? (
                                        <>
                                            {selectedCard.name} · ••••{" "}
                                            {selectedCard.last_four}
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Selecione o cartão
                                        </span>
                                    )}
                                </span>
                            </FormPickerPopoverTrigger>
                            <FormPickerPopoverContent>
                                <FormPickerPopoverList className="py-2">
                                    <CreditCardRows
                                        cards={creditCards}
                                        value={paymentCreditCardId}
                                        onPick={pickCard}
                                        embedInScrollContainer
                                    />
                                </FormPickerPopoverList>
                                <FormPickerPopoverFooter>
                                    <FormPickerPopoverFooterAction className="text-xs">
                                        <Link href={creditCardsHref}>
                                            Cadastrar cartão
                                        </Link>
                                    </FormPickerPopoverFooterAction>
                                </FormPickerPopoverFooter>
                            </FormPickerPopoverContent>
                        </Popover>
                    )}
                    {creditInvoiceFormHint ? (
                        <p className="flex min-w-0 flex-nowrap items-center gap-1.5 text-2xs leading-tight text-muted-foreground">
                            <span
                                className={cn(
                                    "inline-flex shrink-0 rounded-full border-0 px-2 py-0.5 text-2xs font-semibold leading-tight",
                                    creditInvoiceSlotStatusChipClass(
                                        creditInvoiceFormHint.slot
                                    )
                                )}
                                title={`Fatura: ${creditCardInvoiceSlotLabelPt(
                                    creditInvoiceFormHint.slot
                                )}`}
                            >
                                {creditInvoiceSlotCompactLabel(
                                    creditInvoiceFormHint.slot
                                )}
                            </span>
                            <span className="min-w-0 truncate">
                                Fatura fecha em{" "}
                                {formatDatePtBr(
                                    creditInvoiceFormHint.statementClose
                                )}
                                {" · "}
                                Vencimento estimado{" "}
                                {formatDatePtBr(
                                    creditInvoiceFormHint.dueEstimate
                                )}
                            </span>
                        </p>
                    ) : null}
                </Field>
            ) : null}
        </div>
    )
}
