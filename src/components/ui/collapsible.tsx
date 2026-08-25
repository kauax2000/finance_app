"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

/**
 * A altura anima ao abrir e ao fechar.
 *
 * O `Accordion` já fazia isso e o `Collapsible` não — dois componentes com a
 * mesma interação e comportamentos diferentes, o que faz a escolha entre eles
 * virar uma decisão de movimento em vez de uma decisão de estrutura.
 *
 * Os keyframes já vinham no `tw-animate-css` que o projeto instala, ligados a
 * `--radix-collapsible-content-height`. Só faltava `overflow-hidden`, sem o
 * qual o conteúdo vaza durante o trajeto.
 */
function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden duration-(--duration-base) ease-(--ease-out)",
        "data-open:animate-collapsible-down data-closed:animate-collapsible-up",
        className
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
