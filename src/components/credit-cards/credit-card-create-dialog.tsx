"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormHeaderCloseButton,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { CreditCardFormFields } from "@/components/credit-cards/credit-card-form-fields"
import { parseExpiryFields } from "@/components/credit-cards/credit-card-form-shared"
import { toastError, toastSuccess, toastWarning } from "@/lib/toast"
import { resolveCreditCardForSave } from "@/lib/credit-card-number"
import { createCreditCard } from "@/lib/credit-cards/mutations"
import { dispatchFinanceCreditCardsMutated } from "@/lib/workspace-data-events"

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
    const isMobile = useIsMobile()
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
            toastError(resolved.message)
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
            toastError("Dia de fechamento e vencimento devem ser entre 1 e 31.")
            return
        }

        const exp = parseExpiryFields(expiryMonth, expiryYear)
        if (!exp.ok) {
            toastError(exp.message)
            return
        }

        setSaving(true)
        const limitVal = creditLimit.trim()
            ? parseFloat(creditLimit.replace(",", "."))
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
        const result = await createCreditCard(insertRow)
        setSaving(false)

        if (!result.ok) {
            toastError(result.errorMessage)
            return
        }

        toastSuccess(
            result.queued
                ? "Cartão salvo offline. Será sincronizado quando houver conexão."
                : "Cartão cadastrado."
        )
        resetCreateForm()
        onOpenChange(false)
        dispatchFinanceCreditCardsMutated()
        router.refresh()
    }

    const handleDismiss = (next: boolean) => {
        if (!next && saving) return
        onOpenChange(next)
        if (!next && !saving) resetCreateForm()
    }

    if (!user || !workspaceId) return null

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleDismiss}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton={false}
                    className={mobileFormSheetContentClassName}
                >
                    <MobileSheetFormDragStrip />
                    <MobileSheetFormStickyHeader
                        title="Cadastro de cartão"
                        endAdornment={
                            <MobileSheetFormHeaderCloseButton disabled={saving} />
                        }
                    />
                    <CustomForm
                        onSubmit={handleCreate}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="min-h-0 flex-1 overflow-y-auto px-4">
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
                        </div>
                        <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                            <Button
                                type="submit"
                                size="sm"
                                className="h-10 w-full"
                                disabled={saving}
                            >
                                {saving ? "Salvando…" : "Cadastrar"}
                            </Button>
                        </SheetFooter>
                    </CustomForm>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleDismiss}>
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <CustomForm
                    onSubmit={handleCreate}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                        <DialogTitle>Cadastro de cartão</DialogTitle>
                        <DialogDescription>
                            Dados para identificar o cartão nas despesas (não armazenamos o
                            número completo).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6">
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
                    </div>
                    <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/60 bg-background px-6 pt-4 pb-5 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDismiss(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Salvando…" : "Cadastrar"}
                        </Button>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
