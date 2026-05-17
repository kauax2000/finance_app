"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SheetClose, SheetFooter } from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
} from "@/components/ui/mobile-sheet-form-chrome"
import {
    SubscriptionFormFields,
    type SubscriptionFormFieldsProps,
} from "@/components/subscriptions/subscription-form-fields"

function sheetHeaderCloseControl(saving: boolean) {
    return (
        <SheetClose asChild>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 -mr-1"
                aria-label="Fechar"
                disabled={saving}
            >
                <XMarkIcon className="h-5 w-5" aria-hidden />
            </Button>
        </SheetClose>
    )
}

export type SubscriptionFormSurfaceVariant =
    | "dialog-desktop"
    | "dialog-mobile"
    | "detail-sheet"

export type SubscriptionFormSurfaceProps = {
    variant: SubscriptionFormSurfaceVariant
    handleSubmit: (e: React.FormEvent) => void | Promise<void>
    fieldsProps: SubscriptionFormFieldsProps
    formTitle: string
    formDescription?: string
    showFooter: boolean
    submitDisabled: boolean
    submitLabel: string
    saving: boolean
    onCancel: () => void
    scrollClassName?: string
}

export function SubscriptionFormSurface({
    variant,
    handleSubmit,
    fieldsProps,
    formTitle,
    formDescription,
    showFooter,
    submitDisabled,
    submitLabel,
    saving,
    onCancel,
    scrollClassName,
}: SubscriptionFormSurfaceProps) {
    const footer = showFooter ? (
        <>
            {variant === "dialog-desktop" || variant === "detail-sheet" ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                        variant === "detail-sheet" && "max-sm:hidden"
                    )}
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancelar
                </Button>
            ) : null}
            <Button
                type="submit"
                size="sm"
                className={cn(
                    variant === "dialog-mobile" && "h-10 w-full",
                    variant === "detail-sheet" &&
                        "max-sm:h-11 max-sm:w-full max-sm:text-base"
                )}
                disabled={submitDisabled}
            >
                {submitLabel}
            </Button>
        </>
    ) : null

    const fieldsScrollClass =
        variant === "detail-sheet"
            ? cn(
                  "min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5",
                  scrollClassName
              )
            : variant === "dialog-mobile"
              ? cn("min-h-0 flex-1 overflow-y-auto px-4", scrollClassName)
              : cn("min-h-0 flex-1 overflow-y-auto px-6", scrollClassName)

    if (variant === "dialog-mobile") {
        return (
            <>
                <MobileSheetFormDragStrip />
                <MobileSheetFormStickyHeader
                    title={formTitle}
                    description={formDescription}
                />
                <CustomForm
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className={fieldsScrollClass}>
                        <SubscriptionFormFields {...fieldsProps} />
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
                    description={formDescription}
                    endAdornment={sheetHeaderCloseControl(saving)}
                />
                <div className={fieldsScrollClass}>
                    <SubscriptionFormFields {...fieldsProps} />
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
            <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                <DialogTitle>{formTitle}</DialogTitle>
                {formDescription ? (
                    <DialogDescription>{formDescription}</DialogDescription>
                ) : null}
            </DialogHeader>
            <div className={fieldsScrollClass}>
                <SubscriptionFormFields {...fieldsProps} />
            </div>
            {showFooter ? (
                <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/60 bg-background px-6 pt-4 pb-5">
                    {footer}
                </DialogFooter>
            ) : null}
        </CustomForm>
    )
}
