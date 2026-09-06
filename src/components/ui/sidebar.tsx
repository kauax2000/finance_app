"use client"

import { Bars3Icon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizablePanel,
} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { Button } from "@/components/ui/button"
import { Input, type InputBaseProps } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  EdgePanel,
  EdgePanelContent,
} from "@/components/ui/edge-panel"
import {
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SIDEBAR_STATE_COOKIE_NAME } from "@/lib/sidebar-state-cookie"

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
/**
 * Os limites do arraste, em **pixel**.
 *
 * A `react-resizable-panels` 4.12 lê número como pixel e string como
 * porcentagem, e é por isso que o modo redimensionável é possível aqui: um
 * trilho de navegação **não pode** variar de largura com a janela — ícone,
 * rótulo e badge têm medida fixa, e uma proporção faria os três respirarem
 * diferente em cada monitor.
 */
const SIDEBAR_WIDTH_MIN = 208
const SIDEBAR_WIDTH_MAX = 384

/**
 * Os eixos da barra.
 *
 * Ele existe por duas razões, e a segunda é mecânica. A primeira: `variant`
 * decidia a geometria por **ternário** em dois lugares
 * (`variant === "floating" || variant === "inset"`), e uma decisão escrita duas
 * vezes diverge — foi assim que `floating` ficou com `rounded-lg` e `inset` com
 * `rounded-xl`, dois raios para a mesma ideia de cartão solto.
 *
 * A segunda: o `ds:catalog` lê o **primeiro** `cva` do arquivo. Enquanto o
 * único era o do botão de menu, o catálogo reportava `variant: plain | outline`
 * e `size: md | sm | lg` como se fossem os eixos da **barra** — e `side`,
 * `variant` e `collapsible` não apareciam em lugar nenhum. É o mesmo defeito
 * que o `Item` registrou com `itemGroupVariants`, e a correção é a mesma:
 * este vem primeiro.
 */
const sidebarVariants = cva("", {
  variants: {
    /** A borda em que ela encosta. */
    side: { left: "", right: "" },
    /**
     * A superfície. `floating` e `inset` têm a **mesma** geometria — o que
     * muda é quem desenha o cartão: o miolo da barra numa, o `SidebarInset` na
     * outra. Sem um `SidebarInset` na árvore, `inset` não tem efeito visível.
     */
    variant: { sidebar: "", floating: "p-2", inset: "p-2" },
    /** Para onde ela vai ao recolher. */
    collapsible: { offcanvas: "", icon: "", none: "" },
  },
  defaultVariants: { side: "left", variant: "sidebar", collapsible: "offcanvas" },
})

type SidebarContextProps = {
  /** O layout é um `ResizablePanelGroup`, e a largura é arrastável. */
  resizable: boolean
  /** Espalhar no `ResizablePanel` da barra. Vazio fora do modo redimensionável. */
  panelProps: Record<string, unknown>
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

/** Referência estável: um literal aqui trocaria a identidade do contexto a cada render. */
const EMPTY_PANEL_PROPS: Record<string, unknown> = {}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  resizable = false,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * A largura da barra passa a ser arrastável, e o layout vira um
   * `ResizablePanelGroup` — o **átomo** `Resizable`, e não arraste escrito
   * aqui. Com ele vêm de graça a costura com foco de teclado, as setas, o
   * duplo-clique voltando ao padrão e o colapso por arraste.
   *
   * É opt-in porque a casca do produto não pede: uma navegação de seis links
   * não se redimensiona, e o `PanelGroup` declara `display`, `flex-direction`,
   * `overflow` e as medidas por **estilo inline** — o `.d.ts` da lib avisa que
   * as quatro não se sobrescrevem.
   */
  resizable?: boolean
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const painel = useResizablePanel()

  // O estado interno. `open`/`onOpenChange` controlam de fora.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // O cookie é o padrão de quem **não** controla. Gravá-lo em modo
      // controlado sobrescreve pelas costas a preferência de quem controla, e
      // o recarregamento seguinte discorda do pai.
      if (!setOpenProp) {
        document.cookie = `${SIDEBAR_STATE_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      }
    },
    [setOpenProp, open]
  )

  // No modo redimensionável quem sabe a largura é o painel, então quem colapsa
  // também tem de ser ele — senão o `⌘B` e a costura brigariam pelo mesmo
  // estado, cada um com a sua verdade.
  const toggleSidebar = React.useCallback(() => {
    if (isMobile) return setOpenMobile((open) => !open)
    if (resizable) return painel.toggle()
    return setOpen((open) => !open)
  }, [isMobile, resizable, painel, setOpen, setOpenMobile])

  // O atalho escuta o documento que **contém** a barra, e não `window`. Dentro
  // de um iframe — a moldura do catálogo — `window` é o de fora, e a tecla
  // digitada lá dentro nunca chegaria ao ouvinte.
  const raiz = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const janela = raiz.current?.ownerDocument.defaultView ?? window
    const aoTeclar = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    janela.addEventListener("keydown", aoTeclar)
    return () => janela.removeEventListener("keydown", aoTeclar)
  }, [toggleSidebar])

  // Fora do modo redimensionável o estado é o cookie; dentro dele, é o painel.
  const state = (resizable ? !painel.isCollapsed : open)
    ? "expanded"
    : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      resizable,
      panelProps: resizable ? painel.panelProps : EMPTY_PANEL_PROPS,
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [
      resizable,
      painel.panelProps,
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    ]
  )

  const casca = {
    "data-slot": "sidebar-wrapper",
    style: {
      "--sidebar-width": SIDEBAR_WIDTH,
      "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
      ...style,
    } as React.CSSProperties,
    className: cn(
      "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
      className
    ),
    ...props,
  }

  if (resizable) {
    return (
      <SidebarContext.Provider value={contextValue}>
        {/* `stack={false}`: o átomo empilha grupos horizontais no telefone, e
            aqui isso é errado — abaixo de `md` a navegação é um `EdgePanel`, e
            não um painel empilhado sob o conteúdo. */}
        <ResizablePanelGroup ref={raiz} stack={false} {...casca}>
          {children}
        </ResizablePanelGroup>
      </SidebarContext.Provider>
    )
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <div ref={raiz} {...casca}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile, resizable, panelProps } =
    useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      // `EdgePanel`, e não `Sheet`: navegação entra pelo lado em qualquer
      // largura. O `Sheet` vira gaveta de baixo no telefone — certo para um
      // formulário, errado para um menu, que ficaria com alça de arraste e
      // canto arredondado no topo para listar seis links.
      <EdgePanel open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <EdgePanelContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <DialogHeader className="sr-only">
            {/* O nome que o leitor de tela anuncia ao abrir o menu. Ele era a
                palavra inglesa "Sidebar", e a descrição era uma frase de
                desenvolvedor ("Displays the mobile sidebar") — a mesma camada
                que o `Calendar` tinha em inglês sob uma grade traduzida. */}
            <DialogTitle>Navegação</DialogTitle>
            <DialogDescription>
              Seções do app e as ações da conta.
            </DialogDescription>
          </DialogHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        <DialogCloseButton />
        </EdgePanelContent>
      </EdgePanel>
    )
  }

  const miolo = (
    <div
      data-sidebar="sidebar"
      data-slot="sidebar-inner"
      className={cn(
        "flex size-full flex-col bg-sidebar",
        // ── A placa flutuante ──────────────────────────────────────────────
        // `glassSurfaceClassName` traz a superfície inteira: a lâmina preta, as
        // duas nuvens nos cantos opostos da diagonal e o **aro inclinado**. A
        // elevação (`shadow`) fica de fora, porque é outro eixo.
        //
        // **O `bg-sidebar` acima é apagado aqui, e é assim mesmo.** O shorthand
        // `background` da utility redefine a cor de fundo — medido, ele resolve
        // `rgba(0, 0, 0, 0)` sob `floating`. Ele fica porque as outras duas
        // variantes o usam; o vidro **substitui** o preenchimento, não soma.
        //
        // **E a classe é literal, não `${glassSurfaceClassName}` sob o
        // variante.** O Tailwind varre o código como texto: um nome montado em
        // tempo de execução não chega ao CSS. É a mesma razão por que os três
        // menus escrevem por extenso a classe que carrega o nome da primitiva
        // em vez de a herdarem da superfície compartilhada.
        "group-data-[variant=floating]:rounded-xl group-data-[variant=floating]:shadow-sm",
        "group-data-[variant=floating]:glass"
      )}
    >
      {children}
    </div>
  )

  // ── O caminho redimensionável: quem mede é o átomo `Resizable` ────────────
  // A barra deixa de ser um trilho `fixed` com uma `div` de folga e vira o
  // primeiro painel de um grupo. Não é menos código, é outro modelo de layout —
  // e o motor é dono dos **dois** lados da costura, por isso a decisão mora no
  // `SidebarProvider` e não aqui.
  if (resizable) {
    const barra = (
      <ResizablePanel
        {...panelProps}
        // Os dois `collapsible` que sobram aqui viram configuração do átomo: o
        // modo ícone é literalmente o tamanho colapsado, e o offcanvas é zero.
        // (`none` já saiu no retorno de cima — o tipo prova.)
        collapsible
        collapsedSize={collapsible === "icon" ? 48 : 0}
        defaultSize={256}
        minSize={SIDEBAR_WIDTH_MIN}
        maxSize={SIDEBAR_WIDTH_MAX}
        data-slot="sidebar"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
        dir={dir}
        className={cn(
          "group peer hidden text-sidebar-foreground md:block",
          sidebarVariants({ side, variant, collapsible }),
          className
        )}
      >
        {miolo}
      </ResizablePanel>
    )

    return side === "left" ? (
      <>
        {barra}
        <ResizableHandle aria-label="Redimensionar a navegação" />
      </>
    ) : (
      <>
        <ResizableHandle aria-label="Redimensionar a navegação" />
        {barra}
      </>
    )
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* A folga que reserva, no fluxo, o lugar do trilho `fixed`. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--duration-base) ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-(--z-sticky) hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-(--duration-base) ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        {miolo}
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      type="button"
      variant="tertiary"
      size="icon-sm"
      aria-label="Alternar barra lateral"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <Bars3Icon />
    </Button>
  )
}

/**
 * A borda clicável que alterna a barra.
 *
 * **Ela declarava `cursor-w-resize` e só alternava.** Somado ao fio de 2px que
 * acende no cursor, era a gramática de uma costura de arraste inteira — e quem
 * mentia era o cursor do sistema operacional, que é a promessa mais forte que
 * uma interface consegue fazer. É a quarta ocorrência da família que o
 * `SheetDragHandle`, o `Drawer` e a alça do `vaul` já custaram.
 *
 * Hoje ele alterna, e diz que alterna. Quem redimensiona é o átomo
 * `Resizable`, sob `SidebarProvider resizable` — e ali este trilho **não
 * renderiza**, porque a costura do átomo ocupa o lugar dele e duas seriam duas.
 */
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar, resizable } = useSidebar()

  if (resizable) return null

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Alternar a navegação"
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        "absolute inset-y-0 z-10 hidden w-4 cursor-pointer transition-[background-color,translate] ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-0.5 after:transition-colors hover:after:bg-sidebar-border active:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar active:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * O fio da tira de topo do conteúdo, publicado como variável.
 *
 * Em `variant="sidebar"` o cabeçalho encosta no `border-r` da barra e os dois
 * leem como uma cromagem só. No `floating` esse `border-r` não existe, e o fio
 * fica **pendurado**: medido, a placa termina em `x=248` e o fio vai de `x=256`
 * a 778 — uma régua de 522px que começa a 8px de nada.
 *
 * A regra que resolve já está escrita para as tiras de superfície: elas não têm
 * fio nem tinta, e quem marca o limite é o respiro — mais a dissolução onde há
 * rolagem, que no `AppHeader` é o vidro que ele acende ao rolar.
 *
 * **É variável, e não seletor de grupo.** `in-*` e `group-*` compilam com
 * `:where()`, que não soma especificidade e perde para a classe base no mesmo
 * elemento; variável herda e não disputa. É o mecanismo de `--dialog-px`,
 * `--dialog-bleed` e `--toolbar-control`. E ela nasce no `SidebarInset` porque
 * ele é **peer** da barra — a mesma relação que a variante `inset` já usa.
 */
const SIDEBAR_INSET_RULE =
  "[--sidebar-inset-rule:1px] md:peer-data-[variant=floating]:[--sidebar-inset-rule:0px]"

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  const { resizable } = useSidebar()

  // No modo redimensionável o conteúdo é o **outro** painel do grupo: quem
  // divide a largura com a barra tem de estar dentro do mesmo motor, senão o
  // arraste move um lado e o outro não acompanha.
  if (resizable) {
    return (
      // O painel é uma `div` e não aceita trocar de elemento — a lib não tem
      // `asChild` nem `render`. Então o `<main>` mora **dentro** dele: o
      // landmark fica, e quem é filho direto do grupo continua sendo o painel.
      <ResizablePanel data-slot="sidebar-inset-panel" minSize={320}>
        <main
          data-slot="sidebar-inset"
          className={cn(
            "relative flex size-full min-w-0 flex-col bg-background",
            SIDEBAR_INSET_RULE,
            className
          )}
          {...props}
        />
      </ResizablePanel>
    )
  }

  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-w-0 w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        SIDEBAR_INSET_RULE,
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: InputBaseProps & React.RefAttributes<HTMLInputElement>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      // Sem `sticky top-0 z-10 bg-sidebar`: as faixas são **irmãs** do
      // rolável, não descendentes dele, então não havia ancestral rolante
      // contra o qual grudar — o `sticky` era inerte, e o `z-10` mais o
      // `bg-sidebar` existiam para esconder um conteúdo que nunca passou por
      // baixo. Quem marca o limite agora é a dissolução do conteúdo.
      className={cn(
        "flex h-16 shrink-0 flex-col justify-center gap-2 px-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-2 p-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={useScrollFade()}
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        // Modo **sem faixa**: o cabeçalho e o rodapé têm altura variável, e
        // medi-los exigiria um segundo observador escrevendo a altura do JS,
        // com flash na primeira pintura. Aqui a dissolução acontece na borda do
        // próprio rolável, e as duas faixas ficam onde estão.
        //
        // O ganho é maior aqui do que em qualquer outra superfície: com
        // `no-scrollbar`, esta lista rolava sem **nenhum** indicador.
        scrollFadeViewportClassName,
        // A guarda do modo ícone, e é um defeito concreto: um elemento com
        // `overflow: hidden` **continua** tendo `scrollHeight > clientHeight`,
        // então a máscara acenderia — e como não há evento de rolagem possível,
        // as duas pontas congelariam no piso para sempre, apagando o primeiro e
        // o último ícone de navegação.
        "group-data-[collapsible=icon]:[--scroll-fade-mask:none]",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col justify-start p-2",
        // `action` já teve um `border-b border-sidebar-border`. Ele saiu porque
        // esta faixa é o primeiro filho do `SidebarContent`, que **é** o
        // viewport com a dissolução — o limite já está dito, e um fio ali seria
        // o segundo sinal para a mesma emenda. O que separa o botão de ação da
        // navegação é o `p-2` daqui mais o respiro do grupo seguinte.
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-(--duration-base) ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

/**
 * A lista de itens, e o ritmo dela.
 *
 * Ela era `gap-0` — as linhas se encostavam —, e isso não era decisão: era o
 * padrão do shadcn. A prova é que a navegação do produto o desfazia à mão,
 * escrevendo `className="gap-2"` nos **dois** menus que têm mais de um item.
 * (Os outros três do app carregam um item só, onde o `gap` não decide nada.)
 * Padrão que ninguém escolhe não é padrão.
 *
 * **São 4px, e não os 8 que a tela pedia.** O realce de um item é a caixa
 * inteira da linha, com 32px de altura e canto arredondado: a 8px as linhas
 * começam a ler como cartões soltos, e uma navegação é uma lista. Quatro é o
 * suficiente para dois realces vizinhos não se tocarem, que é o problema real
 * do `gap-0`.
 *
 * A hierarquia continua dita, e não pelo respiro: o **grupo** separa em 16
 * (o `p-2` de cada lado), quatro vezes o item — e o **submenu** se distingue
 * pelo recuo e pelo fio à esquerda, não por ser mais denso. É por isso que ele
 * fica nos mesmos 4: com o trilho dizendo o aninhamento, um segundo sinal seria
 * redundante.
 */
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

/**
 * Por que isto não é `Button`, e é decisão.
 *
 * A regra da casa é que um componente não reimplementa o que a camada de baixo
 * já dá — e um item de menu **é** um botão. Medido, vestir `Button
 * variant="tertiary"` aqui exigiria sete contra-classes para desfazê-lo:
 * `justify-start`, `font-normal`, `border-0`, `focus-visible:ring-sidebar-ring`,
 * `dark:hover:bg-sidebar-accent`, os `aria-expanded:*` e o `translate-y`.
 * Reimplementar ao contrário. Este `cva` é a régua de baixo **deste chrome**:
 * ele tem paleta própria (`sidebar-accent`, `sidebar-ring`), geometria própria
 * no modo ícone, e `SidebarMenuAction`/`SidebarMenuBadge` leem o `data-size` dele
 * por `peer-data-[size=…]`. O arquivo já distingue: `SidebarTrigger`, que é
 * ação na superfície do app, **é** `Button`. `SidebarMenuAction` e
 * `SidebarGroupAction` têm 20px de caixa (o menor `Button` é 24); `SidebarRail`
 * é uma alça com `tabIndex={-1}`, não um botão.
 */
/**
 * A escada de realce da placa flutuante.
 *
 * No `floating` a superfície tem **degradê** — corre de `oklch(0.242)` no topo a
 * `oklch(0.192)` na base. Um realce que pinta cor **opaca** sobre isso apaga o
 * degradê dentro do próprio retângulo, e — pior — muda de força conforme onde o
 * item está. Medido: o botão do workspace fica a **8%** da altura do painel e o
 * da conta a **92%**, e o mesmo `--sidebar-accent` dava **1,09 no workspace e
 * 1,21 na conta** no tema escuro. No claro a assimetria **inverte** (1,20 e
 * 1,11), porque ali a superfície escurece para baixo em vez de clarear.
 *
 * A tinta é `bg-current/N`, que é o vocabulário que este sistema já usa em
 * `AlertAction` e `AnnouncementBarAction` para "ação dentro de superfície
 * tingida, quando o componente não sabe o tom". `currentColor` dentro do painel
 * é `--sidebar-foreground` — quase-branco no escuro, quase-preto no claro —,
 * então **a tinta vira de direção sozinha**, sem token novo e sem par `dark:`.
 * E ela deixa o degradê passar por baixo, que é o ponto.
 *
 * **Três degraus, onde antes havia um.** `hover:`, `active:` e `data-active:`
 * usavam todos o mesmo token, e o que separava o ativo era só o `font-medium`.
 *
 * **Uma armadilha, verificada:** `hover:text-sidebar-accent-foreground` mexe em
 * `currentColor`, e portanto na própria tinta. Nos dois temas
 * `--sidebar-accent-foreground` é **igual** a `--sidebar-foreground`, então ela
 * não se move — mas isto quebra calado no dia em que um dos dois mudar.
 */
const SIDEBAR_GLASS_STATES =
  "group-data-[variant=floating]:hover:bg-current/6 group-data-[variant=floating]:active:bg-current/9 group-data-[variant=floating]:data-active:bg-current/12"

/**
 * Recolhida, quem centra o ícone é o **recuo**, e ele é por degrau.
 *
 * A conta é `(32 − filho) / 2`. No degrau padrão o filho é o ícone de 16, e
 * `p-2!` dá os 8 exatos. No `lg` o filho é um avatar de **24** — o seletor de
 * workspace e o da conta —, então o recuo tem de ser 4, e não 8: com 8 ele não
 * caberia. O arquivo escrevia `p-0!` ali, e o avatar encostava na **esquerda**
 * da caixa, com 8px mortos à direita — **4px fora do centro**, medidos, numa
 * coluna em que todo o resto está no meio.
 *
 * **E não se conserta com `justify-center`** — medido: o rótulo continua no
 * fluxo em modo ícone (o que o esconde é o `overflow-hidden`, não `display`),
 * então a linha transborda a caixa, e centrar uma linha de flex que transborda
 * puxa o conteúdo para **fora nos dois lados**. Os degraus que estavam certos
 * foram de 0 para −4. Com o rótulo ocupando espaço, o recuo é a única alavanca
 * que centra.
 */
const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
  {
    variants: {
      variant: {
        // Vazio, e não redundante: a base já declara o realce, e `plain` o
        // repetia palavra por palavra — uma variante que não acrescenta nada
        // não decide nada. É a família do `Item`, que teve dois degraus com a
        // mesma string, e do `defaultControlVariant`, que era constante
        // disfarçada de função.
        plain: "",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)] active:bg-sidebar-accent active:text-sidebar-accent-foreground active:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        md: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-1!",
      },
    },
    defaultVariants: {
      variant: "plain",
      size: "md",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "plain",
  size = "md",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot.Root : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        sidebarMenuButtonVariants({ variant, size }),
        SIDEBAR_GLASS_STATES,
        className
      )}
      {...props}
    />
  )

  // A dica só existe quando o rótulo não está na tela: recolhida, e no
  // desktop. No telefone a barra é um painel com os nomes por extenso, então
  // ali ela seria a mesma palavra duas vezes.
  //
  // **E ela não é montada e escondida — ela não é montada.** A versão anterior
  // passava `hidden` ao conteúdo, e isso esconde pixel e mais nada: o Radix
  // continuava abrindo a dica e ligando o `aria-describedby` do botão a ela.
  // Medido com a barra expandida, que é o estado padrão do app: o botão
  // "Início" saía descrito por uma dica invisível escrita "Início" — o mesmo
  // texto do rótulo, em cada item do menu, para quem usa leitor de tela.
  if (!tooltip || state !== "collapsed" || isMobile) {
    return button
  }

  const tooltipProps =
    typeof tooltip === "string" ? { children: tooltip } : tooltip
  const { className: tooltipClassName, ...restTooltipProps } = tooltipProps

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        {...restTooltipProps}
        side="right"
        align="center"
        sideOffset={6}
        className={tooltipClassName}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=md]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        showOnHover &&
        "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=md]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // A largura varia de 50 a 90% para a pilha não ler como tabela — mas ela sai
  // do `useId`, e não de `Math.random()`. O random do shadcn roda no servidor e
  // no cliente e devolve valores diferentes: eram **dez erros de hidratação numa
  // página só**, todos deste componente. O `useId` é estável entre os dois lados
  // por contrato do React, e mantém a variedade.
  const id = React.useId()
  let semente = 0
  for (let i = 0; i < id.length; i++) semente = (semente * 31 + id.charCodeAt(i)) | 0
  const width = `${50 + (Math.abs(semente) % 41)}%`

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot.Root : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
