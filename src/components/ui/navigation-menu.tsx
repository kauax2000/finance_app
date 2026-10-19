"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/16/solid"
import { Bars3Icon } from "@heroicons/react/20/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { NavigationMenu as NavigationMenuPrimitive, Slot } from "radix-ui"
import { composeRefs } from "radix-ui/internal"

import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { menuPanelTintClassName } from "@/lib/glass-classes"
import {
  menuItemFadeClassName,
  menuItemGeometryClassName,
  menuLabelClassName,
  menuPanelSurfaceClassName,
} from "@/lib/menu-classes"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { useCloseOnScroll } from "@/hooks/use-close-on-scroll"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerCancel,
  DrawerContent,
  DrawerTrigger,
  drawerActionClassName,
} from "@/components/ui/drawer"
import { Kbd } from "@/components/ui/kbd"

/**
 * A fileira de navegação com painéis suspensos, para superfície **pública**
 * (landing, preços, institucional). A navegação do app é a `Sidebar` e a ilha
 * do telefone; nenhuma tela do app usa este componente.
 * O realce é um objeto só que viaja entre os gatilhos (`indicator="highlight"`)
 * e descansa no link da página atual; ele mora só na fileira, como no
 * `Menubar` (o realce entre os links do painel é proibido).
 * `NavigationMenuGroup` aprofunda no lugar, com a trilha em cima para voltar.
 * O índice, como no `Menubar`: o Radix só monta o painel aberto, e o ponto da
 * rota atual e o "abre na rota atual" precisam dele fechado.
 * Estado aberto é `aria-expanded:`, e não `data-open:`: este compila com
 * `:where()` (especificidade zero) e perde para `hover:`.
 * O teto mora no painel, não no viewport: o Radix mede o `offsetHeight` do
 * conteúdo, então capar o conteúdo já dá a altura certa ao viewport.
 */

type NavigationMenuVariant = "floating" | "plain" | "outline" | "solid"
type NavigationMenuSize = "sm" | "md" | "lg"
type NavigationMenuIndicator = "highlight" | "underline" | "none"
type NavigationMenuAlign = "trigger" | "start" | "center" | "end"
type NavigationMenuOrientation = "horizontal" | "vertical"

/** Um link registrado no índice. */
type Entrada = { id: string; item: string; nivel: string[]; ativo: boolean }

type NavigationMenuContextValue = {
  size: NavigationMenuSize
  variant: NavigationMenuVariant
  indicator: NavigationMenuIndicator
  align: NavigationMenuAlign
  orientation: NavigationMenuOrientation
  viewport: boolean
  /** Se `--navigation-menu-anchor-c*` já foi escrita. Antes disso o painel centra na fileira. */
  anchored: boolean
  barId: string
  /** O item aceso: o aberto, o do cursor, o do foco ou o da página atual. */
  realce: string | null
  aberto: string
  setHover: (item: string | null) => void
  setFoco: (item: string | null) => void
  setAtual: (item: string | null) => void
  abrir: (item: string) => void
  /** A diagonal segura: se o cursor está a caminho do painel aberto. */
  aCaminho: (x: number, y: number) => boolean
  entradas: Entrada[]
  registrar: (e: Entrada) => () => void
}

const NavigationMenuContext = React.createContext<NavigationMenuContextValue>({
  size: "md",
  variant: "floating",
  indicator: "highlight",
  align: "center",
  orientation: "horizontal",
  viewport: true,
  anchored: false,
  barId: "",
  realce: null,
  aberto: "",
  setHover: () => {},
  setFoco: () => {},
  setAtual: () => {},
  abrir: () => {},
  aCaminho: () => false,
  entradas: [],
  registrar: () => () => {},
})

/** O item em volta: o `value` dele, para gatilho, link do topo e índice. */
const ItemContext = React.createContext("")
/** Dentro do índice os links se registram e não pintam. */
const IndiceContext = React.createContext(false)
/** Na folha do telefone as peças se desenham como linhas da gaveta. */
const FolhaContext = React.createContext<{ fechar: () => void } | null>(null)
/** O nível do aprofundamento em que a peça mora: os grupos acima dela. */
const NivelContext = React.createContext<string[]>([])
/** A prévia ao lado: o que o link sob o cursor mostra. */
const PreviewContext = React.createContext<{
  atual: React.ReactNode
  setAtual: (p: React.ReactNode) => void
} | null>(null)

/** Se este link está dentro de um `NavigationMenuPanel` (um `<ul>`, que quer o `<li>`). */
const NavigationMenuPanelContext = React.createContext(false)

/** O aprofundamento do painel: o caminho aberto e quem anda nele. */
const DrillContext = React.createContext<{
  caminho: string[]
  entrar: (nivel: string[]) => void
  rotulos: Record<string, React.ReactNode>
  registrarRotulo: (id: string, rotulo: React.ReactNode) => void
} | null>(null)

/** O nível está à vista quando o caminho aberto é exatamente ele. */
function useVisivel() {
  const drill = React.useContext(DrillContext)
  const nivel = React.useContext(NivelContext)
  if (!drill) return true
  return (
    drill.caminho.length === nivel.length &&
    drill.caminho.every((id, i) => id === nivel[i])
  )
}

/**
 * Nota de ordem: `npm run ds:catalog` lê o **primeiro** bloco `variants:` de
 * cada fonte, por isso o do gatilho vem antes do da fileira.
 * O gatilho fala a escada do sistema (28 · 32 · 36); `pointer-coarse:h-11`
 * pergunta pelo apontador, não pela largura.
 */
const navigationMenuTriggerVariants = cva(
  [
    "group/navigation-menu-trigger relative isolate flex shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap outline-hidden select-none",
    "transition-[color,scale] duration-(--duration-fast) ease-(--ease-out) active:scale-[0.985]",
    "focus-visible:ring-3 focus-visible:ring-ring/45",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        floating:
          "rounded-full px-3 hover:bg-sidebar-accent/50 active:bg-sidebar-accent aria-expanded:bg-sidebar-accent aria-expanded:text-foreground",
        plain:
          "hover:bg-sidebar-accent/50 active:bg-sidebar-accent aria-expanded:bg-sidebar-accent aria-expanded:text-foreground",
        outline:
          "hover:bg-sidebar-accent/50 active:bg-sidebar-accent aria-expanded:bg-sidebar-accent aria-expanded:text-foreground",
        solid:
          "border border-transparent hover:bg-background/60 active:bg-background/60 aria-expanded:border-border/80 aria-expanded:bg-background aria-expanded:text-foreground aria-expanded:shadow-xs",
      },
      /** O piso é 28: `xs` (24) é para dentro de outro controle, não para uma fileira. */
      size: {
        sm: "h-7 pointer-coarse:h-11",
        md: "h-8 pointer-coarse:h-11",
        lg: "h-9 pointer-coarse:h-11",
      },
    },
    defaultVariants: { variant: "floating", size: "md" },
  }
)

/**
 * Com o realce que viaja o gatilho não pinta fundo: o `tailwind-merge` derruba
 * o `hover:bg-*` e o `aria-expanded:bg-*` da variante.
 */
const SEM_FUNDO_PROPRIO =
  "text-muted-foreground hover:bg-transparent active:bg-transparent aria-expanded:bg-transparent aria-expanded:border-transparent aria-expanded:shadow-none data-[aceso]:text-foreground"

/**
 * A fileira. `floating` (padrão) é a pílula do `Menubar` na tinta flutuante;
 * `plain`, `outline` e `solid` são escolha explícita. Não declara altura: quem
 * mede é o gatilho.
 */
const navigationMenuListVariants = cva(
  [
    "flex list-none items-center gap-0.5 rounded-full p-0.5",
    "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:rounded-surface",
  ],
  {
    variants: {
      variant: {
        floating: `rounded-full p-1 shadow-lg ring-1 ring-foreground/10 data-[orientation=vertical]:rounded-surface ${menuPanelTintClassName}`,
        plain: "border border-transparent bg-transparent",
        outline: "border border-border bg-background",
        solid: "border border-transparent bg-muted",
      },
    },
    defaultVariants: { variant: "floating" },
  }
)

/** O realce que viaja, por superfície: na bandeja `solid` ele sobe em vez de tingir. */
const realceClassName: Record<NavigationMenuVariant, string> = {
  floating: "bg-muted",
  plain: "bg-muted",
  outline: "bg-muted",
  solid: "bg-background shadow-xs ring-1 ring-border/80",
}

/** A mola do realce, da referência: 0,28s com 20% de quique. */
const MOLA_DO_REALCE = { type: "spring", duration: 0.28, bounce: 0.2 } as const

/**
 * O marcador `underline`: um traço de acento que o `Indicator` do Radix leva
 * até o gatilho aberto. A transição é o componente inteiro.
 */
const navigationMenuIndicatorVariants = cva(
  [
    "pointer-events-none",
    "transition-[transform,width,height] duration-(--duration-base) ease-(--ease-out)",
    "data-[state=visible]:animate-in data-[state=visible]:fade-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out",
  ],
  {
    variants: {
      indicator: {
        none: "hidden",
        highlight: "hidden",
        underline: [
          "rounded-full bg-primary-accent",
          "data-[orientation=horizontal]:top-full data-[orientation=horizontal]:h-0.5",
          "data-[orientation=vertical]:left-full data-[orientation=vertical]:w-0.5",
        ].join(" "),
      },
    },
    defaultVariants: { indicator: "highlight" },
  }
)

/**
 * O conteúdo. Com viewport é só a lâmina que desliza; sem viewport ele **é** a
 * superfície. A troca entre painéis é um crossfade com drift de 16px no eixo da
 * `orientation`.
 */
const navigationMenuContentVariants = cva(
  [
    "w-full",
    "data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out",
    "animation-duration-(--duration-base) ease-(--ease-out)",
  ],
  {
    variants: {
      viewport: {
        true: "top-0 left-0 md:absolute md:w-auto",
        false: [
          "absolute top-full z-10 mt-2 overflow-hidden md:w-auto",
          menuPanelSurfaceClassName,
          "origin-top menu-sprout",
        ].join(" "),
      },
      orientation: {
        horizontal:
          "data-[motion=from-end]:slide-in-from-right-4 data-[motion=from-start]:slide-in-from-left-4 data-[motion=to-end]:slide-out-to-right-4 data-[motion=to-start]:slide-out-to-left-4",
        vertical:
          "data-[motion=from-end]:slide-in-from-bottom-4 data-[motion=from-start]:slide-in-from-top-4 data-[motion=to-end]:slide-out-to-bottom-4 data-[motion=to-start]:slide-out-to-top-4",
      },
      align: { trigger: "", start: "", center: "", end: "" },
    },
    compoundVariants: [
      {
        viewport: false,
        align: "trigger",
        class: "left-[var(--navigation-menu-anchor-cx,50%)] -translate-x-1/2",
      },
      { viewport: false, align: "start", class: "left-0" },
      { viewport: false, align: "center", class: "left-1/2 -translate-x-1/2" },
      { viewport: false, align: "end", class: "right-0" },
    ],
    defaultVariants: { viewport: true, orientation: "horizontal", align: "trigger" },
  }
)

/**
 * O painel: a grade, o recuo, o teto e a rolagem. A largura é variável porque
 * as três contagens de coluna precisam concordar com ela.
 */
const navigationMenuPanelVariants = cva(
  [
    "grid w-(--navigation-menu-panel-w) max-w-(--navigation-menu-panel-max-w) gap-0.5 p-2",
    "max-h-(--navigation-menu-panel-max-h) overflow-y-auto overscroll-contain",
    "[--navigation-menu-panel-max-h:min(60dvh,32rem)]",
    // Os links sobem em cascata ao abrir e ao aprofundar.
    "navigation-menu-reveal",
  ],
  {
    variants: {
      columns: {
        // A largura de uma coluna sai do conteúdo: 224 com linhas, 288 com cartões.
        1: "[--navigation-menu-panel-w:--spacing(56)] has-[[data-variant=card]]:[--navigation-menu-panel-w:--spacing(72)]",
        2: "[--navigation-menu-panel-w:--spacing(150)] sm:grid-cols-2",
        3: "[--navigation-menu-panel-w:--spacing(216)] sm:grid-cols-2 lg:grid-cols-3",
      },
    },
    defaultVariants: { columns: 1 },
  }
)

const NAVIGATION_MENU_LINK_BASE = [
  "group/navigation-menu-link relative min-w-0 outline-hidden select-none",
  "transition-colors",
  "focus-visible:ring-3 focus-visible:ring-ring/45",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
].join(" ")

/**
 * O link do topo veste a régua do gatilho; a página atual é `aria-[current=page]:`
 * (`data-active:` tem especificidade zero e apagaria ao passar o cursor).
 */
const navigationMenuTopLinkVariants = cva(NAVIGATION_MENU_LINK_BASE, {
  variants: {
    variant: {
      floating: "aria-[current=page]:bg-muted aria-[current=page]:text-foreground",
      plain: "aria-[current=page]:bg-muted aria-[current=page]:text-foreground",
      outline: "aria-[current=page]:bg-muted aria-[current=page]:text-foreground",
      solid:
        "aria-[current=page]:border-border/80 aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-xs",
    },
  },
  defaultVariants: { variant: "floating" },
})

/**
 * O link dentro do painel, em duas formas: `row` é a linha de menu, `card` é
 * ícone, título e uma linha do que aquilo é — com `gap-y-0`, porque título e
 * descrição são par de identidade.
 */
const navigationMenuLinkVariants = cva(
  [
    NAVIGATION_MENU_LINK_BASE,
    "concentric text-sm pointer-coarse:min-h-11",
    menuItemFadeClassName,
    // Tinta, não cor: o realce das linhas de lista sobre vidro.
    "hover:bg-sidebar-accent/50 hover:text-accent-foreground active:bg-sidebar-accent active:text-accent-foreground focus-visible:bg-sidebar-accent/50",
    "aria-[current=page]:bg-foreground/6 aria-[current=page]:font-medium",
  ],
  {
    variants: {
      variant: {
        row: cn(menuItemGeometryClassName, "cursor-pointer"),
        card: [
          "grid grid-cols-1 gap-y-0 p-2.5",
          "has-[>svg]:grid-cols-[auto_minmax(0,1fr)] has-[>svg]:gap-x-2.5",
          "[&>svg]:row-span-2 [&>svg]:mt-0.5 [&>svg:not([class*='size-'])]:size-5 [&>svg]:text-muted-foreground",
          "hover:[&>svg]:text-accent-foreground active:[&>svg]:text-accent-foreground",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "row" },
  }
)

/**
 * O cursor a caminho do painel: dentro do triângulo entre onde ele estava e os
 * dois cantos do painel voltados para a fileira (a "diagonal segura").
 */
export function noTriangulo(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): boolean {
  const s = (p1: typeof p, p2: typeof p, p3: typeof p) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  const d1 = s(p, a, b)
  const d2 = s(p, b, c)
  const d3 = s(p, c, a)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

/**
 * O painel segue o gatilho: com viewport há um painel só e o Radix não o
 * desloca; `align="trigger"` mede o gatilho aberto e publica o centro dele em
 * `--navigation-menu-anchor-cx` / `-cy`. Mecanismo do marcador do `Tabs`
 * (`ResizeObserver` e `MutationObserver`).
 */
function NavigationMenu({
  className,
  children,
  ref,
  variant = "floating",
  size = "md",
  align = "trigger",
  orientation = "horizontal",
  indicator = "highlight",
  viewport = true,
  mobile = "bar",
  mobileLabel = "Menu",
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: Omit<
  React.ComponentProps<typeof NavigationMenuPrimitive.Root>,
  "orientation"
> & {
  variant?: NavigationMenuVariant
  size?: NavigationMenuSize
  align?: NavigationMenuAlign
  orientation?: NavigationMenuOrientation
  indicator?: NavigationMenuIndicator
  viewport?: boolean
  /** No telefone, `sheet` troca a fileira por um botão que abre a folha. */
  mobile?: "bar" | "sheet"
  mobileLabel?: string
}) {
  const barId = React.useId()
  const isMobile = useIsMobile()
  const folha = mobile === "sheet" && isMobile
  const raizRef = React.useRef<HTMLElement | null>(null)
  /**
   * A âncora medida vive no estado do React, não escrita à mão na raiz: se o
   * elemento é recriado (recarga a quente), a variável some e o painel cai na
   * posição estática, meio fora da área.
   */
  const [ancora, setAncora] = React.useState<{
    cx: number
    cy: number
    maxW: number
  } | null>(null)
  const anchored = ancora != null
  // O painel fecha quando a página rola — ver `useCloseOnScroll`.
  const [value, setValue] = useCloseOnScroll({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
    closed: "",
  })
  const segueGatilho = align === "trigger"

  const [hover, setHover] = React.useState<string | null>(null)
  const [foco, setFoco] = React.useState<string | null>(null)
  const [atual, setAtual] = React.useState<string | null>(null)
  const realce = indicator === "highlight" ? value || hover || foco || atual : null

  const [entradas, setEntradas] = React.useState<Entrada[]>([])
  const registrar = React.useCallback((e: Entrada) => {
    setEntradas((lista) => {
      const i = lista.findIndex((x) => x.id === e.id)
      if (i < 0) return [...lista, e]
      const nova = lista.slice()
      nova[i] = e
      return nova
    })
    return () => setEntradas((lista) => lista.filter((x) => x.id !== e.id))
  }, [])

  // A diagonal segura: as duas últimas posições do cursor sobre a fileira.
  const rastroRef = React.useRef<{ x: number; y: number }[]>([])
  React.useEffect(() => {
    if (!value) return
    const mover = (e: PointerEvent) => {
      rastroRef.current = [...rastroRef.current.slice(-3), { x: e.clientX, y: e.clientY }]
    }
    document.addEventListener("pointermove", mover)
    return () => document.removeEventListener("pointermove", mover)
  }, [value])
  const aCaminho = React.useCallback(
    (x: number, y: number) => {
      const painel = raizRef.current?.querySelector(
        '[data-slot="navigation-menu-viewport"], [data-slot="navigation-menu-content"][data-state="open"]'
      )
      const antes = rastroRef.current[0]
      if (!painel || !antes || !value) return false
      const r = painel.getBoundingClientRect()
      const vertical = orientation === "vertical"
      const [b, c] = vertical
        ? [{ x: r.left, y: r.top }, { x: r.left, y: r.bottom }]
        : [{ x: r.left, y: r.top }, { x: r.right, y: r.top }]
      return noTriangulo({ x, y }, antes, b, c)
    },
    [value, orientation]
  )

  React.useLayoutEffect(() => {
    const raiz = raizRef.current
    if (!raiz || !segueGatilho) return

    let ultimoPainel: Element | null = null

    /**
     * O retângulo em que o painel precisa caber. Não é a janela: esta é a única
     * superfície ancorada que não é portalizada, e todo ancestral que recorta a
     * recorta. É o `collisionBoundary` do Radix, à mão.
     */
    const janela = raiz.ownerDocument.defaultView ?? window
    const limite = () => {
      let esquerda = 0
      let direita = janela.innerWidth
      let n: HTMLElement | null = raiz.parentElement
      while (n && n !== raiz.ownerDocument.body) {
        const cs = getComputedStyle(n)
        if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
          const r = n.getBoundingClientRect()
          esquerda = Math.max(esquerda, r.left)
          direita = Math.min(direita, r.right)
        }
        n = n.parentElement
      }
      return { esquerda, direita }
    }

    const medir = () => {
      const aberto = raiz.querySelector<HTMLElement>(
        '[data-slot="navigation-menu-trigger"][data-state="open"]'
      )
      if (!aberto) return
      const g = aberto.getBoundingClientRect()
      const r = raiz.getBoundingClientRect()
      const { esquerda, direita } = limite()
      let cx = g.left - r.left + g.width / 2

      const folga = ANCHORED_COLLISION_PADDING
      const maxW = Math.max(0, direita - esquerda - folga * 2)

      const painel = raiz.querySelector(
        '[data-slot="navigation-menu-viewport"], [data-slot="navigation-menu-content"]'
      )
      if (painel) {
        if (painel !== ultimoPainel) {
          ultimoPainel = painel
          ro.observe(painel)
        }
        const w = painel.getBoundingClientRect().width
        if (w > 0) {
          const min = esquerda + folga - r.left + w / 2
          const max = direita - folga - r.left - w / 2
          if (min <= max) cx = Math.min(Math.max(cx, min), max)
        }
      }

      const cy = g.top - r.top + g.height / 2
      // Só troca o estado quando a medida muda: o observador chama a cada quadro da animação.
      setAncora((a) =>
        a && a.cx === cx && a.cy === cy && a.maxW === maxW ? a : { cx, cy, maxW }
      )
    }

    const ro = new ResizeObserver(medir)
    medir()
    ro.observe(raiz)
    for (const gatilho of raiz.querySelectorAll(
      '[data-slot="navigation-menu-trigger"]'
    )) {
      ro.observe(gatilho)
    }
    const mo = new MutationObserver(medir)
    mo.observe(raiz, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
      childList: true,
    })
    janela.addEventListener("resize", medir)
    return () => {
      ro.disconnect()
      mo.disconnect()
      janela.removeEventListener("resize", medir)
    }
  }, [segueGatilho, orientation, size, variant, folha])

  const ctx = React.useMemo<NavigationMenuContextValue>(
    () => ({
      size,
      variant,
      align,
      orientation,
      viewport,
      anchored: anchored && segueGatilho,
      indicator,
      barId,
      realce,
      aberto: value,
      setHover,
      setFoco,
      setAtual,
      abrir: setValue,
      aCaminho,
      entradas,
      registrar,
    }),
    [size, variant, align, orientation, viewport, indicator, anchored, segueGatilho, barId, realce, value, setValue, aCaminho, entradas, registrar]
  )

  const rootRef = React.useMemo(() => composeRefs(raizRef, ref), [ref])

  if (folha) {
    return (
      <NavigationMenuContext.Provider value={ctx}>
        <NavigationMenuFolha label={mobileLabel}>{children}</NavigationMenuFolha>
      </NavigationMenuContext.Provider>
    )
  }

  return (
    <NavigationMenuContext.Provider value={ctx}>
      <LayoutGroup id={barId}>
        <NavigationMenuPrimitive.Root
          ref={rootRef}
          data-slot="navigation-menu"
          data-variant={variant}
          data-size={size}
          data-align={align}
          data-orientation={orientation}
          data-viewport={viewport}
          orientation={orientation}
          value={value}
          onValueChange={setValue}
          onPointerLeave={() => setHover(null)}
          className={cn(
            // `z-(--z-raised)`: o painel não é portalizado, então a raiz é a camada dele,
            // acima do conteúdo e abaixo do header sticky.
            "relative z-(--z-raised) flex w-fit max-w-full",
            "[--navigation-menu-panel-max-w:100vw]",
            className
          )}
          {...props}
          style={
            {
              ...(ancora
                ? {
                    "--navigation-menu-anchor-cx": `${ancora.cx}px`,
                    "--navigation-menu-anchor-cy": `${ancora.cy}px`,
                    "--navigation-menu-panel-max-w": `${ancora.maxW}px`,
                  }
                : null),
              ...props.style,
            } as React.CSSProperties
          }
        >
          {children}
          {viewport ? <NavigationMenuViewport /> : null}
        </NavigationMenuPrimitive.Root>
      </LayoutGroup>
    </NavigationMenuContext.Provider>
  )
}

function NavigationMenuList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  const { variant, indicator } = React.useContext(NavigationMenuContext)
  const folha = React.useContext(FolhaContext)
  if (folha) return <div className="flex flex-col">{children}</div>

  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(navigationMenuListVariants({ variant }), className)}
      {...props}
    >
      {children}
      {indicator === "underline" ? (
        <NavigationMenuIndicator indicator={indicator} />
      ) : null}
    </NavigationMenuPrimitive.List>
  )
}

/**
 * Não é `relative` (carga estrutural): o `Indicator` do Radix se posiciona por
 * `offsetLeft`, e com `relative` aqui ele valeria 0 para todo gatilho.
 */
function NavigationMenuItem({
  className,
  value: valueProp,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  const auto = React.useId()
  const value = valueProp ?? auto
  const folha = React.useContext(FolhaContext)
  if (folha) {
    return (
      <ItemContext.Provider value={value}>
        <div role="group" data-slot="navigation-menu-sheet-section" className="flex flex-col">
          {props.children}
        </div>
      </ItemContext.Provider>
    )
  }
  return (
    <ItemContext.Provider value={value}>
      <NavigationMenuPrimitive.Item
        data-slot="navigation-menu-item"
        value={value}
        className={cn("min-w-0", className)}
        {...props}
      />
    </ItemContext.Provider>
  )
}

/** O objeto que viaja entre os gatilhos — um só, por `layoutId`. */
function Realce() {
  const { barId, variant } = React.useContext(NavigationMenuContext)
  const reduzido = useReducedMotion()
  return (
    <motion.span
      layoutId={`${barId}-realce`}
      aria-hidden
      data-slot="navigation-menu-highlight"
      transition={reduzido ? { duration: 0 } : MOLA_DO_REALCE}
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
        realceClassName[variant]
      )}
    />
  )
}

/**
 * O gatilho ganha o ponto quando um link do painel é a página atual, e segura
 * a troca de painel quando o cursor só passa a caminho do aberto (diagonal
 * segura): o Radix pula o próprio handler se o nosso chama `preventDefault`.
 */
function NavigationMenuTrigger({
  className,
  children,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  const ctx = React.useContext(NavigationMenuContext)
  const item = React.useContext(ItemContext)
  const folha = React.useContext(FolhaContext)
  const esperaRef = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(esperaRef.current), [])
  if (folha) {
    return (
      <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">
        {children}
      </p>
    )
  }

  const temAtual = ctx.entradas.some((e) => e.item === item && e.ativo)
  const aceso = ctx.realce === item
  const comRealce = ctx.indicator === "highlight"

  const segurar = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return false
    if (ctx.aberto && ctx.aberto !== item && ctx.aCaminho(e.clientX, e.clientY)) {
      e.preventDefault()
      window.clearTimeout(esperaRef.current)
      // Parou aqui: era mesmo este gatilho.
      esperaRef.current = window.setTimeout(() => ctx.abrir(item), 150)
      return true
    }
    return false
  }

  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      data-aceso={aceso ? "" : undefined}
      className={cn(
        navigationMenuTriggerVariants({ variant: ctx.variant, size: ctx.size }),
        comRealce && SEM_FUNDO_PROPRIO,
        className
      )}
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        if (!segurar(e) && ehCursor(e)) ctx.setHover(item)
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e)
        if (!segurar(e) && ehCursor(e)) ctx.setHover(item)
      }}
      onPointerLeave={(e) => {
        window.clearTimeout(esperaRef.current)
        onPointerLeave?.(e)
      }}
      onFocus={(e) => {
        ctx.setFoco(item)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        ctx.setFoco(null)
        onBlur?.(e)
      }}
      {...props}
    >
      {comRealce && aceso ? <Realce /> : null}
      {children}
      {temAtual ? (
        <span
          aria-label="seção da página atual"
          data-slot="navigation-menu-trigger-current"
          className="size-1.5 rounded-full bg-primary-accent"
        />
      ) : null}
      <ChevronDownIcon
        aria-hidden="true"
        className="transition-[rotate] duration-(--duration-base) ease-(--ease-out) group-data-open/navigation-menu-trigger:rotate-180"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

/** O marcador `underline`: não desenha nada dentro de si; o padrão é o realce que viaja. */
function NavigationMenuIndicator({
  className,
  indicator = "underline",
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator> & {
  indicator?: NavigationMenuIndicator
}) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(navigationMenuIndicatorVariants({ indicator }), className)}
      {...props}
    />
  )
}

const VIEWPORT_ANCHOR: Record<
  NavigationMenuOrientation,
  Record<NavigationMenuAlign, string>
> = {
  horizontal: {
    // O `50%` de reserva: sem a medida, o centro da fileira, nunca a posição estática.
    trigger: "top-full left-[var(--navigation-menu-anchor-cx,50%)] -translate-x-1/2",
    start: "top-full left-0",
    center: "top-full left-1/2 -translate-x-1/2",
    end: "top-full right-0",
  },
  vertical: {
    trigger: "left-full top-[var(--navigation-menu-anchor-cy,50%)] -translate-y-1/2",
    start: "top-0 left-full",
    center: "top-1/2 left-full -translate-y-1/2",
    end: "bottom-0 left-full",
  },
}

/**
 * O viewport e o wrapper que o alinha. Na vertical o painel voa para o lado.
 * Entra descendo 6px de 97% na mola; a saída dura 130ms e não se move.
 */
function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  const { align, orientation, anchored } = React.useContext(NavigationMenuContext)
  const vertical = orientation === "vertical"
  const ancora = align === "trigger" && !anchored ? "center" : align

  return (
    <div
      data-slot="navigation-menu-viewport-anchor"
      className={cn(
        "absolute isolate z-10 flex",
        VIEWPORT_ANCHOR[orientation][ancora]
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden",
          vertical
            ? "ms-2 origin-left"
            : "mt-2 origin-top",
          menuPanelSurfaceClassName,
          // O morph: o Radix escreve a caixa do conteúdo ativo nas duas
          // variáveis, e a transição de largura e altura é o trajeto.
          "transition-[width,height] duration-(--duration-base) ease-(--ease-out) md:w-(--radix-navigation-menu-viewport-width)",
          // Brota do gatilho no gesto do menu (`@utility menu-sprout`).
          "menu-sprout",
          className
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  const { viewport, align, orientation, anchored } =
    React.useContext(NavigationMenuContext)
  const folha = React.useContext(FolhaContext)
  const item = React.useContext(ItemContext)
  const [preview, setPreview] = React.useState<React.ReactNode>(null)
  const previewCtx = React.useMemo(
    () => ({ atual: preview, setAtual: setPreview }),
    [preview]
  )
  const ancora = align === "trigger" && !anchored ? "center" : align

  if (folha) return <>{children}</>

  return (
    <>
      {/* O índice: os filhos de novo, sem pintar — ver o cabeçalho do arquivo. */}
      <IndiceContext.Provider value={true}>{children}</IndiceContext.Provider>
      <NavigationMenuPrimitive.Content
        data-slot="navigation-menu-content"
        className={cn(
          navigationMenuContentVariants({ viewport, orientation, align: ancora }),
          className
        )}
        {...props}
      >
        {/*
           Com viewport o Radix desenha estes filhos dentro do viewport, fora do item
           na árvore do React: sem reenviar o item, o painel não sabe de quem é.
        */}
        <ItemContext.Provider value={item}>
          <PreviewContext.Provider value={previewCtx}>{children}</PreviewContext.Provider>
        </ItemContext.Provider>
      </NavigationMenuPrimitive.Content>
    </>
  )
}

/**
 * O painel guarda o aprofundamento: o caminho aberto pelos `NavigationMenuGroup`,
 * a trilha para voltar e as setas (`↑↓` andam, `→` aprofunda, `←` volta, `Esc`
 * sobe um nível antes de fechar). Ao abrir mostra o nível do link da página atual.
 * As setas são tratadas na captura: o Radix só as move entre links, e a linha
 * que aprofunda ficaria de fora.
 */
function NavigationMenuPanel({
  className,
  columns = 1,
  children,
  onKeyDownCapture,
  ...props
}: React.ComponentProps<"ul"> &
  VariantProps<typeof navigationMenuPanelVariants>) {
  const indice = React.useContext(IndiceContext)
  const folha = React.useContext(FolhaContext)
  const ctx = React.useContext(NavigationMenuContext)
  const item = React.useContext(ItemContext)
  const dissolver = useScrollFade()
  const listaRef = React.useRef<HTMLUListElement | null>(null)

  // Abre na rota atual: o nível do link ativo deste item, se houver.
  const [caminho, setCaminho] = React.useState<string[]>(
    () => ctx.entradas.find((e) => e.item === item && e.ativo)?.nivel ?? []
  )
  const [rotulos, setRotulos] = React.useState<Record<string, React.ReactNode>>({})
  const registrarRotulo = React.useCallback((id: string, rotulo: React.ReactNode) => {
    setRotulos((r) => (r[id] === rotulo ? r : { ...r, [id]: rotulo }))
  }, [])
  const focarPrimeiroRef = React.useRef(false)
  const entrar = React.useCallback((nivel: string[]) => {
    focarPrimeiroRef.current = true
    setCaminho(nivel)
  }, [])
  React.useEffect(() => {
    if (!focarPrimeiroRef.current) return
    focarPrimeiroRef.current = false
    // O primeiro do nível novo: o "voltar" da trilha ou, na raiz, o primeiro link
    // ou grupo; sem isto o foco cai no `<body>` com o nó focado desmontado.
    listaRef.current
      ?.querySelector<HTMLElement>(
        "[data-panel-focavel], [data-slot=navigation-menu-link], [data-slot=navigation-menu-group]"
      )
      ?.focus()
  }, [caminho])
  const drill = React.useMemo(
    () => ({ caminho, entrar, rotulos, registrarRotulo }),
    [caminho, entrar, rotulos, registrarRotulo]
  )
  // Memorizada: refeita a cada render, a ref de função religaria o observador da dissolução.
  const panelRef = React.useMemo(() => composeRefs(dissolver, listaRef), [dissolver])

  const conteudo = (
    <NavigationMenuPanelContext.Provider value={true}>
      <DrillContext.Provider value={drill}>
        <NivelContext.Provider value={[]}>{children}</NivelContext.Provider>
      </DrillContext.Provider>
    </NavigationMenuPanelContext.Provider>
  )
  if (indice) return conteudo

  const trilha =
    caminho.length > 0 ? (
      <li
        data-slot="navigation-menu-trail"
        className="col-span-full flex min-w-0 items-center gap-0.5 px-1.5 pt-1 pb-1.5 text-xs"
      >
        <nav aria-label="Caminho" className="flex min-w-0 flex-wrap items-center gap-0.5">
          <button
            type="button"
            data-panel-focavel
            aria-label="Voltar"
            onClick={() => entrar(caminho.slice(0, -1))}
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-hidden hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground focus-visible:ring-3 focus-visible:ring-ring/45"
          >
            <ChevronLeftIcon aria-hidden className="size-4" />
          </button>
          {caminho.map((id, i) => {
            const ultimo = i === caminho.length - 1
            return (
              <span key={id} className="flex min-w-0 items-center gap-0.5">
                {i > 0 ? (
                  <ChevronRightIcon aria-hidden className="size-3 text-muted-foreground/60" />
                ) : null}
                {ultimo ? (
                  <span aria-current="location" className="truncate font-semibold text-foreground">
                    {rotulos[id]}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => entrar(caminho.slice(0, i + 1))}
                    className="truncate rounded-sm font-medium text-muted-foreground outline-hidden hover:text-foreground active:text-foreground focus-visible:text-foreground"
                  >
                    {rotulos[id]}
                  </button>
                )}
              </span>
            )
          })}
        </nav>
      </li>
    ) : null

  const teclas = (e: React.KeyboardEvent<HTMLUListElement>) => {
    onKeyDownCapture?.(e)
    const focaveis = Array.from(
      listaRef.current?.querySelectorAll<HTMLElement>(
        "a[href], [data-slot=navigation-menu-link], [data-slot=navigation-menu-group], [data-panel-focavel]"
      ) ?? []
    )
    const i = focaveis.indexOf(document.activeElement as HTMLElement)
    const andar = (j: number) => {
      e.preventDefault()
      e.stopPropagation()
      focaveis[Math.max(0, Math.min(focaveis.length - 1, j))]?.focus()
    }
    if (e.key === "ArrowDown") andar(i + 1)
    else if (e.key === "ArrowUp") andar(i - 1)
    else if (e.key === "Home") andar(0)
    else if (e.key === "End") andar(focaveis.length - 1)
    else if (e.key === "ArrowLeft" || (e.key === "Escape" && caminho.length > 0)) {
      if (caminho.length === 0) return
      // Sobe um nível — e o Esc só fecha o painel no topo.
      e.preventDefault()
      e.stopPropagation()
      entrar(caminho.slice(0, -1))
    } else if (e.key === "ArrowRight") {
      const alvo = document.activeElement as HTMLElement | null
      if (alvo?.dataset.slot === "navigation-menu-group") {
        e.preventDefault()
        e.stopPropagation()
        alvo.click()
      }
    }
  }

  if (folha) {
    return (
      <ul
        ref={listaRef}
        data-slot="navigation-menu-panel"
        className="flex flex-col"
        onKeyDownCapture={teclas}
      >
        {trilha}
        {conteudo}
      </ul>
    )
  }

  return (
    <ul
      ref={panelRef}
      data-slot="navigation-menu-panel"
      data-columns={columns}
      className={cn(
        navigationMenuPanelVariants({ columns }),
        scrollFadeViewportClassName,
        className
      )}
      onKeyDownCapture={teclas}
      {...props}
    >
      {trilha}
      {conteudo}
    </ul>
  )
}

/**
 * Um grupo que aprofunda no lugar: no nível dele é uma linha com a seta; tocada,
 * o painel mostra os filhos com a trilha em cima. Grupos aninham.
 */
function NavigationMenuGroup({
  label,
  value,
  description,
  icon,
  badge,
  children,
}: {
  label: React.ReactNode
  /**
   * A identidade do grupo no caminho; sem ela, o rótulo em texto. Não é `useId`:
   * o índice e o painel são instâncias diferentes do grupo e os ids não bateriam.
   */
  value?: string
  description?: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  const auto = React.useId()
  const id = value ?? (typeof label === "string" ? label : auto)
  const nivel = React.useContext(NivelContext)
  const drill = React.useContext(DrillContext)
  const visivel = useVisivel()
  const indice = React.useContext(IndiceContext)
  const registrarRotulo = drill?.registrarRotulo
  const rotulo = typeof label === "string" ? label : null
  React.useEffect(() => {
    if (registrarRotulo) registrarRotulo(id, rotulo ?? label)
    // `label` como elemento muda de identidade a cada render; o texto basta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrarRotulo, id, rotulo])

  const filhos = (
    <NivelContext.Provider value={[...nivel, id]}>{children}</NivelContext.Provider>
  )
  if (indice || !visivel) return filhos

  // Na folha, a mesma linha no corpo da gaveta.
  return (
    <>
      <li className="min-w-0">
        <button
          type="button"
          data-slot="navigation-menu-group"
          aria-expanded={false}
          onClick={() => drill?.entrar([...nivel, id])}
          className={cn(
            navigationMenuLinkVariants({ variant: description ? "card" : "row" }),
            "w-full text-left",
            description && "grid-cols-[auto_minmax(0,1fr)_auto] has-[>svg]:grid-cols-[auto_minmax(0,1fr)_auto]"
          )}
        >
          {icon}
          {description ? (
            <>
              <NavigationMenuLinkTitle badge={badge}>{label}</NavigationMenuLinkTitle>
              <ChevronRightIcon aria-hidden className="row-span-2 size-4 self-center text-muted-foreground" />
              <NavigationMenuLinkDescription>{description}</NavigationMenuLinkDescription>
            </>
          ) : (
            <>
              <span className="truncate">{label}</span>
              {badge ? <Badge variant="outline" size="xs">{badge}</Badge> : null}
              <ChevronRightIcon aria-hidden className="ms-auto size-4 text-muted-foreground" />
            </>
          )}
        </button>
      </li>
      {filhos}
    </>
  )
}

/** O rótulo de grupo dentro do painel, na régua que os quatro menus já falam. */
function NavigationMenuSectionLabel({
  className,
  ...props
}: React.ComponentProps<"li">) {
  const indice = React.useContext(IndiceContext)
  const visivel = useVisivel()
  if (indice || !visivel) return null
  return (
    <li
      data-slot="navigation-menu-section-label"
      className={cn(
        menuLabelClassName,
        "col-span-full pt-2 first:pt-0 [&:not(:first-child)]:mt-1",
        className
      )}
      {...props}
    />
  )
}

/**
 * O link. No índice só se registra (página atual e nível); fora do nível aberto
 * não aparece; com `preview`, escreve na prévia quando o cursor ou o foco chegam.
 */
function NavigationMenuLink({
  className,
  variant = "row",
  active,
  preview,
  onPointerEnter,
  onFocus,
  onClick,
  onSelect,
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link> &
  VariantProps<typeof navigationMenuLinkVariants> & {
    /** O que a `NavigationMenuPreview` mostra com este link sob o cursor. */
    preview?: React.ReactNode
  }) {
  const inPanel = React.useContext(NavigationMenuPanelContext)
  const ctx = React.useContext(NavigationMenuContext)
  const item = React.useContext(ItemContext)
  const indice = React.useContext(IndiceContext)
  const folha = React.useContext(FolhaContext)
  const nivel = React.useContext(NivelContext)
  const previewCtx = React.useContext(PreviewContext)
  const visivel = useVisivel()
  const id = React.useId()

  const registrar = ctx.registrar
  const nivelChave = nivel.join("/")
  React.useEffect(() => {
    if (!indice) return
    return registrar({
      id,
      item,
      nivel: nivelChave ? nivelChave.split("/") : [],
      ativo: active === true,
    })
  }, [indice, registrar, id, item, nivelChave, active])

  // O link do topo que é a página atual: o realce descansa nele.
  const setAtual = ctx.setAtual
  React.useEffect(() => {
    if (inPanel || indice || folha || !active) return
    setAtual(item)
    return () => setAtual(null)
  }, [inPanel, indice, folha, active, setAtual, item])

  if (indice) return null
  if (!visivel) return null

  if (folha) {
    const Comp = asChild ? Slot.Root : "a"
    return (
      <div className="min-w-0" role="none">
        <Comp
          data-slot="navigation-menu-link"
          aria-current={active ? "page" : undefined}
          className={cn(drawerActionClassName, "[&_svg]:size-5", className)}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            onClick?.(e)
            onSelect?.(e.nativeEvent)
            folha.fechar()
          }}
          {...props}
        >
          {children}
        </Comp>
      </div>
    )
  }

  const aceso = !inPanel && ctx.realce === item
  const comRealce = !inPanel && ctx.indicator === "highlight"

  const link = (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      data-variant={inPanel ? variant : "top"}
      data-aceso={aceso ? "" : undefined}
      active={active}
      asChild={asChild}
      className={cn(
        inPanel
          ? navigationMenuLinkVariants({ variant })
          : cn(
              navigationMenuTriggerVariants({ variant: ctx.variant, size: ctx.size }),
              navigationMenuTopLinkVariants({ variant: ctx.variant }),
              comRealce && SEM_FUNDO_PROPRIO,
              comRealce && "aria-[current=page]:bg-transparent aria-[current=page]:shadow-none aria-[current=page]:border-transparent"
            ),
        className
      )}
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        if (!ehCursor(e)) return
        if (inPanel) {
          if (preview) previewCtx?.setAtual(preview)
        } else ctx.setHover(item)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        if (inPanel) {
          if (preview) previewCtx?.setAtual(preview)
        } else ctx.setFoco(item)
      }}
      onClick={onClick}
      onSelect={onSelect}
      {...props}
    >
      {comRealce && aceso ? comRealceDentro(children, asChild) : children}
    </NavigationMenuPrimitive.Link>
  )

  return inPanel ? <li className="min-w-0">{link}</li> : link
}

/**
 * Põe o realce **dentro** do que o link desenha. Com `asChild` o `Slot` aceita
 * um filho só — o `Link` do Next —, e o realce entra como primeiro filho dele.
 */
function comRealceDentro(children: React.ReactNode, asChild?: boolean) {
  if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return React.cloneElement(
      children,
      undefined,
      <>
        <Realce />
        {children.props.children}
      </>
    )
  }
  return (
    <>
      <Realce />
      {children}
    </>
  )
}

/** O título do link em cartão. `badge` é a pílula pequena ao lado do nome. */
function NavigationMenuLinkTitle({
  className,
  badge,
  children,
  ...props
}: React.ComponentProps<"span"> & { badge?: React.ReactNode }) {
  return (
    <span
      data-slot="navigation-menu-link-title"
      className={cn("flex min-w-0 items-center gap-2 font-medium", className)}
      {...props}
    >
      <span className="truncate">{children}</span>
      {badge ? (
        <Badge variant="outline" size="xs" className="shrink-0">
          {badge}
        </Badge>
      ) : null}
    </span>
  )
}

function NavigationMenuLinkDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="navigation-menu-link-description"
      className={cn(
        "text-xs leading-snug text-muted-foreground group-hover/navigation-menu-link:text-accent-foreground/75 group-active/navigation-menu-link:text-accent-foreground/75",
        className
      )}
      {...props}
    />
  )
}

/** O cabeçalho do painel: título e descrição. Mora no `NavigationMenuContent`, ao lado do painel. */
function NavigationMenuPanelHeader({
  title,
  description,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}) {
  const indice = React.useContext(IndiceContext)
  const folha = React.useContext(FolhaContext)
  if (indice || folha) return null
  return (
    <div
      data-slot="navigation-menu-panel-header"
      className={cn("flex flex-col px-3 pt-3 pb-1", className)}
    >
      <p className="text-sm font-medium leading-snug">{title}</p>
      {description ? (
        <p className="text-xs leading-snug text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

/** O rodapé do painel: o "Ver tudo" e, com `legend`, as teclas (some no toque). */
function NavigationMenuPanelFooter({
  children,
  legend = false,
  className,
}: {
  children?: React.ReactNode
  legend?: boolean
  className?: string
}) {
  const indice = React.useContext(IndiceContext)
  const folha = React.useContext(FolhaContext)
  if (indice) return null
  if (folha) return children ? <div className="px-1 pt-1">{children}</div> : null
  return (
    <div
      data-slot="navigation-menu-panel-footer"
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 px-3 py-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">{children}</div>
      {legend ? (
        <span aria-hidden className="flex shrink-0 items-center gap-1 pointer-coarse:hidden">
          {["↑↓", "←", "→", "↵"].map((t) => (
            <Kbd key={t}>{t}</Kbd>
          ))}
        </span>
      ) : null}
    </div>
  )
}

/**
 * A prévia ao lado: coluna à direita que mostra o `preview` do link sob o
 * cursor ou foco; `children` é o que mostra antes de qualquer um.
 */
function NavigationMenuPreview({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const indice = React.useContext(IndiceContext)
  const folha = React.useContext(FolhaContext)
  const ctx = React.useContext(PreviewContext)
  if (indice || folha) return null
  const mostra = ctx?.atual ?? children
  return (
    <div
      data-slot="navigation-menu-preview"
      aria-live="polite"
      className={cn(
        "concentric m-1 hidden w-56 shrink-0 flex-col justify-end gap-1 bg-muted/60 p-3 text-sm sm:flex",
        className
      )}
    >
      {/* A troca esmaece: a chave muda com o conteúdo, e o nó novo entra. */}
      <div
        key={typeof mostra === "string" ? mostra : undefined}
        className="flex flex-col gap-1 animate-in fade-in-0 animation-duration-(--duration-base)"
      >
        {mostra}
      </div>
    </div>
  )
}

/**
 * No telefone (`mobile="sheet"`) a fileira não cabe: a folha desenha as mesmas
 * peças como seções, com os grupos aprofundando no lugar.
 */
function NavigationMenuFolha({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [aberta, setAberta] = React.useState(false)
  const folha = React.useMemo(() => ({ fechar: () => setAberta(false) }), [])
  return (
    <Drawer open={aberta} onOpenChange={setAberta}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="lg" data-slot="navigation-menu-sheet-trigger">
          <Bars3Icon aria-hidden className="size-5" />
          {label}
        </Button>
      </DrawerTrigger>
      <DrawerContent data-slot="navigation-menu-sheet">
        <DialogHeader className="sr-only">
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>A navegação desta página</DialogDescription>
        </DialogHeader>
        <FolhaContext.Provider value={folha}>
          <nav aria-label={label} className="flex flex-col px-2">
            {children}
          </nav>
        </FolhaContext.Provider>
        <DrawerCancel />
      </DrawerContent>
    </Drawer>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuPanel,
  NavigationMenuPanelHeader,
  NavigationMenuPanelFooter,
  NavigationMenuGroup,
  NavigationMenuPreview,
  NavigationMenuSectionLabel,
  NavigationMenuLink,
  NavigationMenuLinkTitle,
  NavigationMenuLinkDescription,
  navigationMenuListVariants,
  navigationMenuTriggerVariants,
  navigationMenuLinkVariants,
  navigationMenuTopLinkVariants,
  navigationMenuPanelVariants,
}
