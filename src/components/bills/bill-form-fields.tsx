"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Muted } from "@/components/ui/typography"
import type {
    Bill,
    BillFrequency,
    Category,
    CreditCard,
} from "@/lib/supabase"
import { parseYmdLocal, localYmdFromDate } from "@/lib/transaction-date"
import {
    BILL_CATEGORY_NONE,
    BILL_FREQUENCY_OPTIONS,
    BILL_PAYMENT_OPTIONS,
    BILL_PAYMENT_NONE,
} from "@/components/bills/bill-form-shared"
import {
    CategoryIconGrid,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"

export type BillFormFieldsProps = {
    name: string
    setName: (v: string) => void
    description: string
    setDescription: (v: string) => void
    notes: string
    setNotes: (v: string) => void
    expenseCategories: Category[]
    categoryId: string
    setCategoryId: (v: string) => void
    icon: CategoryIconId
    setIcon: (v: CategoryIconId) => void
    frequency: BillFrequency
    setFrequency: (v: BillFrequency) => void
    dueDayOfMonth: number
    setDueDayOfMonth: (v: number) => void
    amountEstimatedStr: string
    setAmountEstimatedStr: (v: string) => void
    startDate: string
    setStartDateYmd: (v: string) => void
    endDateYmd: string
    setEndDateYmd: (v: string) => void
    paymentMethodOption: string
    setPaymentMethodOption: (v: string) => void
    paymentCreditCardId: string
    setPaymentCreditCardId: (v: string) => void
    reminder3: boolean
    setReminder3: (v: boolean) => void
    reminder0: boolean
    setReminder0: (v: boolean) => void
    isActive: boolean
    setIsActive: (v: boolean) => void
    creditCards: CreditCard[]
    editingBill: Bill | null
}

export function BillFormFields({
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
}: BillFormFieldsProps) {
    const startDateObj = useMemo(
        () => parseYmdLocal(startDate.slice(0, 10)),
        [startDate],
    )

    const endDateObj = useMemo(
        () =>
            endDateYmd.trim()
                ? parseYmdLocal(endDateYmd.slice(0, 10))
                : null,
        [endDateYmd],
    )

    const dayOptions = useMemo(
        () => Array.from({ length: 31 }, (_, i) => i + 1),
        []
    )

    return (
        <div className="flex flex-col gap-4 px-4 pb-4 sm:gap-5 sm:px-5">
            <div className="grid gap-2">
                <Label htmlFor="bill-name">Nome</Label>
                <Input
                    id="bill-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Condomínio, Luz, IPTU..."
                    autoFocus
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="bill-description">Descrição (opcional)</Label>
                <Input
                    id="bill-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes para lembrar do que é a conta"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="bill-cat">Categoria (despesa)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger
                        id="bill-cat"
                        size="sm"
                        className="w-full bg-background shadow-xs"
                        data-slot="select-trigger"
                    >
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={BILL_CATEGORY_NONE}>— Sem categoria —</SelectItem>
                        {expenseCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label id="bill-form-icon">Ícone</Label>
                <CategoryIconGrid
                    value={icon}
                    onChange={setIcon}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Periodicidade</Label>
                    <Select
                        value={frequency}
                        onValueChange={(v) => setFrequency(v as BillFrequency)}
                    >
                        <SelectTrigger
                            size="sm"
                            className="w-full bg-background shadow-xs"
                            data-slot="select-trigger"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {BILL_FREQUENCY_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Vencimento (dia)</Label>
                    <Select
                        value={String(dueDayOfMonth)}
                        onValueChange={(v) => setDueDayOfMonth(Number(v))}
                    >
                        <SelectTrigger
                            size="sm"
                            className="w-full bg-background shadow-xs"
                            data-slot="select-trigger"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-52">
                            {dayOptions.map((d) => (
                                <SelectItem key={d} value={String(d)}>
                                    Dia {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="bill-est">Valor estimado (opcional)</Label>
                <Input
                    id="bill-est"
                    inputMode="decimal"
                    value={amountEstimatedStr}
                    onChange={(e) => setAmountEstimatedStr(e.target.value)}
                    placeholder="Ex.: 250,90 — só ajuda nas previsões"
                />
                <Muted>Não será lançado automaticamente.</Muted>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Data de início</Label>
                    <DatePicker
                        value={
                            startDateObj ?? parseYmdLocal(localYmdFromDate(new Date()))
                        }
                        onChange={(d) =>
                            setStartDateYmd(d ? localYmdFromDate(d) : "")
                        }
                        placeholder="Início da conta"
                        className="text-sm"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Encerra em (opcional)</Label>
                    <DatePicker
                        value={
                            endDateYmd.trim() && endDateObj
                                ? endDateObj
                                : undefined
                        }
                        onChange={(d) =>
                            setEndDateYmd(d ? localYmdFromDate(d) : "")
                        }
                        placeholder="Sem data final"
                        className="text-sm"
                    />
                </div>
            </div>
            <Separator />
            <Muted>
                Padrão ao pagar (pode mudar ao confirmar o pagamento).
            </Muted>
            <div className="grid gap-2">
                <Label>Forma de pagamento preferida</Label>
                <Select
                    value={paymentMethodOption}
                    onValueChange={setPaymentMethodOption}
                >
                    <SelectTrigger
                        size="sm"
                        className="bg-background shadow-xs"
                        data-slot="select-trigger"
                    >
                        <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={BILL_PAYMENT_NONE}>— Não definido —</SelectItem>
                        {BILL_PAYMENT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {paymentMethodOption === "credit_card" ? (
                <div className="grid gap-2">
                    <Label>Cartão</Label>
                    <Select
                        value={
                            paymentCreditCardId ||
                            (creditCards[0]?.id ?? "")
                        }
                        onValueChange={setPaymentCreditCardId}
                    >
                        <SelectTrigger
                            size="sm"
                            className="bg-background shadow-xs"
                            data-slot="select-trigger"
                        >
                            <SelectValue placeholder="Escolha o cartão" />
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
            <Separator />
            <div className="space-y-3">
                <Label>Lembretes</Label>
                <div className="flex flex-col gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                            checked={reminder3}
                            onCheckedChange={(c) =>
                                setReminder3(c === true)
                            }
                            id="bill-r3"
                        />
                        <span>3 dias antes do vencimento</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                            checked={reminder0}
                            onCheckedChange={(c) =>
                                setReminder0(c === true)
                            }
                            id="bill-r0"
                        />
                        <span>No dia do vencimento</span>
                    </label>
                </div>
            </div>
            {editingBill ? (
                <>
                    <Separator />
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <Checkbox
                            checked={isActive}
                            onCheckedChange={(c) =>
                                setIsActive(c === true)
                            }
                            id="bill-active"
                        />
                        <span>Conta ativa</span>
                    </label>
                </>
            ) : null}
            <div className="grid gap-2">
                <Label htmlFor="bill-notes">Observações</Label>
                <Textarea
                    id="bill-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opcional — notas internas."
                    rows={3}
                    className="resize-none shadow-xs"
                />
            </div>
        </div>
    )
}
