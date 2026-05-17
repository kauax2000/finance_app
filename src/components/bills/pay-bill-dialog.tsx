"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { MoneyInput } from "@/components/ui/money-input"
import { toastError } from "@/lib/toast"
import { supabase } from "@/lib/supabase"
import { parseMoneyBrl } from "@/lib/money-brl"
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
            const amt =
                input.instance.amount != null
                    ? String(input.instance.amount)
                    : b.amount_estimated != null
                      ? String(b.amount_estimated)
                      : ""
            setAmountStr(amt.replace(".", ","))
            setPaidYmd(localYmdFromDate(new Date()))
            setCategoryId(b.category_id ?? CAT_NONE)
            const pm = b.default_payment_method
            setPmOption(pm ?? BILL_PAYMENT_NONE)
            setPccId(b.default_payment_credit_card_id ?? "")
            setDesc(b.name)
        } else {
            const v = input.virtual
            setAmountStr(String(v.amount_estimated).replace(".", ","))
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

    const headerBlock = isMobile ? (
        <MobileSheetFormStickyHeader
            title={title}
            description={
                <>
                    Informe o valor real pago. Será criada uma despesa e, se aplicável,
                    a fatura do cartão ficará marcada como paga.
                </>
            }
        />
    ) : (
        <DialogHeader className="flex shrink-0 flex-col gap-1 px-6 pt-6 pb-3 text-left sm:px-6">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <DialogDescription>
                Informe o valor real pago. Será criada uma despesa e, se aplicável,
                a fatura do cartão ficará marcada como paga.
            </DialogDescription>
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
            if (input.kind === "virtual_cc" && categoryId === CAT_NONE) {
                toastError("Selecione uma categoria.")
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
            {isMobile ? <MobileSheetFormDragStrip /> : null}
            {headerBlock}

            <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6">
                <div className="grid gap-2">
                    <Label htmlFor="pay-amt">Valor pago</Label>
                    <MoneyInput
                        id="pay-amt"
                        value={amountStr}
                        onValueChange={(v) => setAmountStr(v)}
                        placeholder="R$ 0,00"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Data do pagamento</Label>
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
                </div>
                <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger
                            data-slot="select-trigger"
                            className="bg-background shadow-xs"
                        >
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={CAT_NONE}>— Escolha —</SelectItem>
                            {categoriesExpense.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={pmOption} onValueChange={setPmOption}>
                        <SelectTrigger
                            data-slot="select-trigger"
                            className="bg-background shadow-xs"
                        >
                            <SelectValue />
                        </SelectTrigger>
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
                </div>
                {pmOption === "credit_card" ? (
                    <div className="grid gap-2">
                        <Label>Cartão</Label>
                        <Select value={pccId || ""} onValueChange={setPccId}>
                            <SelectTrigger
                                data-slot="select-trigger"
                                className="bg-background shadow-xs"
                            >
                                <SelectValue placeholder="Cartão" />
                            </SelectTrigger>
                            <SelectContent>
                                {creditCards.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} · {c.last_four}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}
                <div className="grid gap-2">
                    <Label htmlFor="pay-desc">Descrição no extrato</Label>
                    <Input
                        id="pay-desc"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                    />
                </div>
            </div>

            {isMobile ? (
                <SheetFooter className="gap-3 border-border/80 shrink-0 border-t bg-muted/10 px-4 py-4 sm:flex-col sm:px-5">
                    <Button type="submit" disabled={saving} className="w-full">
                        Registrar pagamento
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        disabled={saving}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                </SheetFooter>
            ) : (
                <DialogFooter className="shrink-0 gap-3 border-border/80 border-t bg-muted/10 px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                        Registrar pagamento
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
                    showCloseButton
                    className={mobileFormSheetContentClassName}
                >
                    {formInner}
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
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                {formInner}
            </DialogContent>
        </Dialog>
    )
}
