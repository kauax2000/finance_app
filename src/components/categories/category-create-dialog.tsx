"use client"

import * as React from "react"
import {
    Card,
} from "@/components/ui/card"
import { Field, FieldTitle } from "@/components/ui/field"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    CategoryAppearanceFields,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import {
    TransactionFormTypeSegment,
} from "@/components/transactions/transaction-type-segment"
import {
    CustomForm,
    FormCancel,
    FormInput,
    FormSubmit,
} from "@/components/ui/form"
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
import { supabase } from "@/lib/supabase"
import { upsertCategoryBudget } from "@/lib/category-budget-ops"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import {
    formatYearMonth,
    periodBoundsFromYearMonth,
} from "@/lib/budget-month"
import { parseMoneyBrl } from "@/lib/money-brl"
import { toastError, toastErrorWithDescription, toastSuccess } from "@/lib/toast"
import { categoryDetailPath } from "@/config/navigation"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import {
    dispatchFinanceCategoriesMutated,
} from "@/lib/workspace-data-events"

export type CategoryCreateDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    workspaceId: string | null
}

export function CategoryCreateDialog({
    open,
    onOpenChange,
    user,
    workspaceId,
}: CategoryCreateDialogProps) {
    const router = useRouter()
    const budgetMonthYm = React.useMemo(() => formatYearMonth(new Date()), [])
    const dialogBudgetPeriod = React.useMemo(
        () => periodBoundsFromYearMonth(budgetMonthYm),
        [budgetMonthYm]
    )

    const [name, setName] = React.useState("")
    const [type, setType] = React.useState<"income" | "expense">("expense")
    const [color, setColor] = React.useState<string>(CATEGORY_COLORS[0])
    const [icon, setIcon] = React.useState<CategoryIconId>(CATEGORY_ICONS[0])
    const [editBudgetAmount, setEditBudgetAmount] = React.useState("")
    const [saving, setSaving] = React.useState(false)

    const resetForm = React.useCallback(() => {
        setName("")
        setType("expense")
        setColor(CATEGORY_COLORS[0])
        setIcon(CATEGORY_ICONS[0])
        setEditBudgetAmount("")
    }, [])

    React.useEffect(() => {
        if (!open) resetForm()
    }, [open, resetForm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !workspaceId) return

        const trimmedName = name.trim()
        if (!trimmedName) {
            toastError("Informe o nome da categoria", { id: "criar-categoria" })
            return
        }

        // O orçamento é validado antes de criar a categoria: se ele reprovasse
        // depois, a categoria já existiria e um segundo clique a duplicava.
        const rawBudget = type === "expense" ? editBudgetAmount.trim() : ""
        const budgetAmt = rawBudget ? parseMoneyBrl(rawBudget) : null
        if (rawBudget && (budgetAmt === null || budgetAmt <= 0)) {
            toastError("Informe um valor válido em reais, maior que zero", { id: "criar-categoria" })
            return
        }

        setSaving(true)

        const { data: inserted, error: insErr } = await supabase
            .from("categories")
            .insert({
                user_id: user.id,
                workspace_id: workspaceId,
                name: trimmedName,
                type,
                color,
                icon,
            })
            .select("id")
            .single()

        if (insErr) {
            setSaving(false)
            toastError(
                formatSupabasePostgrestError(insErr) ?? "Não foi possível criar a categoria",
                { id: "criar-categoria" },
            )
            return
        }

        const verCategoria = {
            label: "Ver",
            href: categoryDetailPath(inserted.id, { type }),
        }
        let budgetSaved = true
        if (budgetAmt !== null) {
            const { error: budErr } = await upsertCategoryBudget({
                userId: user.id,
                workspaceId,
                categoryId: inserted.id,
                yearMonth: budgetMonthYm,
                amount: budgetAmt,
            })
            if (budErr) {
                // A categoria existe: fecha o diálogo e diz onde terminar.
                budgetSaved = false
                toastErrorWithDescription(
                    "Categoria criada, mas o orçamento não foi salvo",
                    `Defina-o no detalhe da categoria. ${
                        formatSupabasePostgrestError(budErr) ?? ""
                    }`.trim(),
                    { id: "criar-categoria", action: verCategoria },
                )
            }
        }
        if (budgetSaved) {
            toastSuccess("Categoria criada", {
                id: "criar-categoria",
                description: trimmedName,
                action: verCategoria,
            })
        }

        void invokeEdgeJson("dispatch-notifications", {
            body: {
                workspace_id: workspaceId,
                type: "system",
                title: "Categoria criada",
                body: `Você criou a categoria “${trimmedName}”.`,
                metadata: {
                    kind: "category_created",
                    critical: false,
                },
            },
        }).catch(() => {
            /* non-blocking */
        })

        setSaving(false)
        onOpenChange(false)
        resetForm()
        dispatchFinanceCategoriesMutated()
        router.refresh()
    }

    if (!user || !workspaceId) return null

    const description =
        type === "expense"
            ? "Adicione uma categoria. Se for despesa, você pode definir o limite do mês atual."
            : "Adicione uma nova categoria"

    const fieldsBlock = (
        <div className="space-y-4 py-4">
            <FormInput
                id="global-cat-name"
                label="Nome"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                }
                placeholder="Ex: Alimentação"
                required
            />

            <Field>
                <FieldTitle>Tipo</FieldTitle>
                <TransactionFormTypeSegment
                    aria-label="Tipo"
                    value={type}
                    onChange={setType}
                />
            </Field>

            <CategoryAppearanceFields
                color={color}
                onColorChange={setColor}
                icon={icon}
                onIconChange={setIcon}
            />

            {type === "expense" ? (
                <Card variant="muted" padding="sm" className="px-3">
                    <p className="text-xs text-muted-foreground">
                        Limite de despesas para {dialogBudgetPeriod.period_start} a{" "}
                        {dialogBudgetPeriod.period_end}.
                    </p>
                    <FormInput
                        money
                        label="Valor limite (R$)"
                        placeholder="Ex: 1.500,00"
                        value={editBudgetAmount}
                        onValueChange={setEditBudgetAmount}
                    />
                </Card>
            ) : null}
        </div>
    )

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
                <DialogHeader>
                    <DialogTitle>Nova categoria</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <CustomForm
                    pending={saving}
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody className="pb-2">
                        {fieldsBlock}
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose asChild>
                            <FormCancel>Cancelar</FormCancel>
                        </DialogClose>
                        <FormSubmit>Salvar</FormSubmit>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
