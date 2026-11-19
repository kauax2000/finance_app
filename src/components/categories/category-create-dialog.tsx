"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import { CategoryFormFields } from "@/components/categories/category-form-fields"
import {
    CustomForm,
    FormCancel,
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
import { formatYearMonth } from "@/lib/budget-month"
import { parseMoneyBrl } from "@/lib/money-brl"
import { toastError, toastErrorWithDescription, toastSuccess } from "@/lib/toast"
import { categoryDetailPath } from "@/config/navigation"
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

    const [name, setName] = React.useState("")
    const [type, setType] = React.useState<"income" | "expense">("expense")
    const [color, setColor] = React.useState<string>(CATEGORY_COLORS[0])
    const [icon, setIcon] = React.useState<CategoryIconId>(CATEGORY_ICONS[0])
    const [editBudgetAmount, setEditBudgetAmount] = React.useState("")
    const [editBudgetRepeats, setEditBudgetRepeats] = React.useState(true)
    const [saving, setSaving] = React.useState(false)

    const resetForm = React.useCallback(() => {
        setName("")
        setType("expense")
        setColor(CATEGORY_COLORS[0])
        setIcon(CATEGORY_ICONS[0])
        setEditBudgetAmount("")
        setEditBudgetRepeats(true)
    }, [])

    // Limpa ao abrir, e não ao fechar: limpar no fechar trocava o conteúdo durante
    // a animação de saída. No render, e não num efeito, para a abertura já nascer
    // limpa, sem um quadro com o rascunho anterior.
    const [abertoAntes, setAbertoAntes] = React.useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        if (open) resetForm()
    }

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
                repeats: editBudgetRepeats,
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

        setSaving(false)
        onOpenChange(false)
        dispatchFinanceCategoriesMutated()
        router.refresh()
    }

    if (!user || !workspaceId) return null

    const description =
        type === "expense"
            ? "Adicione uma categoria. Se for despesa, você pode definir o limite do mês atual."
            : "Adicione uma nova categoria"

    const fieldsBlock = (
        <CategoryFormFields
            idPrefix="global-cat"
            name={name}
            onNameChange={setName}
            type={type}
            onTypeChange={setType}
            color={color}
            onColorChange={setColor}
            icon={icon}
            onIconChange={setIcon}
            budget={{
                ym: budgetMonthYm,
                amount: editBudgetAmount,
                onAmountChange: setEditBudgetAmount,
                repeats: editBudgetRepeats,
                onRepeatsChange: setEditBudgetRepeats,
                defaultOpen: false,
            }}
        />
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
