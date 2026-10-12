"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as SheetPrimitive } from "radix-ui"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
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
import { usePedidoDeFechar } from "@/components/ui/dialog"

/**
 * O painel de borda — o ramo desktop da folha.
 *
 * **Isto já foi um componente, e voltou a ser um ramo.** Ele nasceu `EdgePanel`
 * porque duas coisas se chamavam `Sheet` e respondiam diferente ao telefone:
 * conteúdo vira gaveta, e a navegação lateral — dizia a rodada — devia
 * continuar painel. A `Sidebar` usava este `cva` por fora. A decisão foi
 * invertida (rodada 64): no telefone tudo passou a ser gaveta, inclusive a navegação — e a rodada 66 devolveu o painel à navegação como eixo (`surface`),
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
 * **O material é chapado, e nos dois** (rodada 222, a pedido do dono). Até
 * aqui ela vestia `modalSurfaceClassName`, o vidro borrado da placa modal; hoje
 * é `--popover`, a placa solta da casa — a mesma tinta do `Sidebar` flutuante e
 * do `Menubar`. O véu já separa a folha da página; o borrão por baixo dele era
 * uma segunda separação para a mesma coisa.
 *
 * **`floating` é o padrão desde a rodada 222**, como no `Sidebar`, no `Menubar`
 * e no `NavigationMenu`: o raio `--radius-modal` (rodada 240), o anel de 1px das placas e a sombra, e não a
 * borda inteira. `flush` continua, e é o que as folhas do app pedem por
 * enquanto.
 *
 * **As duas verticais somam a área segura.** Uma calha medida a partir do
 * viewport põe o canto de baixo atrás do indicador de home num iPhone. A
 * horizontal fica de fora de propósito: `env(safe-area-inset-left/right)` não
 * aparece nenhuma vez no repositório, e o dono dessa lacuna é a casca do app.
 */
const sheetContentVariants = cva(
  [
    // **O casco de formulário é o de fábrica** (rodada 222): sem `gap`, sem
    // recuo e recortando — o `layout="fixed"` do `Dialog`, com o cabeçalho e o
    // rodapé parados e o `DialogBody` rolando entre eles. As folhas do app
    // escreviam `flex w-full flex-col gap-0 overflow-hidden p-0` à mão.
    "group/dialog-content fixed z-(--z-sheet) flex flex-col gap-0 overflow-hidden",
    "bg-clip-padding bg-popover text-sm text-popover-foreground shadow-lg",
    // **Entra na mola, sai curta**: desde a rodada 248 ela **desliza da borda
    // inteira** — de fora da tela, a própria largura — e assenta com o quique
    // de 3,8% da mola da casa; fechar volta para a mesma borda, sem quique.
    // Eram 48px a partir do meio do caminho: uma folha que surge perto da
    // borda, e não uma que vem dela. Com movimento reduzido o bloco global
    // corta a animação, e a folha simplesmente aparece.
    "will-change-transform motion-reduce:will-change-auto",
    "data-open:animate-in data-open:fade-in-0 data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring)",
    "data-closed:animate-out data-closed:fade-out-0 data-closed:animation-duration-[200ms] data-closed:ease-(--ease-out)",
    // O conteúdo sobe em cascata, logo atrás do deslize.
    "sheet-reveal",
    // **Folha sobre folha**: coberta por outra, ela recua para o fundo — encolhe
    // e se afasta da borda —, e volta quando a de cima fecha.
    "transition-[translate,scale] duration-(--duration-spring) ease-(--ease-spring)",
    "data-[coberta]:scale-[0.96] data-[coberta]:data-[side=right]:-translate-x-6 data-[coberta]:data-[side=left]:translate-x-6 data-[coberta]:data-[side=top]:translate-y-6 data-[coberta]:data-[side=bottom]:-translate-y-6",
    // O contrato que a cromagem do `Dialog` lê — o mesmo em painel e gaveta, e
    // o motivo de `DialogHeader` funcionar dentro dos dois. Ver o `drawer.tsx`.
    SURFACE_CONTRACT_CLASS,
  ],
  {
    variants: {
      /** De qual borda ele entra — no desktop; no telefone é sempre a gaveta de baixo. */
      side: {
        top: "inset-x-[var(--sheet-gap,0px)] top-[var(--sheet-gap-block-start,0px)] h-auto data-open:slide-in-from-top data-closed:slide-out-to-top",
        right:
          "top-[var(--sheet-gap-block-start,0px)] right-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] w-3/4 data-open:slide-in-from-right data-closed:slide-out-to-right",
        bottom:
          "inset-x-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] h-auto data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
        left: "top-[var(--sheet-gap-block-start,0px)] left-[var(--sheet-gap,0px)] bottom-[var(--sheet-gap-block-end,0px)] w-3/4 data-open:slide-in-from-left data-closed:slide-out-to-left",
      },
      /**
       * A largura das laterais (rodada 222): `sm` 384 — o padrão de sempre — ·
       * `md` 448 · `lg` 512 · `full`, a janela menos 4rem. Topo e base tomam a
       * largura, e para eles o componente passa `none`: um `max-w` com as duas
       * âncoras horizontais encolheria a folha para a esquerda.
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
          // O × de canto é **círculo preenchido** (rodada 222). Sem anel e sem
          // sombra: ele já está dentro da placa, e com os dois lia como uma
          // segunda placa pousada na primeira. **O fundo é o texto a 5%, e não a
          // tinta da placa**: `--popover` é a cor exata da folha, e o círculo
          // sumia (o dono viu); `--muted` ficou claro demais, e o dono pediu um
          // degrau abaixo. **E abaixo é mais escuro nos dois temas**: o texto a
          // 5% escurece o branco do claro, mas no escuro puxa para o branco e
          // clareia — ali o fundo é a página a 40% sobre a placa (≈0,18 contra
          // 0,205; a página cheia, 0,145, descia mais de um degrau). O realce do hover é o texto a 10%. Só o de
          // canto (`>`): o que mora num `DialogHeaderRow` é do cabeçalho.
          "[&>[data-slot=dialog-close-button]]:rounded-full [&>[data-slot=dialog-close-button]]:bg-foreground/5 dark:[&>[data-slot=dialog-close-button]]:bg-background/40 [&>[data-slot=dialog-close-button]]:[--button-hover-fill:color-mix(in_oklab,var(--foreground)_10%,transparent)]",
          "[--sheet-gap:--spacing(2)]",
          "[--sheet-gap-block-start:max(var(--sheet-gap),env(safe-area-inset-top,0px))]",
          "[--sheet-gap-block-end:max(var(--sheet-gap),env(safe-area-inset-bottom,0px))]",
        ].join(" "),
      },
    },
    // **A aba do encostado.** A mola passa 3,8% do alvo, e o recuo de
    // "folha sobre folha" anda 24px: nos dois o painel descola da borda e a
    // página aparecia na fresta (11px num painel de 288). Uma cópia chapada da
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

/**
 * O véu — o mesmo no painel, na gaveta e no `Drawer`. Acima do chrome do
 * telefone (`MobileBottomNav` e FAB estão em `--z-modal`); abaixo do `Toaster`.
 */
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
 * telefone ela é gaveta** — menos quem pede `surface="panel"` (a navegação, rodada 66). Não é um `if` espalhado por 37 arquivos — a
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
   * No telefone, as alturas em que a gaveta para (`[0.5, 1]`: meia e cheia) —
   * os `snapPoints` do `vaul`. No desktop não valem.
   */
  snapPoints?: (number | string)[]
}) {
  const isMobile = useIsMobile()
  const escolhida: SheetSurface = isMobile && modo === "auto" ? "drawer" : "panel"

  // O estado mora aqui, controlado ou não, porque todo pedido de fechar passa
  // por `pedir` — a régua do `Dialog`, a mesma função.
  const { open, pedir, pergunta } = usePedidoDeFechar({
    open: openProp,
    defaultOpen,
    onOpenChange,
    pending,
    dirty,
    confirmDiscard,
  })

  // A superfície é decidida ao abrir e fica até fechar. Com ela ao vivo, girar
  // um tablet ou estreitar a janela com a folha aberta desmontava uma primitiva
  // e montava a outra — o foco e o que estava digitado iam junto.
  const [travada, setTravada] = React.useState<SheetSurface | null>(null)
  if (open && travada === null) setTravada(escolhida)
  if (!open && travada !== null) setTravada(null)
  const surface = travada ?? escolhida

  // **Folha sobre folha.** Uma folha aberta de dentro de um painel avisa o de
  // baixo, que recua. Na gaveta quem empilha é o `Drawer`: o aninhamento é um
  // só, o do `drawer.tsx`, e folha e gaveta viram `NestedRoot` uma da outra.
  const pai = React.useContext(DrawerRaizContext)
  React.useEffect(() => {
    if (pai?.superficie !== "painel" || !open) return
    pai.cobrir(true)
    return () => pai.cobrir(false)
  }, [pai, open])

  // Dentro da moldura do catálogo o painel deixa de ser modal — senão o
  // `RemoveScroll` do Radix trava a rolagem da **página de fora**. Ver
  // `useViewportModal`. Na gaveta quem decide é o `Drawer` (e é ele que
  // desenha o véu da moldura), então ela recebe só o que a tela pediu. E
  // `modal={false}` pedido pela tela é o **painel ao lado**: sem véu, a
  // página continua clicável e clicar fora não fecha.
  const modalDaMoldura = useViewportModal()
  const aoLado = modalProp === false
  const modal = surface === "drawer" ? modalProp : (modalProp ?? modalDaMoldura)

  const estado = React.useMemo(() => ({ pending, aoLado }), [pending, aoLado])

  return (
    <SheetSurfaceContext.Provider value={surface}>
      <SheetEstadoContext.Provider value={estado}>
        {surface === "drawer" ? (
          // **No telefone a folha é o `Drawer`** (rodada 252): a mesma raiz,
          // com `repositionInputs`, a trava do `pending` (que respeita o
          // `dismissible` de quem chama) e o aninhamento. O pedido de fechar
          // continua passando por `pedir`, com a pergunta de descarte.
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
        // Só o painel anima o véu por keyframe. Na gaveta o vaul já anima o
        // próprio véu (`fadeIn`, medido no computado) e o acompanha no arraste;
        // as classes de entrada ali eram mortas.
        overlayClassName("sheet", surface === "panel"),
        surface === "panel" && "ease-in-out",
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
 * A costura de largura de uma folha lateral (rodada 222). Fica na aresta de
 * **dentro** — a que encosta na página — e não desenha nada em repouso: ao
 * pousar, ao focar e ao arrastar acende um fio de 2px na cor da borda mais
 * forte, a regra da costura do `Sidebar`. Nas flutuantes o fio pula a curva dos
 * cantos. Arrasta com o ponteiro e anda 16px por seta.
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
    /**
     * No desktop, a aresta de dentro de uma folha lateral arrasta a largura.
     * Uma string é a chave em que ela fica guardada entre aberturas.
     */
    resizable?: boolean | string
  }) {
  const surface = useSheetSurface()
  const { pending, aoLado } = React.useContext(SheetEstadoContext)
  // O portal do painel vai para o `body` da **janela ativa** (o da gaveta é o
  // do `Drawer`, que faz o mesmo). Fora da moldura do catálogo o contexto é
  // `null` e o Radix usa o próprio documento — o app não muda. Dentro dela é o
  // que impede a folha de escapar do `<iframe>`.
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
    // **No telefone a folha é a gaveta do `Drawer`** (rodada 252): a mesma
    // peça — a superfície de vidro, a alça, a altura que acompanha o conteúdo,
    // o meio que rola, a área segura e o portal na janela ativa. Só o nome do
    // slot é da folha. A gaveta alta é o `fill`; sem ele, os degraus da raiz
    // decidem, como em qualquer `Drawer`.
    return (
      <DrawerContent
        data-slot="sheet-content"
        data-side="bottom"
        fill={fillMobileViewport || undefined}
        className={className}
        style={style}
        onInteractOutside={onInteractOutside}
        {...props}
      >
        {children}
      </DrawerContent>
    )
  }

  // No desktop a folha **é** um painel de borda. `side`, `variant` e `size` são
  // destruturados acima e **não** chegam ao ramo gaveta: ali a superfície é o
  // `Drawer`, e as props não valem (ele tem `variant` e `size` próprios, com
  // outros valores). Sem destruturar cairiam em `{...props}` — o tipo herda o
  // eixo sozinho, via `VariantProps<typeof sheetContentVariants>`.
  return (
    <SheetPrimitive.Portal container={janela?.document.body}>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={conteudo}
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
