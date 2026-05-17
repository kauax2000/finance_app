"use client"

import { useMemo } from "react"
import Link from "next/link"
import type {
    CreditCard,
    SubscriptionBillingInterval,
    WorkspaceSubscription,
} from "@/lib/supabase"
import type { PaymentMethod } from "@/lib/payment-methods"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoneyBrlTyping } from "@/lib/money-brl"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { SubscriptionCategoryPicker } from "@/components/subscriptions/subscription-form-pickers"
import {
    SUBSCRIPTION_BILLING_OPTIONS,
    SUBSCRIPTION_CHARGE_METHOD_OPTIONS,
    SUBSCRIPTION_PAYMENT_NONE,
    subscriptionTodayIsoDate,
    type ExpenseCategoryOption,
} from "@/components/subscriptions/subscription-form-shared"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
export type SubscriptionFormFieldsProps = {
    saving: boolean
    editingSubscription: WorkspaceSubscription | null
    expenseCategories: ExpenseCategoryOption[]
    categoriesHref: string
    creditCards: CreditCard[]
    creditCardsHref: string
    name: string
    setName: (v: string) => void
    amount: string
    setAmount: (v: string) => void
    billingInterval: SubscriptionBillingInterval
    setBillingInterval: (v: SubscriptionBillingInterval) => void
    billingDate: string
    setBillingDate: (v: string) => void
    categoryId: string
    setCategoryId: (v: string) => void
    notes: string
    setNotes: (v: string) => void
    paymentMethod: PaymentMethod | null
    setPaymentMethod: (v: PaymentMethod | null) => void
    paymentCreditCardId: string
    setPaymentCreditCardId: (v: string) => void
}

export function SubscriptionFormFields({
    saving,
    editingSubscription,
    expenseCategories,
    categoriesHref,
    creditCards,
    creditCardsHref,
    name,
    setName,
    amount,
    setAmount,
    billingInterval,
    setBillingInterval,
    billingDate,
    setBillingDate,
    categoryId,
    setCategoryId,
    notes,
    setNotes,
    paymentMethod,
    setPaymentMethod,
    paymentCreditCardId,
    setPaymentCreditCardId,
}: SubscriptionFormFieldsProps) {
    const cardSelectOptions = useMemo(() => {
        const active = creditCards.filter((c) => c.is_active)
        if (!paymentCreditCardId) return active
        const sel = creditCards.find((c) => c.id === paymentCreditCardId)
        if (sel && !sel.is_active) {
            return [sel, ...active.filter((c) => c.id !== sel.id)]
        }
        return active
    }, [creditCards, paymentCreditCardId])

    return (
        <div className="space-y-3 pb-1">
            <div className="space-y-1.5">
                <Label htmlFor="sub-form-name" className="text-xs">
                    Nome
                </Label>
                <Input
                    id="sub-form-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Netflix"
                    className="text-sm"
                    required
                />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="sub-form-amount" className="text-xs">
                        Valor
                    </Label>
                    <Input
                        id="sub-form-amount"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(formatMoneyBrlTyping(e.target.value))}
                        placeholder="0,00"
                        className="text-sm tabular-nums"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="sub-form-billing" className="text-xs">
                        Periodicidade
                    </Label>
                    <Select
                        value={billingInterval}
                        onValueChange={(v) =>
                            setBillingInterval(v as SubscriptionBillingInterval)
                        }
                        disabled={saving}
                    >
                        <SelectTrigger
                            id="sub-form-billing"
                            className="h-9 w-full min-w-0 justify-between gap-2 px-2.5 py-0 text-sm font-normal shadow-none data-[size=default]:h-9 [&>svg]:size-4"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            align="start"
                            className="z-[100] min-w-[var(--radix-select-trigger-width)] p-1"
                            sideOffset={6}
                            collisionPadding={12}
                        >
                            {SUBSCRIPTION_BILLING_OPTIONS.map((o) => (
                                <SelectItem
                                    key={o.value}
                                    value={o.value}
                                    className="py-2 pl-2 pr-8"
                                >
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="sub-form-billing-date" className="text-xs">
                    Data da próxima cobrança
                </Label>
                <p className="text-[11px] text-muted-foreground">
                    Usamos esta data como referência do ciclo (cartão, débito,
                    etc.). Ela é salva como início e próxima cobrança.
                </p>
                <DatePicker
                    id="sub-form-billing-date"
                    className="text-sm"
                    value={parseYmdLocal(billingDate)}
                    onChange={(d) =>
                        setBillingDate(
                            d ? localYmdFromDate(d) : subscriptionTodayIsoDate()
                        )
                    }
                    placeholder="Selecione a data"
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="sub-form-payment-method" className="text-xs">
                    Forma de cobrança (opcional)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                    Define como o lançamento automático será registrado (útil para
                    crédito e fatura). Débito automático costuma ser débito em
                    conta.
                </p>
                <Select
                    value={
                        paymentMethod === null
                            ? SUBSCRIPTION_PAYMENT_NONE
                            : paymentMethod
                    }
                    onValueChange={(v) => {
                        const next: PaymentMethod | null =
                            v === SUBSCRIPTION_PAYMENT_NONE
                                ? null
                                : (v as PaymentMethod)
                        setPaymentMethod(next)
                        if (next !== "credit_card") {
                            setPaymentCreditCardId("")
                        }
                    }}
                    disabled={saving}
                >
                    <SelectTrigger
                        id="sub-form-payment-method"
                        className="h-9 w-full min-w-0 justify-between gap-2 px-2.5 py-0 text-sm font-normal shadow-none data-[size=default]:h-9 [&>svg]:size-4"
                    >
                        <SelectValue placeholder="Não informado" />
                    </SelectTrigger>
                    <SelectContent
                        position="popper"
                        align="start"
                        className="z-[100] min-w-[var(--radix-select-trigger-width)] p-1"
                        sideOffset={6}
                        collisionPadding={12}
                    >
                        <SelectItem
                            value={SUBSCRIPTION_PAYMENT_NONE}
                            className="py-2 pl-2 pr-8"
                        >
                            Não informado
                        </SelectItem>
                        {SUBSCRIPTION_CHARGE_METHOD_OPTIONS.map((o) => (
                            <SelectItem
                                key={o.value}
                                value={o.value}
                                className="py-2 pl-2 pr-8"
                            >
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {paymentMethod === "credit_card" ? (
                <div className="space-y-1.5">
                    <Label htmlFor="sub-form-card" className="text-xs">
                        Cartão de crédito
                    </Label>
                    {cardSelectOptions.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                            Cadastre um cartão em{" "}
                            <Link
                                href={creditCardsHref}
                                className="font-medium text-foreground underline-offset-2 hover:underline"
                            >
                                Cartões de crédito
                            </Link>{" "}
                            para vincular esta assinatura.
                        </p>
                    ) : (
                        <Select
                            value={
                                paymentCreditCardId
                                    ? paymentCreditCardId
                                    : "__pick__"
                            }
                            onValueChange={(v) =>
                                setPaymentCreditCardId(
                                    v === "__pick__" ? "" : v
                                )
                            }
                            disabled={saving}
                        >
                            <SelectTrigger
                                id="sub-form-card"
                                className="h-9 w-full min-w-0 justify-between gap-2 px-2.5 py-0 text-sm font-normal shadow-none data-[size=default]:h-9 [&>svg]:size-4"
                            >
                                <SelectValue placeholder="Selecione o cartão" />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                align="start"
                                className="z-[100] min-w-[var(--radix-select-trigger-width)] p-1"
                                sideOffset={6}
                                collisionPadding={12}
                            >
                                <SelectItem
                                    value="__pick__"
                                    className="py-2 pl-2 pr-8"
                                >
                                    Selecione o cartão
                                </SelectItem>
                                {cardSelectOptions.map((c) => (
                                    <SelectItem
                                        key={c.id}
                                        value={c.id}
                                        className="py-2 pl-2 pr-8"
                                    >
                                        {c.name} · •••• {c.last_four}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            ) : null}
            <div className="space-y-1.5">
                <Label className="text-xs">
                    Categoria de despesa (opcional)
                </Label>
                <SubscriptionCategoryPicker
                    value={categoryId}
                    onChange={setCategoryId}
                    categories={expenseCategories}
                    categoriesHref={categoriesHref}
                    disabled={saving}
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="sub-form-notes" className="text-xs">
                    Observações (opcional)
                </Label>
                <Input
                    id="sub-form-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm"
                />
            </div>
        </div>
    )
}
