"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "relative aspect-square size-4 shrink-0 rounded-full border border-input text-primary-accent shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input-fill/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // Mesma expansão de área de toque do Checkbox e do Switch: o alvo
        // desenhado tem 16px, o tocável passa a ter 44px.
        "after:absolute after:-inset-3.5 after:content-['']",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        {/* Um ponto não precisa ser SVG. O Heroicons é um conjunto de
            interface e não traz círculo puro — e nem deveria: `rounded-full`
            com a cor de fundo desenha a mesma coisa sem uma requisição. */}
        <span className="size-2.5 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
