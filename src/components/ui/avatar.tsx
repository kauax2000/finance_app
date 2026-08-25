"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "size-6 text-2xs",
        sm: "size-8 text-xs",
        default: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-14 text-lg",
      },
    },
    defaultVariants: {
      size: "default",
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
      data-size={size ?? "default"}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  )
}

/**
 * A foto entra em fade quando termina de carregar.
 *
 * Sem isso ela aparece de estalo por cima das iniciais, e o troco é visível
 * justamente onde o avatar mais aparece: uma lista de membros ou de transações,
 * onde uma dúzia deles resolve em momentos diferentes e a tela pisca em
 * pedaços.
 *
 * É **animação de entrada**, e não transição. O `Avatar.Image` do Radix não
 * publica `data-state` nem renderiza cedo: ele simplesmente não monta enquanto
 * a imagem não carregou. Transição precisa de dois estados no mesmo elemento e
 * aqui só existe um — a primeira versão disto usava
 * `data-[state=loaded]:opacity-100` e deixava toda foto de perfil invisível,
 * porque o seletor nunca casava.
 */
const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ComponentProps<typeof AvatarPrimitive.Image>
>(({ className, alt = "", ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    alt={alt}
    className={cn(
      "aspect-square h-full w-full object-cover",
      "animate-in fade-in duration-(--duration-base) ease-(--ease-out)",
      className
    )}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted font-medium",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback, AvatarImage, avatarVariants }
