"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Category, CreditCard, Transaction } from "@/lib/supabase"
import type { PaymentMethod } from "@/lib/payment-methods"
import {
    calendarYmdToStorageIso,
    localYmdFromDate,
} from "@/lib/transaction-date"
import {
    equalInstallmentsFromPortion,
    splitTotalAcrossInstallments,
} from "@/lib/installment-amounts"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { totalPurchaseFromPlan } from "@/lib/transaction-installment"
import { toastError } from "@/lib/toast"
import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"
import type {
    InstallmentPlanFormSavePayload,
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"

type RecurringMode = "once" | "daily" | "weekly" | "monthly"

function recurringModeToDb(mode: RecurringMode): {
    isRecurring: boolean
    recurringInterval: "daily" | "weekly" | "monthly" | null
} {
    if (mode === "once") {
        return { isRecurring: false, recurringInterval: null }
    }
    return {
        isRecurring: true,
        recurringInterval: mode,
    }
}

function recurringModeFromTransaction(
    isRecurring: boolean,
    interval: "daily" | "weekly" | "monthly" | null
): RecurringMode {
    if (!isRecurring || !interval) return "once"
    if (interval === "daily" || interval === "weekly" || interval === "monthly") {
        return interval
    }
    return "once"
}

export type UseTransactionFormArgs = {
    active: boolean
    saving: boolean
    editingTransaction: Transaction | null
    defaultLaunchKind?: TransactionFormKind
    categories: Category[]
    creditCards: CreditCard[]
    categoriesHref: string
    creditCardsHref: string
    onSave: (payload: TransactionFormSavePayload) => Promise<boolean>
    onSaveInstallmentPlan?: (
        payload: InstallmentPlanFormSavePayload
    ) => Promise<boolean>
    onUpdateInstallmentPlan?: (
        planId: string,
        payload: InstallmentPlanUpdatePayload
    ) => Promise<boolean>
    /** When false, successful save does not call onClose (e.g. detail sheet returns to view). */
    closeOnSuccess?: boolean
    onClose: () => void
    /** Called after any successful save (before onClose when closeOnSuccess). */
    onSuccess?: () => void
}

export function useTransactionForm({
    active,
    saving,
    editingTransaction,
    defaultLaunchKind = "expense",
    categories,
    creditCards,
    categoriesHref,
    creditCardsHref,
    onSave,
    onSaveInstallmentPlan,
    onUpdateInstallmentPlan,
    closeOnSuccess = true,
    onClose,
    onSuccess,
}: UseTransactionFormArgs) {
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
    const [creditCardPopoverOpen, setCreditCardPopoverOpen] = useState(false)

    const [formKind, setFormKind] = useState<TransactionFormKind>("expense")
    const [type, setType] = useState<"income" | "expense">("expense")
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [date, setDate] = useState(() => localYmdFromDate(new Date()))
    const [recurringMode, setRecurringMode] = useState<RecurringMode>("once")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
        null
    )
    const [paymentCreditCardId, setPaymentCreditCardId] = useState("")
    const [installmentValueMode, setInstallmentValueMode] = useState<
        "total" | "per_installment"
    >("total")
    const [installmentTotal, setInstallmentTotal] = useState("")
    const [installmentPerAmount, setInstallmentPerAmount] = useState("")
    const [installmentCount, setInstallmentCount] = useState("12")
    const [installmentEditScope, setInstallmentEditScope] = useState<
        "slice" | "plan"
    >("slice")

    const segmentMode: "create" | "edit" = editingTransaction
        ? "edit"
        : "create"

    const hasInstallmentPlan = Boolean(editingTransaction?.installment_plan_id)
    const planRef = editingTransaction?.installment_plan ?? null
    const planIsActive = planRef?.is_active === true

    /* eslint-disable react-hooks/set-state-in-effect -- hydrate form fields when opening for edit or create */
    useEffect(() => {
        if (!active) return
        if (editingTransaction) {
            setType(editingTransaction.type)
            setFormKind(
                editingTransaction.type === "income" ? "income" : "expense"
            )
            setAmount(formatMoneyBrlInput(editingTransaction.amount))
            setDescription(editingTransaction.description || "")
            setCategoryId(editingTransaction.category_id || "")
            setDate(localYmdFromDate(new Date(editingTransaction.date)))
            setRecurringMode(
                recurringModeFromTransaction(
                    editingTransaction.is_recurring,
                    editingTransaction.recurring_interval
                )
            )
            setPaymentMethod(
                editingTransaction.type === "expense"
                    ? (editingTransaction.payment_method ?? null)
                    : null
            )
            setPaymentCreditCardId(
                editingTransaction.payment_credit_card_id || ""
            )
            setInstallmentEditScope("slice")
            const p = editingTransaction.installment_plan
            if (p) {
                setInstallmentValueMode("total")
                setInstallmentTotal(formatMoneyBrlInput(totalPurchaseFromPlan(p)))
                setInstallmentPerAmount(formatMoneyBrlInput(p.installment_amount))
                setInstallmentCount(String(p.total_installments))
            } else {
                setInstallmentValueMode("total")
                setInstallmentTotal("")
                setInstallmentPerAmount("")
                setInstallmentCount("12")
            }
        } else {
            setFormKind(defaultLaunchKind)
            setType(defaultLaunchKind === "income" ? "income" : "expense")
            setAmount("")
            setDescription("")
            setCategoryId("")
            setDate(localYmdFromDate(new Date()))
            setRecurringMode("once")
            setPaymentMethod(null)
            setPaymentCreditCardId("")
            setInstallmentValueMode("total")
            setInstallmentTotal("")
            setInstallmentPerAmount("")
            setInstallmentCount("12")
            setInstallmentEditScope("slice")
        }
    }, [active, editingTransaction, defaultLaunchKind])
    /* eslint-enable react-hooks/set-state-in-effect */

    /* eslint-disable react-hooks/set-state-in-effect -- sync form type/panels with launch kind and active state */
    useEffect(() => {
        if (!active || editingTransaction) return
        if (formKind === "income") {
            setType("income")
        } else {
            setType("expense")
        }
    }, [formKind, active, editingTransaction])

    useEffect(() => {
        if (!active) {
            setCategoryPopoverOpen(false)
            setCreditCardPopoverOpen(false)
        }
    }, [active])

    useEffect(() => {
        const cat = categories.find((c) => c.id === categoryId)
        if (categoryId && cat && cat.type !== type) {
            setCategoryId("")
        }
    }, [type, categories, categoryId])

    useEffect(() => {
        if (type === "income") {
            setPaymentMethod(null)
            setPaymentCreditCardId("")
        }
    }, [type])
    /* eslint-enable react-hooks/set-state-in-effect */

    const activeCards = useMemo(
        () => creditCards.filter((c) => c.is_active),
        [creditCards]
    )

    const isInstallmentCreate =
        !editingTransaction && formKind === "installment"

    const isInstallmentPlanEdit =
        Boolean(editingTransaction?.installment_plan_id) &&
        segmentMode === "edit" &&
        installmentEditScope === "plan"

    const syncFieldsForInstallmentScope = useCallback(
        (next: "slice" | "plan") => {
            if (!editingTransaction) return
            if (next === "plan" && editingTransaction.installment_plan) {
                const p = editingTransaction.installment_plan
                setDescription(p.description ?? "")
                setCategoryId(p.category_id ?? "")
                setPaymentMethod(p.payment_method ?? null)
                setPaymentCreditCardId(p.payment_credit_card_id ?? "")
                if (p.next_billing_date) {
                    const d = new Date(p.next_billing_date + "T12:00:00")
                    if (!Number.isNaN(d.getTime())) {
                        setDate(localYmdFromDate(d))
                    }
                }
            } else {
                setDescription(editingTransaction.description ?? "")
                setCategoryId(editingTransaction.category_id ?? "")
                setPaymentMethod(
                    editingTransaction.type === "expense"
                        ? (editingTransaction.payment_method ?? null)
                        : null
                )
                setPaymentCreditCardId(
                    editingTransaction.payment_credit_card_id ?? ""
                )
                setDate(localYmdFromDate(new Date(editingTransaction.date)))
            }
        },
        [editingTransaction]
    )

    const setInstallmentScope = useCallback(
        (next: "slice" | "plan") => {
            syncFieldsForInstallmentScope(next)
            setInstallmentEditScope(next)
        },
        [syncFieldsForInstallmentScope]
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isInstallmentCreate) {
            if (
                paymentMethod === "credit_card" &&
                activeCards.length > 0 &&
                !paymentCreditCardId
            ) {
                toastError("Selecione o cartão de crédito usado nesta compra.")
                return
            }
        }

        if (isInstallmentCreate) {
            if (!onSaveInstallmentPlan) {
                toastError(
                    "Não foi possível salvar o plano parcelado (configuração incompleta)."
                )
                return
            }

            const n = Math.floor(Number.parseInt(installmentCount, 10))
            if (!Number.isFinite(n) || n < 2) {
                toastError("Informe pelo menos 2 parcelas.")
                return
            }

            let installmentAmount = 0
            let finalInstallmentAmount = 0

            if (installmentValueMode === "total") {
                const total = parseMoneyBrl(installmentTotal)
                if (total === null || total <= 0) {
                    toastError("Informe um valor total válido em reais.")
                    return
                }
                const split = splitTotalAcrossInstallments(total, n)
                installmentAmount = split.installmentAmount
                finalInstallmentAmount = split.finalInstallmentAmount
                if (installmentAmount <= 0 || finalInstallmentAmount <= 0) {
                    toastError("Não foi possível dividir o valor nas parcelas.")
                    return
                }
            } else {
                const per = parseMoneyBrl(installmentPerAmount)
                if (per === null || per <= 0) {
                    toastError("Informe o valor de cada parcela em reais.")
                    return
                }
                const eq = equalInstallmentsFromPortion(per, n)
                installmentAmount = eq.installmentAmount
                finalInstallmentAmount = eq.finalInstallmentAmount
            }

            const pm = paymentMethod
            const pcc =
                paymentMethod === "credit_card"
                    ? paymentCreditCardId || null
                    : null

            const ok = await onSaveInstallmentPlan({
                categoryId: categoryId || null,
                description: description.trim() ? description.trim() : null,
                firstBillingYmd: date,
                paymentMethod: pm,
                paymentCreditCardId: pcc,
                totalInstallments: n,
                installmentAmount,
                finalInstallmentAmount,
            })

            if (ok) {
                onSuccess?.()
                if (closeOnSuccess) onClose()
            }
            return
        }

        if (isInstallmentPlanEdit) {
            if (!onUpdateInstallmentPlan || !editingTransaction?.installment_plan_id) {
                toastError(
                    "Não foi possível atualizar o plano parcelado (configuração incompleta)."
                )
                return
            }
            if (
                paymentMethod === "credit_card" &&
                activeCards.length > 0 &&
                !paymentCreditCardId
            ) {
                toastError("Selecione o cartão de crédito usado nesta compra.")
                return
            }

            const plan = editingTransaction.installment_plan
            const gen = plan?.generated_count ?? 0

            const n = Math.floor(Number.parseInt(installmentCount, 10))
            if (!Number.isFinite(n) || n < 2) {
                toastError("Informe pelo menos 2 parcelas.")
                return
            }
            if (n < gen) {
                toastError(
                    `O número de parcelas não pode ser menor que ${gen} (já geradas no plano).`
                )
                return
            }

            let installmentAmount = 0
            let finalInstallmentAmount = 0

            if (installmentValueMode === "total") {
                const total = parseMoneyBrl(installmentTotal)
                if (total === null || total <= 0) {
                    toastError("Informe um valor total válido em reais.")
                    return
                }
                const split = splitTotalAcrossInstallments(total, n)
                installmentAmount = split.installmentAmount
                finalInstallmentAmount = split.finalInstallmentAmount
                if (installmentAmount <= 0 || finalInstallmentAmount <= 0) {
                    toastError("Não foi possível dividir o valor nas parcelas.")
                    return
                }
            } else {
                const per = parseMoneyBrl(installmentPerAmount)
                if (per === null || per <= 0) {
                    toastError("Informe o valor de cada parcela em reais.")
                    return
                }
                const eq = equalInstallmentsFromPortion(per, n)
                installmentAmount = eq.installmentAmount
                finalInstallmentAmount = eq.finalInstallmentAmount
            }

            const pm = paymentMethod
            const pcc =
                paymentMethod === "credit_card"
                    ? paymentCreditCardId || null
                    : null

            const nextBillingYmd = planIsActive ? date : null

            const ok = await onUpdateInstallmentPlan(
                editingTransaction.installment_plan_id,
                {
                    categoryId: categoryId || null,
                    description: description.trim() ? description.trim() : null,
                    paymentMethod: pm,
                    paymentCreditCardId: pcc,
                    totalInstallments: n,
                    installmentAmount,
                    finalInstallmentAmount,
                    nextBillingYmd,
                }
            )

            if (ok) {
                onSuccess?.()
                if (closeOnSuccess) onClose()
            }
            return
        }

        const parsed = parseMoneyBrl(amount)
        if (parsed === null || parsed <= 0) {
            toastError("Informe um valor válido em reais.")
            return
        }

        const { isRecurring, recurringInterval } = recurringModeToDb(recurringMode)

        if (
            type === "expense" &&
            paymentMethod === "credit_card" &&
            activeCards.length > 0 &&
            !paymentCreditCardId
        ) {
            toastError("Selecione o cartão de crédito usado nesta despesa.")
            return
        }

        const pm = type === "expense" ? paymentMethod : null
        const pcc =
            type === "expense" && paymentMethod === "credit_card"
                ? paymentCreditCardId || null
                : null

        const ok = await onSave({
            editingId: editingTransaction?.id ?? null,
            categoryId: categoryId || null,
            type,
            amount: parsed,
            description: description.trim() ? description.trim() : null,
            dateIso: calendarYmdToStorageIso(date),
            isRecurring,
            recurringInterval,
            paymentMethod: pm,
            paymentCreditCardId: pcc,
        })

        if (ok) {
            onSuccess?.()
            if (closeOnSuccess) onClose()
        }
    }

    const showFooter = true

    const fieldsProps = {
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
        dateYmd: date,
        setDateYmd: setDate,
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
        hasInstallmentPlan,
        installmentEditScope,
        setInstallmentEditScope: setInstallmentScope,
        planIsActive,
    }

    const formTitle = editingTransaction
        ? installmentEditScope === "plan" && hasInstallmentPlan
            ? "Plano da compra"
            : "Editar transação"
        : formKind === "installment"
          ? "Compra parcelada"
          : "Nova transação"

    const formDescription = editingTransaction
        ? installmentEditScope === "plan" && hasInstallmentPlan
            ? "Altera o plano; parcelas já lançadas no extrato não mudam automaticamente."
            : "Atualize os dados da transação"
        : formKind === "installment"
          ? "Só as parcelas aparecem no extrato; o total só orienta o cálculo."
          : "Adicione uma nova receita ou despesa"

    const needsCreditCard =
        paymentMethod === "credit_card" &&
        activeCards.length > 0 &&
        !paymentCreditCardId

    const submitDisabled =
        saving ||
        (needsCreditCard &&
            (isInstallmentCreate ||
                isInstallmentPlanEdit ||
                type === "expense"))

    return {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        showFooter,
        submitDisabled,
    }
}