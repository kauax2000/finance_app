"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/modal-classes"
import { DragHandle } from "@/components/ui/drag-handle"
import { EDGE_PANEL_OVERLAY_CLASS } from "@/components/ui/edge-panel"
import { useViewportModal, useViewportWindow } from "@/hooks/use-mobile"

/**
 * A gaveta — **em qualquer largura de tela**.
 *
 * ## O lugar dela entre as quatro superfícies
 *
 * O projeto tem quatro, e cada uma responde a uma pergunta diferente:
 *
 * | | Onde encosta | Responde ao dedo | Muda com a largura |
 * | --- | --- | --- | --- |
 * | `Dialog` | no meio | não | só na largura da caixa |
 * | `EdgePanel` | numa borda | não | não |
 * | **`Drawer`** | **no topo ou no rodapé** | **sim** | **não** |
 * | `Sheet` | borda no desktop, rodapé no telefone | no telefone | **sim** |
 *
 * `Sheet` é a que **troca de superfície**: painel acima de 768px, gaveta
 * abaixo. `Drawer` é gaveta sempre — é o que se usa quando o gesto é a
 * afordância, e não uma consequência de a tela ser estreita.
 *
 * ## O que esta versão corrigiu
 *
 * A anterior era o arquivo do shadcn intacto, sem nenhuma tela, e repetia
 * exatamente o defeito que a rodada do `Sheet` tirou de 37 telas: a alça era
 * uma `div` decorativa — sem `data-vaul-handle`, sem área de toque, sem gesto.
 * Ela **desenhava a promessa do arraste** enquanto a física ficava só na
 * documentação. Agora a alça é o `DragHandle`, que é o `Handle` do vaul: ela é
 * a área de arraste e tem os 44px de alvo. O que **não** faz é fechar no
 * clique — o vaul só fecha ali quando `dismissible` é falso, e está medido e
 * escrito em `drag-handle.tsx`.
 *
 * Junto vieram as decisões que o `Sheet` já tinha tomado e esta não seguia:
 * `--z-sheet` em vez de `--z-modal` (duas gavetas em camadas diferentes),
 * `bg-background` em vez de `bg-popover` (que é token de camada pequena),
 * `dvh` + área segura em vez de `80vh` (que mente quando a barra do navegador
 * recolhe), e `repositionInputs`, que é o que impede a gaveta de encolher
 * quando o teclado do iOS sobe.
 *
 * ## A cromagem não é daqui
 *
 * `DrawerHeader`, `DrawerTitle`, `DrawerDescription` e `DrawerFooter` **saíram
 * do arquivo**. Cabeçalho, título, corpo rolável e rodapé vêm do `Dialog`, como
 * já vêm na folha, e pelo mesmo motivo: `vaul` é construído sobre
 * `@radix-ui/react-dialog`, há uma instância só em `node_modules`, e por isso
 * `DialogTitle` encontra o contexto de que precisa **dentro** de um
 * `DrawerContent`. Manter uma segunda cromagem aqui era manter dois títulos de
 * gaveta que divergiam — e o daqui divergia: centralizava o texto, contra a
 * decisão de que o cabeçalho é alinhado à esquerda em toda largura.
 *
 * ## Só o eixo vertical
 *
 * `direction` aceita `bottom` e `top`, e não `left` / `right`. Não é
 * simplificação: o `[data-vaul-handle]` do vaul declara `touch-action: pan-y`,
 * ou seja, a alça **só arrasta na vertical**. Uma gaveta lateral teria a alça
 * de enfeite outra vez. Painel preso a uma borda lateral é `EdgePanel`, que não
 * promete gesto nenhum.
 */

const drawerContentVariants = cva(
  [
    // `group/dialog-content` é o que a cromagem do `Dialog` procura — é por
    // este nome que `DialogHeader` sabe que está num layout `fixed`.
    "group/dialog-content fixed inset-x-0 z-(--z-sheet)",
    "flex flex-col text-sm shadow-lg",
    modalSurfaceClassName,
    "focus:outline-none",
    // O contrato que a cromagem do `Dialog` lê — o mesmo que `EdgePanelContent`
    // declara, palavra por palavra, para o cabeçalho e o rodapé medirem igual
    // na folha, no painel e aqui.
    "[--dialog-px:--spacing(4)]",
    "[--dialog-bleed:0px]",
    // A reserva do × vem de **haver** um ×, não de um prop.
    "[--dialog-close:0px] has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]",
    // As alturas saem de variáveis para uma gaveta poder baixar o teto sem
    // reescrever a fórmula: uma lista curta pede menos que 85%.
    "[--drawer-max-h:85dvh]",
    // A área segura é da superfície. As 11 telas que hoje escrevem
    // `pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]` à mão o fazem porque
    // a folha não a carregava; aqui ela vem de fábrica, e some sozinha no
    // aparelho que não tem barra de gestos.
    "data-[vaul-drawer-direction=bottom]:pb-(--drawer-safe)",
    "data-[vaul-drawer-direction=top]:pt-(--drawer-safe)",
    "data-[vaul-drawer-direction=bottom]:[--drawer-safe:env(safe-area-inset-bottom,0px)]",
    "data-[vaul-drawer-direction=top]:[--drawer-safe:env(safe-area-inset-top,0px)]",
    // A folga do topo muda com o aparelho, então ela também é variável.
    "data-[vaul-drawer-direction=bottom]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-top,0px)))]",
    "data-[vaul-drawer-direction=top]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-bottom,0px)))]",
    // O raio e a borda ficam do lado que **não** encosta na tela.
    "data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:rounded-t-2xl data-[vaul-drawer-direction=bottom]:border-t",
    "data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:rounded-b-2xl data-[vaul-drawer-direction=top]:border-b",
  ],
  {
    variants: {
      /**
       * Gaveta alta: ocupa quase a tela, com uma folga na borda oposta. Sem
       * ela, a gaveta mede o próprio conteúdo e para no teto de 85%.
       */
      fill: {
        true: "h-(--drawer-h)",
        false: "max-h-(--drawer-max-h)",
      },
      /**
       * Onde a gaveta encosta.
       *
       * `flush` cola nas três bordas e arredonda só o lado de dentro — é a
       * gaveta do telefone, e o padrão. `inset` a solta da tela: margem nos
       * três lados, cantos completos, e a página aparecendo em volta. A segunda
       * forma existe porque uma gaveta **de desktop** coberta de borda a borda
       * lê como um erro de layout, não como uma superfície.
       */
      variant: {
        flush: "",
        inset: [
          "inset-x-(--drawer-inset) rounded-2xl border",
          "data-[vaul-drawer-direction=bottom]:bottom-(--drawer-inset)",
          "data-[vaul-drawer-direction=top]:top-(--drawer-inset)",
          "[--drawer-inset:--spacing(2)]",
        ].join(" "),
      },
      /**
       * O teto de largura.
       *
       * Uma gaveta de baixo numa janela de 1900px vira uma linha de leitura de
       * 1900px, que nenhuma medida de texto suporta. `md` e `lg` a centralizam
       * e param; `full` é o comportamento do telefone, e continua o padrão
       * porque é lá que a gaveta nasceu.
       */
      size: {
        full: "",
        md: "mx-auto sm:max-w-lg",
        lg: "mx-auto sm:max-w-2xl",
      },
    },
    defaultVariants: {
      fill: false,
      variant: "flush",
      size: "full",
    },
  }
)

type DrawerDirection = "bottom" | "top"

function Drawer({
  direction = "bottom",
  repositionInputs = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * Só o eixo vertical — a alça do vaul é `touch-action: pan-y`.
   *
   * A restrição é uma **interseção**, e não um `Omit`: os props da raiz do
   * `vaul` são uma união discriminada (com e sem `fadeFromIndex`), e `Omit`
   * sobre união achata os dois lados num objeto só, que depois não é
   * atribuível a nenhum deles. A interseção distribui e preserva a união.
   */
  direction?: DrawerDirection
}) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      direction={direction}
      // O motivo é o mesmo que o `Sheet` documenta: é `repositionInputs` que
      // impede a superfície de encolher quando o teclado do iOS sobe.
      repositionInputs={repositionInputs}
      // Dentro da moldura do catálogo ela deixa de ser modal — senão o
      // `RemoveScroll` do Radix trava a rolagem da **página de fora**. Antes de
      // `{...props}`, para quem chama continuar mandando. Ver `useViewportModal`.
      modal={useViewportModal()}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

/**
 * O portal vai para o `body` da **janela ativa**, como o do `EdgePanel`.
 *
 * Fora da moldura de viewport do catálogo o contexto é `null` e o vaul usa o
 * próprio documento — o app não muda. Dentro dela, é isto que impede a gaveta
 * de escapar do `<iframe>` e cobrir a página inteira: a moldura já faz o
 * `useIsMobile` ler a janela de dentro, então uma folha a 375px toma o ramo
 * gaveta ali, e sem o `container` ela era portalizada para fora.
 */
function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  const janela = useViewportWindow()
  return <DrawerPrimitive.Portal container={janela?.document.body} {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

/**
 * O véu — o mesmo do painel e o mesmo da folha, escrito uma vez em
 * `edge-panel.tsx`. Sem a duração fixa que o painel acrescenta: aqui o véu
 * acompanha o dedo, e um keyframe brigaria com o arraste.
 */
function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(EDGE_PANEL_OVERLAY_CLASS, className)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  fill,
  variant,
  size,
  showHandle = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerContentVariants> & {
    /**
     * A gaveta sem alça — para quando ela não se arrasta (`dismissible={false}`
     * na raiz). Com o gesto ligado, desligar a alça é tirar a única pista de
     * que ele existe.
     */
    showHandle?: boolean
  }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        data-surface="drawer"
        data-variant={variant}
        data-size={size}
        // `fixed` é o que a cromagem do `Dialog` lê para dar recuo ao cabeçalho
        // e deixar o corpo rolar entre ele e o rodapé.
        data-layout="fixed"
        className={cn(drawerContentVariants({ fill, variant, size }), className)}
        {...props}
      >
        {showHandle ? (
          <DragHandle />
        ) : null}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTrigger,
  drawerContentVariants,
}
