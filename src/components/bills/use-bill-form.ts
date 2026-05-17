"use client"

import { useCallback, useEffect, useState } from "react"
import type { Bill, BillFrequency, Category, CreditCard } from "@/lib/supabase"
import type { PaymentMethod } from "@/lib/payment-methods"
import { toastError } from "@/lib/toast"
import {
    BILL_CATEGORY_NONE,
    BILL_PAYMENT_NONE,
    buildBillFormPayload,
    billTodayYmd,
    type BillFormPayloadForSave,
} from "@/components/bills/bill-form-shared"
import type { BillFormFieldsProps } from "@/components/bills/bill-form-fields"
import {
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"

function paymentMethodFromBill(
    pm: Bill["default_payment_method"]
): PaymentMethod | null {
    if (!pm) return null
    if (
        pm === "pix" ||
        pm === "ted" ||
        pm === "debit_card" ||
        pm === "credit_card" ||
        pm === "cash" ||
        pm === "other"
    ) {
        return pm
    }
    return null
}

export type UseBillFormArgs = {
    active: boolean
    saving: boolean
    editingBill: Bill | null
    expenseCategories: Category[]
    creditCards: CreditCard[]
    onSave: (
        payload: BillFormPayloadForSave,
        billIdForUpdate?: string | null
    ) => Promise<boolean>
    closeOnSuccess?: boolean
    onClose: () => void
}

export function useBillForm({
    active,
    saving,
    editingBill,
    expenseCategories,
    creditCards,
    onSave,
    closeOnSuccess = true,
    onClose,
}: UseBillFormArgs) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [notes, setNotes] = useState("")
    const [categoryId, setCategoryId] = useState(BILL_CATEGORY_NONE)
    const [icon, setIcon] = useState<CategoryIconId>(() =>
        normalizeCategoryIcon("receipt")
    )
    const [frequency, setFrequency] =
        useState<BillFrequency>("monthly")
    const [dueDayOfMonth, setDueDayOfMonth] = useState(10)
    const [amountEstimatedStr, setAmountEstimatedStr] = useState("")
    const [startDate, setStartDateYmd] = useState(billTodayYmd())
    const [endDateYmd, setEndDateYmd] = useState("")
    const [paymentMethodOption, setPaymentMethodOption] = useState(
        BILL_PAYMENT_NONE,
    )
    const [paymentCreditCardId, setPaymentCreditCardId] = useState("")
    const [reminder3, setReminder3] = useState(true)
    const [reminder0, setReminder0] = useState(true)
    const [isActive, setIsActive] = useState(true)

    /* Hydrate controlled fields whenever the dialog opens or the bill being edited changes. */
    /* eslint-disable react-hooks/set-state-in-effect -- deliberate form reset from props */
    useEffect(() => {
        if (!active) return

        const b = editingBill
        if (b) {
            setName(b.name)
            setDescription(b.description ?? "")
            setNotes(b.notes ?? "")
            setCategoryId(b.category_id ?? BILL_CATEGORY_NONE)
            setIcon(normalizeCategoryIcon(b.icon ?? "receipt"))
            setFrequency(b.frequency)
            setDueDayOfMonth(b.due_day_of_month)
            setAmountEstimatedStr(
                b.amount_estimated != null &&
                    typeof b.amount_estimated === "number"
                    ? String(b.amount_estimated).replace(".", ",")
                    : "",
            )
            const startSlice = b.start_date.slice(0, 10)
            setStartDateYmd(startSlice)
            setEndDateYmd(b.end_date ? b.end_date.slice(0, 10) : "")
            const pm = paymentMethodFromBill(b.default_payment_method)
            setPaymentMethodOption(pm ?? BILL_PAYMENT_NONE)
            setPaymentCreditCardId(b.default_payment_credit_card_id ?? "")
            const r = Array.isArray(b.reminder_days_before)
                ? b.reminder_days_before
                : [3, 0]
            setReminder3(r.includes(3))
            setReminder0(r.includes(0))
            setIsActive(b.is_active)
        } else {
            setName("")
            setDescription("")
            setNotes("")
            setCategoryId(BILL_CATEGORY_NONE)
            setIcon(normalizeCategoryIcon("receipt"))
            setFrequency("monthly")
            setDueDayOfMonth(10)
            setAmountEstimatedStr("")
            setStartDateYmd(billTodayYmd())
            setEndDateYmd("")
            setPaymentMethodOption(BILL_PAYMENT_NONE)
            setPaymentCreditCardId("")
            setReminder3(true)
            setReminder0(true)
            setIsActive(true)
        }
    }, [active, editingBill])
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (saving) return

            const parsed = buildBillFormPayload({
                name,
                description,
                notes,
                icon,
                categoryId,
                frequency,
                dueDayOfMonth,
                amountEstimatedStr,
                startDateYmd: startDate,
                endDateYmd,
                paymentMethod:
                    paymentMethodOption !== BILL_PAYMENT_NONE
                        ? (paymentMethodOption as PaymentMethod)
                        : null,
                paymentCreditCardId,
                reminder3,
                reminder0,
                isActive,
            })

            if (!parsed.ok) {
                toastError(parsed.error)
                return
            }

            const ok = await onSave(
                parsed.payload,
                editingBill?.id ?? null,
            )

            if (ok && closeOnSuccess) {
                onClose()
            }
        },
        [
            saving,
            name,
            description,
            notes,
            icon,
            categoryId,
            frequency,
            dueDayOfMonth,
            amountEstimatedStr,
            startDate,
            endDateYmd,
            paymentMethodOption,
            paymentCreditCardId,
            reminder3,
            reminder0,
            isActive,
            onSave,
            editingBill?.id,
            closeOnSuccess,
            onClose,
        ],
    )

    const fieldsProps: BillFormFieldsProps = {
        name,
        setName,
        description,
        setDescription,
        notes,
        setNotes,
        expenseCategories,
        categoryId,
        setCategoryId,
        icon,
        setIcon,
        frequency,
        setFrequency,
        dueDayOfMonth,
        setDueDayOfMonth,
        amountEstimatedStr,
        setAmountEstimatedStr,
        startDate,
        setStartDateYmd,
        endDateYmd,
        setEndDateYmd,
        paymentMethodOption,
        setPaymentMethodOption,
        paymentCreditCardId,
        setPaymentCreditCardId,
        reminder3,
        setReminder3,
        reminder0,
        setReminder0,
        isActive,
        setIsActive,
        creditCards,
        editingBill,
    }

    const submitDisabled =
        saving || name.trim().length === 0 || startDate.trim().length === 0

    return {
        handleSubmit,
        fieldsProps,
        formTitle: editingBill ? "Editar conta" : "Nova conta a pagar",
        formDescription: editingBill
            ? "Ajuste dados da conta cadastrada."
            : "Contas como luz ou condomínio: você confirma o valor ao pagar.",
        submitDisabled,
        submitLabel: editingBill ? "Salvar" : "Criar conta",
    }
}
