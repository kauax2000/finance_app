"use client"

import * as React from "react"

import { PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const formPickerCollisionPadding = {
    top: 16,
    bottom: 16,
    left: 12,
    right: 12,
} as const

/** Scrollable list region inside a form picker popover (category rows, cards, etc.). */
export const formPickerListScrollClassName =
    "min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-1 [-webkit-overflow-scrolling:touch]"

function FormPickerPopoverContent({
    className,
    children,
    onOpenAutoFocus,
    onCloseAutoFocus,
    ...props
}: React.ComponentProps<typeof PopoverContent>) {
    return (
        <PopoverContent
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={formPickerCollisionPadding}
            sticky="partial"
            onOpenAutoFocus={(e) => {
                e.preventDefault()
                onOpenAutoFocus?.(e)
            }}
            onCloseAutoFocus={(e) => {
                e.preventDefault()
                onCloseAutoFocus?.(e)
            }}
            className={cn(
                "flex max-h-[var(--radix-popover-content-available-height)] min-h-0 w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-1.5rem,22rem)] flex-col gap-0 overflow-hidden p-0",
                className
            )}
            {...props}
        >
            {children}
        </PopoverContent>
    )
}

export { FormPickerPopoverContent }
