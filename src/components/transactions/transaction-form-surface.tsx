"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SheetClose, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
} from "@/components/ui/mobile-sheet-form-chrome"
import {
    TransactionFormFields,
    type TransactionFormFieldsProps,
} from "@/components/transactions/transaction-form-fields"

function sheetHeaderCloseControl() {
    return (
        <SheetClose asChild>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 -mr-1"
                aria-label="Fechar"
            >
                <XMarkIcon className="h-5 w-5" aria-hidden />
            </Button>
        </SheetClose>
    )
}

export type TransactionFormSurfaceVariant =
    | "dialog-desktop"
    | "dialog-mobile"
    | "detail-sheet"

export type TransactionFormSurfaceProps = {
    variant: TransactionFormSurfaceVariant
    handleSubmit: (e: React.FormEvent) => void | Promise<void>
    fieldsProps: TransactionFormFieldsProps
    formTitle: string
    formDescription: string
    showFooter: boolean
    submitDisabled: boolean
    saving: boolean
    /** Extra class for the scrollable fields wrapper */
    scrollClassName?: string
}

export function TransactionFormSurface({
    variant,
    handleSubmit,
    fieldsProps,
    formTitle,
    formDescription,
    showFooter,
    submitDisabled,
    saving,
    scrollClassName,
}: TransactionFormSurfaceProps) {
    const footer = showFooter ? (
        <Button
            type="submit"
            size="sm"
            className={cn(
                variant === "dialog-mobile" && "h-10 w-full",
                variant === "detail-sheet" && "max-sm:h-10 max-sm:w-full"
            )}
            disabled={submitDisabled}
        >
            {saving ? "Salvando..." : "Salvar"}
        </Button>
    ) : null

    const fieldsScrollClass =
        variant === "detail-sheet"
            ? cn("min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5", scrollClassName)
            : variant === "dialog-mobile"
              ? cn("min-h-0 flex-1 overflow-y-auto px-4", scrollClassName)
              : cn(
                    "min-h-0 flex-1 overflow-y-auto px-6 pt-4",
                    scrollClassName
                )

    if (variant === "dialog-mobile") {
        return (
            <>
                <MobileSheetFormDragStrip />
                <MobileSheetFormStickyHeader
                    title={formTitle}
                    endAdornment={sheetHeaderCloseControl()}
                />
                <SheetDescription className="sr-only">
                    {formDescription}
                </SheetDescription>
                <CustomForm
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className={fieldsScrollClass}>
                        <TransactionFormFields {...fieldsProps} />
                    </div>
                    {showFooter ? (
                        <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                            {footer}
                        </SheetFooter>
                    ) : null}
                </CustomForm>
            </>
        )
    }

    if (variant === "detail-sheet") {
        return (
            <CustomForm
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
            >
                <MobileSheetFormStickyHeader
                    title={formTitle}
                    endAdornment={sheetHeaderCloseControl()}
                />
                <SheetDescription className="sr-only">
                    {formDescription}
                </SheetDescription>
                <div className={fieldsScrollClass}>
                    <TransactionFormFields {...fieldsProps} />
                </div>
                {showFooter ? (
                    <SheetFooter className="shrink-0 flex-col gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-5">
                        {footer}
                    </SheetFooter>
                ) : null}
            </CustomForm>
        )
    }

    return (
        <CustomForm
            onSubmit={handleSubmit}
            className="flex max-h-[min(90dvh,36rem)] flex-col"
        >
            <DialogHeader className="flex shrink-0 flex-row items-start justify-between gap-3 px-6 pt-6 pb-0 text-left">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <DialogTitle>{formTitle}</DialogTitle>
                    <DialogDescription>{formDescription}</DialogDescription>
                </div>
                <DialogClose asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 -mr-1 -mt-0.5"
                        aria-label="Fechar"
                    >
                        <XMarkIcon className="h-5 w-5" aria-hidden />
                    </Button>
                </DialogClose>
            </DialogHeader>
            <div className={fieldsScrollClass}>
                <TransactionFormFields {...fieldsProps} />
            </div>
            {showFooter ? (
                <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/60 bg-background px-6 pt-4 pb-5">
                    {footer}
                </DialogFooter>
            ) : null}
        </CustomForm>
    )
}
