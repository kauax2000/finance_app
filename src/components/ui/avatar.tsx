"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Duas versões: com foto, ou sem foto (iniciais em tinta escura sobre a cor
 * chapada de identidade). Uma forma só, o círculo; canto arredondado é a
 * família do `ColorTile`.
 */

/**
 * A escala do avatar é dele (24, 32, 40, 48, 56) e diverge da escada de controle
 * de propósito: avatar identifica pessoa numa lista, e 40px é teto. O `xs` a 24
 * vale o mesmo nos dois vocabulários.
 */
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-2xs",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-14 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

function Avatar({
  className,
  size,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size ?? "md"}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  )
}

/**
 * A foto entra em fade ao terminar de carregar. É animação de entrada, não
 * transição de estado: o Radix só monta a imagem depois de carregada, então
 * `opacity-0` + `data-[state=loaded]:opacity-100` deixaria toda foto invisível.
 */
const AvatarImage = React.forwardRef<
  HTMLImageElement,
  // `alt` obrigatório: `""` é a escolha ao lado do nome, mas tem de ser escrita.
  Omit<React.ComponentProps<typeof AvatarPrimitive.Image>, "alt"> & { alt: string }
>(({ className, alt, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    alt={alt}
    // `loading` fica com quem chama: numa lista longa vale `lazy`; na lateral
    // do primeiro quadro só atrasaria a foto.
    decoding="async"
    className={cn(
      "aspect-square h-full w-full object-cover",
      "animate-in fade-in animation-duration-(--duration-base) ease-(--ease-out)",
      className
    )}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

/**
 * As iniciais, e o que se vê enquanto a foto não chega: uma cor chapada de
 * identidade, `tint` `vivid` (padrão) ou `soft`. Quem sabe a pessoa passa o par
 * de `identityToneFor` por `className` (`cn(tone.surface, tone.ink)`).
 *
 * Quem recorta é o `overflow-hidden` da raiz; o `select-none` tira o I-beam de
 * cima das iniciais. `delayMs` do Radix evita piscar iniciais antes de uma foto
 * que chega rápido.
 */
const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
    /** `vivid` (padrão) é a cor cheia com tinta escura; `soft` é quase branca, com a letra no tom forte. */
    tint?: "vivid" | "soft"
  }
>(({ className, tint = "vivid", ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    data-tint={tint}
    className={cn(
      "flex h-full w-full items-center justify-center font-medium",
      // A primeira identidade é o padrão pelo fallback do `var()`: duas
      // `identity-N` no mesmo elemento seriam decididas pela ordem de emissão.
      "bg-[var(--identity-surface,var(--identity-1))] text-identity-foreground",
      "data-[tint=soft]:bg-[var(--identity-surface-soft,var(--identity-1-soft))] data-[tint=soft]:text-[var(--identity-ink,var(--identity-1-ink))]",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback, AvatarImage, avatarVariants }
