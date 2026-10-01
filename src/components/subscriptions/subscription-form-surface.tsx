"use client"

import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import {
  DialogBody,
  DialogClose,
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


/**
 * `dialog` é o miolo do `SubscriptionFormDialog` — um só nas duas larguras,
 * porque a casca (`surface="auto"`) é quem vira gaveta no telefone. Os dois
 * miolos de antes só diferiam no botão de largura total, e o rodapé do
 * diálogo já empilha no telefone.
 */
export type SubscriptionFormSurfaceVariant = "dialog" | "detail-sheet"

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
    /** Só na folha de detalhe: cancelar volta à vista. No diálogo, fecha. */
    onCancel?: () => void
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
    const submit = (
        <FormSubmit
            pendingLabel="Salvando…"
            className={cn(
                variant === "detail-sheet" &&
                    "max-sm:h-11 max-sm:w-full max-sm:text-base"
            )}
            size={variant === "detail-sheet" ? "sm" : undefined}
            disabled={submitDisabled}
        >
            {submitLabel}
        </FormSubmit>
    )

    if (variant === "detail-sheet") {
        return (
            <CustomForm
                pending={saving}
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
                        <FormCancel
                            size="sm"
                            className="max-sm:hidden"
                            onClick={onCancel}
                        >
                            Cancelar
                        </FormCancel>
                        {submit}
                    </DialogFooter>
                ) : null}
            </CustomForm>
        )
    }

    return (
        <CustomForm
            pending={saving}
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
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
                    <DialogClose asChild>
                        <FormCancel>Cancelar</FormCancel>
                    </DialogClose>
                    {submit}
                </DialogFooter>
            ) : null}
        </CustomForm>
    )
}
