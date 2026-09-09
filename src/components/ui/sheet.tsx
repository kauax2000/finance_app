"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as SheetPrimitive } from "radix-ui"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/modal-classes"
import {
  useIsMobile,
  useViewportModal,
  useViewportWindow,
} from "@/hooks/use-mobile"
import { DragHandle } from "@/components/ui/drag-handle"

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
/**
 * O painel de borda — o ramo desktop da folha.
 *
 * **Isto já foi um componente, e voltou a ser um ramo.** Ele nasceu `EdgePanel`
 * porque duas coisas se chamavam `Sheet` e respondiam diferente ao telefone:
 * conteúdo vira gaveta, e a navegação lateral — dizia a rodada — devia
 * continuar painel. A `Sidebar` usava este `cva` por fora. A decisão foi
 * invertida (rodada 64): **no telefone tudo é gaveta**, inclusive a navegação,
 * e sem um consumidor que precisasse do painel em toda largura o componente
 * separado era uma segunda API para a mesma moldura. Ele dissolveu aqui, com
 * os dois eixos, o gume composto e a área segura exatamente como eram.
 *
 * **A posição sai de três variáveis, e não de números.** O eixo `variant` mexe
 * na posição de cada lado, e quatro lados × duas variantes seriam oito
 * `compoundVariants`. Com a calha em variável, `side` escreve a posição **uma
 * vez** e ela resolve em 0 no encostado e em 8px no flutuante — o mecanismo de
 * `--dialog-bleed` e `--sidebar-inset-rule`: variável herda e não disputa.
 *
 * **E nenhuma delas é declarada na base nem em `flush`.** Cada uso a lê com o
 * próprio `0px` como fallback, que é o mecanismo de `--glass-ink`: sem
 * declaração não há disputa, e `flush` é no-op por **construção**. Um
 * `[--sheet-gap:0px]` na base empataria em especificidade com o do `floating`,
 * e quem venceria seria a ordem de emissão do Tailwind.
 *
 * **`h-full` não existe em `left` e `right`, e a ausência é o conserto.** O
 * bloco contentor de um `fixed` é o viewport, então `height: 100%` e o par
 * `top: 0` / `bottom: 0` resolvem no mesmo número — ele era redundante. Sob
 * `floating` ele deixa de ser: com `top: 8px` e altura definida, o painel mede
 * a tela inteira começando 8px abaixo e **transborda 8px na base**.
 *
 * **O gume do encostado é composto por necessidade.** `floating` desenha as
 * quatro bordas e `flush` desenha **uma**, que muda com o lado. Empilhar
 * `border` sobre `border-l` e contar com o `twMerge` funciona por acidente —
 * quem vence depende da ordem em que o `cva` emite `side` e `variant`, e
 * decisão por ordem de emissão não é decisão.
 *
 * **O material não muda entre as duas, e é decisão medida.** A tentação é
 * vestir a `@utility glass` no `floating` como a placa da `Sidebar` faz. Ali é
 * certo porque aquela placa **reserva a própria calha no fluxo** — nada passa
 * por trás dela e a luz é pintada. Aqui o painel é modal, há o `--overlay` a
 * 40% e a página inteira atrás: o flutuante tem **mais** conteúdo por baixo que
 * o encostado, e `modalSurfaceClassName` já é o material borrado de 24px.
 *
 * **As duas verticais somam a área segura.** Uma calha medida a partir do
 * viewport põe o canto de baixo atrás do indicador de home num iPhone. A
 * horizontal fica de fora de propósito: `env(safe-area-inset-left/right)` não
 * aparece nenhuma vez no repositório, e o dono dessa lacuna é a casca do app.
 */
const sheetContentVariants = cva(
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
    // O contrato que a cromagem do `Dialog` lê — o mesmo em painel e gaveta, e
    // o motivo de `DialogHeader` funcionar dentro dos dois.
    "[--dialog-px:--spacing(4)]",
    "[--dialog-bleed:0px]",
    // A reserva do × vem de **haver** um ×, não de um prop. Dentro de um
    // `DialogHeaderRow` quem reserva é a coluna do adorno.
    "[--dialog-close:0px] has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]",
  ],
  {
    variants: {
      /** De qual borda ele entra — no desktop; no telefone é sempre a gaveta de baixo. */
      side: {
        top: "inset-x-[var(--sheet-gap,0px)] top-[var(--sheet-gap-block-start,0px)] h-auto data-open:slide-in-from-top-12 data-closed:slide-out-to-top-12",
        right:
          "top-[var(--sheet-gap-block-start,0px)] right-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] w-3/4 sm:max-w-sm data-open:slide-in-from-right-12 data-closed:slide-out-to-right-12",
        bottom:
          "inset-x-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] h-auto ease-(--ease-emphasized) data-open:slide-in-from-bottom-12 data-closed:slide-out-to-bottom-12",
        left: "top-[var(--sheet-gap-block-start,0px)] left-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] w-3/4 sm:max-w-sm data-open:slide-in-from-left-12 data-closed:slide-out-to-left-12",
      },
      /** `flush` cola na tela e desenha só o gume de dentro; `floating` abre uma calha de 8px e fecha a borda em volta. */
      variant: {
        flush: "",
        floating: [
          "rounded-xl border",
          "[--sheet-gap:--spacing(2)]",
          "[--sheet-gap-block-start:max(var(--sheet-gap),env(safe-area-inset-top,0px))]",
          "[--sheet-gap-block-end:max(var(--sheet-gap),env(safe-area-inset-bottom,0px))]",
        ].join(" "),
      },
    },
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
 * O véu — o mesmo no painel, na gaveta e no `Drawer`. Acima do chrome do
 * telefone (`MobileBottomNav` e FAB estão em `--z-modal`); abaixo do `Toaster`.
 */
const SHEET_OVERLAY_CLASS =
  "fixed inset-0 z-(--z-sheet) bg-overlay supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"

/**
 * Qual superfície está de fato montada.
 *
 * Ela se chamava `"sheet"` do lado do painel — circular dentro de um componente
 * chamado `Sheet`, e impossível de usar como valor de prop. É `"panel"` desde
 * que a escolha virou eixo.
 */
type SheetSurface = "panel" | "drawer"

/**
 * Como a superfície é escolhida.
 *
 * `auto` é a regra da casa: painel de borda acima de 768px, gaveta abaixo. Ela
 * é o padrão, e continua valendo para toda folha do app.
 *
 * `panel` **fixa** o painel em qualquer largura, e existe para um caso só —
 * **navegação presa a uma borda**. Um menu entra pelo lado; ele não sobe do
 * rodapé com alça de arraste para listar seis links.
 *
 * Isto já foi um componente. O `EdgePanel` era exatamente este comportamento, e
 * a rodada 64 o dissolveu aqui com o argumento de que, sem um consumidor que
 * precisasse do painel em toda largura, ele era uma segunda API para a mesma
 * moldura. O argumento continua de pé — o que mudou é que o consumidor voltou,
 * e o que ele precisa é de **uma prop**, não de um arquivo. (Rodada 66.)
 *
 * **Não existe forçar a gaveta.** Uma superfície que é gaveta em qualquer
 * largura já tem nome e arquivo: o `Drawer`.
 */
type SheetSurfaceMode = "auto" | "panel"

const SheetSurfaceContext = React.createContext<SheetSurface>("panel")

/** Qual superfície está ativa — é o que faz gatilho, fechar, portal e véu
 *  trocarem de primitiva sem quem chama saber. */
export function useSheetSurface(): SheetSurface {
  return React.useContext(SheetSurfaceContext)
}

function Sheet({
  children,
  surface: modo = "auto",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root> & {
  /** `auto` painel no desktop e gaveta no telefone; `panel` painel sempre. */
  surface?: SheetSurfaceMode
}) {
  const isMobile = useIsMobile()
  const surface: SheetSurface = isMobile && modo === "auto" ? "drawer" : "panel"
  // Dentro da moldura do catálogo ela deixa de ser modal — senão o
  // `RemoveScroll` do Radix trava a rolagem da **página de fora**. Antes de
  // `{...props}`, para quem chama continuar mandando. Ver `useViewportModal`.
  const modal = useViewportModal()

  return (
    <SheetSurfaceContext.Provider value={surface}>
      {surface === "drawer" ? (
        // `repositionInputs` é o motivo de o `fillMobileViewport` ter existido:
        // é ele que impede a superfície de encolher quando o teclado do iOS
        // sobe. O vaul faz isso de fábrica; o CSS anterior tentava fazer à mão.
        <DrawerPrimitive.Root
          direction="bottom"
          repositionInputs
          modal={modal}
          {...props}
        >
          {children}
        </DrawerPrimitive.Root>
      ) : (
        <SheetPrimitive.Root data-slot="sheet" modal={modal} {...props}>
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
        SHEET_OVERLAY_CLASS,
        // Só o painel anima o véu por keyframe; na gaveta o véu acompanha o
        // dedo, e uma duração fixa brigaria com o arraste.
        surface === "panel" &&
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
  variant,
  fillMobileViewport = false,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetContentVariants> & {
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
  // O portal — dos dois ramos — vai para o `body` da **janela ativa**. Fora da
  // moldura do catálogo o contexto
  // é `null` e o vaul usa o próprio documento — o app não muda. Dentro dela é o
  // que impede a folha de escapar do `<iframe>`: a moldura faz o `useIsMobile`
  // ler a janela de dentro, então a 375px o ramo gaveta é o que renderiza ali.
  const janela = useViewportWindow()

  if (surface === "drawer") {
    return (
      <DrawerPrimitive.Portal container={janela?.document.body}>
        <DrawerPrimitive.Overlay
          data-slot="sheet-overlay"
          className={SHEET_OVERLAY_CLASS}
        />
        <DrawerPrimitive.Content
          data-slot="sheet-content"
          data-surface="drawer"
          data-side="bottom"
          data-layout="fixed"
          className={cn(
            "group/dialog-content fixed inset-x-0 bottom-0 z-(--z-sheet)",
            "flex flex-col overflow-hidden rounded-t-2xl border-t text-sm shadow-lg",
            // **A área segura é da superfície**, e ela só chegou aqui na rodada
            // 60. Até lá quem a dava era uma classe que as telas importavam
            // (`mobileFormSheetContentClassName`), e por isso 19 folhas a
            // tinham e 7 não — as que não tinham punham o botão de salvar sob a
            // barra de gestos do iPhone. O `DrawerContent` já fazia certo; esta
            // é a mesma conta, com os 24px que a classe trazia preservados.
            //
            // Variável, e não número, pelo mesmo motivo do `Drawer`: uma folha
            // que precise de outro respiro sobrescreve sem reescrever a fórmula
            // do `env()`.
            "pb-(--sheet-drawer-safe)",
            "[--sheet-drawer-safe:calc(--spacing(6)+env(safe-area-inset-bottom,0px))]",
            modalSurfaceClassName,
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

  // No desktop a folha **é** um painel de borda. `side` e `variant` são
  // destruturados acima e **não** chegam ao ramo gaveta: ali a superfície é o
  // `vaul`, e as props não valem. Sem destruturar cairiam em `{...props}` e
  // seriam espalhadas como atributo desconhecido no DOM — o tipo herda o eixo
  // sozinho, via `VariantProps<typeof sheetContentVariants>`.
  return (
    <SheetPrimitive.Portal container={janela?.document.body}>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-surface="panel"
        data-side={side}
        data-variant={variant}
        data-layout="fixed"
        className={cn(sheetContentVariants({ side, variant }), className)}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetOverlay,
  SheetPortal,
  SheetTrigger,
  SHEET_OVERLAY_CLASS,
  sheetContentVariants,
}
