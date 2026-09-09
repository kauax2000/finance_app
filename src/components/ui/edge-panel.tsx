"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as EdgePanelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/modal-classes"
import { useViewportModal, useViewportWindow } from "@/hooks/use-mobile"

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
      /**
       * De qual borda ele entra.
       *
       * **A posição sai de três variáveis, e não de números.** O eixo `variant`
       * mexe na posição de cada lado, e quatro lados × duas variantes seriam
       * oito `compoundVariants`. Com a calha em variável, `side` escreve a
       * posição **uma vez** e ela resolve em 0 no encostado e em 8px no
       * flutuante — o mecanismo de `--dialog-bleed`, `--drawer-inset` e
       * `--sidebar-inset-rule`: variável herda e não disputa.
       *
       * **E nenhuma delas é declarada aqui nem em `flush`.** Cada uso a lê com
       * o próprio `0px` como fallback, que é o mecanismo de `--glass-ink`: sem
       * declaração não há disputa, e `flush` é no-op por **construção**. Um
       * `[--edge-panel-gap:0px]` na base empataria em especificidade com o do
       * `floating`, e quem venceria seria a ordem de emissão do Tailwind.
       *
       * **`h-full` saiu de `left` e `right`, e a remoção é o conserto.** O
       * bloco contentor de um `fixed` é o viewport, então `height: 100%` e o
       * par `top: 0` / `bottom: 0` resolvem no mesmo número — ele era
       * redundante. Sob `floating` ele deixa de ser: com `top: 8px` e altura
       * definida, o painel mede a tela inteira começando 8px abaixo e
       * **transborda 8px na base**, com o canto de baixo fora da tela.
       */
      side: {
        top: "inset-x-[var(--edge-panel-gap,0px)] top-[var(--edge-panel-gap-block-start,0px)] h-auto data-open:slide-in-from-top-12 data-closed:slide-out-to-top-12",
        right:
          "top-[var(--edge-panel-gap-block-start,0px)] right-[var(--edge-panel-gap,0px)] bottom-[var(--edge-panel-gap-block-end,0px)] w-3/4 sm:max-w-sm data-open:slide-in-from-right-12 data-closed:slide-out-to-right-12",
        bottom:
          "inset-x-[var(--edge-panel-gap,0px)] bottom-[var(--edge-panel-gap-block-end,0px)] h-auto ease-(--ease-emphasized) data-open:slide-in-from-bottom-12 data-closed:slide-out-to-bottom-12",
        left: "top-[var(--edge-panel-gap-block-start,0px)] left-[var(--edge-panel-gap,0px)] bottom-[var(--edge-panel-gap-block-end,0px)] w-3/4 sm:max-w-sm data-open:slide-in-from-left-12 data-closed:slide-out-to-left-12",
      },
      /**
       * Se ele encosta na tela ou flutua sobre ela.
       *
       * `flush` cola nas três bordas e desenha só o gume que fica para dentro —
       * é a navegação, e o padrão. `floating` abre uma calha de 8px, arredonda
       * os quatro cantos e fecha a borda em volta, com a página aparecendo por
       * baixo. É a mesma ideia que a `Sidebar` chama de `floating` no desktop —
       * e que o `Drawer` ainda chama de `inset`, que é o vocabulário a
       * convergir numa rodada própria.
       *
       * **O material não muda, e é decisão medida.** A tentação é vestir a
       * `@utility glass` como a placa da `Sidebar` faz. Ali é certo porque
       * aquela placa **reserva a própria calha no fluxo** — nada passa por trás
       * dela, borrar cor chapada não desenha nada, e a luz é pintada. Aqui é o
       * contrário: o painel é modal, há o `--overlay` a 40% e a página inteira
       * atrás. O flutuante tem **mais** conteúdo por baixo que o encostado, não
       * menos — e `modalSurfaceClassName`, que já está na base, é o material
       * borrado de 24px com `saturate(1.5)`. Nenhuma linha de vidro aqui.
       *
       * **As duas verticais somam a área segura.** Uma calha medida a partir do
       * viewport põe o canto de baixo atrás do indicador de home num iPhone, e
       * o telefone é onde vive o consumidor principal deste componente. A
       * horizontal fica de fora de propósito: `env(safe-area-inset-left/right)`
       * não aparece **nenhuma vez** no repositório, e o dono dessa lacuna é a
       * casca do app — fechá-la só aqui seria a segunda gramática para a mesma
       * coisa.
       *
       * O `max()` lê `var(--edge-panel-gap)` em vez de chamar `--spacing()`
       * dentro dele: é a forma que `sheet.tsx` já usa (`max(0.5rem,env(…))`).
       */
      variant: {
        flush: "",
        floating: [
          "rounded-xl border",
          "[--edge-panel-gap:--spacing(2)]",
          "[--edge-panel-gap-block-start:max(var(--edge-panel-gap),env(safe-area-inset-top,0px))]",
          "[--edge-panel-gap-block-end:max(var(--edge-panel-gap),env(safe-area-inset-bottom,0px))]",
        ].join(" "),
      },
    },
    /**
     * O gume do encostado, e ele é composto por necessidade.
     *
     * `floating` desenha as quatro bordas e `flush` desenha **uma**, que muda
     * com o lado. Empilhar `border` sobre `border-l` e contar com o `twMerge`
     * funciona por acidente: os dois grupos conflitam, mas quem vence depende
     * da ordem em que o `cva` emite `side` e `variant` — e decisão por ordem de
     * emissão não é decisão. É a forma que o `drawer.tsx` já usa para as bordas
     * que dependem da direção.
     */
    compoundVariants: [
      { variant: "flush", side: "top", class: "border-b" },
      { variant: "flush", side: "right", class: "border-l" },
      { variant: "flush", side: "bottom", class: "border-t" },
      { variant: "flush", side: "left", class: "border-r" },
    ],
    defaultVariants: {
      side: "right",
      variant: "flush",
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
  // Dentro da moldura do catálogo ele deixa de ser modal — senão o
  // `RemoveScroll` do Radix trava a rolagem da **página de fora**. Antes de
  // `{...props}`, para quem chama continuar mandando. Ver `useViewportModal`.
  return (
    <EdgePanelPrimitive.Root
      data-slot="edge-panel"
      modal={useViewportModal()}
      {...props}
    />
  )
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
  variant = "flush",
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
        data-variant={variant}
        data-layout="fixed"
        className={cn(edgePanelContentVariants({ side, variant }), className)}
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
