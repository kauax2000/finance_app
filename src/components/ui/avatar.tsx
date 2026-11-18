"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { PencilIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"

/**
 * Duas versões: com foto, ou sem foto (iniciais em tinta escura sobre a cor
 * chapada de identidade). Uma forma só, o círculo; canto arredondado é a
 * família do `ColorTile`.
 */

/**
 * A escala do avatar é dele (16, 24, 32, 40, 48, 56) e diverge da escada de controle
 * de propósito: avatar identifica pessoa numa lista, e 40px é teto. O `xs` a 24
 * vale o mesmo nos dois vocabulários. O `2xs` a 16 é o avatar do tamanho do texto (a linha da data do lançamento): as
 * iniciais ficam em 8px, porque com 11px duas letras não cabem, e ele não tem
 * canto nem `onEdit`.
 */
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full select-none",
  {
    variants: {
      size: {
        "2xs": "size-4 text-[0.5rem] leading-none",
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

/**
 * O canto do avatar (rodada 362): um círculo no canto de baixo à direita, com
 * um anel na cor da superfície onde o avatar pousa (`--avatar-badge-ring`, senão
 * `--background`), para recortar a foto. O corpo acompanha a escala do avatar e
 * manda no do ícone (`16/solid`).
 */
const avatarBadgeVariants = cva(
  "pointer-events-none absolute -end-0.5 -bottom-0.5 grid place-items-center rounded-full bg-secondary text-secondary-foreground ring-2 ring-(--avatar-badge-ring,var(--background)) transition-colors duration-(--duration-fast)",
  {
    variants: {
      size: {
        xs: "size-3 [&>svg]:size-2",
        sm: "size-3.5 [&>svg]:size-2.5",
        md: "size-4 [&>svg]:size-2.5",
        lg: "size-5 [&>svg]:size-3",
        xl: "size-6 [&>svg]:size-3.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

function AvatarBadge({
  className,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof avatarBadgeVariants>) {
  return (
    <span
      data-slot="avatar-badge"
      aria-hidden="true"
      className={cn(avatarBadgeVariants({ size }), className)}
      {...props}
    />
  )
}

type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants> & {
    /** O desenho do canto (um ícone): fica fora do recorte do círculo. */
    badge?: React.ReactNode
    /**
     * A foto vira o botão de editar: o avatar inteiro é o alvo, e o canto mostra
     * o lápis (a menos que `badge` diga outro desenho).
     */
    onEdit?: () => void
    /** O nome do botão de editar. */
    editLabel?: string
  }

function Avatar({
  className,
  size,
  badge,
  onEdit,
  editLabel = "Editar foto",
  ...props
}: AvatarProps) {
  // Em 16px o canto não cabe: o `2xs` ignora `badge` e `onEdit`.
  const cantoSize = size === "2xs" ? null : size
  const canto = cantoSize === null ? null : (badge ?? (onEdit ? <PencilIcon /> : null))
  const raiz = (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size ?? "md"}
      className={cn(avatarVariants({ size }), !canto && className)}
      {...props}
    />
  )
  if (!canto) return raiz

  const corpo = (
    <>
      {raiz}
      <AvatarBadge size={cantoSize ?? undefined}>{canto}</AvatarBadge>
    </>
  )
  if (!onEdit) {
    return (
      <span data-slot="avatar-frame" className={cn("relative inline-flex shrink-0 rounded-full", className)}>
        {corpo}
      </span>
    )
  }
  return (
    <button
      type="button"
      data-slot="avatar-frame"
      aria-label={editLabel}
      onClick={onEdit}
      className={cn(
        "group/avatar relative inline-flex shrink-0 cursor-pointer rounded-full outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/45",
        "hover:[&_[data-slot=avatar-badge]]:bg-secondary-hover active:[&_[data-slot=avatar-badge]]:bg-secondary-hover",
        className
      )}
    >
      {corpo}
    </button>
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

export { Avatar, AvatarBadge, AvatarFallback, AvatarImage, avatarBadgeVariants, avatarVariants }
export type { AvatarProps }
