"use client"

import { useCallback, useEffect, useState } from "react"
import type {
    CreditCard,
    SubscriptionBillingInterval,
    WorkspaceSubscription,
} from "@/lib/supabase"
import type { PaymentMethod } from "@/lib/payment-methods"
import { toastError } from "@/lib/toast"
import {
    SUBSCRIPTION_SELECT_NONE,
    buildSubscriptionFormPayload,
    subscriptionTodayIsoDate,
    type ExpenseCategoryOption,
    type SubscriptionFormPayload,
} from "@/components/subscriptions/subscription-form-shared"
import type { SubscriptionFormFieldsProps } from "@/components/subscriptions/subscription-form-fields"

export type UseSubscriptionFormArgs = {
    active: boolean
    saving: boolean
    editingSubscription: WorkspaceSubscription | null
    expenseCategories: ExpenseCategoryOption[]
    categoriesHref: string
    creditCards: CreditCard[]
    creditCardsHref: string
    onSave: (
        payload: SubscriptionFormPayload,
        subscriptionIdForUpdate?: string | null
    ) => Promise<boolean>
    closeOnSuccess?: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function useSubscriptionForm({
    active,
    saving,
    editingSubscription,
    expenseCategories,
    categoriesHref,
    creditCards,
    creditCardsHref,
    onSave,
    closeOnSuccess = true,
    onClose,
    onSuccess,
}: UseSubscriptionFormArgs) {
    const [name, setName] = useState("")
    const [amount, setAmount] = useState("")
    const [billingInterval, setBillingInterval] =
        useState<SubscriptionBillingInterval>("monthly")
    const [billingDate, setBillingDate] = useState(() =>
        subscriptionTodayIsoDate()
    )
    const [categoryId, setCategoryId] = useState<string>(
        SUBSCRIPTION_SELECT_NONE
    )
    const [notes, setNotes] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
        null
    )
    const [paymentCreditCardId, setPaymentCreditCardId] = useState("")

    useEffect(() => {
        if (!active) return
        if (editingSubscription) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync fields when edit/create surface opens
            setName(editingSubscription.name)
            setAmount(String(editingSubscription.amount).replace(".", ","))
            setBillingInterval(editingSubscription.billing_interval)
            setBillingDate(
                editingSubscription.next_billing_date
                    ? editingSubscription.next_billing_date.slice(0, 10)
                    : editingSubscription.start_date.slice(0, 10)
            )
            setCategoryId(
                editingSubscription.category_id ?? SUBSCRIPTION_SELECT_NONE
            )
            setNotes(editingSubscription.notes ?? "")
            setPaymentMethod(editingSubscription.payment_method ?? null)
            setPaymentCreditCardId(
                editingSubscription.payment_credit_card_id ?? ""
            )
        } else {
            setName("")
            setAmount("")
            setBillingInterval("monthly")
            setBillingDate(subscriptionTodayIsoDate())
            setCategoryId(SUBSCRIPTION_SELECT_NONE)
            setNotes("")
            setPaymentMethod(null)
            setPaymentCreditCardId("")
        }
    }, [active, editingSubscription])

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (paymentMethod === "credit_card") {
                const activeCardRows = creditCards.filter((c) => c.is_active)
                const id = paymentCreditCardId.trim()
                if (!id) {
                    if (activeCardRows.length > 0) {
                        toastError(
                            "Selecione o cartão de crédito usado nesta assinatura."
                        )
                        return
                    }
                    toastError(
                        "Cadastre um cartão em Cartões de crédito para usar esta forma de cobrança."
                    )
                    return
                }
            }
            const built = buildSubscriptionFormPayload({
                name,
                amountStr: amount,
                billing: billingInterval,
                billingDate,
                cId: categoryId,
                n: notes,
                active: editingSubscription?.is_active ?? true,
                paymentMethod,
                paymentCreditCardId,
            })
            if (!built.ok) {
                toastError(built.error)
                return
            }
            const updateId = editingSubscription?.id ?? null
            const ok = await onSave(built.payload, updateId)
            if (ok) {
                onSuccess?.()
                if (closeOnSuccess) {
                    onClose()
                }
            }
        },
        [
            amount,
            billingDate,
            billingInterval,
            categoryId,
            closeOnSuccess,
            creditCards,
            editingSubscription,
            name,
            notes,
            onClose,
            onSave,
            onSuccess,
            paymentCreditCardId,
            paymentMethod,
        ]
    )

    const formTitle = editingSubscription
        ? "Editar assinatura"
        : "Nova assinatura"
    const formDescription = editingSubscription
        ? undefined
        : "Serviços e cobranças recorrentes (streaming, software, etc.)."

    const submitLabel = saving ? "Salvando…" : "Salvar"

    const fieldsProps: SubscriptionFormFieldsProps = {
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
    }

    return {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        submitLabel,
        showFooter: true,
        submitDisabled: saving,
    }
}
