"use client"

import type { Bill, Category, CreditCard } from "@/lib/supabase"
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
} from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { BillFormSurface } from "@/components/bills/bill-form-surface"
import { useBillForm } from "@/components/bills/use-bill-form"
import type { BillFormPayloadForSave } from "@/components/bills/bill-form-shared"

export type BillFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingBill: Bill | null
    expenseCategories: Category[]
    creditCards: CreditCard[]
    saving: boolean
    onSave: (
        payload: BillFormPayloadForSave,
        billIdForUpdate?: string | null
    ) => Promise<boolean>
}

export function BillFormDialog({
    open,
    onOpenChange,
    editingBill,
    expenseCategories,
    creditCards,
    saving,
    onSave,
}: BillFormDialogProps) {
    const isMobile = useIsMobile()

    const {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        submitDisabled,
        submitLabel,
    } = useBillForm({
        active: open,
        saving,
        editingBill,
        expenseCategories,
        creditCards,
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
                    className="flex w-full flex-col gap-0 overflow-hidden rounded-t-2xl px-0 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
                >
                    <BillFormSurface
                        variant="dialog-mobile"
                        handleSubmit={handleSubmit}
                        fieldsProps={fieldsProps}
                        formTitle={formTitle}
                        formDescription={formDescription}
                        submitDisabled={submitDisabled}
                        submitLabel={submitLabel}
                        saving={saving}
                        onCancel={() => onOpenChange(false)}
                    />
                <DialogCloseButton />
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
            <DialogContent layout="fixed">
                <BillFormSurface
                    variant="dialog-desktop"
                    handleSubmit={handleSubmit}
                    fieldsProps={fieldsProps}
                    formTitle={formTitle}
                    formDescription={formDescription}
                    submitDisabled={submitDisabled}
                    submitLabel={submitLabel}
                    saving={saving}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
