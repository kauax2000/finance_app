"use client"

import { paymentMethodOptions } from "@/lib/payment-methods"
import {
    FormInput,
    FormTextarea,
} from "@/components/ui/form"
import {
    Field,
    FieldControl,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field"
import { useMemo } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
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
            <FormInput
                id="bill-name"
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Condomínio, Luz, IPTU..."
                autoFocus
            />
            <FormInput
                id="bill-description"
                label="Descrição"
                optional
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes para lembrar do que é a conta"
            />
            <Field>
                <FieldLabel>Categoria (despesa)</FieldLabel>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <FieldControl>
                        <SelectTrigger
                            id="bill-cat"
                            size="sm"
                            className="w-full bg-background shadow-xs"
                            data-slot="select-trigger"
                        >
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                    </FieldControl>
                    <SelectContent>
                        <SelectItem value={BILL_CATEGORY_NONE}>— Sem categoria —</SelectItem>
                        {expenseCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
            {/* Título, e não `label`: a grade é um grupo de botões com o próprio
                `aria-label`, e um `<label>` sem alvo não rotula nada. */}
            <div className="grid gap-2">
                <FieldTitle id="bill-form-icon">Ícone</FieldTitle>
                <CategoryIconGrid
                    value={icon}
                    onChange={setIcon}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                    <FieldLabel>Periodicidade</FieldLabel>
                    <Select
                        value={frequency}
                        onValueChange={(v) => setFrequency(v as BillFrequency)}
                    >
                        <FieldControl>
                            <SelectTrigger
                                size="sm"
                                className="w-full bg-background shadow-xs"
                                data-slot="select-trigger"
                            >
                                <SelectValue />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent>
                            {BILL_FREQUENCY_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field>
                    <FieldLabel>Vencimento (dia)</FieldLabel>
                    <Select
                        value={String(dueDayOfMonth)}
                        onValueChange={(v) => setDueDayOfMonth(Number(v))}
                    >
                        <FieldControl>
                            <SelectTrigger
                                size="sm"
                                className="w-full bg-background shadow-xs"
                                data-slot="select-trigger"
                            >
                                <SelectValue />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent className="max-h-52">
                            {dayOptions.map((d) => (
                                <SelectItem key={d} value={String(d)}>
                                    Dia {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>
            <FormInput
                id="bill-est"
                label="Valor estimado"
                optional
                inputMode="decimal"
                value={amountEstimatedStr}
                onChange={(e) => setAmountEstimatedStr(e.target.value)}
                placeholder="Ex.: 250,90 — só ajuda nas previsões"
                description="Não será lançado automaticamente."
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                    <FieldLabel>Data de início</FieldLabel>
                    <FieldControl>
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
                    </FieldControl>
                </Field>
                <Field>
                    <FieldLabel optional>Encerra em</FieldLabel>
                    <FieldControl>
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
                    </FieldControl>
                </Field>
            </div>
            <Separator />
            <Muted>
                Padrão ao pagar (pode mudar ao confirmar o pagamento).
            </Muted>
            <Field>
                <FieldLabel>Forma de pagamento preferida</FieldLabel>
                <Select
                    value={paymentMethodOption}
                    onValueChange={(next) => {
                        setPaymentMethodOption(next)
                        // O seletor mostrava o primeiro cartão com o estado vazio, e a
                        // conta era salva sem cartão. O primeiro cartão vai para o estado.
                        if (next === "credit_card" && !paymentCreditCardId && creditCards[0]) {
                            setPaymentCreditCardId(creditCards[0].id)
                        }
                    }}
                >
                    <FieldControl>
                        <SelectTrigger
                            size="sm"
                            className="bg-background shadow-xs"
                            data-slot="select-trigger"
                        >
                            <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                    </FieldControl>
                    <SelectContent>
                        <SelectItem value={BILL_PAYMENT_NONE}>— Não definido —</SelectItem>
                        {paymentMethodOptions().map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
            {paymentMethodOption === "credit_card" ? (
                <Field>
                    <FieldLabel>Cartão</FieldLabel>
                    <Select
                        value={paymentCreditCardId}
                        onValueChange={setPaymentCreditCardId}
                    >
                        <FieldControl>
                            <SelectTrigger
                                size="sm"
                                className="bg-background shadow-xs"
                                data-slot="select-trigger"
                            >
                                <SelectValue placeholder="Escolha o cartão" />
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
            <Separator />
            {/* Um grupo de caixas com título é `fieldset` + `legend`. As linhas de
                cada caixa são a regra C, e ficam para a fase dos primitivos. */}
            <FieldSet className="gap-3">
                <FieldLegend variant="label">Lembretes</FieldLegend>
                <div className="flex flex-col gap-3">
                    <Field orientation="horizontal" className="w-auto gap-2">
                        <FieldControl>
                            <Checkbox
                                checked={reminder3}
                                onCheckedChange={(c) =>
                                    setReminder3(c === true)
                                }
                                id="bill-r3"
                            />
                        </FieldControl>
                        <FieldLabel className="cursor-pointer text-sm font-normal">3 dias antes do vencimento</FieldLabel>
                    </Field>
                    <Field orientation="horizontal" className="w-auto gap-2">
                        <FieldControl>
                            <Checkbox
                                checked={reminder0}
                                onCheckedChange={(c) =>
                                    setReminder0(c === true)
                                }
                                id="bill-r0"
                            />
                        </FieldControl>
                        <FieldLabel className="cursor-pointer text-sm font-normal">No dia do vencimento</FieldLabel>
                    </Field>
                </div>
            </FieldSet>
            {editingBill ? (
                <>
                    <Separator />
                    <Field orientation="horizontal" className="w-auto gap-2">
                        <FieldControl>
                            <Checkbox
                                checked={isActive}
                                onCheckedChange={(c) =>
                                    setIsActive(c === true)
                                }
                                id="bill-active"
                            />
                        </FieldControl>
                        <FieldLabel className="cursor-pointer text-sm font-medium">Conta ativa</FieldLabel>
                    </Field>
                </>
            ) : null}
            <FormTextarea
                id="bill-notes"
                label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional — notas internas."
                rows={3}
                className="resize-none shadow-xs"
            />
        </div>
    )
}
