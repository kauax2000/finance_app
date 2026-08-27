"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * A caixa flutuante do tooltip.
 *
 * Era uma linha de novecentos caracteres com quatro coisas erradas dentro.
 *
 * **A superfície era emprestada da sidebar.** `bg-sidebar-accent`,
 * `text-sidebar-accent-foreground` e `border-sidebar-border` num overlay que
 * aparece em qualquer canto do app. O preço apareceu sozinho: ao corrigir o
 * item ativo do menu lateral — que era o mesmo cinza da lateral, razão 1,00 —,
 * o fundo e a tinta **do tooltip** se mexeram junto, sem ninguém pedir. Agora
 * ele fala a língua de overlay do sistema, `--popover`, a mesma do `Popover` e
 * do `DropdownMenu`.
 *
 * **`h-8` cortava tooltip de duas linhas.** Medido: com `max-w-xs` o texto
 * quebrava, o conteúdo pedia 45px de altura e a caixa continuava com 32. A
 * altura agora vem do padding.
 *
 * **Metade da animação nunca rodou.** O Radix marca o conteúdo do tooltip como
 * `delayed-open`, `instant-open` ou `closed` — nunca `open`. As classes
 * `data-open:*` eram letra morta, e `instant-open`, que é o estado quando outro
 * tooltip acabou de fechar, entrava sem transição nenhuma. Os três estados
 * estão cobertos.
 *
 * **A costura com o `Kbd` não costurava nada.** Quatro classes aqui
 * (`has-data-[slot=kbd]:pr-1.5` e três `**:data-[slot=kbd]:*`) e três no
 * `Kbd`, para um par que **nenhuma tela monta** — a única aparição era um
 * `<kbd>` cru na página do catálogo, que não é o componente. Saíram das duas
 * pontas.
 */
function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-(--z-modal) w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin)",
          "rounded-md border border-border bg-popover px-3 py-1.5 shadow-md",
          "text-sm font-medium text-balance text-popover-foreground",
          // Entra deslizando do lado do gatilho, o que dá direção ao movimento
          // em vez de fazer a caixa surgir do nada.
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          "fade-in-0 zoom-in-95 fade-out-0 zoom-out-95",
          "data-[state=delayed-open]:animate-in data-[state=instant-open]:animate-in data-[state=closed]:animate-out",
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
