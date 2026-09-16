"use client"

import { CalendarIcon, InformationCircleIcon } from "@heroicons/react/16/solid"
import {
    Field,
    FieldControl,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"
import { useMemo } from "react"
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
    CollapsibleMarker,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FormInput } from "@/components/ui/form"
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
                    <CalendarIcon
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                    />
                    <p className="text-xs font-medium text-foreground">
                        {CREDIT_CARD_BILLING_FORM.sectionTitle}
                    </p>
                </div>
                <p className="text-2xs leading-snug text-muted-foreground">
                    {CREDIT_CARD_BILLING_FORM.lead}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Field size="sm">
                    <FieldLabel>{CREDIT_CARD_BILLING_FORM.closing.label}</FieldLabel>
                    <Select
                        value={closingDay || undefined}
                        onValueChange={onClosingDayChange}
                        required
                    >
                        {/* O embrulho vai no gatilho, não na raiz do `Select`. */}
                        <FieldControl>
                            <SelectTrigger
                                id={`${idPrefix}-close`}
                                className={billingDaySelectTriggerClass}
                            >
                                <SelectValue
                                    placeholder={CREDIT_CARD_BILLING_FORM.closing.placeholder}
                                />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent
                            align="start"
                            className="min-w-[var(--radix-select-trigger-width)] p-1"
                            sideOffset={6}
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
                </Field>
                <Field size="sm">
                    <FieldLabel>{CREDIT_CARD_BILLING_FORM.due.label}</FieldLabel>
                    <Select
                        value={dueDay || undefined}
                        onValueChange={onDueDayChange}
                        required
                    >
                        {/* O embrulho vai no gatilho, não na raiz do `Select`. */}
                        <FieldControl>
                            <SelectTrigger
                                id={`${idPrefix}-due`}
                                className={billingDaySelectTriggerClass}
                            >
                                <SelectValue
                                    placeholder={CREDIT_CARD_BILLING_FORM.due.placeholder}
                                />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent
                            align="start"
                            className="min-w-[var(--radix-select-trigger-width)] p-1"
                            sideOffset={6}
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
                </Field>
            </div>

            {showUnusualDueWarning ? (
                <p
                    className="flex items-start gap-1.5 text-2xs leading-snug text-warning-muted-foreground"
                    role="status"
                >
                    <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {CREDIT_CARD_BILLING_FORM.unusualDueWarning}
                </p>
            ) : null}

            <CreditCardBillingFormPreview closingDay={closingDay} dueDay={dueDay} />

            <Collapsible className="pt-1">
                <CollapsibleTrigger asChild>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="sm"
                        className="h-9 w-full justify-between gap-2 px-2 text-xs font-medium text-muted-foreground hover:text-foreground active:text-foreground"
                    >
                        {CREDIT_CARD_BILLING_FORM.collapsible.trigger}
                        <CollapsibleMarker />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                    <div className="space-y-4 text-2xs leading-relaxed text-muted-foreground">
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
                    <Alert tone="info" size="sm">
                        <InformationCircleIcon aria-hidden />
                        <AlertTitle>
                            {CREDIT_CARD_BILLING_FORM.results.title}
                        </AlertTitle>
                        <AlertDescription className="text-2xs leading-snug">
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
            <FormInput
                id={`${idPrefix}-name`}
                fieldSize="sm"
                label="Nome no cartão / apelido"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Ex: Nubank Roxinho"
                className="text-sm"
                required
            />
            <div className="space-y-1.5">
                <FormInput
                    id={`${idPrefix}-pan`}
                    fieldSize="sm"
                    label="Número do cartão"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={formatCardNumberGroups(cardNumber)}
                    onChange={(e) =>
                        onCardNumberChange(normalizeCardDigits(e.target.value))
                    }
                    placeholder="0000 0000 0000 0000"
                    className="w-full min-w-0 text-sm tabular-nums"
                    required={!savedLastFour}
                    description={
                        savedLastFour && normalizeCardDigits(cardNumber).length === 0
                            ? `Final salvo: •••• ${savedLastFour}. Deixe em branco para manter ou informe o número completo para alterar.`
                            : "O número completo não é salvo."
                    }
                />
                <CreditCardBrandPreview cardNumber={cardNumber} />
            </div>
            {/* Mês e ano são um grupo com título: `fieldset` + `legend`, e não um
                `<p>` solto que o leitor de tela não liga aos dois campos. */}
            <FieldSet size="sm" className="gap-1.5">
                <FieldLegend variant="label" className="text-foreground">
                    Validade do cartão
                </FieldLegend>
                <div className="grid grid-cols-2 gap-3">
                    <FormInput
                        id={`${idPrefix}-exp-m`}
                        label="Mês"
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
                    <FormInput
                        id={`${idPrefix}-exp-y`}
                        label="Ano"
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
            </FieldSet>
            <FormInput
                money
                fieldSize="sm"
                label="Limite"
                optional
                value={creditLimit}
                onValueChange={onCreditLimitChange}
                placeholder="0,00"
            />
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
