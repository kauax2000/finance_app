"use client"

import * as React from "react"

import { FormRadioGroup } from "@/components/ui/form"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type TransactionFilterType = "all" | "income" | "expense"

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

/**
 * O filtro de tipo das barras de transações e de categorias.
 *
 * Era a última bandeja escrita à mão (`transactionSegmentContainerClassName`),
 * com `Button role="tab"` sem foco itinerante: cada aba era uma parada de Tab.
 * Agora é `Tabs` sem `TabsContent`, como as visões de cartões e de contas — o
 * Radix dá as setas, o `aria-selected` e o indicador que desliza.
 */
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
        <Tabs
            value={value}
            onValueChange={(next) => onChange(next as TransactionFilterType)}
            className={cn("w-full md:w-auto", className)}
        >
            <TabsList aria-label="Filtrar por tipo de lançamento" className="w-full md:w-auto">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
}
