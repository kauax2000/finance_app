"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { FormRadioGroup } from "@/components/ui/form"
import { cn } from "@/lib/utils"

export type TransactionFilterType = "all" | "income" | "expense"

/** Shared chrome for filter + form type segments (matches transaction toolbar). */
export const transactionSegmentContainerClassName =
    "inline-flex h-10 w-full items-stretch gap-0.5 rounded-lg bg-muted/60 p-0.5 ring-1 ring-border/60 md:h-8 md:w-auto dark:bg-muted/40"

export function transactionSegmentTabClassName(selected: boolean) {
    return cn(
        "h-full min-h-0 min-w-0 flex-1 px-2 text-xs font-medium shadow-none md:min-w-[4.25rem] md:flex-none md:px-2.5",
        selected
            ? "relative z-[1] border border-border/80 bg-background text-foreground shadow-sm dark:bg-card dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]"
            : "border border-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
    )
}

const FILTER_TABS: { value: TransactionFilterType; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "expense", label: "Despesas" },
    { value: "income", label: "Receitas" },
]

const FORM_TYPE_TABS: { value: "expense" | "income"; label: string }[] = [
    { value: "expense", label: "Despesas" },
    { value: "income", label: "Receitas" },
]

export type TransactionFormKind = "expense" | "installment" | "income"

const FORM_KIND_TABS: { value: TransactionFormKind; label: string }[] = [
    { value: "expense", label: "Despesa" },
    { value: "installment", label: "Parcelada" },
    { value: "income", label: "Receita" },
]

/**
 * Create flow: despesa simples, compra parcelada, receita.
 *
 * **Ele era um `role="tablist"` dentro de um formulário**, com três `Button
 * role="tab"` — o padrão ARIA de abas anunciado sem `tabpanel`, sem
 * `aria-controls` e sem foco itinerante, para escolher o valor que vai ser
 * gravado. Escolha única num formulário é rádio, e agora é.
 *
 * A chapa (`transactionSegmentContainerClassName`) fica no arquivo porque os
 * **seis** trilhos que de fato são filtro ou aba de página ainda a importam.
 */
export function TransactionFormKindSegment({
    value,
    onChange,
    className,
    label = "Tipo de lançamento",
}: {
    value: TransactionFormKind
    onChange: (next: TransactionFormKind) => void
    className?: string
    label?: React.ReactNode
}) {
    return (
        <FormRadioGroup
            label={label}
            fieldClassName={className}
            variant="card"
            orientation="horizontal"
            value={value}
            onValueChange={(next) => onChange(next as TransactionFormKind)}
            options={FORM_KIND_TABS.map((t) => ({ value: t.value, label: t.label }))}
        />
    )
}

/**
 * O tipo — receita ou despesa — como **campo de formulário**.
 *
 * `fullWidth` saiu: dentro de um `Field` o `fieldVariants` já dá `*:w-full`, e
 * o prop virava no-op. Prop que não faz nada é a classe morta desta base em
 * forma de API — e removê-lo fez o compilador apontar os sete sítios que
 * embrulhavam este componente num `<div className="space-y-2"><Label>Tipo</Label>`,
 * com o rótulo solto que agora é o do próprio campo.
 */
export function TransactionFormTypeSegment({
    value,
    onChange,
    className,
    disabled = false,
    label = "Tipo",
}: {
    value: "income" | "expense"
    onChange: (next: "income" | "expense") => void
    className?: string
    disabled?: boolean
    label?: React.ReactNode
}) {
    return (
        <FormRadioGroup
            label={label}
            fieldClassName={className}
            disabled={disabled}
            variant="card"
            orientation="horizontal"
            value={value}
            onValueChange={(next) => onChange(next as "income" | "expense")}
            options={FORM_TYPE_TABS.map((t) => ({ value: t.value, label: t.label }))}
        />
    )
}

export function TransactionTypeSegment({
    value,
    onChange,
    className,
    includeAll = true,
}: {
    value: TransactionFilterType
    onChange: (next: TransactionFilterType) => void
    className?: string
    includeAll?: boolean
}) {
    const tabs = includeAll ? FILTER_TABS : FILTER_TABS.filter((tab) => tab.value !== "all")
    return (
        <div
            className={cn(transactionSegmentContainerClassName, className)}
            role="tablist"
            aria-label="Filtrar por tipo de lançamento"
        >
            {tabs.map((tab) => {
                const selected = value === tab.value
                return (
                    <Button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        size="sm"
                        variant="tertiary"
                        className={transactionSegmentTabClassName(selected)}
                        onClick={() => onChange(tab.value)}
                    >
                        {tab.label}
                    </Button>
                )
            })}
        </div>
    )
}
