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
    TransactionFormFields,
    TransactionFormSegment,
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
    /** No painel de detalhe, Cancelar volta à visualização; sem ele, fecha o diálogo. */
    onCancel?: () => void
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
    onCancel,
    scrollClassName,
}: TransactionFormSurfaceProps) {
    const cancel = onCancel ? (
        <FormCancel onClick={onCancel}>Cancelar</FormCancel>
    ) : (
        <DialogClose asChild>
            <FormCancel>Cancelar</FormCancel>
        </DialogClose>
    )
    const footer = showFooter ? (
        <>
            {cancel}
            <FormSubmit disabled={submitDisabled}>Salvar</FormSubmit>
        </>
    ) : null

    // O tipo fica no cabeçalho fixo, 12px sob o título: sempre à vista, e o
    // corpo que rola começa nos campos. Com ele, o cabeçalho perde o respiro de
    // baixo: o corpo (e o limite da dissolução, quando rola) começa no fim das
    // abas, e o respiro de cima do corpo separa as abas do primeiro campo.
    const temSegmento = !(fieldsProps.segmentMode === "edit" && fieldsProps.hasInstallmentPlan)
    const segmento = temSegmento ? (
        <div className="relative z-10 pt-3">
            <TransactionFormSegment {...fieldsProps} />
        </div>
    ) : null
    const headerClassName = cn(temSegmento && "group-data-[layout=fixed]/dialog-content:pb-0")
    // E o corpo sobe por trás do trilho (opaco): o que rola passa sob as
    // abas e se dissolve ali, em vez de sumir antes delas. O respiro de cima
    // cresce na mesma medida, e o primeiro campo fica onde estava. O trilho é a
    // faixa da dissolução (`--scroll-fade-band-h`), como o rodapé é a do pé: a
    // rampa desliza com a rolagem na mesma regra das duas pontas, presa ao trilho.
    // A faixa é a altura do trilho: 36 no mouse, 40 no dedo.
    const corpoSobAbas =
        temSegmento &&
        "-mt-(--scroll-fade-band-h) pt-[calc(var(--scroll-fade-band-h)+--spacing(4))] [--scroll-fade-band-h:--spacing(9)] pointer-coarse:[--scroll-fade-band-h:--spacing(10)]"

    const formPickersOpen =
        fieldsProps.categoryPopoverOpen || fieldsProps.creditCardPopoverOpen

    // O recuo saiu daqui: quem o dá é o `--dialog-px` do casco — 16 na folha, 24
    // no diálogo —, que é a conta que este ternário fazia à mão. Fica o que é
    // deste formulário: com um seletor aberto o corpo para de rolar, para o
    // gesto não vazar para a lista atrás.
    const fieldsScrollClass = cn(
        corpoSobAbas,
        variant === "dialog-mobile" && formPickersOpen && "overflow-hidden",
        variant === "dialog-desktop" && "scrollbar-thin",
        scrollClassName
    )

    if (variant === "dialog-mobile") {
        return (
            <>
                <DialogHeader className={headerClassName}>
                    <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" />}>
                        <DialogTitle>{formTitle}</DialogTitle>
                    </DialogHeaderRow>
                    {segmento}
                </DialogHeader>
                <DialogDescription className="sr-only">
                    {formDescription}
                </DialogDescription>
                <CustomForm
                    pending={saving}
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody className={fieldsScrollClass}>
                        <TransactionFormFields {...fieldsProps} />
                    </DialogBody>
                    {showFooter ? (
                        <DialogFooter>{footer}</DialogFooter>
                    ) : null}
                </CustomForm>
            </>
        )
    }

    if (variant === "detail-sheet") {
        return (
            <CustomForm
                pending={saving}
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
            >
                <DialogHeader className={headerClassName}>
                    <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" />}>
                        <DialogTitle>{formTitle}</DialogTitle>
                    </DialogHeaderRow>
                    {segmento}
                </DialogHeader>
                <DialogDescription className="sr-only">
                    {formDescription}
                </DialogDescription>
                <DialogBody className={fieldsScrollClass}>
                    <TransactionFormFields {...fieldsProps} />
                </DialogBody>
                {showFooter ? (
                    <DialogFooter>{footer}</DialogFooter>
                ) : null}
            </CustomForm>
        )
    }

    return (
        <CustomForm
            pending={saving}
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
            <DialogHeader className={headerClassName}>
                <DialogHeaderRow
                    endAdornment={
                        <DialogCloseButton placement="inline" />
                    }
                >
                    <DialogTitle>{formTitle}</DialogTitle>
                </DialogHeaderRow>
                {segmento}
            </DialogHeader>
            <DialogDescription className="sr-only">
                {formDescription}
            </DialogDescription>
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
