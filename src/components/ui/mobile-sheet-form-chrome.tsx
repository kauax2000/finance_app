"use client"

import * as React from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SheetClose, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"

/** Pass to `SheetContent` (`side="bottom"`, `fillMobileViewport`) for form layouts. */
export const mobileFormSheetContentClassName =
    "flex w-full flex-col gap-0 overflow-hidden rounded-t-2xl px-0 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"

/**
 * Bottom-sheet chrome for mobile forms: matches sticky header strip used in
 * transaction detail sheet / transaction-form-surface detail-sheet variant.
 */
export function MobileSheetFormDragStrip() {
    return <SheetDragHandle />
}

/** Close control for `MobileSheetFormStickyHeader` (`endAdornment`); pair with `showCloseButton={false}` on `SheetContent`. */
export function MobileSheetFormHeaderCloseButton({
    disabled,
}: {
    disabled?: boolean
}) {
    return (
        <SheetClose asChild>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 -mr-1"
                aria-label="Fechar"
                disabled={disabled}
            >
                <XMarkIcon className="h-5 w-5" aria-hidden />
            </Button>
        </SheetClose>
    )
}

/** Margin below sticky sheet headers before the scrolling body (bottom sheets). */
export const mobileSheetChromeBelowHeaderClassName = "mb-3"

const stickyStripClass = cn(
    "flex shrink-0 flex-row items-start justify-between gap-3 border-b border-border px-4 pb-3 pt-2 text-left sm:px-5 md:pt-3",
    mobileSheetChromeBelowHeaderClassName,
)

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
                    <SheetTitle className="font-heading text-base font-medium leading-tight">
                        {title}
                    </SheetTitle>
                ) : null}
                {description != null ? (
                    <SheetDescription className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </SheetDescription>
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
