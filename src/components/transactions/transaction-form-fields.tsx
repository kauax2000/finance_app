"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CreditCardIcon, MinusIcon, PlusIcon } from "@heroicons/react/16/solid"
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
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupSelect,
} from "@/components/ui/input-group"
import { SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ColorTile } from "@/components/ui/color-tile"
import { Badge } from "@/components/ui/badge"
import { CreditCardBrandChip } from "@/components/credit-cards/credit-card-brand-chip"
import { cartaoPreEscolhido, gravarUltimoCartao } from "@/lib/ultimo-cartao"
import { Separator } from "@/components/ui/separator"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import Link from "next/link"
import type { Category, CreditCard } from "@/lib/supabase"
import { paymentMethodChipOptions, type PaymentMethod } from "@/lib/payment-methods"
import {
    calendarYmdToStorageIso,
    formatTransactionDayMonthPtBr,
    formatYearMonthShortPtBr,
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
import { parseMoneyBrl } from "@/lib/money-brl"
import { Button } from "@/components/ui/button"
import { FormInput, FormRadioGroup } from "@/components/ui/form"
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

const SLOT_TONE = {
    open: "success",
    last_closed: "warning",
    older: "destructive",
} as const

function CreditCardRows({
    cards,
    value,
    onPick,
    purchaseIso,
    embedInScrollContainer = false,
}: {
    cards: CreditCard[]
    value: string
    onPick: (id: string) => void
    /** A data do lançamento: cada linha diz em qual fatura a compra cai por ela. */
    purchaseIso: string | null
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
                const fatura = purchaseIso
                    ? creditCardInvoiceHintForPurchase(purchaseIso, c)
                    : null
                return (
                    <li key={c.id}>
                        <FormPickerPopoverItem
                            selected={selected}
                            onClick={() => onPick(c.id)}
                        >
                            <CreditCardBrandChip brand={c.brand} />
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate">{c.name}</span>
                                <span className="nums truncate text-xs text-muted-foreground">
                                    •••• {c.last_four}
                                    {fatura
                                        ? ` · vence ${formatTransactionDayMonthPtBr(localYmdFromDate(fatura.dueEstimate))}`
                                        : ""}
                                </span>
                            </span>
                            {fatura ? (
                                <Badge
                                    size="xs"
                                    tone={SLOT_TONE[fatura.slot]}
                                    className="shrink-0"
                                    title={`${fatura.slotLabel}: fecha em ${formatDatePtBr(fatura.statementClose)}`}
                                >
                                    {creditInvoiceSlotCompactLabel(fatura.slot)}
                                </Badge>
                            ) : null}
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

/**
 * O trilho do tipo (Despesa, Parcelada, Receita; na edição, Despesa e Receita).
 * Mora no cabeçalho fixo do formulário, sob o título, e não no corpo que rola:
 * é o modo do formulário, a decisão antes dos campos.
 */
export function TransactionFormSegment({
    segmentMode,
    hasInstallmentPlan = false,
    type,
    setType,
    formKind,
    setFormKind,
}: Pick<
    TransactionFormFieldsProps,
    "segmentMode" | "hasInstallmentPlan" | "type" | "setType" | "formKind" | "setFormKind"
>) {
    if (segmentMode === "edit" && hasInstallmentPlan) return null
    return segmentMode === "edit" ? (
        <TransactionFormTypeSegment value={type} onChange={setType} />
    ) : (
        <TransactionFormKindSegment value={formKind} onChange={setFormKind} />
    )
}

export function TransactionFormFields(props: TransactionFormFieldsProps) {
    const {
        segmentMode,
        formKind,
        type,
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

    const parcelas = Math.floor(Number.parseInt(installmentCount, 10)) || 0
    // No dedo o − e o + do contador sobem de 24 a 32px (o campo tem 40); no mouse ficam em 24.
    const alvoDoContador = "pointer-coarse:size-8 pointer-coarse:[&_svg:not([class*='size-'])]:size-4"

    // O resumo do plano: as parcelas, a conta que falta (o total ou a parcela) e
    // o mês da última cobrança, contado da primeira.
    const installmentPreview = useMemo(() => {
        if (!showInstallmentFields) return null
        const n = parcelas
        if (n < 2) return null
        const [ano, mes] = dateYmd.split("-").map(Number)
        const fim =
            ano && mes
                ? ` · última em ${formatYearMonthShortPtBr(
                      `${ano + Math.floor((mes - 1 + n - 1) / 12)}-${String(((mes - 1 + n - 1) % 12) + 1).padStart(2, "0")}`
                  )}`
                : ""
        if (installmentValueMode === "total") {
            const total = parseMoneyBrl(installmentTotal)
            if (total === null || total <= 0) return null
            // O resumo mostra a parcela arredondada, sempre no número escolhido
            // (12 × R$ 8,33), sem separar a sobra de centavos numa parcela à parte.
            const parcela = Math.round((total * 100) / n) / 100
            if (parcela <= 0) return null
            return `${n} × ${currencyBRL(parcela)}${fim}`
        }
        const per = parseMoneyBrl(installmentPerAmount)
        if (per === null || per <= 0) return null
        return `${n} × ${currencyBRL(per)} = ${currencyBRL(per * n)}${fim}`
    }, [
        showInstallmentFields,
        installmentValueMode,
        installmentTotal,
        installmentPerAmount,
        parcelas,
        dateYmd,
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
        const card = activeCards.find((c) => c.id === id)
        if (card) gravarUltimoCartao(card.workspace_id, id)
    }

    /** Ao tocar em Crédito: um cartão só vem escolhido; com mais de um, o último usado na carteira. */
    const preEscolherCartao = () => {
        if (paymentCreditCardId) return
        const id = cartaoPreEscolhido(activeCards)
        if (id) setPaymentCreditCardId(id)
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
                        displayStyle="relative"
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
                    <FieldRow stack={false} className="grid-cols-1 md:grid-cols-[minmax(0,1fr)_8rem]">
                        <Field size="sm">
                            <FieldLabel>
                                Valor
                                <span className="sr-only">
                                    {installmentValueMode === "total" ? " total" : " da parcela"}
                                </span>
                            </FieldLabel>
                            {/* O modo mora dentro do campo, como a moeda de um valor:
                                o trilho Total | Por parcela empilhava um segundo
                                controle segmentado sob o do tipo. */}
                            <InputGroup>
                                <InputGroupSelect
                                    aria-label="Como informar o valor"
                                    value={installmentValueMode}
                                    onValueChange={(next) => {
                                        // O número digitado fica no campo e só muda de
                                        // sentido: 1.200 de total vira 1.200 por parcela,
                                        // e o resumo refaz a conta.
                                        if (next === installmentValueMode) return
                                        if (next === "total") setInstallmentTotal(installmentPerAmount)
                                        else setInstallmentPerAmount(installmentTotal)
                                        setInstallmentValueMode(next as InstallmentValueMode)
                                    }}
                                >
                                    <SelectItem value="total">Total</SelectItem>
                                    <SelectItem value="per_installment">Parcela</SelectItem>
                                </InputGroupSelect>
                                <FieldControl>
                                    <InputGroupInput
                                        money
                                        value={installmentValueMode === "total" ? installmentTotal : installmentPerAmount}
                                        onValueChange={
                                            installmentValueMode === "total"
                                                ? setInstallmentTotal
                                                : setInstallmentPerAmount
                                        }
                                        placeholder={installmentValueMode === "total" ? "1.200,00" : "100,00"}
                                        autoFocus={focoInicial.current}
                                        aria-describedby="tx-inst-preview"
                                    />
                                </FieldControl>
                            </InputGroup>
                        </Field>
                        <Field size="sm">
                            <FieldLabel>Parcelas</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupButton
                                        size="icon-xs"
                                        className={alvoDoContador}
                                        aria-label="Uma parcela a menos"
                                        disabled={parcelas <= 2}
                                        onClick={() => setInstallmentCount(String(Math.max(2, parcelas - 1)))}
                                    >
                                        <MinusIcon />
                                    </InputGroupButton>
                                </InputGroupAddon>
                                <FieldControl>
                                    <InputGroupInput
                                        id="tx-inst-n"
                                        type="number"
                                        inputMode="numeric"
                                        min={2}
                                        step={1}
                                        value={installmentCount}
                                        onChange={(e) => setInstallmentCount(e.target.value)}
                                        placeholder="12"
                                        className="nums px-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                        aria-describedby="tx-inst-preview"
                                    />
                                </FieldControl>
                                <InputGroupAddon align="inline-end">
                                    <InputGroupButton
                                        size="icon-xs"
                                        className={alvoDoContador}
                                        aria-label="Uma parcela a mais"
                                        onClick={() => setInstallmentCount(String(Math.max(2, parcelas + 1)))}
                                    >
                                        <PlusIcon />
                                    </InputGroupButton>
                                </InputGroupAddon>
                            </InputGroup>
                        </Field>
                    </FieldRow>
                    <p id="tx-inst-preview" className="nums text-sm text-muted-foreground">
                        {installmentPreview ?? "Informe o valor e o número de parcelas."}
                    </p>
                </div>
            ) : (
                <FormInput
                    money
                    fieldSize="sm"
                    label="Valor"
                    value={amount}
                    onValueChange={setAmount}
                    placeholder="0,00"
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

            {dataField}

            {mostraForma ? (
                // Um toque escolhe e outro na escolhida desmarca (a forma é opcional).
                // Seis fichas numa grade de 3 × 2, do mesmo tamanho, no lugar da
                // fileira que quebrava em alturas desiguais.
                <FormRadioGroup
                    fieldSize="sm"
                    label="Forma de pagamento"
                    optional
                    variant="chip"
                    deselectable
                    value={paymentMethod ?? ""}
                    onValueChange={(next) => {
                        const forma = (next || null) as PaymentMethod | null
                        setPaymentMethod(forma)
                        if (forma === "credit_card") preEscolherCartao()
                        else setPaymentCreditCardId("")
                    }}
                    options={paymentMethodChipOptions()}
                    // As fichas soltas vestem o preenchimento translúcido dos campos
                    // (`bg-input-fill/50`, o de `fieldSurfaceClassName`), para ler
                    // como parte do formulário; a escolhida segue com a cor de seleção.
                    className="data-[variant=chip]:grid data-[variant=chip]:grid-cols-3 [&>[data-slot=radio-group-item]]:justify-center [&>[data-slot=radio-group-item]:not(:has([data-state=checked]))]:bg-input-fill/50"
                />
            ) : null}

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
                                {selectedCard ? (
                                    <span className="flex min-w-0 items-center gap-2">
                                        <CreditCardBrandChip brand={selectedCard.brand} />
                                        <span className="min-w-0 truncate">
                                            {selectedCard.name}
                                            <span className="nums text-muted-foreground">
                                                {" "}
                                                •••• {selectedCard.last_four}
                                            </span>
                                        </span>
                                    </span>
                                ) : (
                                    <span className="min-w-0 truncate text-muted-foreground">
                                        Selecione o cartão
                                    </span>
                                )}
                            </FormPickerPopoverTrigger>
                            <FormPickerPopoverContent>
                                <FormPickerPopoverList>
                                    <CreditCardRows
                                        cards={creditCards}
                                        value={paymentCreditCardId}
                                        onPick={pickCard}
                                        purchaseIso={
                                            dateYmd.trim()
                                                ? calendarYmdToStorageIso(dateYmd)
                                                : null
                                        }
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
