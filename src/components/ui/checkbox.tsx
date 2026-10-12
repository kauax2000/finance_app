"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"

import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * A caixa de escolha booleana.
 *
 * Marcada, ela floresce do centro (`@utility button-bloom`) em vez de trocar de
 * cor. `variant="brand"` acende a borda em arco-íris perto do ponteiro
 * (`brand-glow` + `useBrandGlow`); longe dele é idêntica à `default`. Uma por
 * tela.
 */
const checkboxVariants = cva(
  [
    "group peer relative size-4 shrink-0 rounded-sm border border-input bg-background shadow-xs outline-none",
    // `transition-colors` deixaria a variável da flor de fora e ela estalaria.
    "button-bloom [--button-bloom-fill:var(--primary)]",
    "data-[state=checked]:[--button-bloom:1] data-[state=indeterminate]:[--button-bloom:1]",
    "transition-[color,background-color,border-color,box-shadow,--button-bloom] duration-(--duration-slow) ease-(--ease-out)",
    "data-[state=checked]:duration-(--duration-spring) data-[state=checked]:ease-(--ease-spring)",
    "data-[state=indeterminate]:duration-(--duration-spring) data-[state=indeterminate]:ease-(--ease-spring)",
    // O pseudo-elemento leva a área de toque a 44px sem mexer no layout; mora
    // na base porque alvo de toque não é aparência.
    "after:absolute after:-inset-3.5 after:content-['']",
    // `hover:` compila dentro de `@media (hover: hover)`; marcada, a flor cobre
    // a caixa e o realce fica por baixo dela.
    "hover:bg-muted/60 active:bg-muted/60",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45",
    // Estado inválido (termo de uso obrigatório desmarcado).
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",
        ].join(" "),
        // Intensidade cheia: numa caixa de 16px o arco tem poucos pixels.
        brand: [
          "brand-glow isolate [--brand-glow-opacity:1]",
          "data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Checkbox({
  className,
  variant,
  ref,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>) {
  const glowRef = useBrandGlow<HTMLButtonElement>(variant === "brand")
  return (
    <CheckboxPrimitive.Root
      ref={composeRefs(glowRef, ref)}
      data-slot="checkbox"
      data-variant={variant ?? "default"}
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          // Tinta do marcado cravada: com `currentColor` o tique nascia escuro
          // antes de a flor chegar.
          "flex size-full items-center justify-center text-primary-foreground",
        )}
      >
        {/* O tique entra crescendo de 50%, na mesma mola da flor. */}
        <CheckIcon className="size-3.5 hidden group-data-[state=checked]:block animate-in zoom-in-50 animation-duration-(--duration-spring) ease-(--ease-spring)" />
        <MinusIcon className="size-3.5 hidden group-data-[state=indeterminate]:block animate-in zoom-in-50 animation-duration-(--duration-spring) ease-(--ease-spring)" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, checkboxVariants }
