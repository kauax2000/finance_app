"use client"

import * as React from "react"
import { XMarkIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * O × de um selo de filtro. Eram quatro `<button>` crus iguais, aqui e no
 * painel de filtros. O `size-5` fica: o × mora dentro do `Badge`, e o
 * `icon-xs` (24px) esticaria o selo.
 */
export function FilterChipRemoveButton(
    props: Omit<React.ComponentProps<typeof Button>, "children" | "variant" | "size">
) {
    return (
        <Button
            type="button"
            variant="tertiary"
            size="icon-xs"
            {...props}
            className={cn(
                "size-5 shrink-0 rounded-full text-current opacity-70 hover:opacity-100 active:opacity-100 [--button-hover-fill:color-mix(in_oklab,var(--success)_20%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,var(--success)_20%,transparent)]",
                props.className
            )}
        >
            <XMarkIcon className="size-3.5" aria-hidden />
        </Button>
    )
}
