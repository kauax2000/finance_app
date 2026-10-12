"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { CheckIcon, XMarkIcon } from "@heroicons/react/16/solid"

import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/**
 * A alternância que vale no instante em que é tocada.
 * `size` mede o trilho: `sm` 14×24 · `md` 18×32 · `lg` 24×44; o polegar deriva
 * (altura menos a borda de 1px, e a viagem é `largura − altura`), então uma
 * classe (`calc(100% − 2px)`) serve a escada.
 * O alvo é 44px de altura nos três degraus (o `::after` centrado, 11px a mais de
 * cada lado da caixa: 46 · 54 · 66 de largura), como `Checkbox` e `Radio`.
 * O polegar anda na mola da casa (`--ease-spring`/`--duration-spring`); o
 * trilho troca de cor em `--duration-slow`.
 * - `pending`: o `Spinner` no polegar enquanto salva; trava (`disabled` do
 *   Radix) sem apagar, e marca `aria-busy`.
 * - `icons`: tique no ligado e × no desligado, para o estado não depender só de
 *   cor e posição.
 * - `variant="brand"`: a borda que acende em arco-íris perto do ponteiro (a
 *   família do `Checkbox` e do `Radio`). Uma por tela.
 */
const TRILHO = {
  sm: "h-3.5 w-6",
  md: "h-4.5 w-8",
  lg: "h-6 w-11",
} as const

const POLEGAR = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5.5",
} as const

/** O ícone do polegar, por degrau: o micro (`16/solid`) em todos. */
const ICONE = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3.5",
} as const

type SwitchSize = keyof typeof TRILHO

function Switch({
  className,
  size = "md",
  variant = "default",
  pending = false,
  icons = false,
  disabled,
  ref,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  /** O trilho: 14×24, 18×32 ou 24×44. */
  size?: SwitchSize
  /** `brand` é o brilho de arco-íris na borda. Uma por tela. */
  variant?: "default" | "brand"
  /** O valor está salvando: o polegar mostra o `Spinner` e o controle trava. */
  pending?: boolean
  /** Tique no ligado, × no desligado. */
  icons?: boolean
}) {
  const glowRef = useBrandGlow<HTMLButtonElement>(variant === "brand")
  return (
    <SwitchPrimitive.Root
      ref={composeRefs(glowRef, ref)}
      data-slot="switch"
      data-size={size}
      data-variant={variant}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent outline-none",
        TRILHO[size],
        "transition-[background-color,border-color,box-shadow] duration-(--duration-slow) ease-(--ease-out)",
        // O alvo de toque: 44 de altura, centrado, e 11px a mais de cada lado.
        "after:absolute after:-inset-x-3 after:top-1/2 after:h-11 after:-translate-y-1/2",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        "data-checked:bg-primary data-unchecked:bg-input-fill dark:data-unchecked:bg-input-fill/80",
        // Desabilitado apaga; salvando trava sem apagar.
        "data-disabled:cursor-not-allowed data-disabled:not-aria-busy:opacity-50 aria-busy:cursor-progress",
        variant === "brand" && "brand-glow isolate [--brand-glow-opacity:1]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none flex items-center justify-center rounded-full bg-background ring-0",
          POLEGAR[size],
          "translate-x-0 data-checked:translate-x-[calc(100%-2px)]",
          "transition-[translate] duration-(--duration-spring) ease-(--ease-spring)",
          "dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground"
        )}
      >
        {pending ? (
          <Spinner className={cn(ICONE[size], "text-muted-foreground")} />
        ) : icons ? (
          <>
            <CheckIcon
              aria-hidden
              className={cn(ICONE[size], "hidden text-foreground group-data-[state=checked]/switch:block")}
            />
            <XMarkIcon
              aria-hidden
              className={cn(
                ICONE[size],
                "hidden text-muted-foreground group-data-[state=unchecked]/switch:block dark:text-background/60"
              )}
            />
          </>
        ) : null}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
