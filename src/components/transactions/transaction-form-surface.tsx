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
    TransactionFormFields,
    type TransactionFormFieldsProps,
} from "@/components/transactions/transaction-form-fields"


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

    const formPickersOpen =
        fieldsProps.categoryPopoverOpen || fieldsProps.creditCardPopoverOpen

    // O recuo saiu daqui: quem o dá é o `--dialog-px` do casco — 16 na folha, 24
    // no diálogo —, que é a conta que este ternário fazia à mão. Fica o que é
    // deste formulário: com um seletor aberto o corpo para de rolar, para o
    // gesto não vazar para a lista atrás.
    const fieldsScrollClass = cn(
        variant === "dialog-mobile" && formPickersOpen && "overflow-hidden",
        variant === "dialog-desktop" && "scrollbar-thin",
        scrollClassName
    )

    if (variant === "dialog-mobile") {
        return (
            <>
                <DialogHeader>
                    <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" />}>
                        <DialogTitle>{formTitle}</DialogTitle>
                    </DialogHeaderRow>
                </DialogHeader>
                <DialogDescription className="sr-only">
                    {formDescription}
                </DialogDescription>
                <CustomForm
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody className={fieldsScrollClass}>
                        <TransactionFormFields {...fieldsProps} />
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
                    <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" />}>
                        <DialogTitle>{formTitle}</DialogTitle>
                    </DialogHeaderRow>
                </DialogHeader>
                <DialogDescription className="sr-only">
                    {formDescription}
                </DialogDescription>
                <DialogBody className={fieldsScrollClass}>
                    <TransactionFormFields {...fieldsProps} />
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
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
            <DialogHeader className="shrink-0 px-6 pt-6 pb-3">
                <DialogHeaderRow
                    endAdornment={
                        <DialogCloseButton
                            placement="inline"
                            className="-mt-0.5"
                        />
                    }
                >
                    <DialogTitle>{formTitle}</DialogTitle>
                    <DialogDescription>{formDescription}</DialogDescription>
                </DialogHeaderRow>
            </DialogHeader>
            <DialogBody className={fieldsScrollClass}>
                <TransactionFormFields {...fieldsProps} />
            </DialogBody>
            {showFooter ? (
                <DialogFooter>
                    {footer}
                </DialogFooter>
            ) : null}
        </CustomForm>
    )
}
