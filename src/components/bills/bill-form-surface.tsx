"use client"

import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
                    variant="tertiary"
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

    // O recuo é do casco (`--dialog-px`); o que fica é a barra fina do desktop.
    const scrollClass = "scrollbar-thin"

    if (variant === "dialog-mobile") {
        return (
            <CustomForm
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
            >
                <DialogHeader>
                    <DialogTitle>{formTitle}</DialogTitle>
                    <DialogDescription>{formDescription}</DialogDescription>
                </DialogHeader>
                <DialogBody className={scrollClass}>
                    <BillFormFields {...fieldsProps} />
                </DialogBody>
                <DialogFooter className="gap-3 sm:flex-col">
                    {footer}
                    <Button
                        type="button"
                        variant="tertiary"
                        className="sm:w-full sm:justify-center"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                </DialogFooter>
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
            <DialogBody className={scrollClass}>
                <BillFormFields {...fieldsProps} />
            </DialogBody>
            <DialogFooter className="gap-3 sm:justify-between">
                {footer}
            </DialogFooter>
        </CustomForm>
    )
}
