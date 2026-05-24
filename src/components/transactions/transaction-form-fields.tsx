"use client"

import { useMemo, useState } from "react"
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
    TransactionFormTypeSegment,
    transactionSegmentContainerClassName,
    transactionSegmentTabClassName,
    type TransactionFormKind,
} from "@/components/transactions/transaction-type-segment"
import { ButtonGroup } from "@/components/ui/button-group"
import { splitTotalAcrossInstallments } from "@/lib/installment-amounts"
import { formatMoneyBrlTyping, parseMoneyBrl } from "@/lib/money-brl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    tagChipFilterIdle,
    tagChipFilterSelected,
} from "@/lib/tag-chip-classes"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

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
                        <button
                            type="button"
                            className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                selected
                                    ? "bg-muted font-medium text-foreground"
                                    : "hover:bg-muted/60"
                            )}
                            onClick={() => onPick(c.id)}
                        >
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{
                                    backgroundColor:
                                        c.color || "var(--muted-foreground)",
                                }}
                                aria-hidden
                            />
                            <span className="min-w-0 truncate">{c.name}</span>
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}

function PaymentMethodChips({
    value,
    onChange,
}: {
    value: PaymentMethod | null
    onChange: (next: PaymentMethod | null) => void
}) {
    const options = paymentMethodOptions()
    return (
        <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Forma de pagamento"
        >
            {options.map((opt) => {
                const selected = value === opt.value
                return (
                    <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-pressed={selected}
                        className={cn(
                            "h-auto min-h-8 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-none transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            "border-0 max-md:active:bg-muted/50 max-md:active:opacity-90",
                            selected ? tagChipFilterSelected : tagChipFilterIdle
                        )}
                        onClick={() =>
                            onChange(selected ? null : opt.value)
                        }
                    >
                        {opt.label}
                    </Button>
                )
            })}
        </div>
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
                        <button
                            type="button"
                            className={cn(
                                "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                selected
                                    ? "bg-muted font-medium text-foreground"
                                    : "hover:bg-muted/60"
                            )}
                            onClick={() => onPick(c.id)}
                        >
                            <span className="truncate">{c.name}</span>
                            <span className="text-xs text-muted-foreground">
                                •••• {c.last_four}
                                {c.brand ? ` · ${c.brand}` : ""}
                            </span>
                        </button>
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

    const [categorySearch, setCategorySearch] = useState("")

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
                ? `${n} parcelas de ${installmentAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                : `${n - 1} × ${installmentAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} + última ${finalInstallmentAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
        }
        const per = parseMoneyBrl(installmentPerAmount)
        if (per === null || per <= 0) return null
        return `${n} parcelas de ${per.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
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
        if (open) setCategorySearch("")
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

    return (
        <div className="space-y-4 py-1 pb-2">
            {showInstallmentEditScopePicker ? (
                <div
                    className={transactionSegmentContainerClassName}
                    role="tablist"
                    aria-label="O que editar"
                >
                    <ButtonGroup className="h-full min-h-0 w-full gap-0.5 md:w-auto">
                        <Button
                            type="button"
                            role="tab"
                            aria-selected={installmentEditScope === "slice"}
                            size="sm"
                            variant="ghost"
                            className={transactionSegmentTabClassName(
                                installmentEditScope === "slice"
                            )}
                            onClick={() => setInstallmentEditScope("slice")}
                        >
                            Esta parcela
                        </Button>
                        <Button
                            type="button"
                            role="tab"
                            aria-selected={installmentEditScope === "plan"}
                            size="sm"
                            variant="ghost"
                            className={transactionSegmentTabClassName(
                                installmentEditScope === "plan"
                            )}
                            onClick={() => setInstallmentEditScope("plan")}
                        >
                            Plano da compra
                        </Button>
                    </ButtonGroup>
                </div>
            ) : null}

            {segmentMode === "edit" && hasInstallmentPlan ? null : segmentMode ===
              "edit" ? (
                <TransactionFormTypeSegment value={type} onChange={setType} />
            ) : (
                <TransactionFormKindSegment
                    value={formKind}
                    onChange={setFormKind}
                />
            )}

            {showInstallmentFields && segmentMode === "edit" ? (
                <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                    Parcelas já lançadas no extrato não mudam automaticamente;
                    só as próximas cobranças usam os novos valores do plano.
                </p>
            ) : null}

            {showInstallmentFields ? (
                <>
                    <div className="space-y-2">
                        <Label className="text-xs">Como informar os valores?</Label>
                        <div
                            className={transactionSegmentContainerClassName}
                            role="tablist"
                            aria-label="Modo de valor da parcela"
                        >
                            <ButtonGroup className="h-full min-h-0 w-full gap-0.5 md:w-auto">
                                <Button
                                    type="button"
                                    role="tab"
                                    aria-selected={
                                        installmentValueMode === "total"
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className={transactionSegmentTabClassName(
                                        installmentValueMode === "total"
                                    )}
                                    onClick={() =>
                                        setInstallmentValueMode("total")
                                    }
                                >
                                    Total e parcelas
                                </Button>
                                <Button
                                    type="button"
                                    role="tab"
                                    aria-selected={
                                        installmentValueMode ===
                                        "per_installment"
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className={transactionSegmentTabClassName(
                                        installmentValueMode ===
                                            "per_installment"
                                    )}
                                    onClick={() =>
                                        setInstallmentValueMode(
                                            "per_installment"
                                        )
                                    }
                                >
                                    Valor da parcela
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>

                    {installmentValueMode === "total" ? (
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-inst-total" className="text-xs">
                                Valor total (R$)
                            </Label>
                            <Input
                                id="tx-inst-total"
                                inputMode="decimal"
                                value={installmentTotal}
                                onChange={(e) =>
                                    setInstallmentTotal(formatMoneyBrlTyping(e.target.value))
                                }
                                placeholder="Ex: 1.200,00"
                                className="text-sm tabular-nums"
                            />
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-inst-per" className="text-xs">
                                Valor de cada parcela (R$)
                            </Label>
                            <Input
                                id="tx-inst-per"
                                inputMode="decimal"
                                value={installmentPerAmount}
                                onChange={(e) =>
                                    setInstallmentPerAmount(formatMoneyBrlTyping(e.target.value))
                                }
                                placeholder="Ex: 100,00"
                                className="text-sm tabular-nums"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="tx-inst-n" className="text-xs">
                            Número de parcelas
                        </Label>
                        <Input
                            id="tx-inst-n"
                            type="number"
                            min={2}
                            step={1}
                            value={installmentCount}
                            onChange={(e) =>
                                setInstallmentCount(e.target.value)
                            }
                            placeholder="12"
                            className="text-sm tabular-nums"
                        />
                    </div>

                    {installmentPreview ? (
                        <p className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                            {installmentPreview}
                        </p>
                    ) : null}
                </>
            ) : (
                <div className="space-y-1.5">
                    <Label htmlFor="tx-amount" className="text-xs">
                        Valor (R$)
                    </Label>
                    <Input
                        id="tx-amount"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAmount(formatMoneyBrlTyping(e.target.value))
                        }
                        placeholder="Ex: 50,00 ou 1.500,00"
                        className="text-sm tabular-nums"
                        required={segmentMode === "edit" || formKind !== "installment"}
                    />
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="tx-description" className="text-xs">
                    Descrição
                </Label>
                <Input
                    id="tx-description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDescription(e.target.value)
                    }
                    className="text-sm"
                    placeholder="Ex: Supermercado"
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Popover
                    modal={false}
                    open={categoryPopoverOpen}
                    onOpenChange={handleCategoryPopoverOpenChange}
                >
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="w-full justify-between px-3 text-left text-sm font-normal"
                            id="tx-category"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                {selectedCategory ? (
                                    <>
                                        <span
                                            className="size-2 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    selectedCategory.color ||
                                                    "var(--muted-foreground)",
                                            }}
                                            aria-hidden
                                        />
                                        <span className="truncate">
                                            {selectedCategory.name}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Selecione uma categoria
                                    </span>
                                )}
                            </span>
                            <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        side="bottom"
                        align="start"
                        sideOffset={6}
                        collisionPadding={12}
                        className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-1.5rem,22rem)] flex flex-col gap-0 overflow-hidden p-0"
                    >
                        <div className="shrink-0 border-b border-border/50 p-3 pb-2">
                            <div className="relative">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={categorySearch}
                                    onChange={(e) =>
                                        setCategorySearch(e.target.value)
                                    }
                                    placeholder="Buscar categoria..."
                                    className="pl-9 text-sm"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div
                            className="max-h-[min(45dvh,15rem)] touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-1 [-webkit-overflow-scrolling:touch]"
                            onWheel={(e) => e.stopPropagation()}
                        >
                            <CategoryRows
                                categories={filteredCategories}
                                search={categorySearch}
                                value={categoryId}
                                onPick={pickCategory}
                                embedInScrollContainer
                            />
                        </div>
                        <div className="shrink-0 border-t border-border/50 bg-muted/25 p-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="lg"
                                className="w-full text-xs"
                                asChild
                            >
                                <Link href={categoriesHref}>
                                    Gerenciar categorias
                                </Link>
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="tx-date" className="text-xs">
                    {showInstallmentFields
                        ? segmentMode === "edit"
                            ? planIsActive
                                ? "Próxima data de cobrança"
                                : "Data de cobrança"
                            : "Data da primeira cobrança"
                        : "Data"}
                </Label>
                {showInstallmentFields &&
                segmentMode === "edit" &&
                !planIsActive ? (
                    <p
                        id="tx-date"
                        className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
                    >
                        Plano concluído — não há próxima cobrança agendada.
                    </p>
                ) : (
                    <DatePicker
                        id="tx-date"
                        className="text-sm"
                        value={parseYmdLocal(dateYmd)}
                        onChange={(d) =>
                            setDateYmd(
                                d
                                    ? localYmdFromDate(d)
                                    : localYmdFromDate(new Date())
                            )
                        }
                        placeholder="Selecione a data"
                    />
                )}
            </div>

            {type === "expense" || showInstallmentFields ? (
                <>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Forma de pagamento</Label>
                        <PaymentMethodChips
                            value={paymentMethod}
                            onChange={(next) => {
                                setPaymentMethod(next)
                                if (next !== "credit_card") {
                                    setPaymentCreditCardId("")
                                }
                            }}
                        />
                    </div>

                    {paymentMethod === "credit_card" ? (
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-credit-card" className="text-xs">
                                Cartão
                            </Label>
                            {activeCards.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                                    Cadastre um cartão em{" "}
                                    <Link
                                        href={creditCardsHref}
                                        className="font-medium text-foreground underline-offset-2 hover:underline"
                                    >
                                        Cartões de crédito
                                    </Link>{" "}
                                    para vincular esta despesa.
                                </p>
                            ) : (
                                <Popover
                                    modal={false}
                                    open={creditCardPopoverOpen}
                                    onOpenChange={setCreditCardPopoverOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            id="tx-credit-card"
                                            className="w-full justify-between px-3 text-left text-sm font-normal"
                                        >
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
                                            <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="bottom"
                                        align="start"
                                        sideOffset={6}
                                        collisionPadding={12}
                                        className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-1.5rem,22rem)] flex flex-col gap-0 overflow-hidden p-0"
                                    >
                                        <div
                                            className="max-h-[min(40dvh,13rem)] touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-2 [-webkit-overflow-scrolling:touch]"
                                            onWheel={(e) => e.stopPropagation()}
                                        >
                                            <CreditCardRows
                                                cards={creditCards}
                                                value={paymentCreditCardId}
                                                onPick={pickCard}
                                                embedInScrollContainer
                                            />
                                        </div>
                                        <div className="shrink-0 border-t border-border/50 bg-muted/25 p-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="lg"
                                                className="w-full text-xs"
                                                asChild
                                            >
                                                <Link href={creditCardsHref}>
                                                    Cadastrar cartão
                                                </Link>
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                            {creditInvoiceFormHint ? (
                                <p className="flex min-w-0 flex-nowrap items-center gap-1.5 text-[11px] leading-tight text-muted-foreground">
                                    <span
                                        className={cn(
                                            "inline-flex shrink-0 rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold leading-tight",
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
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    )
}
