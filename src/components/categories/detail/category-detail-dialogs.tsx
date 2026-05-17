"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm } from "@/components/ui/form"
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
import { formatMoneyBrlTyping } from "@/lib/money-brl"
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
    const isMobile = useIsMobile()
    const { period_start: periodStart, period_end: periodEnd } = periodBoundsFromYearMonth(yearMonth)

    const editDescription =
        editType === "expense"
            ? "Atualize o nome, o tipo, a aparência e o orçamento do mês selecionado desta categoria."
            : "Atualize o nome, o tipo e a aparência desta categoria."

    const handleEditOpenChange = (open: boolean) => {
        if (!open && (editSaving || editBudgetRemoving)) return
        onEditDialogOpenChange(open)
    }

    const editFields = (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="category-edit-name">Nome</Label>
                <Input
                    id="category-edit-name"
                    value={editName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onEditNameChange(e.target.value)
                    }
                    placeholder="Ex: Alimentação"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label>Tipo</Label>
                <TransactionFormTypeSegment
                    value={editType}
                    onChange={onEditTypeChange}
                    fullWidth
                />
            </div>
            <CategoryAppearanceFields
                color={editColor}
                onColorChange={onEditColorChange}
                icon={editIcon}
                onIconChange={onEditIconChange}
            />
            {editType === "expense" ? (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                        Limite de despesas para {periodStart} a {periodEnd}.
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="category-edit-budget-amount">Valor limite (R$)</Label>
                        <Input
                            id="category-edit-budget-amount"
                            inputMode="decimal"
                            placeholder="Ex: 1.500,00"
                            value={editBudgetAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                onEditBudgetAmountChange(formatMoneyBrlTyping(e.target.value))
                            }
                        />
                    </div>
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
                </div>
            ) : null}
        </div>
    )

    return (
        <>
            {isMobile ? (
                <Sheet open={editDialogOpen} onOpenChange={handleEditOpenChange}>
                    <SheetContent
                        side="bottom"
                        fillMobileViewport
                        showCloseButton
                        className={mobileFormSheetContentClassName}
                    >
                        <MobileSheetFormDragStrip />
                        <MobileSheetFormStickyHeader
                            title="Editar categoria"
                            description={editDescription}
                        />
                        <CustomForm
                            onSubmit={onEditSubmit}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1 overflow-y-auto px-4">
                                {editFields}
                            </div>
                            <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={editSaving || editBudgetRemoving}
                                    className="h-10 w-full"
                                >
                                    {editSaving ? "Salvando…" : "Salvar"}
                                </Button>
                            </SheetFooter>
                        </CustomForm>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={editDialogOpen} onOpenChange={handleEditOpenChange}>
                    <DialogContent>
                        <CustomForm onSubmit={onEditSubmit}>
                            <DialogHeader>
                                <DialogTitle>Editar categoria</DialogTitle>
                                <DialogDescription>{editDescription}</DialogDescription>
                            </DialogHeader>
                            {editFields}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onEditDialogOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={editSaving || editBudgetRemoving}>
                                    {editSaving ? "Salvando…" : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </CustomForm>
                    </DialogContent>
                </Dialog>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <CategoryDeleteAlertBody categoryName={category.name} />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button" disabled={deleteDeleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            className={buttonVariants({ variant: "destructive" })}
                            disabled={deleteDeleting}
                            onClick={(e) => {
                                e.preventDefault()
                                void onDeleteConfirm()
                            }}
                        >
                            {deleteDeleting ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </>
    )
}
