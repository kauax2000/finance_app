"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Field,
    FieldControl,
    FieldLabel,
} from "@/components/ui/field"
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { CustomForm, FormInput } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { toastError } from "@/lib/toast"
import { supabase } from "@/lib/supabase"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { currencyBRL } from "@/lib/formatters"
import type {
    Category,
    CreditCard,
    TransactionPaymentMethod,
} from "@/lib/supabase"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { paymentMethodOptions } from "@/lib/payment-methods"
import { BILL_PAYMENT_NONE } from "@/components/bills/bill-form-shared"
import {
    executePayBillFlow,
    type PayBillInput,
} from "@/lib/bills/pay-bill-flow"
import type { User } from "@supabase/supabase-js"

const CAT_NONE = "__none__"

type PayBillDialogProps = {
    open: boolean
    onOpenChange: (v: boolean) => void
    user: User
    workspaceId: string | null | undefined
    input: PayBillInput | null
    categoriesExpense: Category[]
    creditCards: CreditCard[]
    saving: boolean
    setSaving: (v: boolean) => void
    onPaid: () => Promise<void>
}

export function PayBillDialog({
    open,
    onOpenChange,
    user,
    workspaceId,
    input,
    categoriesExpense,
    creditCards,
    saving,
    setSaving,
    onPaid,
}: PayBillDialogProps) {
    const isMobile = useIsMobile()
    const [amountStr, setAmountStr] = useState("")
    const [paidYmd, setPaidYmd] = useState(() => localYmdFromDate(new Date()))
    const [categoryId, setCategoryId] = useState(CAT_NONE)
    const [pmOption, setPmOption] = useState<string>(BILL_PAYMENT_NONE)
    const [pccId, setPccId] = useState("")
    const [desc, setDesc] = useState("")

    useEffect(() => {
        if (!open || !input) return
        if (input.kind === "regular") {
            const b = input.bill
            const amt = input.instance.amount ?? b.amount_estimated
            setAmountStr(amt != null ? formatMoneyBrlInput(amt) : "")
            setPaidYmd(localYmdFromDate(new Date()))
            setCategoryId(b.category_id ?? CAT_NONE)
            const pm = b.default_payment_method
            setPmOption(pm ?? BILL_PAYMENT_NONE)
            setPccId(b.default_payment_credit_card_id ?? "")
            setDesc(b.name)
        } else {
            const v = input.virtual
            setAmountStr(formatMoneyBrlInput(v.amount_estimated))
            setPaidYmd(localYmdFromDate(new Date()))
            setCategoryId(CAT_NONE)
            setPmOption("credit_card")
            setPccId(v.credit_card_id)
            setDesc(`Fatura ${v.cardName} · ${v.last_four}`)
        }
    }, [open, input])

    const title = useMemo(() => {
        if (!input) return "Pagar"
        if (input.kind === "regular") return `Pagar · ${input.bill.name}`
        return `Pagar fatura · ${input.virtual.cardName}`
    }, [input])

    const description =
        input?.kind === "virtual_cc"
            ? "A fatura fica marcada como paga. Nenhuma despesa é criada: as compras já estão lançadas no cartão."
            : "Informe o valor real pago. Será criada uma despesa com ele."

    const headerBlock = isMobile ? (
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
    ) : (
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input || !workspaceId) return
        setSaving(true)
        try {
            const amount = parseMoneyBrl(amountStr)
            if (amount == null || amount <= 0) {
                toastError("Informe um valor válido.")
                return
            }
            const catFinal =
                categoryId === CAT_NONE ? null : categoryId
            if (input.kind === "regular" && !catFinal) {
                toastError("Selecione uma categoria.")
                return
            }

            const pm: TransactionPaymentMethod | null =
                pmOption === BILL_PAYMENT_NONE
                    ? null
                    : (pmOption as TransactionPaymentMethod)
            const pcc = pm === "credit_card" ? pccId.trim() || null : null
            if (pm === "credit_card" && !pcc) {
                toastError("Selecione o cartão de crédito.")
                return
            }
            const res = await executePayBillFlow({
                supabase,
                user,
                workspaceId,
                input,
                payload: {
                    amount,
                    paidDateYmd: paidYmd,
                    categoryId: catFinal,
                    paymentMethod: pm,
                    paymentCreditCardId: pcc,
                    description: desc.trim() || null,
                },
            })

            if (!res.ok) {
                toastError(res.error)
                return
            }

            await onPaid()
            onOpenChange(false)
        } catch (err) {
            // Sem este catch, uma falha ao recarregar depois do pagamento escapava calada.
            toastError(err instanceof Error ? err.message : "Não foi possível registrar o pagamento.")
        } finally {
            setSaving(false)
        }
    }

    if (!input) return null

    const formInner = (
        <CustomForm
            onSubmit={(ev) => void handleSubmit(ev)}
            className="flex min-h-0 flex-1 flex-col"
        >
            {headerBlock}

            <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6">
                {input.kind === "regular" ? (
                    <FormInput
                        money
                        mono
                        label="Valor pago"
                        value={amountStr}
                        onValueChange={(v) => setAmountStr(v)}
                        placeholder="R$ 0,00"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Valor da fatura:{" "}
                        <span className="nums font-medium text-foreground">
                            {currencyBRL(input.virtual.amount_estimated)}
                        </span>
                    </p>
                )}
                <Field>
                    <FieldLabel>Data do pagamento</FieldLabel>
                    <FieldControl>
                        <DatePicker
                            value={
                                parseYmdLocal(paidYmd.slice(0, 10)) ??
                                new Date()
                            }
                            onChange={(d) =>
                                setPaidYmd(
                                    d ? localYmdFromDate(d) : localYmdFromDate(new Date()),
                                )
                            }
                            className="text-sm"
                        />
                    </FieldControl>
                </Field>
                {input.kind === "regular" ? (
                <>
                <Field>
                    <FieldLabel>Categoria</FieldLabel>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <FieldControl>
                            <SelectTrigger
                                data-slot="select-trigger"
                                className="bg-background shadow-xs"
                            >
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent>
                            <SelectItem value={CAT_NONE}>— Escolha —</SelectItem>
                            {categoriesExpense.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field>
                    <FieldLabel>Forma de pagamento</FieldLabel>
                    <Select value={pmOption} onValueChange={setPmOption}>
                        <FieldControl>
                            <SelectTrigger
                                data-slot="select-trigger"
                                className="bg-background shadow-xs"
                            >
                                <SelectValue />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent>
                            <SelectItem value={BILL_PAYMENT_NONE}>
                                — Não especificado —
                            </SelectItem>
                            {paymentMethodOptions().map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                {pmOption === "credit_card" ? (
                    <Field>
                        <FieldLabel>Cartão</FieldLabel>
                        <Select value={pccId || ""} onValueChange={setPccId}>
                            <FieldControl>
                                <SelectTrigger
                                    data-slot="select-trigger"
                                    className="bg-background shadow-xs"
                                >
                                    <SelectValue placeholder="Cartão" />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent>
                                {creditCards.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} · {c.last_four}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                ) : null}
                <FormInput
                    id="pay-desc"
                    label="Descrição no extrato"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                />
                </>
                ) : null}
            </div>

            {isMobile ? (
                <DialogFooter className="gap-3 sm:flex-col">
                    <Button type="submit" disabled={saving} className="w-full">
                        {input.kind === "virtual_cc" ? "Marcar como paga" : "Registrar pagamento"}
                    </Button>
                    <Button
                        type="button"
                        variant="tertiary"
                        className="w-full"
                        disabled={saving}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                </DialogFooter>
            ) : (
                <DialogFooter className="gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {input.kind === "virtual_cc" ? "Marcar como paga" : "Registrar pagamento"}
                    </Button>
                </DialogFooter>
            )}
        </CustomForm>
    )

    if (isMobile) {
        return (
            <Sheet
                open={open}
                onOpenChange={(v) => {
                    if (!v && saving) return
                    onOpenChange(v)
                }}
            >
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                >
                    {formInner}
                <DialogCloseButton />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v && saving) return
                onOpenChange(v)
            }}
        >
            <DialogContent layout="fixed">
                {formInner}
            </DialogContent>
        </Dialog>
    )
}
