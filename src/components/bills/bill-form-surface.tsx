"use client"

import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SheetFooter } from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
} from "@/components/ui/mobile-sheet-form-chrome"
import {
    BillFormFields,
    type BillFormFieldsProps,
} from "@/components/bills/bill-form-fields"

export type BillFormSurfaceVariant = "dialog-desktop" | "dialog-mobile"

export type BillFormSurfaceProps = {
    variant: BillFormSurfaceVariant
    handleSubmit: (e: React.FormEvent) => void | Promise<void>
    fieldsProps: BillFormFieldsProps
    formTitle: string
    formDescription: string
    submitDisabled: boolean
    submitLabel: string
    saving: boolean
    onCancel: () => void
}

export function BillFormSurface({
    variant,
    handleSubmit,
    fieldsProps,
    formTitle,
    formDescription,
    submitDisabled,
    submitLabel,
    saving,
    onCancel,
}: BillFormSurfaceProps) {
    const footer = (
        <>
            {variant === "dialog-desktop" ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancelar
                </Button>
            ) : null}
            <Button
                type="submit"
                size="sm"
                className={cn(variant === "dialog-mobile" && "h-10 w-full")}
                disabled={submitDisabled}
            >
                {submitLabel}
            </Button>
        </>
    )

    const scrollClass = "scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-4"

    if (variant === "dialog-mobile") {
        return (
            <CustomForm
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
            >
                <MobileSheetFormDragStrip />
                <MobileSheetFormStickyHeader
                    title={formTitle}
                    description={formDescription}
                />
                <div className={scrollClass}>
                    <BillFormFields {...fieldsProps} />
                </div>
                <SheetFooter className="gap-3 border-border/80 shrink-0 border-t bg-muted/10 px-4 py-4 sm:flex-col sm:px-5">
                    {footer}
                    <Button
                        type="button"
                        variant="ghost"
                        className="sm:w-full sm:justify-center"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                </SheetFooter>
            </CustomForm>
        )
    }

    return (
        <CustomForm
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-col"
        >
            <DialogHeader className="flex shrink-0 flex-col gap-1 px-6 pt-6 pb-3 text-left sm:px-6">
                <DialogTitle className="text-lg">{formTitle}</DialogTitle>
                <DialogDescription>{formDescription}</DialogDescription>
            </DialogHeader>
            <div className={scrollClass}>
                <BillFormFields {...fieldsProps} />
            </div>
            <DialogFooter className="shrink-0 gap-3 border-border/80 border-t bg-muted/10 px-6 py-4 sm:justify-between">
                {footer}
            </DialogFooter>
        </CustomForm>
    )
}
