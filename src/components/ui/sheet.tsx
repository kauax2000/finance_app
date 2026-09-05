"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { Dialog as SheetPrimitive } from "radix-ui"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { DragHandle } from "@/components/ui/drag-handle"
import {
  EdgePanelContent,
  EDGE_PANEL_OVERLAY_CLASS,
  edgePanelContentVariants,
} from "@/components/ui/edge-panel"

/**
 * A folha no desktop, a gaveta no telefone — e uma API só.
 *
 * ## Por que
 *
 * O app abria 37 folhas de baixo com uma alça de gaveta desenhada em cima. A
 * alça era uma `div` com `aria-hidden` e **nenhum handler**: ela prometia o
 * arraste e não entregava. A "física de gaveta" eram dois keyframes de CSS
 * (`translate3d(0,100%,0) → 0`) — uma animação de entrada, que não responde ao
 * dedo. Enquanto isso o `Drawer` (vaul), que faz exatamente isso de verdade,
 * existia no projeto com **zero telas**.
 *
 * A regra agora é a que o produto sempre quis: **folha é coisa de desktop; no
 * telefone ela é gaveta.** Não é um `if` espalhado por 37 arquivos — a
 * superfície se escolhe aqui, e quem chama escreve `<Sheet>` nos dois casos.
 *
 * ## Como isso é possível
 *
 * Porque as três superfícies modais do projeto são **a mesma primitiva**: o
 * `vaul` é construído sobre `@radix-ui/react-dialog`, o mesmo pacote que o
 * `radix-ui` reexporta, e há **uma instância só** em `node_modules`. Medido em
 * runtime, não suposto: com um `DialogTitle` do Radix dentro de um `Drawer` do
 * vaul, o `aria-labelledby` da gaveta aponta para o `id` que o título gerou.
 *
 * É o que faz a cromagem do `Dialog` servir os três: diálogo, folha e gaveta.
 *
 * Se um dia as versões divergirem e o npm instalar duas cópias de
 * `@radix-ui/react-dialog`, os contextos deixam de se enxergar e o título passa
 * a lançar dentro da gaveta. É a única premissa frágil desta arquitetura, e
 * está escrita aqui para quem for mexer em dependência saber o que olhar.
 */
type SheetSurface = "sheet" | "drawer"

const SheetSurfaceContext = React.createContext<SheetSurface>("sheet")

/** Qual superfície está ativa — é o que faz gatilho, fechar, portal e véu
 *  trocarem de primitiva sem quem chama saber. */
export function useSheetSurface(): SheetSurface {
  return React.useContext(SheetSurfaceContext)
}

function Sheet({
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const isMobile = useIsMobile()
  const surface: SheetSurface = isMobile ? "drawer" : "sheet"

  return (
    <SheetSurfaceContext.Provider value={surface}>
      {surface === "drawer" ? (
        // `repositionInputs` é o motivo de o `fillMobileViewport` ter existido:
        // é ele que impede a superfície de encolher quando o teclado do iOS
        // sobe. O vaul faz isso de fábrica; o CSS anterior tentava fazer à mão.
        <DrawerPrimitive.Root direction="bottom" repositionInputs {...props}>
          {children}
        </DrawerPrimitive.Root>
      ) : (
        <SheetPrimitive.Root data-slot="sheet" {...props}>
          {children}
        </SheetPrimitive.Root>
      )}
    </SheetSurfaceContext.Provider>
  )
}

function SheetTrigger(
  props: React.ComponentProps<typeof SheetPrimitive.Trigger>
) {
  const Comp =
    useSheetSurface() === "drawer"
      ? DrawerPrimitive.Trigger
      : SheetPrimitive.Trigger
  return <Comp data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  const Comp =
    useSheetSurface() === "drawer"
      ? DrawerPrimitive.Close
      : SheetPrimitive.Close
  return <Comp data-slot="sheet-close" {...props} />
}

function SheetPortal(
  props: React.ComponentProps<typeof SheetPrimitive.Portal>
) {
  const Comp =
    useSheetSurface() === "drawer"
      ? DrawerPrimitive.Portal
      : SheetPrimitive.Portal
  return <Comp data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  const surface = useSheetSurface()
  const Comp =
    surface === "drawer" ? DrawerPrimitive.Overlay : SheetPrimitive.Overlay
  return (
    <Comp
      data-slot="sheet-overlay"
      className={cn(
        EDGE_PANEL_OVERLAY_CLASS,
        // Só o painel anima o véu por keyframe; na gaveta o véu acompanha o
        // dedo, e uma duração fixa brigaria com o arraste.
        surface === "sheet" &&
          "ease-in-out data-open:animation-duration-(--duration-slow) data-closed:animation-duration-(--duration-slow)",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  fillMobileViewport = false,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof edgePanelContentVariants> & {
    /**
     * Gaveta alta: ocupa quase a tela, com uma folga no topo e a área segura
     * embaixo. Sem ela, a gaveta mede o próprio conteúdo e para em 85% da tela.
     *
     * O nome sobreviveu porque o significado sobreviveu — o que mudou é quem
     * entrega: era um `height` com `!important` em `globals.css`, agora é a
     * altura da própria gaveta.
     */
    fillMobileViewport?: boolean
  }) {
  const surface = useSheetSurface()

  if (surface === "drawer") {
    return (
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          data-slot="sheet-overlay"
          className={EDGE_PANEL_OVERLAY_CLASS}
        />
        <DrawerPrimitive.Content
          data-slot="sheet-content"
          data-surface="drawer"
          data-side="bottom"
          data-layout="fixed"
          className={cn(
            "group/dialog-content fixed inset-x-0 bottom-0 z-(--z-sheet)",
            "flex flex-col rounded-t-2xl border-t bg-background text-sm shadow-lg",
            // O mesmo contrato do painel, escrito lá.
            "[--dialog-px:--spacing(4)] [--dialog-bleed:0px]",
            "[--dialog-close:0px] has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]",
            // As duas alturas saem de variáveis, e não de valores crus, para
            // uma gaveta poder ajustar o teto sem reescrever a fórmula: uma
            // lista curta pede menos que 85%, e a folga do topo muda com o
            // aparelho.
            "[--sheet-drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-top,0px)))]",
            "[--sheet-drawer-max-h:85dvh]",
            fillMobileViewport
              ? "h-(--sheet-drawer-h)"
              : "max-h-(--sheet-drawer-max-h)",
            className
          )}
          {...props}
        >
          {/* A alça é da superfície, não do conteúdo: é o que se agarra para
              arrastá-la, como a borda e a sombra são dela. Uma tela nunca a
              escreve — 31 chamadas que faziam isso saíram na rodada em que ela
              virou peça. */}
          <DragHandle />
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    )
  }

  // No desktop a folha **é** um painel de borda — e é o mesmo componente que a
  // navegação usa, para a moldura, a animação e o véu existirem uma vez só.
  return (
    <EdgePanelContent
      side={side}
      data-slot="sheet-content"
      data-surface="sheet"
      className={className}
      {...props}
    >
      {children}
    </EdgePanelContent>
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetOverlay,
  SheetPortal,
  SheetTrigger,
}
