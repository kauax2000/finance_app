"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "motion/react"
import { Slot } from "radix-ui"

import { ChevronLeftIcon } from "@heroicons/react/16/solid"
import { SidebarToggleIcon } from "@/components/icons/sidebar-toggle-icon"
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
import { useMarcador } from "@/hooks/use-marcador"
import { composeRefs } from "radix-ui/internal"
import { Button } from "@/components/ui/button"
import { Input, type InputBaseProps } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
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
// O trilho recolhido: 16 + o botão de 32 + 16. Com 48 o ladrilho da carteira e o
// avatar encostavam na borda da placa.
const SIDEBAR_WIDTH_ICON = "4rem"
/** A largura do painel no telefone. Ali a barra não é trilho nem tela cheia. */
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
/**
 * Os limites do arraste, em pixel: a `react-resizable-panels` lê número como
 * pixel e string como porcentagem. Um trilho de navegação não pode variar de
 * largura com a janela (ícone, rótulo e badge têm medida fixa).
 */
const SIDEBAR_WIDTH_MIN = 208
const SIDEBAR_WIDTH_MAX = 384

/**
 * Os eixos da barra. `variant` decidia a geometria por ternário em dois
 * lugares, e uma decisão escrita duas vezes diverge; e o `ds:catalog` lê o
 * **primeiro** `cva` do arquivo, então este vem antes do do botão de menu.
 */
const sidebarVariants = cva("", {
  variants: {
    /**
     * A superfície. `floating` e `inset` têm a mesma geometria; o que muda é quem
     * desenha o cartão (o miolo da barra numa, o `SidebarInset` na outra). Sem um
     * `SidebarInset` na árvore, `inset` não tem efeito visível.
     * No modo redimensionável o `floating` não tem recuo à direita: a placa encosta
     * na costura, que é a aresta dela. Com o recuo, o gatilho do topo (a 8px dela)
     * encostaria no painel de conteúdo, que rola e cortaria a sombra dele.
     */
    variant: { sidebar: "", floating: "py-2 pl-2", inset: "p-2" },
    /** Para onde ela vai ao recolher. */
    collapsible: { offcanvas: "", icon: "", none: "" },
  },
  // `floating` é o padrão, como no `Menubar` e no `NavigationMenu`. Não há `side`:
  // a navegação mora sempre à esquerda, por decisão do dono.
  defaultVariants: { variant: "floating", collapsible: "offcanvas" },
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
  /** Recolhida e aberta por cima pelo cursor (`peek`). O `open` não muda. */
  espiando: boolean
  setEspiando: (espiando: boolean) => void
  /** Recolhida em ícone no `floating`, o gatilho mora no cabeçalho da barra. */
  gatilhoNaBarra: boolean
  setGatilhoMovel: (movel: boolean) => void
  /** O `layoutId` do gatilho — é ele que o leva do topo à barra e de volta. */
  gatilhoId: string
  /** Onde mora o botão de recolher e abrir (`SidebarTogglePlacement`). */
  toggle: SidebarTogglePlacement
}

/**
 * Onde mora o botão de recolher e abrir, no desktop:
 * - `topbar` — no `TopBar`, e recolhida ele viaja para a barra. O padrão do
 *   componente (o catálogo o usa nos exemplos com cabeçalho).
 * - `edge` — uma alça redonda presa na borda direita da placa, na altura do
 *   cabeçalho, com uma seta que gira; anda junto com a borda. **A do app.**
 * - `footer` — uma linha "Recolher" (com o ⌘B) acima da conta; recolhida, o
 *   ícone no mesmo lugar, com dica.
 * - `footerBar` — uma faixa fina no pé da placa, abaixo da conta, só com a seta
 *   que gira (a mesma da `edge`).
 * `footer` e `footerBar` estão em avaliação contra a `edge` no
 * `/laboratorio/barra`. No telefone a barra é folha, e vale o gatilho do topo.
 */
type SidebarTogglePlacement = "topbar" | "edge" | "footer" | "footerBar"

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
  toggle = "topbar",
  ...props
}: React.ComponentProps<"div"> & {
  /** Onde mora o botão de recolher e abrir no desktop. */
  toggle?: SidebarTogglePlacement
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * A largura da barra passa a ser arrastável e o layout vira um
   * `ResizablePanelGroup` (o átomo `Resizable`: costura com foco de teclado,
   * setas, duplo-clique e colapso por arraste). É opt-in: uma navegação de seis
   * links não se redimensiona, e o `PanelGroup` declara `display`, `flex-direction`,
   * `overflow` e as medidas por estilo inline.
   */
  resizable?: boolean
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [espiando, setEspiando] = React.useState(false)
  const [gatilhoMovel, setGatilhoMovel] = React.useState(false)
  const gatilhoId = `${React.useId()}-gatilho`
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

      // O cookie é o padrão de quem não controla: em modo controlado ele sobrescreveria
      // a preferência de quem controla, e o recarregamento discordaria do pai.
      if (!setOpenProp) {
        document.cookie = `${SIDEBAR_STATE_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      }
    },
    [setOpenProp, open]
  )

  // No modo redimensionável quem sabe a largura é o painel, então quem colapsa
  // também é ele (senão o `⌘B` e a costura brigariam pelo mesmo estado).
  // Depende da função, estável, e não do objeto do hook, novo a cada render.
  const togglePainel = painel.toggle
  const toggleSidebar = React.useCallback(() => {
    if (isMobile) return setOpenMobile((open) => !open)
    if (resizable) return togglePainel()
    return setOpen((open) => !open)
  }, [isMobile, resizable, togglePainel, setOpen, setOpenMobile])

  // O atalho escuta o documento que **contém** a barra, e não `window`: no iframe
  // do catálogo, `window` é o de fora.
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
      // Abrir ou recolher de verdade encerra a espiada.
      espiando: espiando && state === "collapsed",
      setEspiando,
      // Só o do topo viaja para a barra; nas outras o botão já mora nela.
      gatilhoNaBarra:
        toggle === "topbar" && gatilhoMovel && state === "collapsed" && !isMobile,
      setGatilhoMovel,
      gatilhoId,
      toggle,
    }),
    [
      toggle,
      espiando,
      gatilhoMovel,
      gatilhoId,
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
      // A folga que a barra do topo reserva, para quem passa por trás dela (ver
      // `SIDEBAR_INSET_BEHIND`). Espiando vale a do trilho, porque a placa abre por cima.
      "md:[--sidebar-gap:var(--sidebar-width)] md:has-[[data-slot=sidebar][data-collapsible=offcanvas]]:[--sidebar-gap:0px]",
      "md:has-[[data-slot=sidebar][data-collapsible=icon]]:[--sidebar-gap:calc(var(--sidebar-width-icon)+(--spacing(4)))] md:has-[[data-slot=sidebar][data-peek]]:[--sidebar-gap:calc(var(--sidebar-width-icon)+(--spacing(4)))]",
      className
    ),
    ...props,
  }

  if (resizable) {
    return (
      <SidebarContext.Provider value={contextValue}>
        {/*
           `stack={false}`: o átomo empilha grupos horizontais no telefone, e aqui
           abaixo de `md` a navegação é uma gaveta, não um painel empilhado.
        */}
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


/**
 * Se o gatilho pode morar na barra: `floating` com `collapsible="icon"`, no
 * desktop. Quem lê é o `SidebarHeader`, que é onde ele mora.
 */
const SidebarGatilhoMovelContext = React.createContext(false)

/**
 * Se a barra espia (`peek` com `collapsible="icon"`): as dicas de dentro não
 * montam, porque o cursor parado abre a barra com os rótulos em 300ms e a dica,
 * mais rápida, repetiria o rótulo que vinha chegando.
 */
const SidebarPeekContext = React.createContext(false)

/**
 * A folga da dica até o botão: 6, como qualquer dica. Somava o recuo da placa
 * solta para abrir a 6px da borda dela, mas com o trilho recolhido a 16 a soma
 * (14 do botão) só afastava a dica do gatilho, e o dono a achou longe.
 */
const SIDEBAR_TOOLTIP_OFFSET = 6

function Sidebar({
  variant: variante = "floating",
  collapsible = "offcanvas",
  peek = false,
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * `plain` é a barra sem superfície da navegação do catálogo: sem placa nem fio,
   * no fluxo da página, com os grupos divididos por um fio, o rótulo em caixa alta
   * e as linhas apagadas até o cursor. Vale com `collapsible="none"`; fora dele
   * cai na `sidebar`.
   */
  variant?: "sidebar" | "floating" | "inset" | "plain"
  collapsible?: "offcanvas" | "icon" | "none"
  /**
   * Recolhida em ícone, o cursor parado 300ms a abre por cima do conteúdo, sem
   * empurrar a página; recolhe 200ms depois de o cursor sair. Só com mouse.
   */
  peek?: boolean
}) {
  const {
    isMobile,
    state,
    openMobile,
    setOpenMobile,
    resizable,
    panelProps,
    espiando,
    setEspiando,
    toggle,
  } = useSidebar()

  const relogio = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(relogio.current), [])
  const podeEspiar = peek && collapsible === "icon" && state === "collapsed"
  const agendar = (valor: boolean, ms: number) => {
    clearTimeout(relogio.current)
    relogio.current = setTimeout(() => setEspiando(valor), ms)
  }
  // **A espiada segura enquanto um menu de dentro está aberto.** Clicar num
  // gatilho (a carteira, o "+ Adicionar", a conta) abre um menu modal, que põe
  // `pointer-events: none` no `body`: o navegador dá a barra por deixada, e ela
  // fechava por baixo do menu aberto. Com um `aria-expanded="true"` dentro, a
  // saída não agenda o fechamento; quando o menu fecha com o cursor fora da
  // barra, a espiada fecha como sempre.
  const conteiner = React.useRef<HTMLDivElement>(null)
  const menuAberto = () =>
    Boolean(conteiner.current?.querySelector('[aria-expanded="true"]'))
  const gestoDeEspiar = podeEspiar
    ? {
        onPointerEnter: (e: React.PointerEvent) => {
          if (e.pointerType === "mouse") agendar(true, 300)
        },
        onPointerLeave: () => {
          if (!menuAberto()) agendar(false, 200)
        },
      }
    : {}
  React.useEffect(() => {
    const el = conteiner.current
    if (!el || !espiando) return
    const aoMudar = () => {
      if (el.querySelector('[aria-expanded="true"]') || el.matches(":hover")) return
      clearTimeout(relogio.current)
      relogio.current = setTimeout(() => setEspiando(false), 200)
    }
    const observador = new MutationObserver(aoMudar)
    observador.observe(el, { subtree: true, attributes: true, attributeFilter: ["aria-expanded"] })
    return () => observador.disconnect()
  }, [espiando, setEspiando])

  if (collapsible === "none") {
    return (
          <div
            data-slot="sidebar"
            data-variant={variante}
            className={cn(
              // `group`: as peças leem a variante por `group-data-[variant=…]`,
              // como leem o `data-collapsible` nos outros ramos.
              "group flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
              variante === "plain" && "bg-transparent",
              className
            )}
            {...props}
          >
            {children}
          </div>
    )
  }

  // Fora do `none` o `plain` não tem o que desenhar (sem placa não há o que
  // recolher): cai na rente.
  const variant = variante === "plain" ? "sidebar" : variante

  if (isMobile) {
    return (
      // `surface="panel"`: navegação entra pelo lado em qualquer largura. É o único
      // lugar do app que fixa a superfície (toda outra folha vira gaveta no telefone).
      // Entra pela esquerda; `fillMobileViewport` não vai (é a altura da gaveta, e no
      // painel a altura sai do par `top`/`bottom` do `cva`). `p-0` fica fora: a base
      // do casco não declara recuo, e se esta barra voltar a ser gaveta o `twMerge` o
      // faria derrubar a área segura.
      <Sheet
        surface="panel"
        open={openMobile}
        onOpenChange={setOpenMobile}
        {...props}
      >
        <SheetContent
          side="left"
          // O `floating` flutua também no telefone: a calha de 8px do `Sheet`.
          variant={variant === "floating" ? "floating" : "flush"}
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          // Sem `[&>button]:hidden`: ele só escondia o × nosso, e num painel não há
          // arraste, então o × é a única afordância visível de fechar.
          className={cn("w-(--sidebar-width) bg-sidebar text-sidebar-foreground", SIDEBAR_MOBILE_TOQUE)}
          style={
            { "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties
          }
        >
          <DialogHeader className="sr-only">
            {/* O nome que o leitor de tela anuncia ao abrir o menu, em português. */}
            <DialogTitle>Navegação</DialogTitle>
            <DialogDescription>
              Seções do app e as ações da conta.
            </DialogDescription>
          </DialogHeader>
          {/*
             O × mora numa linha própria, acima do espaço de trabalho (no canto se
             sobreporia à linha de cima da barra). No `floating` é a pílula do gatilho do
             desktop (`SIDEBAR_TRIGGER_FLOATING`), sem sombra por já estar dentro da placa;
             32px à vista (40 no dedo) e 44 de alvo, pelo `::after`.
          */}
          <div data-slot="sidebar-close-row" className="flex shrink-0 justify-end px-2 pt-2">
            <DialogCloseButton
              placement="inline"
              size="icon-md"
              className={cn(
                "relative me-0 after:absolute after:-inset-1.5 pointer-coarse:after:-inset-0.5",
                variant === "floating" && "rounded-full bg-sidebar bg-clip-border ring-1 ring-foreground/10"
              )}
            />
          </div>
              <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  const miolo = (
    <div
      data-sidebar="sidebar"
      data-slot="sidebar-inner"
      className={cn(
        "flex size-full flex-col bg-sidebar",
        // A placa flutuante: chapada, sem vidro (a barra reserva a própria calha, não
        // há o que borrar atrás): o `--sidebar`, o anel de 1px e a sombra dos outros
        // flutuantes. Raio `--radius-modal`; elevação `lg` porque placa e página estão a
        // 1,04 uma da outra no tema claro e uma sombra de 6% não define nada.
        "group-data-[variant=floating]:rounded-modal group-data-[variant=floating]:[--radius-parent:var(--radius-modal)] group-data-[variant=floating]:[--radius-inset:--spacing(2)] group-data-[collapsible=icon]:[--radius-inset:--spacing(4)]! group-data-[variant=floating]:shadow-lg group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-foreground/10"
      )}
    >
      {children}
    </div>
  )

  const solta = variant === "floating" || variant === "inset"

  // O caminho redimensionável: quem mede é o átomo `Resizable`. A barra vira o
  // primeiro painel de um grupo (outro modelo de layout), e o motor é dono dos
  // dois lados da costura, por isso a decisão mora no `SidebarProvider`.
  if (resizable) {
    const barra = (
      <ResizablePanel
        {...panelProps}
        // Os dois `collapsible` que sobram viram configuração do átomo: o modo ícone é
        // o tamanho colapsado, e o offcanvas é zero (`none` já saiu acima).
        collapsible
        // O modo ícone soma a calha: 64 da placa, mais 8 à esquerda no `floating` (a
        // direita é a costura) e 8 dos dois lados no `inset`. Sem a calha a placa
        // ficaria com 48 e cortaria os ícones.
        collapsedSize={
          collapsible === "icon"
            ? variant === "floating"
              ? 72
              : variant === "inset"
                ? 80
                : 64
            : 0
        }
        defaultSize={256}
        minSize={SIDEBAR_WIDTH_MIN}
        maxSize={SIDEBAR_WIDTH_MAX}
        // A lib escreve `overflow: auto` inline no nó de dentro do painel, o que
        // recortava o anel e a sombra na aresta da costura. A barra não rola ali (quem
        // rola é o `SidebarContent`), então o painel deixa pintar por fora.
        className="overflow-visible!"
      >
        {/*
           A lib põe o `className` do painel num `div` interno e os atributos no de
           fora; `group` e `data-collapsible` precisam morar no mesmo nó para os
           `group-data-[collapsible=icon]:` do miolo casarem.
        */}
        <div
          data-slot="sidebar"
          data-state={state}
          data-collapsible={state === "collapsed" ? collapsible : ""}
          data-variant={variant}
          dir={dir}
          className={cn(
            // Fora da tela no offcanvas: o painel vai a zero, mas o recuo de 8px e o anel transbordariam como um fio solto.
            "group peer hidden size-full text-sidebar-foreground md:block data-[collapsible=offcanvas]:invisible",
            sidebarVariants({ variant, collapsible }),
            className
          )}
        >
          {miolo}
        </div>
      </ResizablePanel>
    )

    return (
        <SidebarGatilhoMovelContext.Provider
          value={variant === "floating" && collapsible === "icon"}
        >
        <>
          {barra}
          {/* Nas soltas a costura é da placa: sem fio em repouso, rente à aresta e da altura dela. */}
          <ResizableHandle
            aria-label="Redimensionar a navegação"
            variant={solta ? "plain" : "line"}
            className={SIDEBAR_COSTURA[variant]}
          />
        </>
        </SidebarGatilhoMovelContext.Provider>
    )
  }

  return (
      <SidebarGatilhoMovelContext.Provider
        value={variant === "floating" && collapsible === "icon"}
      >
      <SidebarPeekContext.Provider value={peek && collapsible === "icon"}>
      <>
        <div
          className="group peer hidden text-sidebar-foreground md:block"
          data-state={state}
          // Espiando, a barra se desenha aberta (`data-collapsible` vazio) e o
          // `data-state` continua `collapsed`: é ele que o `SidebarInset` lê, e a página não pode andar.
          data-collapsible={state === "collapsed" && !espiando ? collapsible : ""}
          data-peek={espiando ? "" : undefined}
          data-variant={variant}
          data-slot="sidebar"
        >
          {/*
             A folga que reserva, no fluxo, o lugar do trilho `fixed`. Fica na curva
             enfatizada: ela reflui a página, e um quique sacudiria o conteúdo. Espiando, não se mexe.
          */}
          <div
            data-slot="sidebar-gap"
            className={cn(
              "relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--duration-slow) ease-(--ease-emphasized)",
              "group-data-[collapsible=offcanvas]:w-0",
              solta
                ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))] group-data-[peek]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[peek]:w-(--sidebar-width-icon)"
            )}
          />
          <div
            data-slot="sidebar-container"
            className={cn(
              "fixed inset-y-0 left-0 z-(--z-sticky) hidden h-svh w-(--sidebar-width) group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[peek]:z-(--z-sheet) md:flex",
              solta
                ? // **A placa anda na mola**: o trilho `fixed`
                  // não reflui nada, então o quique de 3,8% da mola da casa
                  // fica na placa e não chega à página.
                  "p-2 transition-[left,width] duration-(--duration-spring) ease-(--ease-spring) group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                : // A rente encosta no conteúdo: um quique passaria o fio por
                  // cima dele. Fica na curva da folga.
                  "transition-[left,width] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:w-(--sidebar-width-icon) border-r",
              className
            )}
            ref={conteiner}
            {...gestoDeEspiar}
            {...props}
          >
            {miolo}
            {toggle === "edge" && solta ? <SidebarEdgeToggle /> : null}
          </div>
        </div>
      </>
      </SidebarPeekContext.Provider>
      </SidebarGatilhoMovelContext.Provider>
  )
}

/**
 * A costura do modo redimensionável, uma regra para as três: o acento é a
 * borda da barra acendendo (a cor do anel mais forte, `foreground/30` ao pousar
 * e no foco, `/50` ao arrastar), com a ponta arredondada.
 * Nas soltas ela tem a altura da placa que encosta nela (`my-2`) e só acende no
 * trecho reto da aresta, depois da curva do canto (8 + 10 = o raio 18). Na rente
 * é o fio entre as duas, de cima a baixo.
 */
const SIDEBAR_COSTURA = {
  floating:
    "my-2 h-auto before:inset-y-2.5 before:rounded-full data-[separator=hover]:before:bg-foreground/30 data-[separator=focus]:before:bg-foreground/30 data-[separator=active]:before:bg-foreground/50",
  inset:
    "my-2 h-auto before:inset-y-2.5 before:rounded-full data-[separator=hover]:before:bg-foreground/30 data-[separator=focus]:before:bg-foreground/30 data-[separator=active]:before:bg-foreground/50",
  sidebar:
    "before:rounded-full data-[separator=hover]:before:bg-foreground/30 data-[separator=focus]:before:bg-foreground/30 data-[separator=active]:before:bg-foreground/50",
} as const

/**
 * O gatilho do topo, ao lado de uma barra `floating` aberta, fica a 8px da placa
 * (a calha dela): lado a lado, as peças soltas leem como um conjunto. Recolhida
 * em offcanvas a placa sai da tela e ele volta ao recuo de quem o chama.
 * No redimensionável a calha mora no conteúdo (`pl-2` no `SidebarInset`): o
 * painel de conteúdo rola, e o gatilho puxado até a borda perderia a sombra e o
 * anel.
 */
const SIDEBAR_TRIGGER_GAP =
  "md:group-has-[[data-slot=sidebar][data-variant=floating][data-state=expanded]]/sidebar-wrapper:-ml-4"

/**
 * A mola da viagem do gatilho: um pouco mais longa que a do realce, porque o
 * caminho é maior (do cabeçalho da tela até dentro da barra).
 */
const MOLA_DO_GATILHO = { type: "spring", duration: 0.45, bounce: 0.15 } as const

/**
 * O botão vive em dois lugares com o mesmo `layoutId`: no topo da tela (o
 * `SidebarTrigger`) e, recolhida em ícone no `floating`, dentro da barra. Quando
 * um desmonta e o outro monta no mesmo commit, o `motion` o leva de um ao outro na mola.
 */
function SidebarTriggerButton({
  naBarra = false,
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { naBarra?: boolean }) {
  const { toggleSidebar, state, isMobile, openMobile, gatilhoId } = useSidebar()
  const espia = React.useContext(SidebarPeekContext)
  const reduzido = useReducedMotion()
  // O rótulo diz o que o clique vai fazer. O ícone é um só nos dois estados.
  const aberta = isMobile ? openMobile : state === "expanded"
  const rotulo = aberta ? "Recolher barra lateral" : "Abrir barra lateral"

  const botao = (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      type="button"
      variant="tertiary"
      // O degrau padrão: ele mora no `TopBar`, onde todo botão é `md` —
      // e é a caixa de 32 dos itens da barra recolhida.
      size="icon-md"
      aria-label={rotulo}
      className={cn(!naBarra && SIDEBAR_TRIGGER_FLOATING, className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <SidebarToggleIcon />
    </Button>
  )

  // No topo o gatilho não tem dica (o nome acessível é o `aria-label`). Dentro da barra
  // recolhida ela fica, como a de todo ícone do trilho, e mostra o atalho (⌘B / Ctrl+B).
  return (
    <motion.span
      layoutId={gatilhoId}
      transition={reduzido ? { duration: 0 } : MOLA_DO_GATILHO}
      className={naBarra && espia ? "flex w-full" : "inline-flex"}
    >
      {naBarra && espia ? (
        // Numa barra que espia, o gatilho é uma linha da barra (ícone, "Manter aberta" e
        // o atalho): ela está aberta por cima e vai fechar quando o cursor sair, e a
        // linha diz como fixá-la. Sem dica, a mesma regra dos itens.
        <SidebarMenuButton
          data-sidebar="trigger"
          data-slot="sidebar-trigger"
          onClick={(event) => {
            onClick?.(event as React.MouseEvent<HTMLButtonElement>)
            toggleSidebar()
          }}
        >
          <SidebarToggleIcon />
          <span>Manter aberta</span>
          <Kbd
            aria-hidden
            keys={`mod+${SIDEBAR_KEYBOARD_SHORTCUT}`}
            className="ml-auto pointer-coarse:hidden"
          />
        </SidebarMenuButton>
      ) : naBarra ? (
        <Tooltip>
          <TooltipTrigger asChild>{botao}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={SIDEBAR_TOOLTIP_OFFSET}
            shortcut={`mod+${SIDEBAR_KEYBOARD_SHORTCUT}`}
          >
            {rotulo}
          </TooltipContent>
        </Tooltip>
      ) : (
        botao
      )}
    </motion.span>
  )
}

/**
 * O gatilho do topo da tela. Quando vai para a barra, a vaga dele encolhe (32px
 * a zero, com a margem de quem o encosta na borda) em vez de sumir, e o título
 * ao lado desliza no mesmo passo.
 */
/**
 * O botão de recolher das versões que moram na barra (`edge` e `footerBar`): não
 * viaja — fica no mesmo lugar da barra nos dois estados. A dica abre ao lado,
 * com o atalho, aberta ou recolhida.
 */
function SidebarToggleSimple({
  variant = "tertiary",
  size = "icon-md",
  className,
  children,
  tooltip = true,
}: {
  variant?: "tertiary" | "floating"
  size?: "icon-md" | "icon-xs" | "sm"
  className?: string
  children?: React.ReactNode
  /** Sem a dica, o nome fica só no `aria-label`. */
  tooltip?: boolean
}) {
  const { toggleSidebar, state } = useSidebar()
  const rotulo = state === "expanded" ? "Recolher barra lateral" : "Abrir barra lateral"
  const botao = (
    <Button
      type="button"
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant={variant}
      size={size}
      aria-label={rotulo}
      className={className}
      onClick={toggleSidebar}
    >
      {children ?? <SidebarToggleIcon />}
    </Button>
  )
  if (!tooltip) return botao
  return (
    <Tooltip>
      <TooltipTrigger asChild>{botao}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={SIDEBAR_TOOLTIP_OFFSET}
        shortcut={`mod+${SIDEBAR_KEYBOARD_SHORTCUT}`}
      >
        {rotulo}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * A alça da versão `edge`: um círculo de 24 (`Button floating`, a pílula que
 * paira) centrado na borda direita da placa, na altura da mídia do cabeçalho
 * (40 do topo do trilho, aberta e recolhida). A seta aponta para onde a barra
 * vai: para dentro aberta, gira meia volta recolhida, na curva da placa.
 */
function SidebarEdgeToggle() {
  return (
    <SidebarToggleSimple
      variant="floating"
      size="icon-xs"
      className="absolute top-7 -right-1 z-10"
      // A seta já diz o que faz, e a dica cobria o conteúdo ao lado da barra.
      tooltip={false}
    >
      <ChevronLeftIcon className="transition-transform duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:rotate-180" />
    </SidebarToggleSimple>
  )
}

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { gatilhoNaBarra, toggle, isMobile } = useSidebar()
  // Nas versões em que o botão mora na barra, o topo fica sem ele no desktop.
  if (toggle !== "topbar" && !isMobile) return null
  return (
    <span
      data-slot="sidebar-trigger-slot"
      data-vazio={gatilhoNaBarra ? "" : undefined}
      className={cn(
        "inline-flex w-8 shrink-0 transition-[width,margin] duration-(--duration-slow) ease-(--ease-emphasized) data-vazio:w-0",
        className,
        SIDEBAR_TRIGGER_GAP,
        // Depois do `className`: a margem que encostava o botão na borda
        // (`-ml-2` no app e no catálogo) sai junto com ele.
        gatilhoNaBarra && "ms-0 ml-0"
      )}
    >
      {gatilhoNaBarra ? null : <SidebarTriggerButton {...props} />}
    </span>
  )
}

/**
 * A borda clicável que alterna a barra. Diz que alterna, e só isso: sem
 * `cursor-w-resize` nem fio de arraste (o cursor do sistema promete arrastar).
 * Quem redimensiona é o átomo `Resizable`, sob `SidebarProvider resizable`, e ali
 * este trilho não renderiza (a costura do átomo ocupa o lugar dele).
 */
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar, resizable } = useSidebar()

  if (resizable) return null

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Alternar a navegação"
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        // Sem fio e sem faixa: um fio que acende na borda é a gramática de uma costura
        // de arraste, e aqui não há arraste. A borda alterna no clique, sem desenhar
        // nada; o cursor de mão é a única pista.
        "absolute inset-y-0 -right-4 z-10 hidden w-4 cursor-pointer sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:-right-2",
        "[[data-variant=floating]:not([data-collapsible=offcanvas])_&]:-right-2 [[data-variant=floating]_&]:inset-y-2 [[data-variant=inset]_&]:inset-y-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * O fio da tira de topo do conteúdo, publicado como variável. Em
 * `variant="sidebar"` o cabeçalho encosta no `border-r` da barra; no `floating`
 * esse `border-r` não existe e o fio ficaria pendurado. As tiras de superfície
 * não têm fio (quem marca o limite é o respiro). Só o redimensionável zera o
 * fio: no outro a barra corre por trás da placa (`SIDEBAR_INSET_BEHIND`).
 * É variável, e não seletor de grupo: `in-*` e `group-*` compilam com `:where()`
 * e perdem para a classe base. Nasce no `SidebarInset`.
 * Quem pergunta pela variante é o invólucro, e não o irmão: no modo
 * redimensionável barra e conteúdo moram em painéis diferentes do grupo (não são
 * irmãos), então `group-has-[…]/sidebar-wrapper` pergunta ao invólucro do
 * `SidebarProvider` se há uma barra `floating` dentro dele, nos dois modos.
 */
const SIDEBAR_INSET_RULE =
  "[--sidebar-inset-rule:1px] md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[--sidebar-inset-rule:0px]"

/**
 * Ao lado do `floating`, a barra do topo não pinta: a placa flutua sobre a
 * página e uma faixa de fundo no topo leria como um segundo chrome. Só o repouso;
 * a barra `glass`, e a `scroll` depois de rolar, mantêm o vidro (que corre por
 * baixo da placa até a borda da janela). O próprio
 * conteúdo também não pinta ao lado do `floating`: no redimensionável cobriria a
 * sombra da placa.
 */
const SIDEBAR_INSET_BAR =
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[&_[data-slot=top-bar]:not([data-surface=glass]):not([data-scrolled=true])]:bg-transparent md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:bg-transparent"

/**
 * Ao lado do `floating` (não redimensionável), a barra do topo passa por trás da
 * placa: recua pela folga (`--sidebar-gap`) e a devolve como `padding`, então o
 * conteúdo dela fica onde está e a superfície vai à borda esquerda da janela. A
 * duração e a curva já são as da folga no próprio `TopBar`; aqui só entram
 * `margin` e `padding` na lista de propriedades.
 * `isolate` porque a placa (`--z-sticky`) tem de ficar acima da barra, que vem
 * depois no DOM com a mesma camada; dentro do `main` a barra segue acima do
 * conteúdo da página. O fio volta (`--sidebar-inset-rule` fica em 1px): ele corre
 * por baixo da placa até a borda, e não fica pendurado. Sem `vw` na largura (a
 * barra é `w-auto`): nas prévias do catálogo `vw` é a janela, e não a caixa.
 * No redimensionável o painel recorta, e a barra não passa por trás.
 */
const SIDEBAR_INSET_BEHIND = [
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:isolate",
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[&>[data-slot=top-bar]]:-ms-(--sidebar-gap) md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[&>[data-slot=top-bar]]:w-auto",
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[&>[data-slot=top-bar]]:ps-[calc(var(--sidebar-gap)+--spacing(4))]",
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[&>[data-slot=top-bar]]:transition-[background-color,border-color,translate,margin,padding]",
].join(" ")

/**
 * O toque no painel do telefone: as linhas de 28 e 32 sobem a 40 e 44 (o alvo do
 * dedo), o campo a 40, e a ação e a contagem da linha se centram em qualquer
 * altura. Só o painel do telefone veste isto.
 */
const SIDEBAR_MOBILE_TOQUE = [
  "[&_[data-slot=sidebar-menu-button][data-size=md]]:h-11 [&_[data-slot=sidebar-menu-button][data-size=sm]]:h-10",
  "[&_[data-slot=sidebar-menu-sub-button]]:h-10 [&_[data-slot=sidebar-input]]:h-10",
  "[&_[data-slot=sidebar-menu-action]]:top-1/2! [&_[data-slot=sidebar-menu-action]]:-translate-y-1/2",
  "[&_[data-slot=sidebar-menu-badge]]:top-1/2! [&_[data-slot=sidebar-menu-badge]]:-translate-y-1/2",
  "[&_[data-slot=sidebar-menu]]:gap-0.5",
].join(" ")

/**
 * O gatilho flutua com a barra: no `floating` é uma pílula da mesma placa
 * (`--sidebar` chapado, anel e sombra). Mora no `SidebarInset`, fora da barra,
 * então quem decide é o `:has` do invólucro.
 * O fundo pinta sob a borda (`bg-clip-border`): o `Button` traz borda
 * transparente de 1px com o fundo no `padding-box`, e sobrava 1px da página
 * entre o preenchimento e o anel.
 */
const SIDEBAR_TRIGGER_FLOATING =
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:rounded-full md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:bg-clip-border md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:bg-sidebar md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:shadow-lg md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:ring-1 md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:ring-foreground/10"

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  const { resizable } = useSidebar()

  // No modo redimensionável o conteúdo é o outro painel do grupo: quem divide a
  // largura com a barra tem de estar no mesmo motor, senão o arraste move um lado só.
  if (resizable) {
    return (
      // O painel é uma `div` e não aceita trocar de elemento (a lib não tem `asChild`):
      // o `<main>` mora dentro dele, o landmark fica e o filho direto do grupo segue sendo o painel.
      <ResizablePanel minSize={320}>
        <main
          data-slot="sidebar-inset"
          className={cn(
            "relative flex size-full min-w-0 flex-col bg-background",
            // A calha do `floating` aberto, do lado do conteúdo (ver `SIDEBAR_TRIGGER_GAP`).
            "md:group-has-[[data-slot=sidebar][data-variant=floating][data-state=expanded]]/sidebar-wrapper:pl-2",
            // O `inset` também aqui: a placa do conteúdo, com a calha de 8px
            // em cima, embaixo e do lado de fora (a costura fica do outro).
            "md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:my-2 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:mr-2 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:h-[calc(100%-1rem)] md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:w-[calc(100%-0.5rem)] md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:rounded-modal md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ring-1 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ring-foreground/10",
            SIDEBAR_INSET_RULE,
            SIDEBAR_INSET_BAR,
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
        // O lado que encosta na barra perde o respiro e o recupera quando ela recolhe.
        // O conteúdo é a placa do `inset`, na língua das outras placas soltas (raio
        // `--radius-modal` e anel, sem sombra); a margem anima.
        "relative flex min-w-0 w-full flex-1 flex-col bg-background transition-[margin] duration-(--duration-slow) ease-(--ease-emphasized) md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:m-2 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:rounded-modal md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ring-1 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ring-foreground/10",
        "md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ml-0 md:group-has-[[data-slot=sidebar][data-variant=inset][data-state=collapsed]]/sidebar-wrapper:ml-2",
        SIDEBAR_INSET_BEHIND,
        SIDEBAR_INSET_BAR,
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

function SidebarHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { gatilhoNaBarra, setGatilhoMovel } = useSidebar()
  const movel = React.useContext(SidebarGatilhoMovelContext)
  // O cabeçalho registra que existe: sem ele o gatilho não teria para onde ir.
  React.useLayoutEffect(() => {
    setGatilhoMovel(movel)
    return () => setGatilhoMovel(false)
  }, [movel, setGatilhoMovel])

  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      // Sem `sticky`: as faixas são irmãs do rolável, não descendentes, e não há
      // ancestral rolante contra o qual grudar; quem marca o limite é a dissolução.
      // Recolhida, a faixa desce a 48 (o botão `lg` com o recuo). Com o gatilho dentro
      // ela cresce até o conteúdo e anima até ele: `interpolate-size` deixa a altura
      // transicionar para `auto` (no Chrome; onde falta, salta). Começa do topo, para o
      // avatar não descer enquanto a altura cresce.
      className={cn(
        "flex h-16 shrink-0 flex-col justify-center gap-2 px-2 group-data-[collapsible=icon]:px-4 group-data-[collapsible=icon]:pt-4 transition-[height,padding] duration-(--duration-slow) ease-(--ease-emphasized) [interpolate-size:allow-keywords] group-data-[collapsible=icon]:h-12",
        gatilhoNaBarra &&
          "h-auto justify-start py-2 group-data-[collapsible=icon]:h-auto",
        className
      )}
      {...props}
    >
      {children}
      {gatilhoNaBarra ? <SidebarTriggerButton naBarra /> : null}
    </div>
  )
}

function SidebarFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { toggle, isMobile, state, toggleSidebar } = useSidebar()
  const noRodape = toggle === "footer" && !isMobile
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-2 p-2 group-data-[collapsible=icon]:px-4 group-data-[collapsible=icon]:pb-4",
        className
      )}
      {...props}
    >
      {noRodape ? (
        // `footer`: a linha da régua dos itens, acima da conta. Recolhida, o
        // rótulo some com os outros e a dica diz o que o ícone faz.
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              data-sidebar="trigger"
              onClick={toggleSidebar}
              tooltip={{
                children: state === "expanded" ? "Recolher barra lateral" : "Abrir barra lateral",
                shortcut: `mod+${SIDEBAR_KEYBOARD_SHORTCUT}`,
              }}
            >
              <SidebarToggleIcon />
              <span>Recolher</span>
              <Kbd
                aria-hidden
                keys={`mod+${SIDEBAR_KEYBOARD_SHORTCUT}`}
                className="ml-auto pointer-coarse:hidden"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : null}
      {children}
      {toggle === "footerBar" && !isMobile ? (
        // `footerBar`: a faixa no pé, a largura toda da coluna e só a seta, que
        // aponta para onde a barra vai (a da `edge`).
        <SidebarToggleSimple variant="tertiary" size="sm" className="w-full">
          <ChevronLeftIcon className="transition-transform duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:rotate-180" />
        </SidebarToggleSimple>
      ) : null}
    </div>
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

/** O item ativo da lista: um botão ou subitem com `data-active="true"`. */
const ATIVO_DA_LISTA =
  '[data-sidebar=menu-button][data-active=true], [data-sidebar=menu-sub-button][data-active=true]'

/**
 * A caixa do ativo na régua do `SidebarContent`: pela diferença dos retângulos,
 * porque cada linha mora num `li` posicionado (o `offsetTop` seria do `li`), mais
 * a rolagem, para a pílula rolar com a lista.
 */
function caixaNaLista(ativa: HTMLElement, trilha: HTMLElement) {
  const t = trilha.getBoundingClientRect()
  const a = ativa.getBoundingClientRect()
  return {
    left: a.left - t.left + trilha.scrollLeft,
    top: a.top - t.top + trilha.scrollTop,
    width: a.width,
    height: a.height,
  }
}

function SidebarContent({ className, children, ...props }: React.ComponentProps<"div">) {
  // **A pílula do ativo é uma só e anda no compositor.** Era um `layoutId` do
  // motion dentro de cada botão: a viagem roda em JavaScript, quadro a quadro, e
  // logo depois do clique a página nova ocupa a linha principal — a pílula
  // travava e saltava (o dono viu; medido, ~200ms sem quadro). Agora é o
  // `useMarcador` do `Tabs` e da `BottomBar`: WAAPI em `translate` e `scale`, que
  // seguem andando com a página ocupada, na viagem líquida da casa.
  const trilha = React.useRef<HTMLDivElement>(null)
  const marcador = React.useRef<HTMLSpanElement>(null)
  const medido = useMarcador({
    trilha,
    marcador,
    ativo: (t) => t.querySelector<HTMLElement>(ATIVO_DA_LISTA),
    atributos: ["data-active"],
    prefixo: "sidebar-ativo",
    insete: 0,
    eixo: "y",
    viajar: true,
    medida: caixaNaLista,
  })
  return (
    <div
      ref={composeRefs(useScrollFade(), trilha)}
      data-slot="sidebar-content"
      data-sidebar="content"
      data-marcador={medido ? "" : undefined}
      className={cn(
        // `relative isolate`: a pílula mora aqui, atrás de todas as linhas.
        "group/conteudo relative isolate",
        // Recolhida, ela rola: com muitos itens o modo ícone cortaria os últimos sem
        // caminho até eles. A máscara continua desligada ali.
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-x-hidden",
        // Modo sem faixa: cabeçalho e rodapé têm altura variável, e medi-los exigiria um
        // segundo observador escrevendo a altura do JS. A dissolução acontece na borda
        // do próprio rolável. Aqui o ganho é maior: com `no-scrollbar`, a lista rolaria
        // sem nenhum indicador.
        scrollFadeViewportClassName,
        // A guarda do modo ícone: numa coluna de 48 a dissolução apagaria metade do
        // primeiro e do último ícone, que não têm rótulo para dizer o que são.
        "group-data-[collapsible=icon]:[--scroll-fade-mask:none]",
        className
      )}
      {...props}
    >
      <span
        ref={marcador}
        aria-hidden
        data-slot="sidebar-menu-marker"
        className={cn(
          "pointer-events-none absolute top-0 left-0 -z-10 h-(--sidebar-ativo-h) w-(--sidebar-ativo-w) rounded-row bg-sidebar-accent [translate:var(--sidebar-ativo-x)_var(--sidebar-ativo-y)]",
          !medido && "hidden"
        )}
      />
      {children}
    </div>
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col justify-start p-2 group-data-[collapsible=icon]:px-4",
        // No `plain` o grupo se separa do anterior por um fio: com 80 linhas rolando, um
        // vão de 16px lê como item faltando.
        "group-data-[variant=plain]:not-first:border-t group-data-[variant=plain]:border-sidebar-border group-data-[variant=plain]:px-0 group-data-[variant=plain]:pt-2 group-data-[variant=plain]:pb-4",
        // Sem fio na `action`: esta faixa é o primeiro filho do `SidebarContent`, que é
        // o viewport com a dissolução, e um fio ali seria o segundo sinal para a mesma
        // emenda. O que separa o botão de ação da navegação é o `p-2` daqui mais o
        // respiro do grupo seguinte.
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
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-3 [&>svg]:size-4 [&>svg]:shrink-0",
        // No `plain` o rótulo é a sobrancelha da camada: caixa alta de 11px,
        // na tinta do texto, com o ícone de 12px apagado.
        "group-data-[variant=plain]:gap-1.5 group-data-[variant=plain]:text-2xs group-data-[variant=plain]:font-semibold group-data-[variant=plain]:tracking-wide group-data-[variant=plain]:text-sidebar-foreground group-data-[variant=plain]:uppercase group-data-[variant=plain]:[&>svg]:size-3 group-data-[variant=plain]:[&>svg]:text-muted-foreground",
        // A régua dos rótulos: ao abrir, o texto espera a largura assentar (a margem
        // não espera: é o espaço do rótulo); ao recolher, sai na hora.
        "[transition-delay:0ms,120ms] group-data-[collapsible=icon]:[transition-delay:0ms]",
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
      type={asChild ? undefined : "button"}
      data-sidebar="group-action"
      className={cn(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-full p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground focus-visible:ring-3 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
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
 * A pílula do item ativo: um objeto só, que viaja de um item ao outro (`layoutId`
 * do `motion`, a mecânica do `Menubar`), inclusive de um item ao subitem. Vale
 * nas três variantes e nasce no HTML do servidor. Marca o ativo, e não o cursor:
 * o realce que corre entre as linhas sob o ponteiro é proibido; o hover esmaece.
 */
/**
 * A pílula parada de cada linha ativa: o que marca o ativo antes da primeira
 * medida (no HTML do servidor, sem JavaScript) e fora da lista (a carteira e a
 * conta no cabeçalho e no rodapé). Dentro de uma lista já medida quem marca é a
 * pílula que viaja do `SidebarContent`, e esta some.
 */
function SidebarRealce() {
  return (
    <span
      aria-hidden
      data-slot="sidebar-menu-highlight"
      className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-sidebar-accent group-data-[marcador]/conteudo:invisible"
    />
  )
}

/**
 * Põe a pílula dentro do que o botão desenha, como último filho (o primeiro é o
 * ícone, que a régua dos rótulos não esmaece). Com `asChild` o `Slot` aceita um
 * filho só, e a pílula entra nele.
 */
function comRealce(children: React.ReactNode, asChild: boolean, ativo: boolean) {
  if (!ativo) return children
  if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return React.cloneElement(
      children,
      undefined,
      <>
        {children.props.children}
        <SidebarRealce />
      </>
    )
  }
  return (
    <>
      {children}
      <SidebarRealce />
    </>
  )
}

/**
 * A lista de itens: `gap` de 4px. O realce é a caixa inteira da linha (32px,
 * canto arredondado) e a 8px as linhas leriam como cartões soltos; 4 basta para
 * dois realces vizinhos não se tocarem. A hierarquia vem do grupo (16, o `p-2`
 * de cada lado) e do submenu (recuo e fio à esquerda), não do respiro.
 */
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      // `isolate`: a pílula do ativo (`-z-10`) mora atrás de todas as linhas da
      // lista, e não de uma só — é aqui que ela viaja de um item ao outro.
      className={cn("relative isolate flex w-full min-w-0 flex-col gap-1", className)}
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
 * Por que isto não é `Button`: vestir `Button variant="tertiary"` aqui exigiria
 * sete contra-classes para desfazê-lo (`justify-start`, `font-normal`,
 * `border-0`, `focus-visible:ring-sidebar-ring`, `dark:hover:bg-sidebar-accent`,
 * os `aria-expanded:*` e o `translate-y`). Este `cva` é a régua de baixo deste
 * chrome: tem paleta própria (`sidebar-accent`, `sidebar-ring`), geometria
 * própria no modo ícone, e `SidebarMenuAction`/`SidebarMenuBadge` leem o
 * `data-size` dele por `peer-data-[size=…]`. `SidebarTrigger`, que é ação na
 * superfície do app, **é** `Button`; `SidebarMenuAction` e `SidebarGroupAction`
 * têm 20px (o menor `Button` é 24); `SidebarRail` é uma alça com `tabIndex={-1}`.
 * Recolhida, quem centra o ícone é o recuo, por degrau: `(32 − filho) / 2`. No
 * degrau padrão o filho é o ícone de 16 e `p-2!` dá os 8; no `lg` é um avatar de
 * 24 e o recuo é 4. `justify-center` não conserta: o rótulo continua no fluxo em
 * modo ícone (o `overflow-hidden` o esconde, não `display`), a linha transborda
 * a caixa e centrar uma linha que transborda puxa o conteúdo para fora nos dois lados.
 */
const sidebarMenuButtonVariants = cva(
  [
    // O cursor e o toque pintam a metade da pílula (`/50`), e a linha ativa não
    // soma nada por cima: com o mesmo tom, o destino já estava cheio quando a
    // pílula chegava e a viagem lia como uma segunda pílula. A cor e o peso do
    // rótulo andam junto dela (`color`, `font-weight` na transição).
    // A linha é retângulo arredondado (`rounded-row`, 12px) e não pílula: o
    // concêntrico dava 20–22px numa linha de 32 e o CSS a desenhava cápsula. O
    // subitem veste o mesmo.
    "peer/menu-button group/menu-button relative flex w-full items-center gap-2 rounded-row p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding,background-color,color,font-weight] duration-(--duration-slow) ease-(--ease-emphasized) group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-3 active:bg-sidebar-accent/50 active:text-sidebar-accent-foreground data-active:hover:bg-transparent data-active:active:bg-transparent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate [&>span:nth-last-child(2):has(+[data-slot=sidebar-menu-highlight])]:truncate",
    // O `plain`: a linha apagada até o cursor e acesa na página atual (80 linhas na
    // tinta cheia virariam um bloco de texto), com 44px no dedo.
    "group-data-[variant=plain]:text-muted-foreground group-data-[variant=plain]:hover:text-sidebar-accent-foreground group-data-[variant=plain]:active:text-sidebar-accent-foreground group-data-[variant=plain]:data-active:text-sidebar-accent-foreground group-data-[variant=plain]:pointer-coarse:min-h-11",
    // Os rótulos ao recolher e abrir: tudo depois do primeiro filho (o ícone ou o
    // avatar, que fica) é rótulo. Ao recolher some em 100ms, antes de a largura
    // fechar; ao abrir, espera a largura e sobe 3px.
    "[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:transition-[opacity,translate] [&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:duration-160 [&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:delay-120 [&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:ease-(--ease-out)",
    "group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:translate-y-[3px] group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:opacity-0 group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:delay-0 group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:duration-100",
  ],
  {
    variants: {
      variant: {
        // Vazio de propósito: a base já declara o realce, e repeti-lo em `plain` não decidiria nada.
        plain: "",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)] active:bg-sidebar-accent active:text-sidebar-accent-foreground active:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        md: "h-8 text-sm",
        sm: "h-7 text-xs",
        // Na placa flutuante, a carteira e a conta moram nos cantos: o raio segue a
        // curva dela (28 − 8 = 20). Recolhida, a caixa é 40 — um realce de 4px em
        // volta da mídia de 32 (o de 8 lia como moldura larga): `size-10` com
        // `-m-1` cabe no recuo de 16 sem mexer a mídia, e com a caixa a 12 da borda
        // o raio concêntrico é 16.
        lg: "h-12 text-sm group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:-m-1 group-data-[collapsible=icon]:p-1! group-data-[variant=floating]:concentric group-data-[collapsible=icon]:[--radius-inset:--spacing(3)]",
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
  children,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot.Root : "button"
  const { isMobile, state, espiando } = useSidebar()
  const espia = React.useContext(SidebarPeekContext)

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      type={asChild ? undefined : "button"}
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    >
      {comRealce(children, asChild, isActive)}
    </Comp>
  )

  // A dica só existe quando o rótulo não está na tela: recolhida, e no desktop.
  // No telefone a barra é um painel com os nomes por extenso.
  // Ela não é montada e escondida: `hidden` esconde pixel, e o Radix seguiria
  // abrindo a dica e ligando o `aria-describedby` do botão a ela (leitor de tela
  // ouviria o mesmo texto do rótulo em cada item). Numa barra que espia a dica
  // não monta nem antes, porque a espiada traz o rótulo logo depois.
  if (!tooltip || state !== "collapsed" || isMobile || espiando || espia) {
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
        sideOffset={SIDEBAR_TOOLTIP_OFFSET}
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
      type={asChild ? undefined : "button"}
      data-sidebar="menu-action"
      className={cn(
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-full p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=md]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground focus-visible:ring-3 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        showOnHover &&
        "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:pointer-fine:opacity-0",
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
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=md]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  media = "tile",
  size = "md",
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
  /**
   * A forma da mídia que o osso guarda no `lg`: `tile` é a marca da carteira,
   * `avatar` é o círculo do `Avatar` da conta — o osso tem a forma da peça.
   */
  media?: "tile" | "avatar"
  /**
   * `lg` é a espera do botão `lg` (seletor de workspace e conta): avatar de 32 e
   * duas linhas, e recolhido só o avatar, sem recuo, na caixa de 32.
   */
  size?: "md" | "lg"
}) {
  // A largura varia de 50 a 90% para a pilha não ler como tabela, mas sai do
  // `useId` e não de `Math.random()`: o random roda no servidor e no cliente com
  // valores diferentes (erros de hidratação), e o `useId` é estável entre os dois.
  const id = React.useId()
  let semente = 0
  for (let i = 0; i < id.length; i++) semente = (semente * 31 + id.charCodeAt(i)) | 0
  const width = `${50 + (Math.abs(semente) % 41)}%`

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      data-size={size}
      className={cn(
        "flex items-center gap-2 overflow-hidden rounded-md",
        size === "lg"
          ? "h-12 p-2 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:-m-1 group-data-[collapsible=icon]:p-1"
          : "h-8 px-2",
        className
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton
          {...(size === "lg" && media === "avatar"
            ? { shape: "circle" as const, size: "sm" as const }
            : { className: size === "lg" ? "size-8 shrink-0 rounded-lg" : "size-4 rounded-md" })}
          data-sidebar="menu-skeleton-icon"
        />
      )}
      {size === "lg" ? (
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Skeleton className="h-4 w-24 max-w-full" />
          <Skeleton className="h-3 w-36 max-w-full" />
        </div>
      ) : (
        <Skeleton
          className="h-4 max-w-(--skeleton-width) flex-1"
          data-sidebar="menu-skeleton-text"
          style={
            {
              "--skeleton-width": width,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "relative isolate mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
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
  children,
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
        "relative flex h-7 min-w-0 -translate-x-px items-center gap-2 rounded-row px-2.5 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-[background-color,color,font-weight] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-3 active:bg-sidebar-accent/50 active:text-sidebar-accent-foreground data-active:hover:bg-transparent data-active:active:bg-transparent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>span:nth-last-child(2):has(+[data-slot=sidebar-menu-highlight])]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {comRealce(children, asChild, isActive)}
    </Comp>
  )
}

export type { SidebarTogglePlacement }

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
