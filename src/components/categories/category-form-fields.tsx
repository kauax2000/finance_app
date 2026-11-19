"use client"

import * as React from "react"
import { ColorTile } from "@/components/ui/color-tile"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleRow,
} from "@/components/ui/collapsible"
import { Field, FieldTitle } from "@/components/ui/field"
import { FormInput } from "@/components/ui/form"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TransactionFormTypeSegment } from "@/components/transactions/transaction-type-segment"
import {
    CategoryColorSwatches,
    CategoryIconGrid,
    CategoryIconPreview,
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import { mesNaFrase } from "@/components/categories/categorias-do-mes"
import { shiftYearMonth } from "@/lib/budget-month"

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
 * a cor, o ícone e, só para despesa, o limite de gasto recolhível. Quem salva é
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
    const anoAtual = new Date().getFullYear()
    const nomeDoMes = budget ? mesNaFrase(budget.ym, anoAtual) : ""
    const proximoMes = budget ? mesNaFrase(shiftYearMonth(budget.ym, 1), anoAtual) : ""
    const nomeDaCategoria = name.trim()

    return (
        <div className="space-y-4">
            {/* O ladrilho acompanha o campo, e não a base da linha: com a mensagem de
                erro embaixo do campo, a base desce e levava o ladrilho junto. `mt-7`
                é a altura do rótulo; a caixa tem a altura do campo (36, 44 no dedo). */}
            <div className="flex items-start gap-3">
                <ColorTile size="lg" color={color} className="mt-7 shrink-0 pointer-coarse:size-11">
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
                <Collapsible variant="card" defaultOpen={budget.defaultOpen} className="bg-card/50">
                    <CollapsibleRow trailing="Opcional" underline={false}>Limite de gasto</CollapsibleRow>
                    <CollapsibleContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Um teto para o que você gasta {nomeDaCategoria ? `em ${nomeDaCategoria}` : "nesta categoria"} por
                            mês. Avisamos em 80% e ao passar dele.
                        </p>
                        <FormInput
                            id={`${idPrefix}-budget`}
                            money
                            label="Valor"
                            placeholder="Ex: 1.500,00"
                            value={budget.amount}
                            onValueChange={budget.onAmountChange}
                        />
                        {/* Toggle, e não abas: a escolha não muda o formulário, só a frase. */}
                        <div className="space-y-2">
                            <ToggleGroup
                                type="single"
                                variant="segmented"
                                stretch
                                aria-label="Quando o limite vale"
                                value={budget.repeats ? "todo-mes" : "so-este"}
                                onValueChange={(v) => {
                                    if (v) budget.onRepeatsChange(v === "todo-mes")
                                }}
                            >
                                <ToggleGroupItem value="todo-mes">Todo mês</ToggleGroupItem>
                                <ToggleGroupItem value="so-este">Só em {nomeDoMes}</ToggleGroupItem>
                            </ToggleGroup>
                            <p className="text-xs text-muted-foreground" aria-live="polite">
                                {budget.repeats
                                    ? "O mesmo valor começa sozinho todo dia 1, até você mudar."
                                    : `Vale só em ${nomeDoMes}. Em ${proximoMes}, ${nomeDaCategoria || "a categoria"} fica sem limite.`}
                            </p>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ) : null}
        </div>
    )
}
