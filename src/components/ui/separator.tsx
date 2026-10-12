"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * A régua.
 * `tone` é o peso: a que **estrutura** uma página pesa mais que a que **arruma**
 * o interior de uma superfície já delimitada. O peso mora em `--separator-color`
 * porque três desenhos o leem de jeitos diferentes (`solid` pinta o fundo,
 * `dashed` a borda, `fade` o põe no meio de um degradê).
 * `variant` é o desenho: `solid` (padrão, 1px), `dashed` (a do extrato antes de
 * um total) e `fade` (some nas pontas, para blocos soltos).
 * `bleed` atravessa o recuo da superfície, lendo o que ela **publica**:
 * `--card-px`, depois `--dialog-px` (um cartão dentro de um diálogo tem o recuo
 * dele); quem não publica escreve `--separator-bleed`.
 * `children` é o rótulo do meio: duas meias-réguas e o texto entre elas, sem
 * retângulo mascarando o meio da linha. O `FieldSeparator` compõe esta peça.
 */
const separatorVariants = cva("shrink-0", {
  variants: {
    tone: {
      default: "[--separator-color:var(--border)]",
      soft: "[--separator-color:color-mix(in_oklab,var(--border)_60%,transparent)]",
    },
  },
  defaultVariants: {
    tone: "default",
  },
})

type SeparatorVariant = "solid" | "dashed" | "fade"
type Orientation = "horizontal" | "vertical"

/** O desenho da linha, por orientação. Literal por extenso: o Tailwind lê texto. */
function linha(variant: SeparatorVariant, orientation: Orientation, metade?: "inicio" | "fim") {
  const h = orientation === "horizontal"
  if (variant === "dashed") {
    return h ? "h-0 border-t border-dashed border-(--separator-color)" : "w-0 border-l border-dashed border-(--separator-color)"
  }
  if (variant === "fade") {
    // Com rótulo, cada metade some só na ponta de fora.
    if (metade === "inicio") return "bg-linear-to-r from-transparent to-(--separator-color)"
    if (metade === "fim") return "bg-linear-to-r from-(--separator-color) to-transparent"
    return h
      ? "bg-linear-to-r from-transparent via-(--separator-color) to-transparent"
      : "bg-linear-to-b from-transparent via-(--separator-color) to-transparent"
  }
  return "bg-(--separator-color)"
}

/** O recuo que a régua atravessa: o do cartão, o da folha ou o declarado. */
const BLEED =
  "[--separator-bleed-x:var(--separator-bleed,var(--card-px,var(--dialog-px,0px)))] -mx-(--separator-bleed-x) w-[calc(100%_+_2*var(--separator-bleed-x))] max-w-none"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  tone,
  variant = "solid",
  bleed = false,
  children,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> &
  VariantProps<typeof separatorVariants> & {
    /** O desenho: linha, tracejado ou pontas que dissolvem. */
    variant?: SeparatorVariant
    /** Atravessa o recuo da superfície e encosta nas bordas. Só na horizontal. */
    bleed?: boolean
    /** O rótulo do meio. Só na horizontal. */
    children?: React.ReactNode
  }) {
  const horizontal = orientation === "horizontal"

  if (children != null && horizontal) {
    // Com rótulo, a peça é uma fileira: as duas metades são decorativas e o
    // texto é texto. `decorative={false}` põe o papel na fileira, e o rótulo
    // vira o nome dela.
    const metade = (lado: "inicio" | "fim") => (
      <span
        aria-hidden
        data-slot="separator-line"
        className={cn("h-px min-w-4 flex-1", linha(variant, "horizontal", lado), variant === "dashed" && "h-0")}
      />
    )
    return (
      <div
        data-slot="separator"
        data-variant={variant}
        data-tone={tone ?? "default"}
        role={decorative ? undefined : "separator"}
        aria-orientation={decorative ? undefined : "horizontal"}
        className={cn(
          separatorVariants({ tone }),
          "flex w-full items-center gap-3 text-xs font-medium text-muted-foreground",
          bleed && BLEED,
          className
        )}
        {...(props as React.ComponentProps<"div">)}
      >
        {metade("inicio")}
        <span data-slot="separator-label" className="shrink-0">
          {children}
        </span>
        {metade("fim")}
      </div>
    )
  }

  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      data-variant={variant}
      data-tone={tone ?? "default"}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        separatorVariants({ tone }),
        // As medidas saem de uma condicional, e não de `data-[orientation=…]:h-4`: classe
        // com variante não entra no mesmo grupo do merge do Tailwind, então uma classe
        // crua em `className` não a substituía. Um ponto de extensão tem de funcionar.
        horizontal ? "h-px w-full" : "h-4 w-px self-center",
        linha(variant, orientation),
        horizontal && bleed && BLEED,
        className
      )}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
