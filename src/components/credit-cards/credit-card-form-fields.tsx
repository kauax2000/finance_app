"use client"

import { useMemo } from "react"
import { Calendar, ChevronDown, Info } from "lucide-react"
import { CreditCardBillingFormPreview } from "@/components/credit-cards/credit-card-billing-form-preview"
import { CreditCardBrandPreview } from "@/components/credit-cards/credit-card-brand-preview"
import {
    formatCardNumberGroups,
    normalizeCardDigits,
} from "@/lib/credit-card-number"
import { CREDIT_CARD_BILLING_FORM } from "@/lib/credit-card-billing-copy"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoneyBrlTyping } from "@/lib/money-brl"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1))

const billingDaySelectTriggerClass = "w-full min-w-0"

function parseDay(s: string): number {
    const n = parseInt(s, 10)
    return Number.isFinite(n) && n >= 1 ? n : 0
}

export type CreditCardFormFieldsProps = {
    /** Bumps when the dialog/card instance resets (for parent remount semantics). */
    formKey: string
    idPrefix: string
    name: string
    onNameChange: (v: string) => void
    cardNumber: string
    onCardNumberChange: (v: string) => void
    /** When editing, shown if the number field is empty. */
    savedLastFour?: string
    closingDay: string
    onClosingDayChange: (v: string) => void
    dueDay: string
    onDueDayChange: (v: string) => void
    creditLimit: string
    onCreditLimitChange: (v: string) => void
    expiryMonth: string
    onExpiryMonthChange: (v: string) => void
    expiryYear: string
    onExpiryYearChange: (v: string) => void
}

function CreditCardBillingSection({
    idPrefix,
    closingDay,
    onClosingDayChange,
    dueDay,
    onDueDayChange,
}: Pick<
    CreditCardFormFieldsProps,
    "idPrefix" | "closingDay" | "onClosingDayChange" | "dueDay" | "onDueDayChange"
>) {
    const showUnusualDueWarning = useMemo(() => {
        const c = parseDay(closingDay)
        const d = parseDay(dueDay)
        return c >= 1 && d >= 1 && d <= c
    }, [closingDay, dueDay])

    return (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3 dark:bg-muted/5">
            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <Calendar
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                    />
                    <p className="text-xs font-medium text-foreground">
                        {CREDIT_CARD_BILLING_FORM.sectionTitle}
                    </p>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                    {CREDIT_CARD_BILLING_FORM.lead}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor={`${idPrefix}-close`} className="text-xs">
                        {CREDIT_CARD_BILLING_FORM.closing.label}
                    </Label>
                    <Select
                        value={closingDay || undefined}
                        onValueChange={onClosingDayChange}
                        required
                    >
                        <SelectTrigger
                            id={`${idPrefix}-close`}
                            className={billingDaySelectTriggerClass}
                        >
                            <SelectValue
                                placeholder={CREDIT_CARD_BILLING_FORM.closing.placeholder}
                            />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            align="start"
                            className="z-[100] min-w-[var(--radix-select-trigger-width)] p-1"
                            sideOffset={6}
                            collisionPadding={12}
                        >
                            {DAY_OPTIONS.map((d) => (
                                <SelectItem
                                    key={d}
                                    value={d}
                                    className="cursor-pointer py-2 pl-2 pr-8"
                                >
                                    {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${idPrefix}-due`} className="text-xs">
                        {CREDIT_CARD_BILLING_FORM.due.label}
                    </Label>
                    <Select
                        value={dueDay || undefined}
                        onValueChange={onDueDayChange}
                        required
                    >
                        <SelectTrigger
                            id={`${idPrefix}-due`}
                            className={billingDaySelectTriggerClass}
                        >
                            <SelectValue
                                placeholder={CREDIT_CARD_BILLING_FORM.due.placeholder}
                            />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            align="start"
                            className="z-[100] min-w-[var(--radix-select-trigger-width)] p-1"
                            sideOffset={6}
                            collisionPadding={12}
                        >
                            {DAY_OPTIONS.map((d) => (
                                <SelectItem
                                    key={d}
                                    value={d}
                                    className="cursor-pointer py-2 pl-2 pr-8"
                                >
                                    {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {showUnusualDueWarning ? (
                <p
                    className="flex items-start gap-1.5 text-[11px] leading-snug text-warning-muted-foreground"
                    role="status"
                >
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {CREDIT_CARD_BILLING_FORM.unusualDueWarning}
                </p>
            ) : null}

            <CreditCardBillingFormPreview closingDay={closingDay} dueDay={dueDay} />

            <Collapsible className="pt-1">
                <CollapsibleTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group h-9 w-full justify-between gap-2 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                        {CREDIT_CARD_BILLING_FORM.collapsible.trigger}
                        <ChevronDown
                            className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                            aria-hidden
                        />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                    <div className="space-y-4 text-[11px] leading-relaxed text-muted-foreground">
                        {CREDIT_CARD_BILLING_FORM.collapsible.sections.map(
                            (section) => (
                                <div key={section.id} className="space-y-1.5">
                                    <p className="text-xs font-medium text-foreground">
                                        {section.title}
                                    </p>
                                    {section.paragraphs.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                    <Alert variant="info" className="gap-2 px-3 py-2.5">
                        <Info className="size-4" aria-hidden />
                        <AlertTitle className="text-xs font-medium">
                            {CREDIT_CARD_BILLING_FORM.results.title}
                        </AlertTitle>
                        <AlertDescription className="text-[11px] leading-snug">
                            <ul className="list-inside list-disc space-y-0.5">
                                {CREDIT_CARD_BILLING_FORM.results.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

export function CreditCardFormFields({
    formKey: _formKey,
    idPrefix,
    name,
    onNameChange,
    cardNumber,
    onCardNumberChange,
    savedLastFour,
    closingDay,
    onClosingDayChange,
    dueDay,
    onDueDayChange,
    creditLimit,
    onCreditLimitChange,
    expiryMonth,
    onExpiryMonthChange,
    expiryYear,
    onExpiryYearChange,
}: CreditCardFormFieldsProps) {
    return (
        <>
            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-name`} className="text-xs">
                    Nome no cartão / apelido
                </Label>
                <Input
                    id={`${idPrefix}-name`}
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Ex: Nubank Roxinho"
                    className="text-sm"
                    required
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-pan`} className="text-xs">
                    Número do cartão
                </Label>
                <Input
                    id={`${idPrefix}-pan`}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={formatCardNumberGroups(cardNumber)}
                    onChange={(e) =>
                        onCardNumberChange(normalizeCardDigits(e.target.value))
                    }
                    placeholder="0000 0000 0000 0000"
                    className="w-full min-w-0 text-sm tabular-nums"
                    required={!savedLastFour}
                />
                {savedLastFour && normalizeCardDigits(cardNumber).length === 0 ? (
                    <p className="text-[11px] leading-snug text-muted-foreground">
                        Final salvo: •••• {savedLastFour}. Deixe em branco para manter ou
                        informe o número completo para alterar.
                    </p>
                ) : (
                    <p className="text-[11px] leading-snug text-muted-foreground">
                        O número completo não é salvo.
                    </p>
                )}
                <CreditCardBrandPreview cardNumber={cardNumber} />
            </div>
            <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">Validade do cartão</p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-exp-m`} className="text-xs">
                            Mês
                        </Label>
                        <Input
                            id={`${idPrefix}-exp-m`}
                            inputMode="numeric"
                            maxLength={2}
                            value={expiryMonth}
                            onChange={(e) =>
                                onExpiryMonthChange(
                                    e.target.value.replace(/\D/g, "").slice(0, 2)
                                )
                            }
                            placeholder="MM"
                            className="text-sm tabular-nums"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-exp-y`} className="text-xs">
                            Ano
                        </Label>
                        <Input
                            id={`${idPrefix}-exp-y`}
                            inputMode="numeric"
                            maxLength={4}
                            value={expiryYear}
                            onChange={(e) =>
                                onExpiryYearChange(
                                    e.target.value.replace(/\D/g, "").slice(0, 4)
                                )
                            }
                            placeholder="AAAA"
                            className="text-sm tabular-nums"
                        />
                    </div>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-limit`} className="text-xs">
                    Limite (opcional)
                </Label>
                <Input
                    id={`${idPrefix}-limit`}
                    type="text"
                    inputMode="decimal"
                    value={creditLimit}
                    onChange={(e) => onCreditLimitChange(formatMoneyBrlTyping(e.target.value))}
                    placeholder="0,00"
                    className="text-sm tabular-nums"
                />
            </div>
            <CreditCardBillingSection
                idPrefix={idPrefix}
                closingDay={closingDay}
                onClosingDayChange={onClosingDayChange}
                dueDay={dueDay}
                onDueDayChange={onDueDayChange}
            />
        </>
    )
}
