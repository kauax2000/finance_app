"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import type { Category, CreditCard, Transaction } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
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
        isDirty,
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

    // Uma casca só: diálogo no desktop, gaveta alta no telefone. O
    // `isMobile` sobra só para escolher a variante do miolo, que no telefone
    // trava a rolagem com um seletor aberto. A descrição é `sr-only` nas três.
    //
    // Salvar com sucesso fecha pelo `onClose` do hook, que chama o
    // `onOpenChange` da tela direto — fora do `Dialog` —, e por isso não
    // pergunta "Descartar alterações?".
    return (
        <Dialog
            surface="auto"
            pending={saving}
            dirty={isDirty}
            confirmDiscard
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent layout="fixed" showCloseButton={false}>
                <TransactionFormSurface
                    variant={isMobile ? "dialog-mobile" : "dialog-desktop"}
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
