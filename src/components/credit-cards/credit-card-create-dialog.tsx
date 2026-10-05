"use client"

import { parseMoneyBrl } from "@/lib/money-brl"
import * as React from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCardFormFields } from "@/components/credit-cards/credit-card-form-fields"
import { parseExpiryFields } from "@/components/credit-cards/credit-card-form-shared"
import { toastError, toastSuccess, toastWarning } from "@/lib/toast"
import { creditCardDetailPath } from "@/config/navigation"
import { resolveCreditCardForSave } from "@/lib/credit-card-number"
import { createCreditCard } from "@/lib/credit-cards/mutations"
import { dispatchFinanceCreditCardsMutated } from "@/lib/workspace-data-events"

/** O assunto dos toasts do formulário: o sucesso substitui o erro anterior. */
const TOAST_ID = "cadastrar-cartao"

export type CreditCardCreateDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    workspaceId: string | null
}

export function CreditCardCreateDialog({
    open,
    onOpenChange,
    user,
    workspaceId,
}: CreditCardCreateDialogProps) {
    const router = useRouter()
    const [createFormKey, setCreateFormKey] = React.useState(0)
    const [saving, setSaving] = React.useState(false)

    const [name, setName] = React.useState("")
    const [cardNumber, setCardNumber] = React.useState("")
    const [closingDay, setClosingDay] = React.useState("")
    const [dueDay, setDueDay] = React.useState("")
    const [creditLimit, setCreditLimit] = React.useState("")
    const [expiryMonth, setExpiryMonth] = React.useState("")
    const [expiryYear, setExpiryYear] = React.useState("")

    const resetCreateForm = React.useCallback(() => {
        setName("")
        setCardNumber("")
        setClosingDay("")
        setDueDay("")
        setCreditLimit("")
        setExpiryMonth("")
        setExpiryYear("")
    }, [])

    React.useEffect(() => {
        if (open) {
            setCreateFormKey((k) => k + 1)
        }
    }, [open])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !workspaceId) return

        const resolved = resolveCreditCardForSave({
            digits: cardNumber,
            mode: "create",
        })
        if (!resolved.ok) {
            toastError(resolved.message, { id: TOAST_ID })
            return
        }
        if (resolved.luhnWarning) {
            toastWarning(
                "O número informado pode estar incorreto. Verifique os dígitos."
            )
        }
        const closeN = parseInt(closingDay, 10)
        const dueN = parseInt(dueDay, 10)
        if (
            Number.isNaN(closeN) ||
            closeN < 1 ||
            closeN > 31 ||
            Number.isNaN(dueN) ||
            dueN < 1 ||
            dueN > 31
        ) {
            toastError("Dia de fechamento e vencimento devem ser entre 1 e 31", { id: TOAST_ID })
            return
        }

        const exp = parseExpiryFields(expiryMonth, expiryYear)
        if (!exp.ok) {
            toastError(exp.message, { id: TOAST_ID })
            return
        }

        setSaving(true)
        const limitVal = creditLimit.trim()
            ? (parseMoneyBrl(creditLimit) ?? NaN)
            : null
        const insertRow = {
            workspace_id: workspaceId,
            user_id: user.id,
            name: name.trim(),
            last_four: resolved.lastFour,
            brand: resolved.brand,
            closing_day: closeN,
            due_day: dueN,
            credit_limit:
                limitVal !== null && !Number.isNaN(limitVal) ? limitVal : null,
            is_active: true,
            ...(exp.month != null && exp.year != null
                ? { expiry_month: exp.month, expiry_year: exp.year }
                : {}),
        }
        let result: Awaited<ReturnType<typeof createCreditCard>>
        try {
            result = await createCreditCard(insertRow)
        } catch {
            toastError("Não foi possível cadastrar o cartão", { id: TOAST_ID })
            return
        } finally {
            // Se a criação lançar, o botão não fica preso em "salvando".
            setSaving(false)
        }

        if (!result.ok) {
            toastError(result.errorMessage, { id: TOAST_ID })
            return
        }

        if (result.queued) {
            toastSuccess("Cartão salvo offline", {
                id: TOAST_ID,
                description: "Será sincronizado quando houver conexão",
            })
        } else {
            toastSuccess("Cartão cadastrado", {
                id: TOAST_ID,
                action: { label: "Ver", href: creditCardDetailPath(result.cardId) },
            })
        }
        resetCreateForm()
        onOpenChange(false)
        dispatchFinanceCreditCardsMutated()
        router.refresh()
    }

    // Enquanto salva, o `pending` do `Dialog` já segura todo pedido de fechar.
    const handleDismiss = (next: boolean) => {
        onOpenChange(next)
        if (!next) resetCreateForm()
    }

    if (!user || !workspaceId) return null

    // Diálogo no desktop, gaveta alta no telefone (`surface="auto"`).
    return (
        <Dialog
            surface="auto"
            pending={saving}
            open={open}
            onOpenChange={handleDismiss}
        >
            <DialogContent layout="fixed">
                <CustomForm
                    pending={saving}
                    onSubmit={handleCreate}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogHeader>
                        <DialogTitle>Cadastro de cartão</DialogTitle>
                        <DialogDescription>
                            Dados para identificar o cartão nas despesas (não armazenamos o
                            número completo).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <div className="space-y-3 pb-2">
                            <CreditCardFormFields
                                formKey={`create-global-${createFormKey}`}
                                idPrefix="cc-global-new"
                                name={name}
                                onNameChange={setName}
                                cardNumber={cardNumber}
                                onCardNumberChange={setCardNumber}
                                closingDay={closingDay}
                                onClosingDayChange={setClosingDay}
                                dueDay={dueDay}
                                onDueDayChange={setDueDay}
                                creditLimit={creditLimit}
                                onCreditLimitChange={setCreditLimit}
                                expiryMonth={expiryMonth}
                                onExpiryMonthChange={setExpiryMonth}
                                expiryYear={expiryYear}
                                onExpiryYearChange={setExpiryYear}
                            />
                        </div>
                    </DialogBody>
                    <DialogFooter className="sm:gap-3">
                        <DialogClose asChild>
                            <FormCancel>Cancelar</FormCancel>
                        </DialogClose>
                        <FormSubmit>Cadastrar</FormSubmit>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
