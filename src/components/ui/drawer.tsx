"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { useComposedRefs } from "radix-ui/internal"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/glass-classes"
import { useViewportModal, useViewportWindow } from "@/hooks/use-mobile"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { Button } from "@/components/ui/button"

/**
 * O véu de todo modal do sistema, numa função só (a camada é o parâmetro). Mora
 * aqui porque a dependência corre num sentido só (`dialog` importa `sheet`, que
 * importa este arquivo) e o `dialog.tsx` o reexporta. As camadas ficam num mapa
 * de literais, porque uma classe montada por template não chega ao CSS. `fade`
 * é o esmaecer por keyframe; a gaveta o desliga porque o vaul anima o próprio
 * véu e o acompanha no arraste.
 */
const OVERLAY_Z = {
  modal: "z-(--z-modal)",
  sheet: "z-(--z-sheet)",
} as const

function overlayClassName(camada: keyof typeof OVERLAY_Z, fade = true) {
  return cn(
    "fixed inset-0 isolate bg-overlay supports-backdrop-filter:backdrop-blur-xs",
    OVERLAY_Z[camada],
    fade &&
      "animation-duration-(--duration-slow) ease-(--ease-out) data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
  )
}

/** O véu das superfícies de borda: o de `overlayClassName("sheet")`, sem o esmaecer. */
const SHEET_OVERLAY_CLASS = overlayClassName("sheet", false)

/**
 * O contrato que a cromagem do `Dialog` lê nas superfícies de borda (esta
 * gaveta e o `Sheet`): recuo e sangramento, o raio que o `concentric` de dentro
 * lê (sem ele sairia pílula) e a reserva do ×, que vem de haver um ×, não de um
 * prop. O `DialogContent` escreve o dele, com 24px.
 */
const SURFACE_CONTRACT_CLASS =
  "[--dialog-px:--spacing(4)] [--dialog-bleed:0px] [--radius-parent:var(--radius-modal)] [--radius-inset:var(--dialog-px)] [--dialog-close:0px] has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]"

/**
 * A alça: a pista de que a superfície se arrasta e o próprio alvo do gesto. Mora
 * neste arquivo porque as duas superfícies que a vestem são gavetas do vaul
 * (esta e o `Sheet` no telefone); uma tela nunca a escreve
 * (`drawer-drag-handle.test.ts` tranca).
 *
 * `DrawerPrimitive.Handle` renderiza a barra com `data-vaul-handle` e um
 * `<span data-vaul-handle-hitarea>` de 44px, ambos `aria-hidden` (a alça é
 * afordância de ponteiro; fecha-se por `Esc` ou pelo ×). Tocar a alça não fecha:
 * o vaul só fecha ali com `dismissible` falso e, sem `snapPoints`, é no-op.
 *
 * O vaul injeta uma folha de estilo sem camada, e a cascata resolve a camada
 * antes da especificidade, então ela ganha de qualquer utility. Toda propriedade
 * que este arquivo redeclara precisa de `!` (a asserção 1 do teste garante);
 * `my-2.5` é a única sem ele, porque o vaul não a declara.
 *
 * A tinta é 75%: abaixo disso reprova os 3:1 da 1.4.11 no claro sobre a placa de
 * vidro (alfa medido contra um fundo não sobrevive à troca do fundo). O par
 * hover/active a 90% é obrigatório, porque o `hover:` não existe no telefone.
 *
 * O vaul errou o seletor que encolheria a área de acerto no ponteiro fino
 * (emite `(pointer:fine)` com um `:` sobrando), então os 44px persistiam no
 * mouse e roubavam 9px de clique do cabeçalho. `pointer-fine:` faz o que ele
 * pretendia, com 20px que cabem inteiros na margem da alça; `my-2.5` é
 * estrutural.
 */
const dragHandleClassName = cn(
  // `my-2.5` é o único sem `!`: o vaul declara os outros quatro (margem
  // lateral, altura, largura, raio) e eles precisam vencer a folha dele.
  "!mx-auto my-2.5 shrink-0",
  "!h-1.5 !w-12 !rounded-full",
  // A tinta. `!opacity-100` tira o fator 0,7 do vaul de cima do alfa.
  "!opacity-100 !bg-muted-foreground/75",
  "hover:!bg-muted-foreground/90 active:!bg-muted-foreground/90",
  "transition-colors duration-(--duration-fast) ease-(--ease-out)",
  // O alvo de acerto no mouse, o que o vaul quis fazer.
  "pointer-fine:[&>[data-vaul-handle-hitarea]]:!h-5",
  // Numa gaveta de cima a alça é a borda de baixo. As duas superfícies declaram
  // `group/dialog-content`, então a alça sabe sozinha de que lado nasce.
  "group-data-[vaul-drawer-direction=top]/dialog-content:order-last"
)

/**
 * Exige o contexto do vaul (fora de um `Drawer.Root` o `useDrawerContext`
 * lança), o que impede a alça de existir onde não há gesto.
 */
function DragHandle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
  return (
    <DrawerPrimitive.Handle
      data-slot="drag-handle"
      className={cn(dragHandleClassName, className)}
      {...props}
    />
  )
}


/**
 * A gaveta, em qualquer largura de tela. `Sheet` troca de superfície (painel de
 * borda acima de 768px, gaveta abaixo); `Drawer` é gaveta sempre, para quando o
 * gesto é a afordância. Usa `--z-sheet`, `bg-background`, `dvh` + área segura e
 * `repositionInputs` (a gaveta não encolhe quando o teclado do iOS sobe).
 *
 * A cromagem (cabeçalho, título, corpo rolável, rodapé) vem do `Dialog`: o
 * vaul é construído sobre `@radix-ui/react-dialog` e há uma instância só em
 * `node_modules`, então `DialogTitle` acha o contexto dentro de um
 * `DrawerContent`.
 *
 * `direction` aceita só `bottom` e `top`: a alça do vaul é `touch-action:
 * pan-y`, e uma gaveta lateral teria a alça de enfeite (a borda lateral é o
 * ramo desktop do `Sheet`).
 */

const drawerContentVariants = cva(
  [
    // `group/dialog-content` é o nome que a cromagem do `Dialog` procura para
    // saber que está num layout `fixed`.
    "group/dialog-content fixed inset-x-0 z-(--z-sheet)",
    "flex flex-col text-sm shadow-lg",
    modalSurfaceClassName,
    "focus:outline-none",
    // O contrato que a cromagem do `Dialog` lê, o mesmo do `SheetContent`.
    SURFACE_CONTRACT_CLASS,
    // As alturas saem de variáveis para uma gaveta baixar o teto sem reescrever a fórmula.
    "[--drawer-max-h:85dvh]",
    // A área segura é da superfície, com a mesma conta da gaveta do `Sheet`:
    // 24px de respiro mais a barra de gestos.
    "data-[vaul-drawer-direction=bottom]:pb-(--drawer-safe)",
    "data-[vaul-drawer-direction=top]:pt-(--drawer-safe)",
    "data-[vaul-drawer-direction=bottom]:[--drawer-safe:calc(--spacing(6)+env(safe-area-inset-bottom,0px))]",
    "data-[vaul-drawer-direction=top]:[--drawer-safe:calc(--spacing(6)+env(safe-area-inset-top,0px))]",
    // A folga do topo muda com o aparelho, então ela também é variável.
    "data-[vaul-drawer-direction=bottom]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-top,0px)))]",
    "data-[vaul-drawer-direction=top]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-bottom,0px)))]",
    // O raio e a borda ficam do lado que **não** encosta na tela.
    "data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:rounded-t-modal data-[vaul-drawer-direction=bottom]:border-t",
    "data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:rounded-b-modal data-[vaul-drawer-direction=top]:border-b",
  ],
  {
    variants: {
      /** Gaveta alta: ocupa quase a tela, com folga na borda oposta; sem ela mede o conteúdo e para em 85%. */
      fill: {
        true: "h-(--drawer-h)",
        false: "max-h-(--drawer-max-h)",
      },
      /**
       * Onde a gaveta encosta: `flush` (padrão, a do telefone) cola nas bordas
       * e arredonda o lado de dentro; `inset` a solta da tela, com margem e
       * cantos completos (de borda a borda no desktop lê como erro de layout).
       */
      variant: {
        flush: "",
        inset: [
          "inset-x-(--drawer-inset) rounded-modal border",
          "data-[vaul-drawer-direction=bottom]:bottom-(--drawer-inset)",
          "data-[vaul-drawer-direction=top]:top-(--drawer-inset)",
          "[--drawer-inset:--spacing(2)]",
        ].join(" "),
      },
      /**
       * O teto de largura: `md` e `lg` centralizam e param (uma gaveta de
       * 1900px vira linha de leitura impossível); `full` é o telefone, e o padrão.
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

/**
 * O aninhamento das superfícies de borda, um só para esta gaveta e o `Sheet`.
 *
 * - `gaveta`: o que a raiz do `Drawer` diz ao conteúdo (se há degraus, se está
 *   salvando) e, só por existir, que há uma gaveta aberta acima: é como a de
 *   dentro vira `NestedRoot`. No telefone a folha é este `Drawer`.
 * - `painel`: o painel de borda do `Sheet` no desktop. Uma folha aberta de
 *   dentro avisa que o cobre (`cobrir`); ele zera a pilha, porque uma gaveta
 *   dentro de um painel é raiz.
 */
type DrawerRaiz =
  | {
      superficie: "gaveta"
      degraus: boolean
      pending: boolean
      /** Na moldura do catálogo: o véu e o fechar no toque fora são desenhados aqui. */
      veuEmulado: boolean
      fechar: () => void
    }
  | { superficie: "painel"; cobrir: (coberta: boolean) => void }

const DrawerRaizContext = React.createContext<DrawerRaiz | null>(null)

/**
 * Uma `Drawer` aberta dentro de outra vira `NestedRoot` sozinha (a de baixo
 * recua e escurece). `scaleBackground` escala o `[data-vaul-drawer-wrapper]`
 * da raiz do app. `snapPoints` deixa o conteúdo alto sozinho. `pending` barra
 * arrastar, tocar fora, Esc e a alça: o vaul só fecha no toque da alça com
 * `dismissible` falso, e é falso que a trava o deixa, então o pedido de fechar
 * é barrado também na raiz. `modal={false}` é a gaveta presa embaixo, sem véu.
 */
function Drawer({
  direction = "bottom",
  repositionInputs = true,
  scaleBackground = false,
  pending = false,
  dismissible = true,
  modal: modalProp,
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * Só o eixo vertical (a alça do vaul é `touch-action: pan-y`). A restrição é
   * uma interseção e não um `Omit`: os props do vaul são uma união
   * discriminada, e `Omit` a achata num objeto não atribuível a nenhum lado.
   */
  direction?: DrawerDirection
  /** A página recua e arredonda atrás da gaveta (iOS). */
  scaleBackground?: boolean
  /** Salvando: nada fecha a gaveta até acabar. */
  pending?: boolean
}) {
  const pai = React.useContext(DrawerRaizContext)
  const controlado = openProp !== undefined
  const [interno, setInterno] = React.useState(defaultOpen ?? false)
  const open = controlado ? openProp : interno
  const pedir = (proximo: boolean) => {
    if (!proximo && pending) return
    if (!controlado) setInterno(proximo)
    onOpenChange?.(proximo)
  }
  const degraus = Boolean(
    (props as { snapPoints?: unknown[] }).snapPoints?.length
  )
  // Dentro da moldura do catálogo a gaveta deixa de ser modal, e gaveta não
  // modal não monta véu nem fecha no toque fora. Quando a falta de modal é da
  // moldura (e não de um `modal={false}` de quem chamou), o véu é desenhado
  // aqui. `modal` é desestruturado e não lido de `{...props}`: um
  // `modal={undefined}` explícito apagaria o padrão da moldura no espalhamento.
  const modalDaMoldura = useViewportModal()
  const modal = modalProp ?? modalDaMoldura
  const veuEmulado = modalDaMoldura === false && modalProp === undefined
  const pedirRef = React.useRef(pedir)
  React.useEffect(() => {
    pedirRef.current = pedir
  })
  const raiz = React.useMemo(
    () => ({
      superficie: "gaveta" as const,
      degraus,
      pending,
      veuEmulado,
      fechar: () => pedirRef.current(false),
    }),
    [degraus, pending, veuEmulado]
  )
  const Raiz =
    pai?.superficie === "gaveta" ? DrawerPrimitive.NestedRoot : DrawerPrimitive.Root

  return (
    <DrawerRaizContext.Provider value={raiz}>
      <Raiz
        data-slot="drawer"
        direction={direction}
        // `repositionInputs` impede a superfície de encolher quando o teclado do iOS sobe.
        repositionInputs={repositionInputs}
        shouldScaleBackground={scaleBackground}
        // Dentro da moldura ela deixa de ser modal (senão o `RemoveScroll` do
        // Radix trava a rolagem da página de fora). Antes de `{...props}`, para
        // quem chama mandar. Ver `useViewportModal`.
        modal={modal}
        {...props}
        dismissible={pending ? false : dismissible}
        open={open}
        onOpenChange={pedir}
      />
    </DrawerRaizContext.Provider>
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

/**
 * O portal vai para o `body` da janela ativa, como o do `Sheet`. Fora da
 * moldura do catálogo o contexto é `null` e o vaul usa o próprio documento;
 * dentro dela, é isso que impede a gaveta de escapar do `<iframe>`.
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
 * O véu, o mesmo do painel e da folha (`SHEET_OVERLAY_CLASS`), sem a duração
 * fixa: aqui o véu acompanha o dedo e um keyframe brigaria com o arraste.
 */
function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(SHEET_OVERLAY_CLASS, className)}
      {...props}
    />
  )
}

/**
 * O meio de uma gaveta sem `DialogBody`: o filho direto que não é cromagem. É
 * ele que rola, entre cabeçalho e rodapé parados. Quem acha o meio é o JS e o
 * CSS lê a marca (`data-drawer-meio`, escrita pelo efeito do `DrawerContent`),
 * para a lista de slots de borda morar uma vez em `acharMeio`. As classes estão
 * escritas por extenso, uma a uma: um template literal não gera regra.
 */
const MEIO_CLASSES = [
  "[&>[data-drawer-meio]]:min-h-0",
  "[&>[data-drawer-meio]]:overflow-y-auto",
  "[&>[data-drawer-meio]]:overscroll-contain",
  "[&>[data-drawer-meio]]:scroll-fade-y",
  "[&>[data-drawer-meio]]:[--scroll-fade-floor:0]",
].join(" ")

function acharMeio(el: HTMLElement): HTMLElement | null {
  const cromagem = new Set([
    "drag-handle",
    "dialog-header",
    "dialog-footer",
    "dialog-close-button",
    "dialog-body",
    "drawer-cancel",
  ])
  for (const filho of Array.from(el.children)) {
    const slot = (filho as HTMLElement).dataset.slot
    if (!slot || !cromagem.has(slot)) return filho as HTMLElement
  }
  return null
}

/**
 * A altura acompanha o conteúdo: quando ele muda, a gaveta anima da altura de
 * antes até a nova em vez de saltar. O `ResizeObserver` dispara antes da
 * pintura, então a altura nova nunca aparece de estalo; as medidas da própria
 * animação são ignoradas.
 */
function useAlturaQueAcompanha(el: HTMLElement | null, ativo: boolean) {
  React.useEffect(() => {
    if (!el || !ativo) return
    const reduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    let anterior = el.getBoundingClientRect().height
    let animando: Animation | null = null
    const ro = new ResizeObserver(() => {
      // As medidas da própria animação não contam: ela mexe na altura a cada quadro.
      if (animando) return
      const atual = el.getBoundingClientRect().height
      if (Math.abs(atual - anterior) < 1 || reduzido || anterior === 0) {
        anterior = atual
        return
      }
      const de = anterior
      anterior = atual
      animando = el.animate(
        [{ height: `${de}px` }, { height: `${atual}px` }],
        { duration: 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      )
      animando.onfinish = animando.oncancel = () => {
        animando = null
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [el, ativo])
}

function DrawerContent({
  className,
  children,
  fill,
  variant,
  size,
  showHandle = true,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerContentVariants> & {
    /** A gaveta sem alça, para quando ela não se arrasta (`dismissible={false}`); com o gesto ligado, tirá-la tira a única pista dele. */
    showHandle?: boolean
  }) {
  const contexto = React.useContext(DrawerRaizContext)
  const raiz = contexto?.superficie === "gaveta" ? contexto : null
  // Com degraus a gaveta é alta: o vaul a desloca de um a outro e o conteúdo
  // precisa existir inteiro por baixo.
  const alta = fill ?? raiz?.degraus ?? false
  // O elemento mora em estado e não numa `ref` de função: refeita a cada render
  // ela criava um observador novo sem desligar o anterior.
  const [el, setEl] = React.useState<HTMLDivElement | null>(null)
  const conteudo = useComposedRefs<HTMLDivElement>(setEl, ref)
  useAlturaQueAcompanha(el, !alta)
  const dissolver = useScrollFade()
  // Marca o meio e repete a busca quando filhos entram ou saem, tirando a marca
  // e a dissolução do antigo.
  React.useEffect(() => {
    if (!el) return
    let meio: HTMLElement | null = null
    let soltar: (() => void) | undefined
    const largar = () => {
      soltar?.()
      meio?.removeAttribute("data-drawer-meio")
    }
    const marcar = () => {
      const achado = acharMeio(el)
      if (achado === meio) return
      largar()
      meio = achado
      meio?.setAttribute("data-drawer-meio", "")
      soltar = meio ? dissolver(meio) : undefined
    }
    marcar()
    const ob = new MutationObserver(marcar)
    ob.observe(el, { childList: true })
    return () => {
      ob.disconnect()
      largar()
    }
  }, [el, dissolver])

  return (
    <DrawerPortal>
      <DrawerOverlay />
      {raiz?.veuEmulado ? (
        // O véu da moldura: o mesmo desenho, e tocar nele fecha.
        // `pointer-events-auto` porque o Radix pode deixar o `body` de dentro em
        // `none`, e a propriedade é herdada.
        <div
          aria-hidden
          data-slot="drawer-overlay"
          className={cn(
            SHEET_OVERLAY_CLASS,
            "pointer-events-auto animate-in fade-in-0 animation-duration-(--duration-base)"
          )}
          onPointerDown={() => raiz.fechar()}
        />
      ) : null}
      <DrawerPrimitive.Content
        ref={conteudo}
        data-slot="drawer-content"
        data-surface="drawer"
        data-variant={variant}
        data-size={size}
        // `fixed` é o que a cromagem do `Dialog` lê para dar recuo ao cabeçalho
        // e deixar o corpo rolar entre ele e o rodapé.
        data-layout="fixed"
        aria-busy={raiz?.pending || undefined}
        className={cn(
          drawerContentVariants({ fill: alta, variant, size }),
          // Sem `DialogBody`, o meio é quem rola, e dissolve nas bordas.
          "overflow-hidden",
          MEIO_CLASSES,
          className
        )}
        {...props}
      >
        {showHandle ? <DragHandle /> : null}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

/**
 * A folha de ações (o action sheet do iOS): linhas de 52px com ícone, a
 * destrutiva em vermelho e o `DrawerCancel` separado embaixo. Cada ação fecha a
 * gaveta depois de rodar.
 */
function DrawerActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="drawer-actions"
      className={cn("flex flex-col px-2", className)}
      {...props}
    />
  )
}

/** A linha da folha de ações, para quem monta a própria (o `DropdownMenu` no telefone, cujas linhas que confirmam ou carregam não fecham no toque). */
const drawerActionClassName = cn(
  "flex min-h-13 w-full items-center gap-3 rounded-surface px-4 text-left text-base text-foreground outline-none select-none",
  "transition-colors duration-(--duration-fast) ease-(--ease-out)",
  // Tinta sobre o vidro da gaveta, e não `bg-muted` opaco.
  "hover:bg-foreground/9 active:bg-foreground/9 focus-visible:bg-foreground/9",
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  "[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
  "data-[variant=destructive]:text-destructive data-[variant=destructive]:[&_svg]:text-destructive"
)

/** Uma linha da folha de ações. O ícone é desenhado a 20px (`20/solid`); `asChild` para um link. */
function DrawerAction({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "destructive"
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <DrawerPrimitive.Close asChild>
      <Comp
        data-slot="drawer-action"
        data-variant={variant}
        {...(asChild ? {} : { type: "button" as const })}
        className={cn(drawerActionClassName, className)}
        {...props}
      />
    </DrawerPrimitive.Close>
  )
}

/** O "Cancelar" da folha de ações: um botão sozinho, separado das ações. */
function DrawerCancel({
  className,
  children = "cancelar",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <DrawerPrimitive.Close asChild>
      <Button
        data-slot="drawer-cancel"
        type="button"
        variant="secondary"
        size="xl"
        className={cn("mx-2 mt-2 shrink-0", className)}
        {...props}
      >
        {children}
      </Button>
    </DrawerPrimitive.Close>
  )
}

export {
  DragHandle,
  dragHandleClassName,
  Drawer,
  DrawerAction,
  DrawerActions,
  drawerActionClassName,
  DrawerCancel,
  DrawerClose,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerRaizContext,
  DrawerTrigger,
  drawerContentVariants,
  overlayClassName,
  SHEET_OVERLAY_CLASS,
  SURFACE_CONTRACT_CLASS,
}
