"use client"

import * as React from "react"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "motion/react"
import { Slot } from "radix-ui"

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
const SIDEBAR_WIDTH_ICON = "3rem"
/** A largura do painel no telefone. Ali a barra não é trilho nem tela cheia. */
const SIDEBAR_WIDTH_MOBILE = "18rem"
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
 * e `size: md | sm | lg` como se fossem os eixos da **barra** — e `variant`
 * e `collapsible` não apareciam em lugar nenhum. É o mesmo defeito
 * que o `Item` registrou com `itemGroupVariants`, e a correção é a mesma:
 * este vem primeiro.
 */
const sidebarVariants = cva("", {
  variants: {
    /**
     * A superfície. `floating` e `inset` têm a **mesma** geometria — o que
     * muda é quem desenha o cartão: o miolo da barra numa, o `SidebarInset` na
     * outra. Sem um `SidebarInset` na árvore, `inset` não tem efeito visível.
     */
    //
    // No modo redimensionável (o único que lê este `cva`) o `floating` não
    // tem recuo à direita: a placa encosta na costura, e a costura **é** a
    // aresta dela. Com o recuo, a costura ficava a 8px da placa e o gatilho do
    // topo, para ficar a 8px dela, encostava na borda do painel de conteúdo —
    // que rola (`overflow: auto`) e cortava a sombra dele (o dono viu).
    variant: { sidebar: "", floating: "py-2 pl-2", inset: "p-2" },
    /** Para onde ela vai ao recolher. */
    collapsible: { offcanvas: "", icon: "", none: "" },
  },
  // `floating` é o padrão desde a rodada 221, como no `Menubar` e no
  // `NavigationMenu`: o objeto solto é a forma desta casa.
  //
  // **Não há `side`** (rodada 221, decisão do dono): a navegação mora sempre à
  // esquerda. O eixo existia e custava a ordem visual invertida, as margens
  // espelhadas do `inset`, o trilho e o painel do telefone dos dois lados.
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
  // Depende da função, que é estável, e não do objeto do hook, que é novo a
  // cada render: com o objeto, o atalho era religado e o contexto recriado sempre.
  const togglePainel = painel.toggle
  const toggleSidebar = React.useCallback(() => {
    if (isMobile) return setOpenMobile((open) => !open)
    if (resizable) return togglePainel()
    return setOpen((open) => !open)
  }, [isMobile, resizable, togglePainel, setOpen, setOpenMobile])

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
      // Abrir ou recolher de verdade encerra a espiada.
      espiando: espiando && state === "collapsed",
      setEspiando,
      gatilhoNaBarra: gatilhoMovel && state === "collapsed" && !isMobile,
      setGatilhoMovel,
      gatilhoId,
    }),
    [
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
      className
    ),
    ...props,
  }

  if (resizable) {
    return (
      <SidebarContext.Provider value={contextValue}>
        {/* `stack={false}`: o átomo empilha grupos horizontais no telefone, e
            aqui isso é errado — abaixo de `md` a navegação é uma gaveta, e
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

/**
 * O id da barra, que prefixa o `layoutId` da pílula do ativo — duas barras na
 * mesma página não trocam pílula.
 *
 * **Não é `LayoutGroup id`**, e foi medido: o grupo prefixa todo `layoutId` de
 * dentro dele, e o gatilho, que viaja do topo da tela (fora da barra) para o
 * cabeçalho (dentro dela), virava dois ids — saía do topo sem animar.
 */
const SidebarRealceContext = React.createContext("sidebar")

/**
 * Se o gatilho pode morar na barra: `floating` com `collapsible="icon"`, no
 * desktop. Quem lê é o `SidebarHeader`, que é onde ele mora.
 */
const SidebarGatilhoMovelContext = React.createContext(false)

/**
 * Se a barra espia (`peek` com `collapsible="icon"`). Aí as dicas de dentro
 * dela **não montam**: o cursor parado abre a barra com os rótulos em 300ms, e
 * a dica, mais rápida, aparecia antes e repetia o rótulo que vinha chegando.
 */
const SidebarPeekContext = React.createContext(false)

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
   * `plain` (rodada 233) é a barra **sem superfície** da navegação do
   * catálogo: sem placa, sem fio, no fluxo da página — quem a prende é quem a
   * dispõe —, com os grupos divididos por um fio, o rótulo em caixa alta e as
   * linhas apagadas até o cursor. Ela vale com `collapsible="none"`; recolher
   * uma barra que não tem placa não diz nada, e fora dele ela cai na `sidebar`.
   */
  variant?: "sidebar" | "floating" | "inset" | "plain"
  collapsible?: "offcanvas" | "icon" | "none"
  /**
   * Recolhida em ícone, o cursor parado 300ms sobre ela a abre **por cima** do
   * conteúdo, sem empurrar a página; ela recolhe 200ms depois de o cursor sair.
   * Só com mouse — no toque não há "passar por cima".
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
  } = useSidebar()
  const realceId = React.useId()

  const relogio = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(relogio.current), [])
  const podeEspiar = peek && collapsible === "icon" && state === "collapsed"
  const agendar = (valor: boolean, ms: number) => {
    clearTimeout(relogio.current)
    relogio.current = setTimeout(() => setEspiando(valor), ms)
  }
  const gestoDeEspiar = podeEspiar
    ? {
        onPointerEnter: (e: React.PointerEvent) => {
          if (e.pointerType === "mouse") agendar(true, 300)
        },
        onPointerLeave: () => agendar(false, 200),
      }
    : {}

  if (collapsible === "none") {
    return (
        <SidebarRealceContext.Provider value={realceId}>
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
        </SidebarRealceContext.Provider>
    )
  }

  // Fora do `none` o `plain` não tem o que desenhar — sem placa não há o que
  // recolher nem o que abrir —, e a barra cai na rente.
  const variant = variante === "plain" ? "sidebar" : variante

  if (isMobile) {
    return (
      // `surface="panel"`: **navegação entra pelo lado em qualquer largura.**
      // É o único lugar do app que fixa a superfície — toda outra folha segue
      // a regra `auto` e vira gaveta no telefone.
      //
      // A rodada 64 tinha decidido o contrário, e a 66 desfez para este
      // consumidor. O que não voltou é o `EdgePanel`: o comportamento dele é
      // uma prop, e a moldura continua sendo uma só.
      //
      // Entra pela esquerda, onde a barra mora. E **`fillMobileViewport` não
      // vai**: ele é a altura da gaveta, e no painel a altura sai do par
      // `top`/`bottom` do `cva`.
      //
      // **`p-0` continua fora**, e a razão é a da rodada 64: a base do casco não
      // declara recuo, então ele era no-op no painel — e no dia em que esta
      // barra voltar a ser gaveta, o `twMerge` o faria derrubar a área segura.
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
          // **Sem `[&>button]:hidden`.** A classe vinha do shadcn, de quando o
          // `SheetContent` injetava o próprio ×; desde a rodada 60 ele não
          // injeta, e ela só escondia o nosso — medido, `display: none`. Na
          // gaveta passava (fecha-se arrastando); num painel não há arraste, e
          // o × é a única afordância visível de fechar.
          className={cn("w-(--sidebar-width) bg-sidebar text-sidebar-foreground", SIDEBAR_MOBILE_TOQUE)}
          style={
            { "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties
          }
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
          {/* O × mora numa linha própria, acima do espaço de trabalho: no canto,
              ele se sobrepunha à linha de cima da barra. No `floating` é a
              mesma pílula do gatilho do desktop (`SIDEBAR_TRIGGER_FLOATING`) —
              `--sidebar` sob a borda e o anel, sem sombra, porque já está
              dentro da placa. 32px à vista e 44 de alvo, pelo `::after`. */}
          <div data-slot="sidebar-close-row" className="flex shrink-0 justify-end px-2 pt-2">
            <DialogCloseButton
              placement="inline"
              size="icon-md"
              className={cn(
                "relative me-0 after:absolute after:-inset-1.5",
                variant === "floating" && "rounded-full bg-sidebar bg-clip-border ring-1 ring-foreground/10"
              )}
            />
          </div>
            <SidebarRealceContext.Provider value={realceId}>
              <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
            </SidebarRealceContext.Provider>
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
        // ── A placa flutuante (rodada 221) ─────────────────────────────────
        // **Chapada, sem vidro**: a barra reserva a própria calha, então um
        // borrão não teria o que borrar atrás (medido na rodada 36), e o aro e
        // as nuvens pintados eram a última peça da casa que ainda vestia a
        // lâmina. Hoje ela é a placa solta dos outros flutuantes — a pílula do
        // `Menubar`, as peças do `CommandDialog`: o `--sidebar` chapado, o anel
        // de 1px delas e a sombra. Uma peça só, a pedido do dono.
        //
        // O raio é `--radius-modal` (o papel modal, rodada 240); a elevação é `lg`
        // pelo motivo da rodada 36: placa e página estão a 1,04 uma da outra
        // no tema claro, e uma sombra de 6% não define nada ali.
        "group-data-[variant=floating]:rounded-modal group-data-[variant=floating]:[--radius-parent:var(--radius-modal)] group-data-[variant=floating]:[--radius-inset:--spacing(2)] group-data-[variant=floating]:shadow-lg group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-foreground/10"
      )}
    >
      {children}
    </div>
  )

  const solta = variant === "floating" || variant === "inset"

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
        // O modo ícone soma a calha: 48 da placa, mais 8 à esquerda no
        // `floating` (a direita é a costura) e 8 dos dois lados no `inset`.
        // Com 48 a placa ficava com 32 e cortava os ícones (rodada 221).
        collapsedSize={
          collapsible === "icon"
            ? variant === "floating"
              ? 56
              : variant === "inset"
                ? 64
                : 48
            : 0
        }
        defaultSize={256}
        minSize={SIDEBAR_WIDTH_MIN}
        maxSize={SIDEBAR_WIDTH_MAX}
        // A lib escreve `overflow: auto` inline no nó de dentro do painel, e
        // ele recortava o anel e a sombra da placa na aresta da costura — a
        // placa saía chapada daquele lado. A barra não rola por ali (quem rola
        // é o `SidebarContent`), então o painel deixa pintar por fora.
        className="overflow-visible!"
      >
        {/* A lib põe o `className` do painel num `div` interno e os atributos no
            de fora: `group` e `data-collapsible` ficavam em nós diferentes, e os
            `group-data-[collapsible=icon]:` do miolo não casavam com nada. Os
            dois moram neste nó. */}
        <div
          data-slot="sidebar"
          data-state={state}
          data-collapsible={state === "collapsed" ? collapsible : ""}
          data-variant={variant}
          dir={dir}
          className={cn(
            // Fora da tela no offcanvas: o painel vai a zero, mas o recuo de
            // 8px e o anel transbordariam como um fio solto.
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
        <SidebarRealceContext.Provider value={realceId}>
        <SidebarGatilhoMovelContext.Provider
          value={variant === "floating" && collapsible === "icon"}
        >
          {barra}
          {/* Nas soltas a costura é **da placa** (rodada 221): sem fio em
              repouso, rente à aresta e da altura dela — e não pendurada no
              meio do vão, nem do topo ao chão da janela. */}
          <ResizableHandle
            aria-label="Redimensionar a navegação"
            variant={solta ? "plain" : "line"}
            className={SIDEBAR_COSTURA[variant]}
          />
        </SidebarGatilhoMovelContext.Provider>
        </SidebarRealceContext.Provider>
    )
  }

  return (
      <SidebarRealceContext.Provider value={realceId}>
      <SidebarGatilhoMovelContext.Provider
        value={variant === "floating" && collapsible === "icon"}
      >
      <SidebarPeekContext.Provider value={peek && collapsible === "icon"}>
        <div
          className="group peer hidden text-sidebar-foreground md:block"
          data-state={state}
          // Espiando, a barra se desenha **aberta** (`data-collapsible` vazio)
          // e o `data-state` continua `collapsed` — é ele que o `SidebarInset`
          // lê, e a página não pode andar.
          data-collapsible={state === "collapsed" && !espiando ? collapsible : ""}
          data-peek={espiando ? "" : undefined}
          data-variant={variant}
          data-slot="sidebar"
        >
          {/* A folga que reserva, no fluxo, o lugar do trilho `fixed`. Ela fica
              na curva enfatizada: ela **reflui a página**, e um quique aqui
              sacudiria o conteúdo inteiro. Espiando, ela não se mexe. */}
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
                ? // **A placa anda na mola** (rodada 221): o trilho `fixed`
                  // não reflui nada, então o quique de 3,8% da mola da casa
                  // fica na placa e não chega à página. Sem o `+2px` de
                  // antes: era a borda do vidro, e o anel não ocupa espaço.
                  "p-2 transition-[left,width] duration-(--duration-spring) ease-(--ease-spring) group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                : // A rente encosta no conteúdo: um quique passaria o fio por
                  // cima dele. Fica na curva da folga.
                  "transition-[left,width] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:w-(--sidebar-width-icon) border-r",
              className
            )}
            {...gestoDeEspiar}
            {...props}
          >
            {miolo}
          </div>
        </div>
      </SidebarPeekContext.Provider>
      </SidebarGatilhoMovelContext.Provider>
      </SidebarRealceContext.Provider>
  )
}

/**
 * A costura do modo redimensionável (rodada 221), uma regra para as três: o
 * acento é a **borda da barra acendendo**, e não uma peça à parte — a cor do
 * anel mais forte (`foreground/30` ao pousar e no foco, `/50` ao arrastar), no
 * lugar do acento da marca, com a ponta arredondada.
 *
 * Nas soltas ela tem a **altura da placa** que encosta nela (`my-2`) e só
 * acende no trecho reto da aresta, depois da curva do canto (8 + 10 = o raio
 * 18): no `floating` é a aresta direita da barra, no `inset` a esquerda do
 * conteúdo. Na rente ela é o fio entre as duas, de cima a baixo.
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
 * O gatilho do topo, ao lado de uma barra `floating` aberta, fica a **8px** da
 * placa — a calha dela — e não a 16: lado a lado, as duas peças soltas leem como
 * um conjunto, à distância que separa a placa da borda da janela. Recolhida em
 * offcanvas a placa sai da tela, e ele volta ao recuo de quem o chama.
 *
 * **No redimensionável a calha mora no conteúdo** (`pl-2` no `SidebarInset`):
 * a placa encosta na costura, e o painel de conteúdo rola (`overflow: auto`)
 * — puxado até a borda dele, o gatilho perdia a sombra e o anel. Com a calha
 * por dentro, o gatilho para a 8px da placa e a 8px da borda do painel, e a
 * página tem as mesmas medidas do trilho `fixed`.
 */
const SIDEBAR_TRIGGER_GAP =
  "md:group-has-[[data-slot=sidebar][data-variant=floating][data-state=expanded]]/sidebar-wrapper:-ml-4"

/**
 * A mola da viagem do gatilho: um pouco mais longa que a do realce, porque o
 * caminho é maior — do cabeçalho da tela até dentro da barra.
 */
const MOLA_DO_GATILHO = { type: "spring", duration: 0.45, bounce: 0.15 } as const

/**
 * O botão em si. Ele vive em **dois lugares** com o mesmo `layoutId`: no
 * topo da tela (o `SidebarTrigger`) e, recolhida em ícone no `floating`,
 * dentro da barra, sob o cabeçalho (rodada 221). Quando um desmonta e o outro
 * monta no mesmo commit, o `motion` o leva de um ponto ao outro na mola.
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
  // O rótulo diz o que o clique vai fazer: recolher quando a barra está aberta,
  // abrir quando está fechada. No telefone quem conta é o painel. O ícone é um
  // só nos dois estados — o desenho próprio da barra lateral.
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

  // A dica existe pelo atalho (rodada 185): ⌘B / Ctrl+B recolhe a barra desde
  // sempre, e nada na tela dizia isso. No telefone não há cursor e ela não abre.
  return (
    <motion.span
      layoutId={gatilhoId}
      transition={reduzido ? { duration: 0 } : MOLA_DO_GATILHO}
      className={naBarra && espia ? "flex w-full" : "inline-flex"}
    >
      {naBarra && espia ? (
        // **Numa barra que espia, o gatilho é uma linha da barra** (rodada
        // 221): ícone, "Manter aberta" e o atalho, na régua dos itens — o
        // rótulo some e volta com eles, e recolhida ela é o ícone de 32. É o
        // que a espiada pede: a barra está aberta **por cima** e vai fechar
        // quando o cursor sair; a linha diz como fixá-la. Sem dica, a mesma
        // regra dos itens.
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
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{botao}</TooltipTrigger>
          <TooltipContent
            side={naBarra ? "right" : undefined}
            shortcut={`mod+${SIDEBAR_KEYBOARD_SHORTCUT}`}
          >
            {rotulo}
          </TooltipContent>
        </Tooltip>
      )}
    </motion.span>
  )
}

/**
 * O gatilho do topo da tela. Quando ele vai para a barra, **a vaga dele
 * encolhe** em vez de sumir — 32px a zero, com a margem de quem o encosta na
 * borda —, e o título ao lado desliza no mesmo passo, em vez de saltar.
 */
function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { gatilhoNaBarra } = useSidebar()
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
        // **Sem fio e sem faixa** (rodada 221, a pedido do dono). Um fio que
        // acende na borda é a gramática de uma costura de arraste, e aqui não
        // há arraste — quem redimensiona é o modo `resizable`, que nem monta
        // este trilho. A borda continua alternando a barra no clique, sem
        // desenhar nada: o cursor de mão é a única pista.
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
 * `--dialog-bleed` e `--toolbar-control`. E ela nasce no `SidebarInset`.
 *
 * **Quem pergunta pela variante é o invólucro, e não o irmão.** Era o
 * seletor de irmão (`peer-data-*`), e no modo redimensionável barra e conteúdo
 * moram em painéis diferentes do grupo — não são irmãos, e o fio, o fundo da
 * barra do topo e a pílula do gatilho ficavam como na rente (o dono viu na
 * tela, rodada 221). `group-has-[…]/sidebar-wrapper` pergunta ao invólucro do
 * `SidebarProvider` se há uma barra `floating` dentro dele, nos dois modos.
 */
const SIDEBAR_INSET_RULE =
  "[--sidebar-inset-rule:1px] md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[--sidebar-inset-rule:0px]"

/**
 * E, ao lado do `floating`, a barra do topo **não pinta** (rodada 221): a
 * placa flutua sobre a página, e uma faixa de fundo atravessando o topo do
 * conteúdo lia como um segundo chrome encostado nela. Só o repouso — a barra
 * `glass`, e a `scroll` depois de rolar, mantêm o vidro, porque aí há conteúdo
 * passando por baixo.
 *
 * O próprio conteúdo também não pinta ao lado do `floating`: o fundo dele é o
 * da página, e no redimensionável ele cobria a sombra da placa, que passa da
 * costura para dentro dele.
 */
const SIDEBAR_INSET_BAR =
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[&_[data-slot=top-bar]:not([data-surface=glass]):not([data-scrolled=true])]:bg-transparent md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:bg-transparent"

/**
 * O toque no painel do telefone (rodada 233): as linhas que no desktop medem
 * 28 e 32 sobem a 40 e 44 — o alvo do dedo —, o campo a 40, e a ação e a
 * contagem da linha se centram em qualquer altura (os `top-*` fixos eram
 * contas da linha de 32). Só o painel do telefone veste isto; o desktop não
 * muda.
 */
const SIDEBAR_MOBILE_TOQUE = [
  "[&_[data-slot=sidebar-menu-button][data-size=md]]:h-11 [&_[data-slot=sidebar-menu-button][data-size=sm]]:h-10",
  "[&_[data-slot=sidebar-menu-sub-button]]:h-10 [&_[data-slot=sidebar-input]]:h-10",
  "[&_[data-slot=sidebar-menu-action]]:top-1/2! [&_[data-slot=sidebar-menu-action]]:-translate-y-1/2",
  "[&_[data-slot=sidebar-menu-badge]]:top-1/2! [&_[data-slot=sidebar-menu-badge]]:-translate-y-1/2",
  "[&_[data-slot=sidebar-menu]]:gap-0.5",
].join(" ")

/**
 * O gatilho flutua com a barra: no `floating` ele é uma pílula da mesma
 * placa — o `--sidebar` chapado, o anel e a sombra —, e não um ícone solto no
 * cabeçalho. Ele mora no `SidebarInset`, fora da barra, então quem decide é
 * o `:has` do invólucro, sem contexto.
 *
 * **O fundo pinta sob a borda (`bg-clip-border`).** O `Button` traz uma borda
 * transparente de 1px com o fundo recortado no `padding-box`, e entre o
 * preenchimento e o anel sobrava 1px da página: a aresta da pílula lia mais
 * apagada que a da barra, com o mesmo anel nas duas.
 */
const SIDEBAR_TRIGGER_FLOATING =
  "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:rounded-full md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:bg-clip-border md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:bg-sidebar md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:shadow-lg md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:ring-1 md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:ring-foreground/10"

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
      <ResizablePanel minSize={320}>
        <main
          data-slot="sidebar-inset"
          className={cn(
            "relative flex size-full min-w-0 flex-col bg-background",
            // A calha do `floating` aberto, do lado do conteúdo — ver
            // `SIDEBAR_TRIGGER_GAP`.
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
        // O lado que encosta na barra perde o respiro, e o recupera quando
        // ela recolhe.
        //
        // Desde a rodada 221 o conteúdo é a **placa** do `inset`, na língua das
        // outras placas soltas: o raio `--radius-modal` e o anel, sem a `shadow-sm` que não
        // separava nada sobre o `--sidebar`. E a margem anima — ela saltava
        // 8px no fim do recolher.
        "relative flex min-w-0 w-full flex-1 flex-col bg-background transition-[margin] duration-(--duration-slow) ease-(--ease-emphasized) md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:m-2 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:rounded-modal md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ring-1 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ring-foreground/10",
        "md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ml-0 md:group-has-[[data-slot=sidebar][data-variant=inset][data-state=collapsed]]/sidebar-wrapper:ml-2",
        SIDEBAR_INSET_RULE,
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
  // O cabeçalho registra que existe: sem ele o gatilho não teria para onde ir,
  // e ficaria no topo da tela.
  useIsomorphicLayoutEffect(() => {
    setGatilhoMovel(movel)
    return () => setGatilhoMovel(false)
  }, [movel, setGatilhoMovel])

  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      // Sem `sticky top-0 z-10 bg-sidebar`: as faixas são **irmãs** do
      // rolável, não descendentes dele, então não havia ancestral rolante
      // contra o qual grudar — o `sticky` era inerte, e o `z-10` mais o
      // `bg-sidebar` existiam para esconder um conteúdo que nunca passou por
      // baixo. Quem marca o limite agora é a dissolução do conteúdo.
      // Recolhida, a faixa desce a 48 — a altura do botão `lg` com o recuo, que
      // o seletor de workspace do app escrevia à mão.
      //
      // Com o gatilho dentro (rodada 221), a faixa cresce até o conteúdo — e
      // **anima** até ele: `interpolate-size` deixa a altura transicionar para
      // `auto` (no Chrome; onde falta, ela salta). Começa do topo, para o
      // avatar não descer enquanto a altura cresce.
      className={cn(
        "flex h-16 shrink-0 flex-col justify-center gap-2 px-2 transition-[height,padding] duration-(--duration-slow) ease-(--ease-emphasized) [interpolate-size:allow-keywords] group-data-[collapsible=icon]:h-12",
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
        // Recolhida, ela **rola** (rodada 221): com muitos itens o modo ícone
        // cortava os últimos sem caminho até eles, e o app escrevia
        // `overflow-y-auto` à mão. A máscara continua desligada ali.
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-x-hidden",
        // Modo **sem faixa**: o cabeçalho e o rodapé têm altura variável, e
        // medi-los exigiria um segundo observador escrevendo a altura do JS,
        // com flash na primeira pintura. Aqui a dissolução acontece na borda do
        // próprio rolável, e as duas faixas ficam onde estão.
        //
        // O ganho é maior aqui do que em qualquer outra superfície: com
        // `no-scrollbar`, esta lista rolava sem **nenhum** indicador.
        scrollFadeViewportClassName,
        // A guarda do modo ícone: numa coluna de 48 a dissolução apagaria
        // metade do primeiro e do último ícone, e o ícone não tem rótulo que
        // sobre para dizer o que é.
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
        // No `plain` o grupo se separa do anterior por um fio: com 80 linhas
        // rolando, um vão de 16px lê como item faltando, e não como fronteira.
        "group-data-[variant=plain]:not-first:border-t group-data-[variant=plain]:border-sidebar-border group-data-[variant=plain]:px-0 group-data-[variant=plain]:pt-2 group-data-[variant=plain]:pb-4",
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
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-3 [&>svg]:size-4 [&>svg]:shrink-0",
        // No `plain` o rótulo é a sobrancelha da camada: caixa alta de 11px,
        // na tinta do texto, com o ícone de 12px apagado.
        "group-data-[variant=plain]:gap-1.5 group-data-[variant=plain]:text-2xs group-data-[variant=plain]:font-semibold group-data-[variant=plain]:tracking-wide group-data-[variant=plain]:text-sidebar-foreground group-data-[variant=plain]:uppercase group-data-[variant=plain]:[&>svg]:size-3 group-data-[variant=plain]:[&>svg]:text-muted-foreground",
        // A régua dos rótulos (rodada 221): ao abrir, o texto espera a largura
        // assentar (a margem não espera — ela é o espaço do rótulo); ao
        // recolher, sai na hora.
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
 * A mola do realce — a do `Menubar` e do `NavigationMenu`, da referência de
 * movimento do dono: 0,28s, 20% de quique.
 */
const MOLA_DO_REALCE = { type: "spring", duration: 0.28, bounce: 0.2 } as const

/**
 * A pílula do item ativo: **um objeto só**, que viaja de um item ao outro.
 *
 * É o `layoutId` do `motion` (rodada 221), a mecânica do `Menubar`: quem está
 * ativo desenha a pílula, e como o id é o mesmo, o `motion` a anima do lugar
 * antigo ao novo — inclusive de um item ao subitem. Antes ela era medida à mão
 * (`offsetParent`, `ResizeObserver`, `MutationObserver`) e só existia no
 * `floating`; agora vale nas três variantes, e nasce no HTML do servidor.
 *
 * Ela marca **o ativo**, e não o cursor: o realce que corre entre as linhas
 * sob o ponteiro foi recusado (rodada 137) e continua fora — o hover esmaece.
 */
function SidebarRealce() {
  const id = React.useContext(SidebarRealceContext)
  const reduzido = useReducedMotion()
  return (
    <motion.span
      layoutId={`${id}-ativo`}
      aria-hidden
      data-slot="sidebar-menu-highlight"
      transition={reduzido ? { duration: 0 } : MOLA_DO_REALCE}
      className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-sidebar-accent"
    />
  )
}

/**
 * Põe a pílula **dentro** do que o botão desenha, como **último** filho — o
 * primeiro é o ícone, que a régua dos rótulos não esmaece. Com `asChild` o
 * `Slot` aceita um filho só, e a pílula entra nele.
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
      className={cn("relative flex w-full min-w-0 flex-col gap-1", className)}
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
  [
    // A linha é retângulo arredondado (`rounded-row`, 12px, o degrau da
    // linha), e não pílula (rodadas 241c e 241d, a pedido do dono): o
    // concêntrico dava 20–22px numa linha de 32, e o CSS a desenhava cápsula.
    // O subitem veste o mesmo.
    "peer/menu-button group/menu-button relative isolate flex w-full items-center gap-2 overflow-hidden rounded-row p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding,background-color] duration-(--duration-slow) ease-(--ease-emphasized) group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate [&>span:nth-last-child(2):has(+[data-slot=sidebar-menu-highlight])]:truncate",
    // ── O `plain` (rodada 233) ──────────────────────────────────────────────
    // A linha apagada até o cursor e acesa na página atual — a lista do
    // catálogo, onde 80 linhas na tinta cheia viravam um bloco de texto. E
    // 44px no dedo: a régua de /designsystem/touch-safe-area.
    "group-data-[variant=plain]:text-muted-foreground group-data-[variant=plain]:hover:text-sidebar-accent-foreground group-data-[variant=plain]:active:text-sidebar-accent-foreground group-data-[variant=plain]:data-active:text-sidebar-accent-foreground group-data-[variant=plain]:pointer-coarse:min-h-11",
    // ── Os rótulos ao recolher e abrir (rodada 221) ─────────────────────────
    // Tudo depois do primeiro filho — o ícone ou o avatar, que fica — é
    // rótulo. Ao recolher ele some em 100ms, antes de a largura fechar, em vez
    // de ser cortado no meio; ao abrir, ele espera a largura e sobe 3px.
    "[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:transition-[opacity,translate] [&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:duration-160 [&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:delay-120 [&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:ease-(--ease-out)",
    "group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:translate-y-[3px] group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:opacity-0 group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:delay-0 group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:duration-100",
  ],
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
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    >
      {comRealce(children, asChild, isActive)}
    </Comp>
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
  // Espiando, o rótulo está na tela de novo — e numa barra que espia a dica
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
  size = "md",
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
  /**
   * `lg` é a espera do botão `lg` — o seletor de workspace e a conta: avatar
   * de 32 e duas linhas, e recolhido só o avatar, sem recuo, na caixa de 32
   * (rodada 221; o perfil da conta escrevia isso à mão).
   */
  size?: "md" | "lg"
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
      data-size={size}
      className={cn(
        "flex items-center gap-2 overflow-hidden rounded-md",
        size === "lg"
          ? "h-12 p-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
          : "h-8 px-2",
        className
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className={size === "lg" ? "size-8 shrink-0 rounded-lg" : "size-4 rounded-md"}
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
        "relative isolate flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-row px-2.5 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-[background-color] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>span:nth-last-child(2):has(+[data-slot=sidebar-menu-highlight])]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {comRealce(children, asChild, isActive)}
    </Comp>
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
