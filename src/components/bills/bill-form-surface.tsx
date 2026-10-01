"use client"

import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import {
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
    BillFormFields,
    type BillFormFieldsProps,
} from "@/components/bills/bill-form-fields"

/**
 * O miolo do `BillFormDialog`, um só nas duas larguras: a casca
 * (`surface="auto"`) é quem vira gaveta no telefone, e o rodapé do diálogo já
 * empilha ali. Os dois miolos de antes só diferiam na ordem e na largura dos
 * botões.
 */
export type BillFormSurfaceProps = {
    handleSubmit: (e: React.FormEvent) => void | Promise<void>
    fieldsProps: BillFormFieldsProps
    formTitle: string
    formDescription: string
    submitDisabled: boolean
    submitLabel: string
    saving: boolean
}

export function BillFormSurface({
    handleSubmit,
    fieldsProps,
    formTitle,
    formDescription,
    submitDisabled,
    submitLabel,
    saving,
}: BillFormSurfaceProps) {
    return (
        <CustomForm
            pending={saving}
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
        >
            <DialogHeader>
                <DialogTitle>{formTitle}</DialogTitle>
                <DialogDescription>{formDescription}</DialogDescription>
            </DialogHeader>
            {/* O recuo é do casco (`--dialog-px`); o que fica é a barra fina do desktop. */}
            <DialogBody className="scrollbar-thin">
                <BillFormFields {...fieldsProps} />
            </DialogBody>
            {/* Cancelar é a saída, não uma ação auxiliar: vem antes da ação e
                encosta com ela à direita, a tabela do rodapé. */}
            <DialogFooter>
                <DialogClose asChild>
                    <FormCancel>Cancelar</FormCancel>
                </DialogClose>
                <FormSubmit disabled={submitDisabled}>
                    {submitLabel}
                </FormSubmit>
            </DialogFooter>
        </CustomForm>
    )
}
