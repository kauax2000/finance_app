"use client"

import {
    Card,
} from "@/components/ui/card"
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
    FormInput,
    FormSubmit,
} from "@/components/ui/form"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TransactionFormTypeSegment } from "@/components/transactions/transaction-type-segment"
import {
    CategoryAppearanceFields,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import type { Budget, Category } from "@/lib/supabase"
import { periodBoundsFromYearMonth } from "@/lib/budget-month"
import { CategoryDeleteAlertBody } from "@/components/categories/category-delete-alert-body"

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
    editSaving: boolean
    editBudgetRemoving: boolean
    onEditBudgetRemove: () => void
    onEditSubmit: (e: React.FormEvent) => void
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
    editSaving,
    editBudgetRemoving,
    onEditBudgetRemove,
    onEditSubmit,
    deleteDialogOpen,
    onDeleteDialogOpenChange,
    deleteDeleting,
    onDeleteConfirm,
}: CategoryDetailDialogsProps) {
    const { period_start: periodStart, period_end: periodEnd } = periodBoundsFromYearMonth(yearMonth)

    const editDescription =
        editType === "expense"
            ? "Atualize o nome, o tipo, a aparência e o orçamento do mês selecionado desta categoria."
            : "Atualize o nome, o tipo e a aparência desta categoria."

    const editFields = (
        <div className="space-y-4 py-4">
            <FormInput
                id="category-edit-name"
                label="Nome"
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onEditNameChange(e.target.value)
                }
                placeholder="Ex: Alimentação"
                required
            />
            <TransactionFormTypeSegment
                value={editType}
                onChange={onEditTypeChange}
            />
            <CategoryAppearanceFields
                color={editColor}
                onColorChange={onEditColorChange}
                icon={editIcon}
                onIconChange={onEditIconChange}
            />
            {editType === "expense" ? (
                <Card variant="muted" padding="sm" className="px-3">
                    <p className="text-xs text-muted-foreground">
                        Limite de despesas para {periodStart} a {periodEnd}.
                    </p>
                    <FormInput
                        money
                        label="Valor limite (R$)"
                        placeholder="Ex: 1.500,00"
                        value={editBudgetAmount}
                        onValueChange={onEditBudgetAmountChange}
                    />
                    {budget ? (
                        <Button
                            type="button"
                            variant="destructive"
                            className="w-full sm:w-auto"
                            disabled={editSaving || editBudgetRemoving}
                            onClick={() => void onEditBudgetRemove()}
                        >
                            {editBudgetRemoving ? "Removendo…" : "Remover orçamento"}
                        </Button>
                    ) : null}
                </Card>
            ) : null}
        </div>
    )

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
                        <DialogFooter>
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

            <AlertDialog pending={deleteDeleting} open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <CategoryDeleteAlertBody categoryName={category.name} />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Excluindo…"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                void onDeleteConfirm()
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </>
    )
}
