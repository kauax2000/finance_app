"use client"

import type { Bill, Category, CreditCard } from "@/lib/supabase"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
                <BillFormSurface
                    handleSubmit={handleSubmit}
                    fieldsProps={fieldsProps}
                    formTitle={formTitle}
                    formDescription={formDescription}
                    submitDisabled={submitDisabled}
                    submitLabel={submitLabel}
                    saving={saving}
                />
            </DialogContent>
        </Dialog>
    )
}
