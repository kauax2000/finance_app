"use client"

import * as React from "react"
import { ColorTile } from "@/components/ui/color-tile"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleRow,
} from "@/components/ui/collapsible"
import { Field, FieldTitle } from "@/components/ui/field"
import { FormInput, FormSwitch } from "@/components/ui/form"
import { TransactionFormTypeSegment } from "@/components/transactions/transaction-type-segment"
import {
    CategoryColorSwatches,
    CategoryIconGrid,
    CategoryIconPreview,
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import { formatMonthLongPtBr } from "@/lib/transaction-date"

export type CategoryFormBudget = {
    /** YYYY-MM do mês do limite. */
    ym: string
    amount: string
    onAmountChange: (v: string) => void
    repeats: boolean
    onRepeatsChange: (r: boolean) => void
    /** Aberto ao editar quem já tem limite. */
    defaultOpen: boolean
}

/**
 * O formulário de categoria, o mesmo nos três diálogos (a página, o "Nova
 * categoria" de fora e o editar do detalhe): a prévia ao lado do nome, o tipo,
 * a cor, o ícone e, só para despesa, o limite do mês recolhível. Quem salva é
 * o diálogo.
 */
export function CategoryFormFields({
    idPrefix,
    name,
    onNameChange,
    type,
    onTypeChange,
    color,
    onColorChange,
    icon,
    onIconChange,
    budget,
}: {
    idPrefix: string
    name: string
    onNameChange: (v: string) => void
    type: "income" | "expense"
    onTypeChange: (t: "income" | "expense") => void
    color: string
    onColorChange: (c: string) => void
    icon: CategoryIconId
    onIconChange: (i: CategoryIconId) => void
    /** Ausente: o diálogo não oferece limite. */
    budget?: CategoryFormBudget
}) {
    const [ano, mes] = (budget?.ym ?? "").split("-").map(Number)
    const nomeDoMes = budget ? formatMonthLongPtBr(new Date(ano, mes - 1, 1)) : ""

    return (
        <div className="space-y-4 py-4">
            <div className="flex items-end gap-3">
                <ColorTile size="xl" color={color} className="shrink-0">
                    <CategoryIconPreview name={normalizeCategoryIcon(icon)} size="mini" />
                </ColorTile>
                <FormInput
                    id={`${idPrefix}-name`}
                    label="Nome"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
                    placeholder="Ex: Alimentação"
                    required
                    fieldClassName="min-w-0 flex-1"
                />
            </div>

            <Field>
                <FieldTitle>Tipo</FieldTitle>
                <TransactionFormTypeSegment aria-label="Tipo" value={type} onChange={onTypeChange} />
            </Field>

            {/* Títulos, e não `label`: as grades são grupos com o próprio `aria-label`. */}
            <div className="space-y-2">
                <FieldTitle>Cor</FieldTitle>
                <CategoryColorSwatches value={color} onChange={onColorChange} idPrefix={`${idPrefix}-color`} />
            </div>
            <div className="space-y-2">
                <FieldTitle>Ícone</FieldTitle>
                <CategoryIconGrid value={icon} onChange={onIconChange} />
            </div>

            {type === "expense" && budget ? (
                <Collapsible variant="card" defaultOpen={budget.defaultOpen}>
                    <CollapsibleRow trailing="Opcional">Limite do mês</CollapsibleRow>
                    <CollapsibleContent className="space-y-4">
                        <FormInput
                            id={`${idPrefix}-budget`}
                            money
                            label="Valor"
                            description={`Vale para ${nomeDoMes} de ${ano}`}
                            placeholder="Ex: 1.500,00"
                            value={budget.amount}
                            onValueChange={budget.onAmountChange}
                        />
                        <FormSwitch
                            id={`${idPrefix}-repeats`}
                            label="Repetir todo mês"
                            description={
                                budget.repeats
                                    ? "Vale também nos próximos meses"
                                    : `Desligado, vale só em ${nomeDoMes}`
                            }
                            checked={budget.repeats}
                            onCheckedChange={budget.onRepeatsChange}
                        />
                    </CollapsibleContent>
                </Collapsible>
            ) : null}
        </div>
    )
}
