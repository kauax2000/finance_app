"use client"

import * as React from "react"
import { XMarkIcon } from "@heroicons/react/16/solid"
import { cn } from "@/lib/utils"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { Button } from "@/components/ui/button"
import {
  SheetClose,
} from "@/components/ui/sheet"
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

/** Pass to `SheetContent` (`side="bottom"`, `fillMobileViewport`) for form layouts. */
export const mobileFormSheetContentClassName =
    "flex w-full flex-col gap-0 overflow-hidden rounded-t-2xl px-0 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"

/** Close control for `MobileSheetFormStickyHeader` (`endAdornment`). The sheet no longer injects a floating ×, so this is the only one. */
export function MobileSheetFormHeaderCloseButton({
    disabled,
}: {
    disabled?: boolean
}) {
    return (
        <SheetClose asChild>
            <Button
                type="button"
                variant="tertiary"
                size="icon-sm"
                className="shrink-0 -mr-1"
                aria-label="Fechar"
                disabled={disabled}
            >
                <XMarkIcon aria-hidden />
            </Button>
        </SheetClose>
    )
}

/** Margin below sticky sheet headers before the scrolling body (bottom sheets). */
export const mobileSheetChromeBelowHeaderClassName = "mb-3"

// **Sem fio.** Quem marca o limite é o conteúdo dissolvendo na borda de cima do
// `MobileSheetFormBody`, 12px abaixo daqui (o `mb-3`). É modo **sem faixa**, e a
// razão é que esta altura não é conhecível: quinze das vinte e quatro chamadas
// passam `description`, que quebra em telas estreitas, e o `pt` muda por
// breakpoint. Medir isso exigiria um observador escrevendo a altura do JS.
const stickyStripClass = cn(
    "flex shrink-0 flex-row items-start justify-between gap-3 px-4 pb-3 pt-2 text-left sm:px-5 md:pt-3",
    mobileSheetChromeBelowHeaderClassName,
)

/**
 * O corpo rolável de uma folha de formulário — e ele é o dono da dissolução.
 *
 * Ele nasceu porque **o corpo não era do componente**: cada uma das ~20 telas
 * escrevia `min-h-0 flex-1 overflow-y-auto px-4` à mão, quase sempre dentro de
 * um `<CustomForm>`, o que faz dele nem irmão do cabeçalho. Sem um dono, tirar
 * o fio da faixa de cima tiraria o limite e não devolveria nada — o pior
 * resultado possível.
 */
export function MobileSheetFormBody({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            ref={useScrollFade()}
            data-slot="mobile-sheet-form-body"
            className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5",
                scrollFadeViewportClassName,
                className,
            )}
            {...props}
        />
    )
}

export type MobileSheetFormStickyHeaderProps = {
    className?: string
    title?: React.ReactNode
    description?: React.ReactNode
    /** Full replacement for title + description row */
    children?: React.ReactNode
    /** Rendered flush end (e.g. dismiss button) without shrinking the title block */
    endAdornment?: React.ReactNode
}

export function MobileSheetFormStickyHeader({
    className,
    title,
    description,
    children,
    endAdornment,
}: MobileSheetFormStickyHeaderProps) {
    const main =
        children != null ? (
            children
        ) : (
            <>
                {title != null ? (
                    <DialogTitle className="font-heading text-base font-medium leading-tight">
                        {title}
                    </DialogTitle>
                ) : null}
                {description != null ? (
                    <DialogDescription className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </DialogDescription>
                ) : null}
            </>
        )

    return (
        <div className={cn(stickyStripClass, className)}>
            <div className="min-w-0 flex-1">{main}</div>
            {endAdornment != null ? (
                <div className="shrink-0">{endAdornment}</div>
            ) : null}
        </div>
    )
}
