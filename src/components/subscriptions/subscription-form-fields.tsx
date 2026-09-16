"use client"

import { paymentMethodOptions } from "@/lib/payment-methods"
import {
    Field,
    FieldControl,
    FieldDescription,
    FieldLabel,
    FieldTitle,
} from "@/components/ui/field"
import { useMemo } from "react"
import Link from "next/link"
import type {
    CreditCard,
    SubscriptionBillingInterval,
    WorkspaceSubscription,
} from "@/lib/supabase"
import type { PaymentMethod } from "@/lib/payment-methods"
import { FormInput } from "@/components/ui/form"
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
    SUBSCRIPTION_PAYMENT_NONE,
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
            <FormInput
                id="sub-form-name"
                fieldSize="sm"
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Netflix"
                className="text-sm"
                required
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <FormInput
                    money
                    fieldSize="sm"
                    label="Valor"
                    value={amount}
                    onValueChange={setAmount}
                    placeholder="0,00"
                    required
                />
                <Field size="sm">
                    <FieldLabel>Periodicidade</FieldLabel>
                    <Select
                        value={billingInterval}
                        onValueChange={(v) =>
                            setBillingInterval(v as SubscriptionBillingInterval)
                        }
                        disabled={saving}
                    >
                        <FieldControl>
                            <SelectTrigger
                                id="sub-form-billing"
                                className="h-9 w-full min-w-0 justify-between gap-2 px-2.5 py-0 text-sm font-normal shadow-none [&>svg]:size-4"
                            >
                                <SelectValue />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent
                            align="start"
                            className="min-w-[var(--radix-select-trigger-width)] p-1"
                            sideOffset={6}
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
                </Field>
            </div>
            {/* A ajuda fica entre o rótulo e o controle, como antes; como
                `FieldDescription` ela passa a entrar no `aria-describedby`. */}
            <Field size="sm">
                <FieldLabel>Data da próxima cobrança</FieldLabel>
                <FieldDescription>
                    Usamos esta data como referência do ciclo (cartão, débito,
                    etc.). Ela é salva como início e próxima cobrança.
                </FieldDescription>
                <FieldControl>
                    <DatePicker
                        id="sub-form-billing-date"
                        className="text-sm"
                        value={parseYmdLocal(billingDate)}
                        onChange={(d) =>
                            setBillingDate(
                                d ? localYmdFromDate(d) : localYmdFromDate(new Date())
                            )
                        }
                        placeholder="Selecione a data"
                    />
                </FieldControl>
            </Field>
            <Field size="sm">
                <FieldLabel optional>Forma de cobrança</FieldLabel>
                <FieldDescription>
                    Define como o lançamento automático será registrado (útil para
                    crédito e fatura). Débito automático costuma ser débito em
                    conta.
                </FieldDescription>
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
                    <FieldControl>
                        <SelectTrigger
                            id="sub-form-payment-method"
                            className="h-9 w-full min-w-0 justify-between gap-2 px-2.5 py-0 text-sm font-normal shadow-none [&>svg]:size-4"
                        >
                            <SelectValue placeholder="Não informado" />
                        </SelectTrigger>
                    </FieldControl>
                    <SelectContent
                        align="start"
                        className="min-w-[var(--radix-select-trigger-width)] p-1"
                        sideOffset={6}
                    >
                        <SelectItem
                            value={SUBSCRIPTION_PAYMENT_NONE}
                            className="py-2 pl-2 pr-8"
                        >
                            Não informado
                        </SelectItem>
                        {paymentMethodOptions().map((o) => (
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
            </Field>
            {paymentMethod === "credit_card" ? (
                <Field size="sm">
                    {/* Sem cartões não há controle: o `for` apontava para nada, e
                        aqui vira título. */}
                    {cardSelectOptions.length === 0 ? (
                        <FieldTitle>Cartão de crédito</FieldTitle>
                    ) : (
                        <FieldLabel>Cartão de crédito</FieldLabel>
                    )}
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
                            <FieldControl>
                                <SelectTrigger
                                    id="sub-form-card"
                                    className="h-9 w-full min-w-0 justify-between gap-2 px-2.5 py-0 text-sm font-normal shadow-none [&>svg]:size-4"
                                >
                                    <SelectValue placeholder="Selecione o cartão" />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent
                                align="start"
                                className="min-w-[var(--radix-select-trigger-width)] p-1"
                                sideOffset={6}
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
                </Field>
            ) : null}
            {/* O seletor não repassa `id`: o gatilho dele tem o seu, fixo, e o
                rótulo aponta para ele explicitamente. */}
            <Field size="sm">
                <FieldLabel htmlFor="subscription-category-picker" optional>
                    Categoria de despesa
                </FieldLabel>
                <SubscriptionCategoryPicker
                    value={categoryId}
                    onChange={setCategoryId}
                    categories={expenseCategories}
                    categoriesHref={categoriesHref}
                    disabled={saving}
                />
            </Field>
            <FormInput
                id="sub-form-notes"
                fieldSize="sm"
                label="Observações"
                optional
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
            />
        </div>
    )
}
