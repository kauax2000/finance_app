"use client"

import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    RectangleStackIcon,
} from "@heroicons/react/16/solid"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import type { HeroIcon } from "@/types/navigation"

export type TransactionFilterType = "all" | "income" | "expense"

const FILTER_TABS: { value: TransactionFilterType; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "expense", label: "Despesas" },
    { value: "income", label: "Receitas" },
]

// O `ToggleGroupItem` desenha o ícone em 16px, então `16/solid`.
const FORM_TYPE_TABS: { value: "expense" | "income"; label: string; icon: HeroIcon }[] = [
    { value: "expense", label: "Despesa", icon: ArrowTrendingDownIcon },
    { value: "income", label: "Receita", icon: ArrowTrendingUpIcon },
]

export type TransactionFormKind = "expense" | "installment" | "income"

const FORM_KIND_TABS: { value: TransactionFormKind; label: string; icon: HeroIcon }[] = [
    { value: "expense", label: "Despesa", icon: ArrowTrendingDownIcon },
    { value: "installment", label: "Parcelada", icon: RectangleStackIcon },
    { value: "income", label: "Receita", icon: ArrowTrendingUpIcon },
]

/**
 * O tipo ao criar: despesa simples, compra parcelada ou receita. Escolha de
 * valor num formulário: `ToggleGroup` na pele das abas (`floating`), que o Radix anuncia como
 * rádio (`single`). Eram três cartões de rádio que ocupavam o topo; o título
 * do diálogo já diz o tipo, então o grupo não tem rótulo visível.
 */
export function TransactionFormKindSegment({
    value,
    onChange,
    className,
}: {
    value: TransactionFormKind
    onChange: (next: TransactionFormKind) => void
    className?: string
}) {
    return (
        <ToggleGroup
            type="single"
            variant="floating"
            stretch
            aria-label="Tipo de lançamento"
            value={value}
            onValueChange={(next) => onChange(next as TransactionFormKind)}
            className={className}
        >
            {FORM_KIND_TABS.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value} icon={t.icon}>
                    {t.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

/** O tipo ao editar: despesa ou receita. */
export function TransactionFormTypeSegment({
    value,
    onChange,
    className,
    disabled = false,
    "aria-label": ariaLabel = "Tipo de lançamento",
}: {
    value: "income" | "expense"
    onChange: (next: "income" | "expense") => void
    className?: string
    disabled?: boolean
    "aria-label"?: string
}) {
    return (
        <ToggleGroup
            type="single"
            variant="floating"
            stretch
            aria-label={ariaLabel}
            disabled={disabled}
            value={value}
            onValueChange={(next) => onChange(next as "income" | "expense")}
            className={className}
        >
            {FORM_TYPE_TABS.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value} icon={t.icon}>
                    {t.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

/** Na edição de uma parcela: só ela ou o plano inteiro. */
export function TransactionFormScopeSegment({
    value,
    onChange,
    className,
}: {
    value: "slice" | "plan"
    onChange: (next: "slice" | "plan") => void
    className?: string
}) {
    return (
        <ToggleGroup
            type="single"
            variant="floating"
            stretch
            aria-label="O que editar"
            value={value}
            onValueChange={(next) => onChange(next as "slice" | "plan")}
            className={className}
        >
            <ToggleGroupItem value="slice">Esta parcela</ToggleGroupItem>
            <ToggleGroupItem value="plan">Plano da compra</ToggleGroupItem>
        </ToggleGroup>
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
