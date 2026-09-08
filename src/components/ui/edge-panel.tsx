"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as EdgePanelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/modal-classes"
import { useViewportWindow } from "@/hooks/use-mobile"

/**
 * Um painel preso a uma borda — **em qualquer largura de tela**.
 *
 * Ele existe porque duas coisas diferentes se chamavam `Sheet`:
 *
 * 1. **Superfície de conteúdo modal** — formulário, detalhe, filtros. No
 *    telefone ela deve ser gaveta, e é o que o `Sheet` faz hoje.
 * 2. **Painel preso a uma borda** — a navegação lateral. No telefone ela
 *    continua sendo um painel lateral: navegação entra pelo lado, não sobe do
 *    rodapé.
 *
 * Enquanto a `Sidebar` pegava o `Sheet` emprestado para ter (2), ela herdou a
 * regra de (1) e virou uma gaveta de baixo — com alça e cantos arredondados no
 * topo, para um menu de navegação. Separar não foi preferência: as duas
 * respondem diferente à mesma pergunta sobre o telefone.
 *
 * O `Sheet` reusa este arquivo no desktop, então a moldura, a animação e o véu
 * são escritos uma vez só.
 */
const edgePanelContentVariants = cva(
  [
    "group/dialog-content fixed z-(--z-sheet) flex flex-col gap-4",
    // `bg-clip-padding` fica: `glass-surface` é dona de **uma** propriedade
    // (`backdrop-filter`) e não escreve `background-clip`, ao contrário da
    // `@utility glass`. Não há disputa.
    "bg-clip-padding text-sm shadow-lg",
    modalSurfaceClassName,
    "duration-(--duration-slow) ease-in-out transition-colors will-change-transform",
    "motion-reduce:will-change-auto motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none",
    "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
    // O contrato que a cromagem do `Dialog` lê — o mesmo em painel, folha e
    // gaveta, e o motivo de `DialogHeader` funcionar dentro dos três.
    "[--dialog-px:--spacing(4)]",
    "[--dialog-bleed:0px]",
    // A reserva do × vem de **haver** um ×, não de um prop. Dentro de um
    // `DialogHeaderRow` quem reserva é a coluna do adorno.
    "[--dialog-close:0px] has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]",
  ],
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto border-b data-open:slide-in-from-top-12 data-closed:slide-out-to-top-12",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-open:slide-in-from-right-12 data-closed:slide-out-to-right-12",
        bottom:
          "inset-x-0 bottom-0 h-auto border-t ease-(--ease-emphasized) data-open:slide-in-from-bottom-12 data-closed:slide-out-to-bottom-12",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-open:slide-in-from-left-12 data-closed:slide-out-to-left-12",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

/**
 * O véu. Acima do chrome do telefone (`MobileBottomNav` e FAB estão em
 * `--z-modal`); abaixo do `Toaster`, em `--z-toast`.
 */
const EDGE_PANEL_OVERLAY_CLASS =
  "fixed inset-0 z-(--z-sheet) bg-overlay supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"

function EdgePanel({
  ...props
}: React.ComponentProps<typeof EdgePanelPrimitive.Root>) {
  return <EdgePanelPrimitive.Root data-slot="edge-panel" {...props} />
}

function EdgePanelTrigger({
  ...props
}: React.ComponentProps<typeof EdgePanelPrimitive.Trigger>) {
  return (
    <EdgePanelPrimitive.Trigger data-slot="edge-panel-trigger" {...props} />
  )
}

function EdgePanelClose({
  ...props
}: React.ComponentProps<typeof EdgePanelPrimitive.Close>) {
  return <EdgePanelPrimitive.Close data-slot="edge-panel-close" {...props} />
}

function EdgePanelOverlay({
  className,
  ...props
}: React.ComponentProps<typeof EdgePanelPrimitive.Overlay>) {
  return (
    <EdgePanelPrimitive.Overlay
      data-slot="edge-panel-overlay"
      className={cn(
        EDGE_PANEL_OVERLAY_CLASS,
        "ease-in-out data-open:animation-duration-(--duration-slow) data-closed:animation-duration-(--duration-slow)",
        className
      )}
      {...props}
    />
  )
}

function EdgePanelContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof EdgePanelPrimitive.Content> &
  VariantProps<typeof edgePanelContentVariants>) {
  const janela = useViewportWindow()

  return (
    // O portal vai para o `body` da **janela ativa**. Fora da moldura do
    // catálogo o contexto é `null` e o Radix usa o `document` dele mesmo — o
    // app não muda. Dentro dela, é isto que impede o painel de escapar do
    // iframe e cobrir a página inteira, que era a segunda limitação declarada
    // da moldura.
    <EdgePanelPrimitive.Portal container={janela?.document.body}>
      <EdgePanelOverlay />
      <EdgePanelPrimitive.Content
        // Antes de `{...props}`: quem embrulha este painel — o `Sheet` no
        // desktop — precisa poder carimbar o próprio `data-slot`.
        data-slot="edge-panel-content"
        data-surface="panel"
        data-side={side}
        data-layout="fixed"
        className={cn(edgePanelContentVariants({ side }), className)}
        {...props}
      >
        {children}
      </EdgePanelPrimitive.Content>
    </EdgePanelPrimitive.Portal>
  )
}

export {
  EdgePanel,
  EdgePanelClose,
  EdgePanelContent,
  EdgePanelOverlay,
  EdgePanelTrigger,
  EDGE_PANEL_OVERLAY_CLASS,
  edgePanelContentVariants,
}
