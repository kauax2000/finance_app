"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Field,
    FieldControl,
    FieldLabel,
} from "@/components/ui/field"
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
import {
    CustomForm,
    FormCancel,
    FormInput,
    FormSubmit,
} from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import { ColorTile } from "@/components/ui/color-tile"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxField,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue,
} from "@/components/ui/combobox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

/**
 * O assunto dos toasts do pagamento: o "Pagamento registrado" da tela substitui
 * o erro de validação anterior deste formulário.
 */
export const PAY_BILL_TOAST_ID = "pagar-conta"

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

    // O rótulo do gatilho vem daqui: os itens do combobox só montam com o
    // painel aberto.
    const categoriaEscolhida = categoriesExpense.find((c) => c.id === categoryId)

    const description =
        input?.kind === "virtual_cc"
            ? "A fatura fica marcada como paga. Nenhuma despesa é criada: as compras já estão lançadas no cartão."
            : "Informe o valor real pago. Será criada uma despesa com ele."

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input || !workspaceId) return
        setSaving(true)
        try {
            const amount = parseMoneyBrl(amountStr)
            if (amount == null || amount <= 0) {
                toastError("Informe um valor válido", { id: PAY_BILL_TOAST_ID })
                return
            }
            const catFinal =
                categoryId === CAT_NONE ? null : categoryId
            if (input.kind === "regular" && !catFinal) {
                toastError("Selecione uma categoria", { id: PAY_BILL_TOAST_ID })
                return
            }

            const pm: TransactionPaymentMethod | null =
                pmOption === BILL_PAYMENT_NONE
                    ? null
                    : (pmOption as TransactionPaymentMethod)
            const pcc = pm === "credit_card" ? pccId.trim() || null : null
            if (pm === "credit_card" && !pcc) {
                toastError("Selecione o cartão de crédito", { id: PAY_BILL_TOAST_ID })
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
                toastError(res.error, { id: PAY_BILL_TOAST_ID })
                return
            }

            await onPaid()
            onOpenChange(false)
        } catch (err) {
            // Sem este catch, uma falha ao recarregar depois do pagamento escapava calada.
            toastError(err instanceof Error ? err.message : "Não foi possível registrar o pagamento")
        } finally {
            setSaving(false)
        }
    }

    if (!input) return null

    // Diálogo no desktop, gaveta alta no telefone (`surface="auto"`). Enquanto
    // salva, o `pending` segura todo pedido de fechar.
    return (
        <Dialog
            surface="auto"
            pending={saving}
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent layout="fixed">
                <CustomForm
                    pending={saving}
                    onSubmit={(ev) => void handleSubmit(ev)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>

                    <DialogBody className="scrollbar-thin flex flex-col gap-4">
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
                                    displayStyle="relative"
                                    presets
                                />
                            </FieldControl>
                        </Field>
                        {input.kind === "regular" ? (
                        <>
                        <Field>
                            <FieldLabel>Categoria</FieldLabel>
                            {/* A categoria é obrigatória aqui: não há opção de ausência, e o
                                sentinela vira o `placeholder` (valor vazio). Combobox, e
                                não Select: a pessoa procura a categoria pelo nome. */}
                            <Combobox
                                value={categoryId === CAT_NONE ? "" : categoryId}
                                onValueChange={setCategoryId}
                            >
                                <ComboboxField>
                                    <FieldControl>
                                        <ComboboxTrigger>
                                            <ComboboxValue
                                                placeholder="Escolha uma categoria"
                                                media={
                                                    categoriaEscolhida ? (
                                                        <ColorTile size="xs" color={categoriaEscolhida.color} />
                                                    ) : undefined
                                                }
                                            >
                                                {categoriaEscolhida?.name}
                                            </ComboboxValue>
                                        </ComboboxTrigger>
                                    </FieldControl>
                                </ComboboxField>
                                <ComboboxContent>
                                    <ComboboxInput placeholder="Buscar categoria…" />
                                    <ComboboxList>
                                        <ComboboxEmpty>
                                            Nenhuma categoria com esse nome.
                                        </ComboboxEmpty>
                                        <ComboboxGroup>
                                            {categoriesExpense.map((c) => (
                                                <ComboboxItem
                                                    key={c.id}
                                                    value={c.id}
                                                    media={<ColorTile size="xs" color={c.color} />}
                                                >
                                                    {c.name}
                                                </ComboboxItem>
                                            ))}
                                        </ComboboxGroup>
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </Field>
                        <Field>
                            <FieldLabel>Forma de pagamento</FieldLabel>
                            <Select value={pmOption} onValueChange={setPmOption}>
                                <FieldControl>
                                    <SelectTrigger
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                </FieldControl>
                                <SelectContent>
                                    <SelectItem value={BILL_PAYMENT_NONE} variant="none">
                                        Não informado
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
                    </DialogBody>

                    <DialogFooter>
                        <DialogClose asChild>
                            <FormCancel>Cancelar</FormCancel>
                        </DialogClose>
                        <FormSubmit>
                            {input.kind === "virtual_cc" ? "Marcar como paga" : "Registrar pagamento"}
                        </FormSubmit>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
