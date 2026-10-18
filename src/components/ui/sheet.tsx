"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as SheetPrimitive } from "radix-ui"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/glass-classes"
import {
  useIsMobile,
  useViewportModal,
  useViewportWindow,
} from "@/hooks/use-mobile"
import {
  Drawer,
  DrawerContent,
  DrawerRaizContext,
  overlayClassName,
  SHEET_OVERLAY_CLASS,
  SURFACE_CONTRACT_CLASS,
} from "@/components/ui/drawer"
// Ciclo deliberado: o `dialog.tsx` importa este arquivo (o `surface="auto"`
// dele é a gaveta daqui), e este importa de volta o pedido de fechar, com a
// pergunta de descarte. Os dois só se usam dentro de funções, nunca na
// avaliação do módulo.
import {
  NavegarFechandoContext,
  useLinkQueFecha,
  usePedidoDeFechar,
} from "@/components/ui/dialog"

/**
 * O painel de borda: o ramo desktop da folha.
 * A posição sai de três variáveis (calha), e não de números: `side` escreve a
 * posição uma vez e ela resolve em 0 no encostado e em 8px no flutuante.
 * Nenhuma é declarada na base nem em `flush`: cada uso lê a sua com `0px` de
 * fallback, então `flush` é no-op por construção (declarada na base, empataria
 * em especificidade com a do `floating` e decidiria a ordem de emissão).
 * `h-full` não existe em `left` e `right`: o bloco contentor de um `fixed` é o
 * viewport, e sob `floating` (`top: 8px`) ele faria o painel transbordar 8px na base.
 * O gume do encostado é composto: `floating` desenha as quatro bordas e `flush`
 * uma, que muda com o lado; empilhar `border` e `border-l` dependeria da ordem
 * de emissão do `cva`.
 * O material é o vidro modal do `Dialog` (`modalSurfaceClassName`: `--background`
 * a 85%, 40% no escuro, com borrão), a pedido do dono — antes era a placa chapada
 * (`--popover`). `floating` é o padrão (raio `--radius-modal`, anel de 1px e
 * sombra); `flush` é o que as folhas do app pedem por enquanto.
 * As duas verticais somam a área segura (uma calha a partir do viewport põe o
 * canto atrás do indicador de home); a horizontal não, pois
 * `env(safe-area-inset-left/right)` é da casca do app.
 */
const sheetContentVariants = cva(
  [
    // O casco de formulário é o de fábrica: sem `gap`, sem recuo e recortando, como
    // o `layout="fixed"` do `Dialog` (cabeçalho e rodapé parados, `DialogBody` rolando).
    "group/dialog-content fixed z-(--z-sheet) flex flex-col gap-0 overflow-hidden",
    "bg-clip-padding text-sm text-foreground shadow-lg",
    modalSurfaceClassName,
    // Entra na mola e sai macia: desliza da borda inteira (de fora da tela, a
    // própria largura) e assenta com o quique de 3,8%; fechar volta à mesma borda,
    // sem quique, em 380ms de `--ease-in-out` — parte devagar, acelera e pousa fora
    // da tela, junto com o véu. Os 200ms de `--ease-out` andavam 263px e apagavam
    // 69% nos primeiros 30ms: lia como um corte. Com movimento reduzido o bloco
    // global corta a animação.
    "will-change-transform motion-reduce:will-change-auto",
    "data-open:animate-in data-open:fade-in-0 data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring)",
    "data-closed:animate-out data-closed:fade-out-0 data-closed:animation-duration-380 data-closed:ease-(--ease-in-out)",
    // O conteúdo sobe em cascata, logo atrás do deslize.
    "sheet-reveal",
    // Folha sobre folha: coberta por outra, ela recua para o fundo e volta quando a de cima fecha.
    "transition-[translate,scale] duration-(--duration-spring) ease-(--ease-spring)",
    "data-[coberta]:scale-[0.96] data-[coberta]:data-[side=right]:-translate-x-6 data-[coberta]:data-[side=left]:translate-x-6 data-[coberta]:data-[side=top]:translate-y-6 data-[coberta]:data-[side=bottom]:-translate-y-6",
    // O contrato que a cromagem do `Dialog` lê, o mesmo em painel e gaveta (ver o `drawer.tsx`).
    SURFACE_CONTRACT_CLASS,
  ],
  {
    variants: {
      /** De qual borda ele entra, no desktop; no telefone é sempre a gaveta de baixo. */
      side: {
        top: "inset-x-[var(--sheet-gap,0px)] top-[var(--sheet-gap-block-start,0px)] h-auto data-open:slide-in-from-top data-closed:slide-out-to-top",
        right:
          "top-[var(--sheet-gap-block-start,0px)] right-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] w-3/4 data-open:slide-in-from-right data-closed:slide-out-to-right",
        bottom:
          "inset-x-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] h-auto data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
        left: "top-[var(--sheet-gap-block-start,0px)] left-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] w-3/4 data-open:slide-in-from-left data-closed:slide-out-to-left",
      },
      /**
       * A largura das laterais: `sm` 384 (padrão), `md` 448, `lg` 512, `full` (a
       * janela menos 4rem). Topo e base recebem `none`: um `max-w` com as duas âncoras
       * horizontais encolheria a folha para a esquerda.
       */
      size: {
        none: "",
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        full: "w-full sm:max-w-[calc(100%-4rem)]",
      },
      /** `flush` cola na tela e desenha só o gume de dentro; `floating` abre uma calha de 8px e fecha a borda em volta. */
      variant: {
        flush: "",
        floating: [
          "rounded-modal ring-1 ring-foreground/10",
          // O × de canto é um círculo preenchido, sem anel nem sombra (já está dentro da
          // placa). O fundo é o texto a 5% no claro (`--popover` some e `--muted` é claro
          // demais) e a página a 40% sobre a placa no escuro (onde o texto a 5% clarearia);
          // o hover é o texto a 10%. Só o de canto (`>`): o do `DialogHeaderRow` é do cabeçalho.
          "[&>[data-slot=dialog-close-button]]:rounded-full [&>[data-slot=dialog-close-button]]:bg-foreground/5 dark:[&>[data-slot=dialog-close-button]]:bg-background/40 [&>[data-slot=dialog-close-button]]:[--button-hover-fill:color-mix(in_oklab,var(--foreground)_10%,transparent)]",
          "[--sheet-gap:--spacing(2)]",
          "[--sheet-gap-block-start:max(var(--sheet-gap),env(safe-area-inset-top,0px))]",
          "[--sheet-gap-block-end:max(var(--sheet-gap),env(safe-area-inset-bottom,0px))]",
        ].join(" "),
      },
    },
    // A aba do encostado: a mola passa 3,8% do alvo e o recuo de "folha sobre
    // folha" anda 24px, e nos dois a página aparece na fresta. Uma cópia chapada da
    // placa, 4rem para fora da tela (`box-shadow`, que o `overflow-hidden` não
    // recorta), cobre o vão sem mexer na animação.
    // ponytail: cobre quique até 4rem (painel até ~1680px no eixo); o `full`
    // mais largo que isso ainda abriria fresta.
    compoundVariants: [
      { variant: "flush", side: "top", class: "border-b shadow-[0_-4rem_0_var(--color-popover),var(--shadow-lg)]" },
      { variant: "flush", side: "right", class: "border-l shadow-[4rem_0_0_var(--color-popover),var(--shadow-lg)]" },
      { variant: "flush", side: "bottom", class: "border-t shadow-[0_4rem_0_var(--color-popover),var(--shadow-lg)]" },
      { variant: "flush", side: "left", class: "border-r shadow-[-4rem_0_0_var(--color-popover),var(--shadow-lg)]" },
    ],
    defaultVariants: {
      side: "right",
      variant: "floating",
      size: "sm",
    },
  }
)

/** Qual superfície está de fato montada. */
type SheetSurface = "panel" | "drawer"

/**
 * Como a superfície é escolhida. `auto` é a regra da casa: painel de borda
 * acima de 768px, gaveta abaixo. `panel` fixa o painel em qualquer largura, para
 * um caso só: navegação presa a uma borda (um menu entra pelo lado, não sobe do
 * rodapé com alça para listar seis links). Não existe forçar a gaveta: isso é o
 * `Drawer`.
 */
type SheetSurfaceMode = "auto" | "panel"

const SheetSurfaceContext = React.createContext<SheetSurface>("panel")

/** O que a raiz decide e o painel lê (a gaveta lê o do `Drawer`). */
const SheetEstadoContext = React.createContext({
  pending: false,
  /** `modal={false}` pedido pela tela: o painel ao lado. */
  aoLado: false,
})

/** Qual superfície está ativa — é o que faz gatilho, fechar, portal e véu
 *  trocarem de primitiva sem quem chama saber. */
export function useSheetSurface(): SheetSurface {
  return React.useContext(SheetSurfaceContext)
}

/**
 * A folha no desktop, a gaveta no telefone, numa API só: folha é coisa de
 * desktop (menos `surface="panel"`), e a superfície se escolhe aqui em vez de
 * um `if` por tela.
 * Isso funciona porque as três superfícies modais são a mesma primitiva: o
 * `vaul` é construído sobre `@radix-ui/react-dialog`, e há uma instância só em
 * `node_modules` (o `aria-labelledby` da gaveta aponta para o `id` do
 * `DialogTitle`). É a premissa frágil: se o npm instalar duas cópias, os
 * contextos deixam de se enxergar e o título passa a lançar dentro da gaveta.
 */
function Sheet({
  children,
  surface: modo = "auto",
  pending = false,
  dirty = false,
  confirmDiscard = false,
  snapPoints,
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal: modalProp,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root> & {
  /** `auto` painel no desktop e gaveta no telefone; `panel` painel sempre. */
  surface?: SheetSurfaceMode
  /** Salvando: Esc, véu, × e o arraste não fecham, e a folha marca `aria-busy`. */
  pending?: boolean
  /** O que está aberto tem alterações não salvas. */
  dirty?: boolean
  /** Com `dirty`, fechar pergunta antes. `true` usa os textos padrão. */
  confirmDiscard?: boolean | { title?: string; description?: string }
  /**
   * No telefone, as alturas em que a gaveta para (`[0.5, 1]`: meia e cheia), os
   * `snapPoints` do `vaul`. No desktop não valem.
   */
  snapPoints?: (number | string)[]
}) {
  const isMobile = useIsMobile()
  const escolhida: SheetSurface = isMobile && modo === "auto" ? "drawer" : "panel"

  // O estado mora aqui, controlado ou não, porque todo pedido de fechar passa
  // por `pedir` — a régua do `Dialog`, a mesma função.
  const { open, pedir, pergunta, navegarFechando } = usePedidoDeFechar({
    open: openProp,
    defaultOpen,
    onOpenChange,
    pending,
    dirty,
    confirmDiscard,
  })

  // A superfície é decidida ao abrir e fica até fechar: ao vivo, girar um tablet
  // com a folha aberta desmontaria uma primitiva e montaria a outra, levando foco
  // e texto digitado.
  const [travada, setTravada] = React.useState<SheetSurface | null>(null)
  if (open && travada === null) setTravada(escolhida)
  if (!open && travada !== null) setTravada(null)
  const surface = travada ?? escolhida

  // Folha sobre folha: uma folha aberta de dentro de um painel avisa o de baixo,
  // que recua. Na gaveta quem empilha é o `Drawer` (`NestedRoot`).
  const pai = React.useContext(DrawerRaizContext)
  React.useEffect(() => {
    if (pai?.superficie !== "painel" || !open) return
    pai.cobrir(true)
    return () => pai.cobrir(false)
  }, [pai, open])

  // Dentro da moldura do catálogo o painel deixa de ser modal (senão o
  // `RemoveScroll` trava a rolagem da página de fora; ver `useViewportModal`). Na
  // gaveta quem decide é o `Drawer`. `modal={false}` pedido pela tela é o painel
  // ao lado: sem véu, página clicável, clicar fora não fecha.
  const modalDaMoldura = useViewportModal()
  const aoLado = modalProp === false
  const modal = surface === "drawer" ? modalProp : (modalProp ?? modalDaMoldura)

  const estado = React.useMemo(() => ({ pending, aoLado }), [pending, aoLado])
  // A raiz mais de fora responde ao link (o `Dialog` que virou gaveta, ou um
  // painel dentro de outro): fechá-la fecha as de dentro.
  const navegarDeFora = React.useContext(NavegarFechandoContext)

  return (
    <NavegarFechandoContext.Provider value={navegarDeFora ?? navegarFechando}>
    <SheetSurfaceContext.Provider value={surface}>
      <SheetEstadoContext.Provider value={estado}>
        {surface === "drawer" ? (
          // No telefone a folha é o `Drawer`: a mesma raiz, com `repositionInputs`, a
          // trava do `pending` e o aninhamento. O pedido de fechar continua passando por
          // `pedir`, com a pergunta de descarte.
          <Drawer
            direction="bottom"
            modal={modal}
            snapPoints={snapPoints}
            pending={pending}
            {...props}
            open={open}
            onOpenChange={pedir}
          >
            {children}
          </Drawer>
        ) : (
          <SheetPrimitive.Root
            data-slot="sheet"
            modal={modal}
            {...props}
            open={open}
            onOpenChange={pedir}
          >
            {children}
          </SheetPrimitive.Root>
        )}
        {pergunta}
      </SheetEstadoContext.Provider>
    </SheetSurfaceContext.Provider>
    </NavegarFechandoContext.Provider>
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
        // Só o painel anima o véu por keyframe; na gaveta o vaul já anima o próprio véu e o acompanha no arraste.
        overlayClassName("sheet", surface === "panel"),
        // O véu fecha no mesmo tempo da folha, e os dois somem juntos.
        surface === "panel" && "ease-in-out data-closed:animation-duration-380",
        className
      )}
      {...props}
    />
  )
}

/** A largura guardada de uma folha arrastável, por chave. */
function useLarguraGuardada(chave: string | null) {
  const [largura, setLargura] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (!chave) return
    try {
      const salva = Number(window.localStorage.getItem(`sheet-width:${chave}`))
      if (salva > 0) setLargura(salva)
    } catch {
      // Armazenamento bloqueado: a largura vale só nesta abertura.
    }
  }, [chave])
  const guardar = React.useCallback(
    (px: number) => {
      if (!chave) return
      try {
        window.localStorage.setItem(`sheet-width:${chave}`, String(Math.round(px)))
      } catch {
        // Idem.
      }
    },
    [chave]
  )
  return [largura, setLargura, guardar] as const
}

const LARGURA_MIN = 320
const PASSO_DO_TECLADO = 16

/**
 * A costura de largura de uma folha lateral: fica na aresta de dentro e não
 * desenha nada em repouso; ao pousar, focar e arrastar acende um fio de 2px (a
 * regra da costura do `Sidebar`). Nas flutuantes o fio pula a curva dos cantos.
 * Arrasta com o ponteiro e anda 16px por seta.
 */
function SheetResizeHandle({
  side,
  largura,
  onLargura,
  onSoltar,
  conteudo,
}: {
  side: "left" | "right"
  largura: number | null
  onLargura: (px: number) => void
  onSoltar: (px: number) => void
  conteudo: React.RefObject<HTMLDivElement | null>
}) {
  const limitar = (px: number) => {
    const janela = conteudo.current?.ownerDocument.defaultView ?? window
    return Math.min(Math.max(px, LARGURA_MIN), janela.innerWidth - 64)
  }
  const medir = (clientX: number) => {
    const caixa = conteudo.current?.getBoundingClientRect()
    if (!caixa) return null
    return limitar(side === "right" ? caixa.right - clientX : clientX - caixa.left)
  }
  const atual = () => largura ?? conteudo.current?.getBoundingClientRect().width ?? LARGURA_MIN

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar a folha"
      aria-valuenow={Math.round(atual())}
      aria-valuemin={LARGURA_MIN}
      tabIndex={0}
      data-slot="sheet-resize-handle"
      className={cn(
        "group/costura absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none outline-none",
        side === "right" ? "left-0" : "right-0",
        "after:absolute after:inset-y-0 after:w-0.5 after:rounded-full after:bg-transparent after:transition-colors after:duration-(--duration-fast)",
        side === "right" ? "after:left-0" : "after:right-0",
        "group-data-[variant=floating]/dialog-content:after:inset-y-2.5",
        "hover:after:bg-foreground/30 focus-visible:after:bg-foreground/30 active:after:bg-foreground/50 data-[arrastando]:after:bg-foreground/50"
      )}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.dataset.arrastando = ""
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const px = medir(e.clientX)
        if (px) onLargura(px)
      }}
      onPointerUp={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        e.currentTarget.releasePointerCapture(e.pointerId)
        delete e.currentTarget.dataset.arrastando
        onSoltar(atual())
      }}
      onKeyDown={(e) => {
        // A seta anda para onde ela aponta: na folha da direita, ← alarga.
        const passo =
          e.key === "ArrowLeft" ? -PASSO_DO_TECLADO : e.key === "ArrowRight" ? PASSO_DO_TECLADO : 0
        if (!passo) return
        e.preventDefault()
        const px = limitar(atual() + (side === "right" ? -passo : passo))
        onLargura(px)
        onSoltar(px)
      }}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  variant,
  size,
  resizable = false,
  fillMobileViewport = false,
  style,
  onInteractOutside,
  onClickCapture,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetContentVariants> & {
    /**
     * Gaveta alta: ocupa quase a tela, com folga no topo e área segura embaixo; sem
     * ela, a gaveta mede o conteúdo e para em 85%.
     */
    fillMobileViewport?: boolean
    /**
     * No desktop, a aresta de dentro de uma folha lateral arrasta a largura.
     * Uma string é a chave em que ela fica guardada entre aberturas.
     */
    resizable?: boolean | string
  }) {
  const surface = useSheetSurface()
  const { pending, aoLado } = React.useContext(SheetEstadoContext)
  const aoClicarLink = useLinkQueFecha(onClickCapture)
  // O portal do painel vai para o `body` da janela ativa (o da gaveta é o do
  // `Drawer`). Fora da moldura do catálogo o contexto é `null` e o app não muda;
  // dentro dela impede a folha de escapar do `<iframe>`.
  const janela = useViewportWindow()
  // Coberta por uma folha aberta de dentro desta.
  const [coberta, setCoberta] = React.useState(false)
  const lateral = side === "left" || side === "right"
  const [largura, setLargura, guardar] = useLarguraGuardada(
    typeof resizable === "string" ? resizable : null
  )
  const conteudo = React.useRef<HTMLDivElement | null>(null)
  const aninhamento = React.useMemo(
    () => ({ superficie: "painel" as const, cobrir: setCoberta }),
    []
  )

  if (surface === "drawer") {
    // No telefone a folha é a gaveta do `Drawer`: a mesma peça (vidro, alça, altura
    // que acompanha o conteúdo, meio que rola, área segura, portal na janela ativa).
    // Só o nome do slot é da folha. A gaveta alta é o `fill`; sem ele, os degraus da
    // raiz decidem.
    return (
      <DrawerContent
        data-slot="sheet-content"
        data-side="bottom"
        fill={fillMobileViewport || undefined}
        className={className}
        style={style}
        onInteractOutside={onInteractOutside}
        onClickCapture={aoClicarLink}
        {...props}
      >
        {children}
      </DrawerContent>
    )
  }

  // No desktop a folha é um painel de borda. `side`, `variant` e `size` são
  // destruturados acima e não chegam ao ramo gaveta (o `Drawer` tem `variant` e
  // `size` próprios, com outros valores); sem destruturar cairiam em `{...props}`.
  return (
    <SheetPrimitive.Portal container={janela?.document.body}>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={conteudo}
        onClickCapture={aoClicarLink}
        data-slot="sheet-content"
        data-surface="panel"
        data-side={side}
        data-variant={variant ?? "floating"}
        data-layout="fixed"
        data-coberta={coberta ? "" : undefined}
        data-ao-lado={aoLado ? "" : undefined}
        aria-busy={pending || undefined}
        className={cn(
          sheetContentVariants({ side, variant, size: lateral ? size : "none" }),
          // Arrastando, a largura segue o dedo sem transição.
          largura !== null && "sm:max-w-none",
          className
        )}
        style={largura !== null && lateral ? { ...style, width: largura } : style}
        // Ao lado, clicar na página não fecha: é para usar as duas.
        onInteractOutside={(e) => {
          onInteractOutside?.(e)
          if (aoLado) e.preventDefault()
        }}
        {...props}
      >
        <DrawerRaizContext.Provider value={aninhamento}>{children}</DrawerRaizContext.Provider>
        {resizable && lateral ? (
          <SheetResizeHandle
            side={side}
            largura={largura}
            onLargura={setLargura}
            onSoltar={guardar}
            conteudo={conteudo}
          />
        ) : null}
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
