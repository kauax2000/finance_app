"use client"

import type { CreditCard, WorkspaceSubscription } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { SubscriptionFormSurface } from "@/components/subscriptions/subscription-form-surface"
import { useSubscriptionForm } from "@/components/subscriptions/use-subscription-form"
import type { ExpenseCategoryOption } from "@/components/subscriptions/subscription-form-shared"
import type { SubscriptionFormPayload } from "@/components/subscriptions/subscription-form-shared"

type SubscriptionFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingSubscription: WorkspaceSubscription | null
    expenseCategories: ExpenseCategoryOption[]
    categoriesHref: string
    creditCards: CreditCard[]
    creditCardsHref: string
    saving: boolean
    onSave: (
        payload: SubscriptionFormPayload,
        subscriptionIdForUpdate?: string | null
    ) => Promise<boolean>
}

export function SubscriptionFormDialog({
    open,
    onOpenChange,
    editingSubscription,
    expenseCategories,
    categoriesHref,
    creditCards,
    creditCardsHref,
    saving,
    onSave,
}: SubscriptionFormDialogProps) {
    const {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        showFooter,
        submitDisabled,
        submitLabel,
    } = useSubscriptionForm({
        active: open,
        saving,
        editingSubscription,
        expenseCategories,
        categoriesHref,
        creditCards,
        creditCardsHref,
        onSave,
        closeOnSuccess: true,
        onClose: () => onOpenChange(false),
    })

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
                <SubscriptionFormSurface
                    variant="dialog"
                    handleSubmit={handleSubmit}
                    fieldsProps={fieldsProps}
                    formTitle={formTitle}
                    formDescription={formDescription}
                    showFooter={showFooter}
                    submitDisabled={submitDisabled}
                    submitLabel={submitLabel}
                    saving={saving}
                />
            </DialogContent>
        </Dialog>
    )
}
