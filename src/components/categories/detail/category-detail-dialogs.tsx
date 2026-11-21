"use client"

import { Button } from "@/components/ui/button"
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
import {
    CustomForm,
    FormCancel,
    FormSubmit,
} from "@/components/ui/form"
import { type CategoryIconId } from "@/components/categories/category-appearance-fields"
import {
    CategoryBudgetFields,
    CategoryFormFields,
    explicacaoDoLimite,
} from "@/components/categories/category-form-fields"
import type { Budget, Category } from "@/lib/supabase"
import { ExcluirCategoriaDialog } from "@/components/categories/excluir-categoria-dialog"

type CategoryDetailDialogsProps = {
    category: Category
    yearMonth: string
    budget: Budget | null
    editDialogOpen: boolean
    onEditDialogOpenChange: (open: boolean) => void
    editName: string
    onEditNameChange: (v: string) => void
    editType: "income" | "expense"
    onEditTypeChange: (v: "income" | "expense") => void
    editColor: string
    onEditColorChange: (v: string) => void
    editIcon: CategoryIconId
    onEditIconChange: (v: CategoryIconId) => void
    editBudgetAmount: string
    onEditBudgetAmountChange: (v: string) => void
    editBudgetRepeats: boolean
    onEditBudgetRepeatsChange: (v: boolean) => void
    editSaving: boolean
    editBudgetRemoving: boolean
    onEditBudgetRemove: () => void
    onEditSubmit: (e: React.FormEvent) => void
    /** "Definir limite" / "Editar limite" do ⋯: o diálogo só do limite. */
    limitDialogOpen: boolean
    onLimitDialogOpenChange: (open: boolean) => void
    onLimitSubmit: (e: React.FormEvent) => void
    deleteDialogOpen: boolean
    onDeleteDialogOpenChange: (open: boolean) => void
    deleteDeleting: boolean
    onDeleteConfirm: () => void | Promise<void>
}

export function CategoryDetailDialogs({
    category,
    yearMonth,
    budget,
    editDialogOpen,
    onEditDialogOpenChange,
    editName,
    onEditNameChange,
    editType,
    onEditTypeChange,
    editColor,
    onEditColorChange,
    editIcon,
    onEditIconChange,
    editBudgetAmount,
    onEditBudgetAmountChange,
    editBudgetRepeats,
    onEditBudgetRepeatsChange,
    editSaving,
    editBudgetRemoving,
    onEditBudgetRemove,
    onEditSubmit,
    limitDialogOpen,
    onLimitDialogOpenChange,
    onLimitSubmit,
    deleteDialogOpen,
    onDeleteDialogOpenChange,
    deleteDeleting,
    onDeleteConfirm,
}: CategoryDetailDialogsProps) {
    const editDescription =
        editType === "expense"
            ? "Atualize o nome, o tipo, a aparência e o orçamento do mês selecionado desta categoria."
            : "Atualize o nome, o tipo e a aparência desta categoria."

    const budgetFields = {
        ym: yearMonth,
        amount: editBudgetAmount,
        onAmountChange: onEditBudgetAmountChange,
        repeats: editBudgetRepeats,
        onRepeatsChange: onEditBudgetRepeatsChange,
    }

    const editFields = (
        <CategoryFormFields
            idPrefix="category-edit"
            name={editName}
            onNameChange={onEditNameChange}
            type={editType}
            onTypeChange={onEditTypeChange}
            color={editColor}
            onColorChange={onEditColorChange}
            icon={editIcon}
            onIconChange={onEditIconChange}
            budget={{ ...budgetFields, defaultOpen: Boolean(budget) }}
        />
    )

    const removerLimite = budget ? (
        <Button
            type="button"
            variant="tertiary"
            className="text-destructive"
            disabled={editSaving || editBudgetRemoving}
            onClick={() => void onEditBudgetRemove()}
        >
            Remover limite
        </Button>
    ) : undefined

    return (
        <>
            {/* Diálogo no desktop, gaveta alta no telefone (`surface="auto"`).
                Salvando ou removendo o orçamento, o `pending` segura todo
                pedido de fechar. `fixed` nas duas larguras: o formulário é
                longo, e na gaveta é o `DialogBody` que rola. */}
            <Dialog
                surface="auto"
                pending={editSaving || editBudgetRemoving}
                open={editDialogOpen}
                onOpenChange={onEditDialogOpenChange}
            >
                <DialogContent layout="fixed">
                    <DialogHeader>
                        <DialogTitle>Editar categoria</DialogTitle>
                        <DialogDescription>{editDescription}</DialogDescription>
                    </DialogHeader>
                    <CustomForm
                        pending={editSaving}
                        onSubmit={onEditSubmit}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <DialogBody>
                            {editFields}
                        </DialogBody>
                        <DialogFooter start={editType === "expense" ? removerLimite : undefined}
                        >
                            <DialogClose asChild>
                                <FormCancel>Cancelar</FormCancel>
                            </DialogClose>
                            <FormSubmit disabled={editBudgetRemoving}>
                                Salvar
                            </FormSubmit>
                        </DialogFooter>
                    </CustomForm>
                </DialogContent>
            </Dialog>

            {/* O ⋯ "Definir limite": só o limite, sem o resto da categoria. O
                título repete o item do menu, como o "Editar categoria" repete o
                "Editar". Salva pelo mesmo caminho do orçamento do editar. */}
            <Dialog
                surface="auto"
                pending={editSaving || editBudgetRemoving}
                open={limitDialogOpen}
                onOpenChange={onLimitDialogOpenChange}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{budget ? "Editar limite" : "Definir limite"}</DialogTitle>
                        <DialogDescription>{explicacaoDoLimite(category.name)}</DialogDescription>
                    </DialogHeader>
                    <CustomForm
                        pending={editSaving}
                        onSubmit={onLimitSubmit}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <DialogBody>
                            <CategoryBudgetFields
                                idPrefix="category-limit"
                                name={category.name}
                                budget={budgetFields}
                                explicacao={false}
                            />
                        </DialogBody>
                        <DialogFooter start={removerLimite}>
                            <DialogClose asChild>
                                <FormCancel>Cancelar</FormCancel>
                            </DialogClose>
                            {/* Sem limite e sem valor, não há o que salvar. */}
                            <FormSubmit disabled={editBudgetRemoving || (!budget && !editBudgetAmount.trim())}>
                                Salvar
                            </FormSubmit>
                        </DialogFooter>
                    </CustomForm>
                </DialogContent>
            </Dialog>

            <ExcluirCategoriaDialog
                categoria={category}
                limite={category.type === "expense" && budget ? Number(budget.amount) : null}
                pending={deleteDeleting}
                open={deleteDialogOpen}
                onOpenChange={onDeleteDialogOpenChange}
                onConfirm={() => void onDeleteConfirm()}
            />

        </>
    )
}
