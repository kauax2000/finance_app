"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import type { Category, CreditCard, Transaction } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import { TransactionFormSurface } from "@/components/transactions/transaction-form-surface"
import { useTransactionForm } from "@/components/transactions/transaction-form-use"
import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"
import type {
    InstallmentPlanFormSavePayload,
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"

export type {
    InstallmentPlanFormSavePayload,
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"

type TransactionFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingTransaction: Transaction | null
    /** When opening for create (no `editingTransaction`), initial tab. */
    defaultLaunchKind?: TransactionFormKind
    categories: Category[]
    creditCards: CreditCard[]
    categoriesHref: string
    creditCardsHref: string
    saving: boolean
    onSave: (payload: TransactionFormSavePayload) => Promise<boolean>
    onSaveInstallmentPlan?: (
        payload: InstallmentPlanFormSavePayload
    ) => Promise<boolean>
    onUpdateInstallmentPlan?: (
        planId: string,
        payload: InstallmentPlanUpdatePayload
    ) => Promise<boolean>
}

export function TransactionFormDialog({
    open,
    onOpenChange,
    editingTransaction,
    defaultLaunchKind = "expense",
    categories,
    creditCards,
    categoriesHref,
    creditCardsHref,
    saving,
    onSave,
    onSaveInstallmentPlan,
    onUpdateInstallmentPlan,
}: TransactionFormDialogProps) {
    const isMobile = useIsMobile()

    const {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        showFooter,
        submitDisabled,
    } = useTransactionForm({
        active: open,
        saving,
        editingTransaction,
        defaultLaunchKind,
        categories,
        creditCards,
        categoriesHref,
        creditCardsHref,
        onSave,
        onSaveInstallmentPlan,
        onUpdateInstallmentPlan,
        closeOnSuccess: true,
        onClose: () => onOpenChange(false),
    })

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton={false}
                    className="flex w-full flex-col gap-0 overflow-hidden rounded-t-2xl px-0 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
                >
                    <TransactionFormSurface
                        variant="dialog-mobile"
                        handleSubmit={handleSubmit}
                        fieldsProps={fieldsProps}
                        formTitle={formTitle}
                        formDescription={formDescription}
                        showFooter={showFooter}
                        submitDisabled={submitDisabled}
                        saving={saving}
                    />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
            >
                <TransactionFormSurface
                    variant="dialog-desktop"
                    handleSubmit={handleSubmit}
                    fieldsProps={fieldsProps}
                    formTitle={formTitle}
                    formDescription={formDescription}
                    showFooter={showFooter}
                    submitDisabled={submitDisabled}
                    saving={saving}
                />
            </DialogContent>
        </Dialog>
    )
}
