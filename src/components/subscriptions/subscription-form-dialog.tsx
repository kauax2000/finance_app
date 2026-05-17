"use client"

import type { CreditCard, WorkspaceSubscription } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
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
    const isMobile = useIsMobile()

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

    if (isMobile) {
        return (
            <Sheet
                open={open}
                onOpenChange={(next) => {
                    if (!next && saving) return
                    onOpenChange(next)
                }}
            >
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton={false}
                    className="flex w-full flex-col gap-0 overflow-hidden rounded-t-2xl px-0 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
                >
                    <SubscriptionFormSurface
                        variant="dialog-mobile"
                        handleSubmit={handleSubmit}
                        fieldsProps={fieldsProps}
                        formTitle={formTitle}
                        formDescription={formDescription}
                        showFooter={showFooter}
                        submitDisabled={submitDisabled}
                        submitLabel={submitLabel}
                        saving={saving}
                        onCancel={() => onOpenChange(false)}
                    />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next && saving) return
                onOpenChange(next)
            }}
        >
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <SubscriptionFormSurface
                    variant="dialog-desktop"
                    handleSubmit={handleSubmit}
                    fieldsProps={fieldsProps}
                    formTitle={formTitle}
                    formDescription={formDescription}
                    showFooter={showFooter}
                    submitDisabled={submitDisabled}
                    submitLabel={submitLabel}
                    saving={saving}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
