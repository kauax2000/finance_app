"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon, MinusIcon } from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group peer relative size-4 shrink-0 rounded border border-input bg-background shadow-xs outline-none transition-colors",
        // O controle desenhado tem 16px; o pseudo-elemento leva a área de
        // toque aos 44px que um dedo pede, sem mexer no layout. É a mesma
        // técnica do `Switch`. Não substitui envolver o item num `Label`
        // clicável numa lista — soma a ela.
        "after:absolute after:-inset-3.5 after:content-['']",
        "hover:bg-muted/60",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn("flex size-full items-center justify-center text-current")}
      >
        <CheckIcon className="size-3.5 hidden group-data-[state=checked]:block" />
        <MinusIcon className="size-3.5 hidden group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
