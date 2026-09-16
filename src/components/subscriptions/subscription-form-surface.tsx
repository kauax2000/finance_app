"use client"

import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderRow,
  DialogTitle,
} from "@/components/ui/dialog"
import {
    SubscriptionFormFields,
    type SubscriptionFormFieldsProps,
} from "@/components/subscriptions/subscription-form-fields"


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
                    variant="tertiary"
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


    if (variant === "dialog-mobile") {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>{formTitle}</DialogTitle>
                    <DialogDescription>{formDescription}</DialogDescription>
                </DialogHeader>
                <CustomForm
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody className={scrollClassName}>
                        <SubscriptionFormFields {...fieldsProps} />
                    </DialogBody>
                    {showFooter ? (
                        <DialogFooter className="flex-col">
                            {footer}
                        </DialogFooter>
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
                <DialogHeader>
                    <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" disabled={saving} />}>
                        <DialogTitle>{formTitle}</DialogTitle>
                        <DialogDescription>{formDescription}</DialogDescription>
                    </DialogHeaderRow>
                </DialogHeader>
                <DialogBody className={scrollClassName}>
                    <SubscriptionFormFields {...fieldsProps} />
                </DialogBody>
                {showFooter ? (
                    <DialogFooter className="flex-col">
                        {footer}
                    </DialogFooter>
                ) : null}
            </CustomForm>
        )
    }

    return (
        <CustomForm
            onSubmit={handleSubmit}
            className="flex max-h-[min(90dvh,36rem)] flex-col"
        >
            <DialogHeader>
                <DialogTitle>{formTitle}</DialogTitle>
                {formDescription ? (
                    <DialogDescription>{formDescription}</DialogDescription>
                ) : null}
            </DialogHeader>
            <DialogBody className={scrollClassName}>
                <SubscriptionFormFields {...fieldsProps} />
            </DialogBody>
            {showFooter ? (
                <DialogFooter>
                    {footer}
                </DialogFooter>
            ) : null}
        </CustomForm>
    )
}
