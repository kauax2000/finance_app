"use client"

import * as React from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { animate, useReducedMotion } from "motion/react"
import { flushSync } from "react-dom"
import { Slot } from "radix-ui"

import { tagChipUnreadCount } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup, type ButtonGroupProps } from "@/components/ui/button-group"
import { Kbd } from "@/components/ui/kbd"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { useViewportWindow } from "@/hooks/use-mobile"
import { usePageTitleDock } from "@/hooks/use-page-title-dock"
import {
  barEdgeLayerBaseClassName,
  barEdgeLayerClassNames,
  barSurfaceClassName,
} from "@/lib/glass-classes"
import { GOTA_H, GOTA_R, quadroDaGotaDoFiltro, quadroDaTroca, suave, TINTA_DO_VOO, type IconeEmVoo } from "@/lib/header-morph"
import { alvoDaRolagem, proximoEscondido } from "@/lib/hide-on-scroll"
import {
  searchFieldIconClassName,
  searchFieldShapeClassName,
  searchFieldShortcutClassName,
  searchFieldSizeClassName,
  searchFieldSurfaceClassName,
} from "@/lib/search-field-classes"
import { ariaShortcut, isEditableTarget, matchShortcut } from "@/lib/shortcut"
import { MOLA } from "@/lib/spring"
import { cn } from "@/lib/utils"

/**
 * A barra do topo da janela, a que fica parada enquanto a tela rola (o
 * `PageHeader` é o topo de dentro da tela, e `DialogHeader`/`CardHeader` o de uma
 * superfície). Substitui o `AppHeader` e o `DsTopBar`, que divergiam em borrão,
 * camada e altura.
 * A altura é do `<header>`, com o fio e a área segura dentro: o degrau publica
 * `--top-bar-h`, `fixed` publica `--top-bar-safe`, e a caixa é a soma das duas em
 * `border-box`, de modo que o total no telefone é `--mobile-header-offset`.
 * `sticky` mora em `--z-sticky`, e não em `--z-header`: a faixa de aviso
 * (`offline-banner`) é `fixed md:top-0` em `--z-banner` e cobre a barra do
 * desktop de propósito; `fixed` é o telefone, onde a faixa desce para baixo da
 * barra e ali vai a `--z-header`.
 * O fio lê `--sidebar-inset-rule`, que o `SidebarInset` publica: numa `Sidebar`
 * `floating` a placa não tem `border-r` para ele encostar. Fora de um
 * `SidebarInset`, 1px.
 * O padrão é `sm`: 48 no telefone e 52 do `md` para cima, com a barra lateral
 * aberta ou recolhida — no desktop, 8px em cima e embaixo dos controles de 36,
 * no ritmo da placa da barra lateral, que começa a 8 do topo (decisão do dono). No telefone a área segura soma por dentro. O que
 * anima é o fundo, quando o vidro acende.
 */
const topBarVariants = cva(
  [
    "flex w-full min-w-0 shrink-0 items-center gap-2",
    // A área segura por variável (`--top-bar-safe-area`), e não `env()` cru: a prévia
    // num iPhone do catálogo é um iframe, onde `env()` vale zero.
    "[--top-bar-safe-area:env(safe-area-inset-top,0px)]",
    "h-[calc(var(--top-bar-h)+var(--top-bar-safe,0px))] pt-[var(--top-bar-safe,0px)]",
    "border-b border-b-[length:var(--sidebar-inset-rule,1px)] border-border",
    // O fio só ao rolar: no `scroll`, aparece junto com o vidro (em repouso a barra é a página).
    "data-[scrolled=false]:border-b-transparent",
    // Some ao rolar: no telefone a barra sobe inteira, com a área segura e a calha da flutuante.
    "max-md:data-hidden:-translate-y-[calc(100%+var(--top-bar-safe-area)+--spacing(4))]",
    // O título no meio, no telefone: uma grade de três áreas com as pontas iguais,
    // para o título ficar no meio da tela, e não do vão.
    "data-[title-align=center]:max-md:grid data-[title-align=center]:max-md:grid-cols-[minmax(0,1fr)_minmax(0,max-content)_minmax(0,1fr)] data-[title-align=center]:max-md:[grid-template-areas:'start_title_actions']",
    // O borrão do `backdrop-filter` ignora o recorte de todo ancestral no Chromium
    // (`overflow-hidden`, `clip-path`, máscara, `contain: paint`) e só respeita o raio
    // do próprio elemento. Quem põe a barra no topo de uma caixa arredondada publica
    // `--top-bar-r` (a moldura do catálogo publica); fora disso, 0.
    "rounded-t-[var(--top-bar-r,0px)]",
    "transition-[background-color,border-color,translate] duration-(--duration-slow) ease-(--ease-emphasized)",
  ],
  {
    variants: {
      size: {
        // 56 no telefone (a régua dos apps nativos: botões de 44 com 6 de folga) e
        // 52 do `md` para cima, 8 em volta dos controles de 36 (rodada 328).
        sm: "[--top-bar-h:3.5rem] md:[--top-bar-h:3.25rem]",
        md: "[--top-bar-h:3.5rem]",
        // O degrau `lg` (64): a barra das páginas públicas e de marca. O título fica no
        // corpo da barra; a marca é que cresce.
        lg: "[--top-bar-h:4rem]",
      },
      position: {
        // `relative` para o `TopBarProgress`, que mora na aresta de baixo.
        static: "relative",
        sticky: "sticky top-0 z-(--z-sticky)",
        fixed:
          "fixed inset-x-0 top-0 z-(--z-header) [--top-bar-safe:var(--top-bar-safe-area)]",
        auto: "max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-(--z-header) max-md:[--top-bar-safe:var(--top-bar-safe-area)] md:sticky md:top-0 md:z-(--z-sticky)",
      },
      surface: {
        solid: "bg-background",
        glass: barSurfaceClassName,
        /**
         * A borda do iOS (a barra do WhatsApp): sem tinta chapada e sem fio. Quem esconde o
         * conteúdo que passa por baixo são as três camadas de `barEdgeLayerClassNames`, mais
         * fortes junto à borda e sumindo 24px abaixo da barra, com a tinta de
         * `--background` acumulando na mesma rampa — a barra não tem aresta.
         * A própria barra não pode ter `backdrop-filter` nem fundo translúcido: viraria a
         * raiz do borrão das camadas, que só veriam ela. O fundo cheio é o caminho de volta
         * de quem não tem o borrão (sem `backdrop-filter`, ou com transparência reduzida).
         */
        edge: [
          "border-b-0 bg-background supports-backdrop-filter:bg-transparent reduced-transparency:bg-background",
          "[--top-bar-edge-tint:color-mix(in_oklab,var(--background)_30%,transparent)]",
        ].join(" "),
      },
      /**
       * A flutuante: a pílula solta da casa (a placa, o anel de 1px e a sombra, a 8px
       * das bordas), a família do `Tabs` e do `Sidebar` flutuantes. A área segura sai
       * de dentro da caixa e vai para a distância do topo: a pílula desce inteira abaixo do notch.
       */
      variant: {
        bar: "",
        floating:
          "h-(--top-bar-h)! pt-0! mx-2 mt-2 w-[calc(100%-1rem)] rounded-full border-b-0 shadow-lg ring-1 ring-foreground/10 [--top-bar-r:9999px]",
      },
      gutter: {
        bar: "px-4",
        none: "",
      },
    },
    compoundVariants: [
      { variant: "floating", surface: "solid", class: "bg-popover" },
      { variant: "floating", position: "sticky", class: "top-2" },
      {
        variant: "floating",
        position: "fixed",
        class: "inset-x-2 mx-0 mt-0 w-auto top-[calc(var(--top-bar-safe-area)+--spacing(2))]",
      },
      {
        variant: "floating",
        position: "auto",
        class: "max-md:inset-x-2 max-md:mx-0 max-md:mt-0 max-md:w-auto max-md:top-[calc(var(--top-bar-safe-area)+--spacing(2))] md:top-2",
      },
      { variant: "floating", gutter: "bar", class: "px-3" },
    ],
    defaultVariants: {
      size: "sm",
      position: "sticky",
      surface: "solid",
      variant: "bar",
      gutter: "bar",
    },
  }
)

type TopBarSurface = "solid" | "glass" | "scroll" | "edge"

/**
 * O que acontece na rolagem: se o conteúdo saiu do topo (o vidro e o fio do
 * `scroll`) e se a barra deve sumir (`hideOnScroll`).
 * Quem faz o conteúdo passar por baixo de uma barra `sticky` é o ancestral que
 * rola (a janela, no app; uma região rolável na moldura do catálogo ou numa
 * coluna de painel). Por isso a escuta é em captura na janela e o alvo é decidido
 * a cada evento: vale a janela, ou um ancestral da barra; uma lista rolando dentro
 * da tela não acende nada. Resolver o ancestral uma vez, na montagem, falhou: na
 * moldura o CSS chega depois do efeito e o `overflow` ainda lia `visible`.
 * Sumir é rolar para baixo passada a altura da barra; voltar é rolar para cima.
 * Nunca com o foco dentro dela (quem está num campo da barra não pode vê-lo
 * fugir); que só vale no telefone o CSS decide (`max-md:`).
 */
function useRolagem(
  ref: React.RefObject<HTMLElement | null>,
  vidro: boolean,
  sumir: boolean
) {
  const janelaDaMoldura = useViewportWindow()
  const [rolou, setRolou] = React.useState(false)
  const [escondida, setEscondida] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if ((!vidro && !sumir) || !el) return
    const janela = janelaDaMoldura ?? window
    let antes = 0
    const ler = (e?: Event) => {
      const y = alvoDaRolagem(e ?? new Event("scroll"), el)
      if (y == null) return
      setRolou(y > 0)
      if (sumir) {
        // Os valores entram já lidos: o React pode rodar o atualizador depois de
        // `antes` virar `y`, e não haveria movimento.
        const s = { y, antes, focada: el.contains(el.ownerDocument.activeElement), mostrarAte: el.offsetHeight }
        setEscondida((v) => proximoEscondido(v, s))
      }
      antes = y
    }
    ler()
    janela.addEventListener("scroll", ler, { capture: true, passive: true })
    return () => {
      janela.removeEventListener("scroll", ler, { capture: true })
      // Desligar `hideOnScroll` com a barra escondida a mostra.
      setEscondida(false)
    }
  }, [ref, vidro, sumir, janelaDaMoldura])

  return { rolou, escondida }
}

const TopBarContext = React.createContext<{ titleAlign: "start" | "center" }>({
  titleAlign: "start",
})

function TopBar({
  className,
  size,
  position,
  surface = "solid",
  variant,
  gutter,
  titleAlign = "start",
  hideOnScroll = false,
  children,
  ...props
}: React.ComponentProps<"header"> &
  Omit<VariantProps<typeof topBarVariants>, "surface"> & {
    /**
     * `scroll` é `solid` até o conteúdo rolar por baixo, e `glass` depois; `edge` é o
     * borrão progressivo, sem tinta chapada nem fio.
     */
    surface?: TopBarSurface
    /** No telefone, o título à esquerda (o padrão) ou no meio, como no iOS. */
    titleAlign?: "start" | "center"
    /** No telefone, a barra sobe ao rolar para baixo e volta ao subir. */
    hideOnScroll?: boolean
  }) {
  const ref = React.useRef<HTMLElement>(null)
  const { rolou, escondida } = useRolagem(ref, surface === "scroll", hideOnScroll)
  // Escolhe entre duas strings inteiras que o `cva` já tem — nunca monta classe.
  const pintura = surface === "scroll" ? (rolou ? "glass" : "solid") : surface
  const contexto = React.useMemo(() => ({ titleAlign }), [titleAlign])

  return (
    <TopBarContext value={contexto}>
      <header
        ref={ref}
        data-slot="top-bar"
        data-size={size ?? "sm"}
        data-variant={variant ?? "bar"}
        data-surface={surface}
        data-scrolled={surface === "scroll" ? rolou : undefined}
        data-title-align={titleAlign}
        data-hidden={escondida || undefined}
        className={cn(
          topBarVariants({ size, position, surface: pintura, variant, gutter }),
          className
        )}
        {...props}
      >
        {/* Em ordem crescente: a camada mais longa por baixo, e cada uma borra o que a de
            baixo compôs. `-z-10` dentro da barra, que é contexto de empilhamento (sticky
            ou fixed com camada): atrás do conteúdo dela, sobre a página. */}
        {surface === "edge"
          ? barEdgeLayerClassNames.map((camada, i) => (
              <span key={i} aria-hidden data-slot="top-bar-edge" className={cn(barEdgeLayerBaseClassName, camada)} />
            ))
          : null}
        {children}
      </header>
    </TopBarContext>
  )
}

/**
 * Uma árvore para os dois tamanhos: toda ponta aceita `phone`, o que mostra
 * abaixo de `md`. Sem ele, a ponta é a mesma nas duas larguras; com
 * `phone={null}`, some no telefone. Evita duas árvores (`md:hidden` e `hidden
 * md:contents`).
 */
function comTelefone(children: React.ReactNode, phone: React.ReactNode | undefined) {
  if (phone === undefined) return children
  return (
    <>
      <span data-slot="top-bar-wide" className="contents max-md:hidden">
        {children}
      </span>
      <span data-slot="top-bar-phone" className="hidden max-md:contents">
        {phone}
      </span>
    </>
  )
}

/** A ponta de entrada: voltar, gatilho da barra lateral, marca. */
function TopBarStart({
  className,
  phone,
  children,
  ...props
}: React.ComponentProps<"div"> & { phone?: React.ReactNode }) {
  return (
    <div
      data-slot="top-bar-start"
      // Quando o gatilho da barra lateral vai para dentro dela e esta ponta fica
      // vazia, ela devolve o `gap` da barra, e o título encosta na calha deslizando,
      // no passo da vaga que encolhe.
      className={cn(
        "flex shrink-0 items-center gap-2 transition-[margin] duration-(--duration-slow) ease-(--ease-emphasized) has-[>[data-slot=sidebar-trigger-slot][data-vazio]:only-child]:-me-2",
        // O mesmo com `phone`: aí o gatilho mora dentro da ponta larga.
        "has-[>[data-slot=top-bar-wide]>[data-slot=sidebar-trigger-slot][data-vazio]:only-child]:md:-me-2",
        "in-data-[title-align=center]:max-md:[grid-area:start] in-data-[title-align=center]:max-md:justify-self-start",
        className
      )}
      {...props}
    >
      {comTelefone(children, phone)}
    </div>
  )
}

/**
 * O nome da tela. Um `<h1>` porque, no telefone, é o único título que a tela
 * mostra; `asChild` para quando a tela já tem o seu. Fica cru, e não sobre `H4`:
 * o átomo traria corpo, peso e entrelinha que os três anulariam (a conta do `CardTitle`).
 */
function TopBarTitle({
  className,
  asChild = false,
  pageTitle = false,
  phone,
  scrollToTop = true,
  onClick,
  children,
  ...props
}: React.ComponentProps<"h1"> & {
  asChild?: boolean
  /**
   * O título que sobe: quando o título de um `PageHeader collapse` rola para baixo
   * da barra, ele aparece aqui (subindo 6px e acendendo) e o que a barra mostrava
   * (`children`) cede o lugar; ao voltar, desce. É o título grande do iOS. O texto
   * que sobe é `aria-hidden`: o `<h1>` da página segue sendo o nome dela.
   */
  pageTitle?: boolean
  /** O título abaixo de `md`; `null` o esconde no telefone. */
  phone?: React.ReactNode
  /**
   * Tocar no título sobe ao topo, no telefone (o gesto da barra de status do iOS).
   * É um atalho a mais, e não o único caminho: o título segue um `<h1>`, sem papel de botão.
   */
  scrollToTop?: boolean
}) {
  const subir = (e: React.MouseEvent<HTMLHeadingElement>) => {
    onClick?.(e)
    if (!scrollToTop || e.defaultPrevented) return
    const barra = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-slot=top-bar]")
    const janela = barra?.ownerDocument.defaultView
    if (!barra || !janela || !janela.matchMedia("(max-width: 767px)").matches) return
    const suave = janela.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    let rolavel: HTMLElement | null = barra.parentElement
    while (rolavel && rolavel !== barra.ownerDocument.body) {
      if (/(auto|scroll)/.test(janela.getComputedStyle(rolavel).overflowY) && rolavel.scrollTop > 0) {
        rolavel.scrollTo({ top: 0, behavior: suave })
        return
      }
      rolavel = rolavel.parentElement
    }
    janela.scrollTo({ top: 0, behavior: suave })
  }

  if (pageTitle) {
    return (
      <TopBarPageTitle className={cn(TITULO_CENTRADO, className)} onClick={subir} {...props}>
        {comTelefone(children, phone)}
      </TopBarPageTitle>
    )
  }
  const Comp = asChild ? Slot.Root : "h1"
  return (
    <Comp
      data-slot="top-bar-title"
      className={cn(
        "min-w-0 flex-1 truncate font-heading text-sm font-medium text-foreground",
        TITULO_CENTRADO,
        className
      )}
      onClick={subir}
      {...props}
    >
      {asChild ? children : comTelefone(children, phone)}
    </Comp>
  )
}

/** O título na área do meio, no `titleAlign="center"` do telefone. */
const TITULO_CENTRADO =
  "in-data-[title-align=center]:max-md:[grid-area:title] in-data-[title-align=center]:max-md:text-center"

const TROCA_DO_TITULO =
  "[grid-area:1/1] min-w-0 truncate transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out)"

function TopBarPageTitle({ className, children, ...props }: React.ComponentProps<"div">) {
  const [doc, setDoc] = React.useState<Document | null>(null)
  const medir = React.useCallback((no: HTMLDivElement | null) => setDoc(no?.ownerDocument ?? null), [])
  const dock = usePageTitleDock(doc)
  const subiu = Boolean(dock?.docked)
  return (
    <div
      ref={medir}
      data-slot="top-bar-title"
      data-docked={subiu || undefined}
      className={cn(
        "group/top-bar-title grid min-w-0 flex-1 font-heading text-sm font-medium text-foreground",
        className
      )}
      {...props}
    >
      {children ? (
        <span className={cn(TROCA_DO_TITULO, "group-data-docked/top-bar-title:-translate-y-1.5 group-data-docked/top-bar-title:opacity-0")}>
          {children}
        </span>
      ) : null}
      <span
        aria-hidden
        className={cn(
          TROCA_DO_TITULO,
          "translate-y-1.5 opacity-0 group-data-docked/top-bar-title:translate-y-0 group-data-docked/top-bar-title:opacity-100"
        )}
      >
        {dock?.text}
      </span>
    </div>
  )
}

/** O meio elástico: trilha, busca, título composto. */
function TopBarContent({
  className,
  phone,
  children,
  ...props
}: React.ComponentProps<"div"> & { phone?: React.ReactNode }) {
  return (
    <div
      data-slot="top-bar-content"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        "in-data-[title-align=center]:max-md:[grid-area:title] in-data-[title-align=center]:max-md:justify-center",
        className
      )}
      {...props}
    >
      {comTelefone(children, phone)}
    </div>
  )
}

/** A ponta de saída. `ms-auto` a encosta à direita mesmo sem meio elástico. */
function TopBarActions({
  className,
  phone,
  children,
  ...props
}: React.ComponentProps<"div"> & { phone?: React.ReactNode }) {
  return (
    <div
      data-slot="top-bar-actions"
      className={cn(
        "ms-auto flex shrink-0 items-center gap-1",
        "in-data-[title-align=center]:max-md:[grid-area:actions] in-data-[title-align=center]:max-md:justify-self-end",
        className
      )}
      {...props}
    >
      {comTelefone(children, phone)}
    </div>
  )
}

/**
 * A ação da barra: o botão de ícone com o nome, a dica (com a tecla, se houver
 * atalho) e a contagem. A contagem é `aria-hidden` e entra no nome (`countLabel`,
 * ou o número): "Notificações, 3 não lidas". Acima de 99, "99+". No dedo o botão
 * mede 40 (o `icon-md` do `Button`) e o alvo vai a 44 por pseudo-elemento.
 */
function TopBarAction({
  label,
  count,
  countLabel,
  shortcut,
  tooltip = true,
  plate = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "variant"> & {
  label: string
  /** O número no canto; `0` e `undefined` não desenham nada. */
  count?: number
  /** Como a contagem entra no nome: "3 não lidas". Sem ela, o número. */
  countLabel?: string
  /** A tecla (`"mod+k"`), na dica e no `aria-keyshortcuts`. Só mostra — quem escuta é a tela. */
  shortcut?: string
  tooltip?: boolean
  /** O vidro da busca do cabeçalho, como o botão de recolher (em todo tamanho). */
  plate?: boolean
}) {
  // Dentro de um `TopBarActionSwap` o vidro é dele: o botão não desenha o próprio.
  const emTroca = React.useContext(TopBarSwapContext)
  const temContagem = typeof count === "number" && count > 0
  const nome = temContagem ? label + ", " + (countLabel ?? count) : label
  // O último número fica desenhado enquanto a bolha esvazia: ao zerar, ela sai
  // com o mesmo número que tinha.
  const [mostrado, setMostrado] = React.useState(temContagem ? count : 0)
  if (temContagem && count !== mostrado) setMostrado(count)
  const botao = (
    <Button
      variant="tertiary"
      size="icon-lg"
      aria-label={nome}
      aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
      data-slot="top-bar-action"
      className={cn(
        "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-0.5 pointer-coarse:after:content-['']",
        // No telefone o botão é o alvo inteiro, 44, com o ícone a 20.
        "max-md:size-11 max-md:[&_svg]:size-5",
        plate && !emTroca && TOP_BAR_PLATE,
        className
      )}
      {...props}
    >
      {children}
      {mostrado > 0 ? (
        <span
          aria-hidden
          data-slot="top-bar-action-count"
          data-state={temContagem ? "open" : "closed"}
          className={cn(
            // Algarismos proporcionais: na bolha o número fica sozinho, e o "1" tabular
            // (folga à esquerda) tirava o "13" do centro.
            "proportional-nums pointer-events-none absolute top-0 right-0 z-10 flex h-4 min-w-4 translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full px-1 text-2xs leading-3 font-semibold ring-2 ring-background",
            tagChipUnreadCount,
            // O gesto da bolha da aba "Não lidas": enche na mola ao chegar (também
            // ao montar, por `@starting-style`) e, ao zerar, toma impulso e
            // esvazia, com o azul apagando na segunda metade.
            "transition-[scale,opacity] duration-(--duration-spring) ease-(--ease-spring) starting:scale-30 starting:opacity-0",
            "data-[state=closed]:scale-30 data-[state=closed]:opacity-0",
            "data-[state=closed]:[transition:scale_320ms_cubic-bezier(0.5,-0.45,0.75,0.2),opacity_160ms_var(--ease-in-out)_160ms]"
          )}
        >
          {mostrado > 99 ? "99+" : mostrado}
        </span>
      ) : null}
    </Button>
  )
  if (!tooltip) return botao
  return (
    <Tooltip>
      <TooltipTrigger asChild>{botao}</TooltipTrigger>
      <TooltipContent shortcut={shortcut}>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Verdadeiro dentro de um `TopBarActionSwap`: quem desenha o vidro é ele. */
const TopBarSwapContext = React.createContext(false)

/** Escreve um quadro de ícone no miolo; `null` apaga, e nada inline sobra. */
function pintarMiolo(el: HTMLElement, i: IconeEmVoo | null) {
  el.style.opacity = i ? String(i.opacidade) : ""
  el.style.scale = i ? String(i.escala) : ""
  el.style.filter = i ? "blur(" + i.desfoque + "px)" : ""
}

/** O quadro em que um miolo está, lido do inline; sem nada escrito, `reserva` (o repouso do papel dele). */
function lerMiolo(el: HTMLElement, reserva: IconeEmVoo): IconeEmVoo {
  if (!el.style.opacity) return reserva
  return {
    opacidade: parseFloat(el.style.opacity),
    escala: parseFloat(el.style.scale) || 1,
    desfoque: parseFloat(el.style.filter.slice("blur(".length)) || 0,
  }
}

const misturar = (a: IconeEmVoo, b: IconeEmVoo, t: number): IconeEmVoo => ({
  opacidade: a.opacidade + (b.opacidade - a.opacidade) * t,
  escala: a.escala + (b.escala - a.escala) * t,
  desfoque: a.desfoque + (b.desfoque - a.desfoque) * t,
})

/**
 * O realce do vidro no botão de dentro, o mesmo `--button-hover-fill` do
 * `TOP_BAR_PLATE`: a variante do `Button` reescreve a variável no próprio
 * botão (0,1,0) e venceria a herdada; o descendente por atributo (0,2,0) vence.
 */
const REALCE_DO_VIDRO_NO_MIOLO =
  "[&_[data-variant]]:[--button-hover-fill:color-mix(in_oklab,var(--sidebar-accent)_50%,transparent)]"

type Miolo = { chave: string; filho: React.ReactNode }

/**
 * O vidro que fica e o miolo que troca: um círculo só (o vidro da barra, 44)
 * que segura uma ação — o sino, o voltar — e, quando `swapKey` muda, afunda e
 * volta na `MOLA` enquanto o miolo de antes sai no desfoque e o novo chega
 * dele (`quadroDaTroca`). O de antes fica montado por cima, inerte e escondido
 * do leitor, até o gesto acabar; o novo já é o interativo, e herda o foco se o
 * de antes o tinha. A escala é do próprio vidro; opacidade, escala e desfoque
 * são dos miolos, filhos dele — nunca de um ancestral, que desligaria o
 * `backdrop-filter`. No fim, nada inline.
 * Montar não anima: a troca nasce de uma chave diferente da que já montou.
 * Uma troca no meio de outra não pula: o vidro segue no mesmo afundar, e cada
 * miolo parte do quadro em que estava, misturando-se ao da troca nova no
 * primeiro quarto dela. Antes do meio, o que sai continua saindo e o que mal
 * tinha entrado vai embora; depois, o que entrava passa a sair. Sem caixa (a árvore do telefone escondida) ou com movimento
 * reduzido, troca na hora.
 */
function TopBarActionSwap({
  swapKey,
  className,
  children,
}: {
  /** Quem está no vidro; trocar a chave troca o miolo com o gesto. */
  swapKey: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <MioloQueTroca
      swapKey={swapKey}
      afundar
      data-slot="top-bar-action-swap"
      className={cn("relative grid size-11 shrink-0 place-items-center", TOP_BAR_PLATE, REALCE_DO_VIDRO_NO_MIOLO, className)}
    >
      {children}
    </MioloQueTroca>
  )
}

/**
 * O miolo que troca, sem o vidro: a caixa que segura o de agora e, durante o
 * gesto, o de antes por cima. É o de dentro do `TopBarActionSwap` (onde a
 * caixa é o próprio vidro, que afunda) e o da gota da `TopBarActionGroup
 * morph` (onde a caixa mora dentro do vidro e não afunda, `afundar` falso:
 * o vidro é da gota, e o `transform` dele é dela). Fora disso, o mesmo gesto.
 */
function MioloQueTroca({
  swapKey,
  afundar,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  swapKey: string
  /** O vidro afunda e volta na mola (só quando a caixa é o próprio vidro). */
  afundar: boolean
}) {
  const reduzido = useReducedMotion()
  const vidro = React.useRef<HTMLSpanElement>(null)
  // Onde o gesto está: 0 em repouso; no meio, o ponto de partida da troca seguinte.
  const progresso = React.useRef(0)
  // O miolo que montou por último, sempre com o filho em dia (o de saída leva a contagem de agora).
  const [montou, setMontou] = React.useState<Miolo>({ chave: swapKey, filho: children })
  const [saindo, setSaindo] = React.useState<Miolo | null>(null)
  // Se o gesto em curso já passou do meio: decide quem sai numa troca no meio de outra.
  const [passouDoMeio, setPassouDoMeio] = React.useState(false)
  // O miolo que entrava saiu da árvore (ou virou o que sai) com o foco dentro.
  const focoNoQueSaiu = React.useRef(false)
  const guardarFoco = React.useCallback((no: HTMLSpanElement | null) => {
    if (!no) return
    return () => {
      if (no.contains(no.ownerDocument.activeElement)) focoNoQueSaiu.current = true
    }
  }, [])
  if (montou.chave !== swapKey) {
    // Voltar à chave que saía, ou trocar depois do meio: o que entrava passa a
    // sair. Antes do meio, o que saía segue saindo, e o que mal tinha entrado
    // desmonta. Sempre um objeto novo: o efeito recomeça mesmo quando quem sai
    // é o mesmo.
    const fica = saindo && !passouDoMeio && swapKey !== saindo.chave ? saindo : montou
    setSaindo({ ...fica })
    setMontou({ chave: swapKey, filho: children })
    setPassouDoMeio(false)
  } else if (montou.filho !== children) {
    setMontou({ chave: swapKey, filho: children })
  }

  React.useLayoutEffect(() => {
    const el = vidro.current
    const sai = el?.querySelector<HTMLElement>(":scope > [data-swap=sai]")
    const entra = el?.querySelector<HTMLElement>(":scope > [data-swap=entra]")
    if (!saindo || !el || !sai || !entra) return
    const herdaFoco = focoNoQueSaiu.current
    focoNoQueSaiu.current = false
    // Antes de medir: o foco ainda está no miolo que virou inerte, ou estava no que desmontou.
    if (herdaFoco || sai.contains(el.ownerDocument.activeElement)) {
      entra.querySelector<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")?.focus()
    }
    const repouso = () => {
      progresso.current = 0
      el.style.transform = ""
      pintarMiolo(sai, null)
      pintarMiolo(entra, null)
    }
    if (reduzido || el.offsetWidth === 0) {
      repouso()
      setSaindo(null)
      return
    }
    // Interrompida depois do meio, a troca nova parte do espelho (`1 − p`): o
    // vidro está no mesmo afundar (`sen(πp) = sen(π(1 − p))`).
    progresso.current = Math.max(0, Math.min(progresso.current, 1 - progresso.current))
    const p0 = progresso.current
    // Cada miolo parte de onde estava (o repouso do papel, se nada estava
    // escrito: o que sai inteiro, o que entra apagado) e se mistura ao quadro
    // da troca no primeiro quarto dela: os papéis não são simétricos, e partir
    // do quadro de `p0` pularia.
    const repousoDosPapeis = quadroDaTroca(0, true)
    const deSai = lerMiolo(sai, repousoDosPapeis.sai)
    const deEntra = lerMiolo(entra, repousoDosPapeis.entra)
    let passou = false
    const quadro = (p: number) => {
      progresso.current = p
      const f = quadroDaTroca(p, true)
      const t = suave(p, [p0, p0 + 0.25])
      if (afundar) el.style.transform = "scale(" + f.escala + ")"
      pintarMiolo(sai, misturar(deSai, f.sai, t))
      pintarMiolo(entra, misturar(deEntra, f.entra, t))
      if (!passou && p >= 0.5) {
        passou = true
        setPassouDoMeio(true)
      }
    }
    quadro(p0)
    let ativa = true
    const controle = animate(progresso.current, 1, { ...MOLA, onUpdate: quadro })
    controle.then(() => {
      if (!ativa) return
      // O desmonte antes do repouso, no mesmo quadro (`flushSync`): limpar
      // primeiro devolvia o miolo que saía inteiro por um quadro, até o
      // React desmontá-lo numa tarefa seguinte, depois da pintura.
      flushSync(() => {
        setSaindo(null)
        setPassouDoMeio(false)
      })
      repouso()
    })
    return () => {
      ativa = false
      controle.stop()
    }
  }, [saindo, reduzido, afundar])

  return (
    <span ref={vidro} className={className} {...props}>
      <TopBarSwapContext value>
        {/* As duas camadas na mesma célula da grade, e na ordem fixa (a que sai
            primeiro): a reconciliação por chave não move o miolo que entra, e
            o foco dele não cai (quem desmonta com o foco o passa adiante pelo
            `guardarFoco`). A que sai pinta por cima (`z-10`). */}
        {saindo ? (
          <span
            key={saindo.chave}
            data-swap="sai"
            aria-hidden
            inert
            className="pointer-events-none z-10 grid place-items-center [grid-area:1/1]"
          >
            {saindo.filho}
          </span>
        ) : null}
        <span key={swapKey} ref={guardarFoco} data-swap="entra" className="grid place-items-center [grid-area:1/1]">
          {children}
        </span>
      </TopBarSwapContext>
    </span>
  )
}

/** Onde a cápsula cola, por extenso (classe montada não chega ao CSS). */
const CAPSULA_COLA = {
  always: "rounded-full ring-1 ring-foreground/10 *:ring-0!",
  desktop: "md:rounded-full md:ring-1 md:ring-foreground/10 md:*:ring-0! max-md:gap-1 max-md:*:rounded-full!",
  phone: "max-md:rounded-full max-md:ring-1 max-md:ring-foreground/10 max-md:*:ring-0! md:gap-1 md:*:rounded-full!",
} as const

/**
 * Ações da barra numa cápsula só: `TopBarAction plate` lado a lado, colados pelo
 * `ButtonGroup` (os cantos de dentro achatados), sem o divisor dele e sem a
 * sobreposição de 1px. O anel é um só, o do grupo: o de cada botão desenhava uma
 * linha na emenda. `join` diz onde cola, para quando um dos botões só existe num
 * lado da quebra (`md:hidden`, `max-md:hidden`): do outro lado o que sobra fica
 * um círculo solto, com o próprio anel. A busca compacta do app (lupa e sino) a
 * veste.
 * `morph` é a cápsula do telefone, `[lupa | filtro]`, que aceita um ou dois
 * filhos: com um, o círculo do primeiro; com dois, a cápsula. O segundo entra
 * e sai pingando da lupa (`CapsulaQuePinga`), e `trailingKey` é a identidade
 * dele (`"month"`, `"filter"`): mudá-la com os dois presentes troca o miolo
 * no lugar, sem mexer na forma.
 */
function TopBarActionGroup({
  join = "always",
  morph = false,
  trailingKey,
  className,
  ...props
}: ButtonGroupProps & {
  /** Onde os botões colam: sempre, só do `md` para cima ou só no telefone. */
  join?: keyof typeof CAPSULA_COLA
  /** A cápsula que pinga: o segundo filho entra e sai como uma gota da lupa. */
  morph?: boolean
  /** Com `morph`, a identidade do segundo filho; trocá-la troca o miolo dele no lugar. */
  trailingKey?: string
}) {
  const classe = cn("*:before:hidden *:ml-0!", CAPSULA_COLA[join], className)
  if (morph) return <CapsulaQuePinga data-join={join} trailingKey={trailingKey} className={classe} {...props} />
  return <ButtonGroup data-slot="top-bar-action-group" data-join={join} className={classe} {...props} />
}

/**
 * Escreve um quadro da gota nos dois vidros e no miolo do filtro — nunca no
 * grupo, que é ancestral dos dois (um `transform` ali desligaria o
 * `backdrop-filter`); dele só sai o anel, que contornaria a cápsula inteira
 * em volta de uma gota que ainda não chegou. `k` leva os 44 do quadro ao
 * vidro de verdade (36 no desktop do catálogo).
 * A lupa anda (`translateX`) e o recorte arredonda os cantos da direita dela
 * com a emenda. A gota é o próprio vidro do filtro, levado ao centro e ao raio
 * do quadro por `translate`/`scale`, recortado onde cairia dentro da lupa
 * (vidro sobre vidro pintaria duas vezes) e com a emenda nos cantos da
 * esquerda — R com a gota solta (dois círculos que se tocam), 0 com a cintura
 * cheia (a costura reta da cápsula); a emenda da gota é dividida pela escala
 * dela, e só o raio horizontal encolhe quando a fatia visível é mais estreita
 * que ele (como em `quadroDasBolhas`). A costura cai num pixel do aparelho, a
 * mesma para os dois. No passe da mola a gota acompanha a lupa, para a costura
 * não abrir. O recorte tira o anel, e a silhueta vem da tinta do voo, que some
 * na chegada à cápsula, antes de o anel do grupo voltar.
 */
function desenharGota(
  grupo: HTMLElement,
  lupa: HTMLElement,
  gota: HTMLElement,
  miolo: HTMLElement,
  g: number,
  k: number,
  dpr: number
) {
  const f = quadroDaGotaDoFiltro(g)
  const R = GOTA_R * k
  const H = GOTA_H * k
  const lupaDx = Math.round(f.lupaDx * k * dpr) / dpr
  const costura = lupaDx + H
  const s = f.gota.r / GOTA_R
  const cx = f.gota.cx * k + Math.min(0, lupaDx)
  const emenda = R * (1 - f.cintura)
  const emendaDaGota = Math.min(R, emenda / s)
  // Onde a lupa acaba, nas coordenadas da gota antes do `transform`; passada a caixa, não sobra nada.
  const corte = Math.min(H, Math.max(0, R + (costura - cx) / s))
  const cabe = Math.min(1, (H - corte) / (R + emendaDaGota))
  grupo.style.boxShadow = "none"
  lupa.style.transform = "translateX(" + lupaDx + "px)"
  lupa.style.clipPath = "inset(0px round " + R + "px " + emenda + "px " + emenda + "px " + R + "px)"
  gota.style.transform = "translateX(" + (cx - H - R) + "px) scale(" + s + ")"
  gota.style.clipPath =
    "inset(0px 0px 0px " + corte + "px round " +
    emendaDaGota * cabe + "px " + R * cabe + "px " + R * cabe + "px " + emendaDaGota * cabe + "px / " +
    emendaDaGota + "px " + R + "px " + R + "px " + emendaDaGota + "px)"
  const tinta = "color-mix(in oklab, var(--foreground) " + TINTA_DO_VOO * (1 - suave(g, [0.85, 1])) + "%, transparent)"
  lupa.style.backgroundImage = gota.style.backgroundImage = "linear-gradient(" + tinta + ", " + tinta + ")"
  pintarMiolo(miolo, f.icone)
}

/** A cápsula pronta: nada inline nos dois vidros, no miolo nem no grupo. */
function gotaEmRepouso(grupo: HTMLElement, lupa: HTMLElement, gota: HTMLElement, miolo: HTMLElement) {
  grupo.style.boxShadow = ""
  lupa.style.transform = lupa.style.clipPath = lupa.style.backgroundImage = ""
  gota.style.transform = gota.style.clipPath = gota.style.backgroundImage = ""
  pintarMiolo(miolo, null)
}

/**
 * A cápsula que pinga, o `TopBarActionGroup morph`: a lupa (o primeiro filho,
 * o próprio vidro dele) e a gota do filtro (o segundo, dentro de um vidro do
 * grupo, com o miolo que troca). A ordem é `[lupa | filtro]`, e a ponta
 * direita fica parada: o pixel da lupa sozinha é o da ponta da cápsula.
 * Quando o segundo aparece, `g` vai de 0 a 1 na `MOLA`, e cada quadro
 * (`quadroDaGotaDoFiltro`) é escrito pelo `desenharGota`; quando some, o
 * grupo o segura montado, inerte e escondido do leitor, roda `g` de 1 a 0 e
 * só então o desmonta. Montar não anima (`g` nasce no destino). Interromper
 * parte do `g` guardado: tudo é função dele, e a mola segue de onde está.
 * Sem caixa (a árvore do telefone escondida) ou com movimento reduzido, na
 * hora; no fim, nada inline.
 */
function CapsulaQuePinga({
  trailingKey,
  children,
  ...props
}: ButtonGroupProps & { trailingKey?: string }) {
  const reduzido = useReducedMotion()
  const grupo = React.useRef<HTMLDivElement>(null)
  // Os filhos como vieram (`toArray` clonaria, e a identidade do segundo é o que diz se ele mudou).
  const [lupa, filtro] = Array.isArray(children) ? children : [children]
  const temFiltro = filtro != null && filtro !== false
  const chave = trailingKey ?? "filtro"
  // Onde a gota está: 0 a lupa sozinha, 1 a cápsula; no meio, de onde a próxima mola parte.
  const g = React.useRef(temFiltro ? 1 : 0)
  // O segundo que está no DOM: o de agora, ou o que saiu, segurado até a lupa o reabsorver.
  const [segundo, setSegundo] = React.useState<Miolo | null>(temFiltro ? { chave, filho: filtro } : null)
  if (temFiltro && (!segundo || segundo.chave !== chave || segundo.filho !== filtro)) {
    setSegundo({ chave, filho: filtro })
  }
  const alvo = temFiltro ? 1 : 0

  React.useLayoutEffect(() => {
    const el = grupo.current
    const lupaEl = el?.firstElementChild as HTMLElement | null
    const gota = el?.querySelector<HTMLElement>(":scope > [data-slot=top-bar-action-drop]")
    const miolo = gota?.firstElementChild as HTMLElement | null
    if (!el || !lupaEl || !gota || !miolo || g.current === alvo) return
    // O segundo que sai com o foco dentro (a folha dele fechou e devolveu o
    // foco ao gatilho) o passa à lupa antes de a gota ficar inerte — inerte,
    // o foco cairia no `body`.
    if (alvo === 0 && gota.contains(el.ownerDocument.activeElement)) lupaEl.focus()
    const repouso = () => {
      g.current = alvo
      gotaEmRepouso(el, lupaEl, gota, miolo)
    }
    if (reduzido || lupaEl.offsetWidth === 0) {
      repouso()
      if (alvo === 0) setSegundo(null)
      return
    }
    const k = lupaEl.offsetWidth / GOTA_H
    const dpr = el.ownerDocument.defaultView?.devicePixelRatio || 1
    const quadro = (x: number) => {
      g.current = x
      desenharGota(el, lupaEl, gota, miolo, x, k, dpr)
    }
    quadro(g.current)
    let ativa = true
    const controle = animate(g.current, alvo, { ...MOLA, onUpdate: quadro })
    controle.then(() => {
      if (!ativa) return
      // Ao sair, o desmonte antes do repouso, no mesmo quadro (`flushSync`):
      // limpar primeiro pintava a cápsula inteira por um quadro, com a lupa
      // 44px à esquerda, até o React desmontar a gota depois da pintura. Sem
      // a gota, a lupa sem `translate` é o mesmo pixel.
      if (alvo === 0) flushSync(() => setSegundo(null))
      repouso()
    })
    return () => {
      ativa = false
      controle.stop()
    }
  }, [alvo, reduzido])

  return (
    <ButtonGroup ref={grupo} data-slot="top-bar-action-group" {...props}>
      {lupa}
      {segundo ? (
        <span
          data-slot="top-bar-action-drop"
          inert={!temFiltro || undefined}
          aria-hidden={!temFiltro || undefined}
          // A caixa é a do botão de dentro (44 no telefone, 36 no desktop do catálogo), como a lupa.
          className={cn("relative grid shrink-0 place-items-center", !temFiltro && "pointer-events-none", TOP_BAR_PLATE, REALCE_DO_VIDRO_NO_MIOLO)}
        >
          <MioloQueTroca swapKey={segundo.chave} afundar={false} className="grid place-items-center">
            {segundo.filho}
          </MioloQueTroca>
        </span>
      ) : null}
    </ButtonGroup>
  )
}

/**
 * O vidro do campo da paleta (`searchFieldSurfaceClassName.plate`): o anel de
 * 1px sobre a tinta flutuante, por extenso (classe montada não chega ao CSS).
 * A lupa o veste, no telefone também (rodada 329).
 */
const TOP_BAR_SEARCH_PLATE =
  "ring-1 ring-foreground/10 bg-popover/85 glass-surface supports-backdrop-filter:bg-popover/60 reduced-transparency:bg-popover"

/**
 * O botão de ação no mesmo vidro da busca, como o de recolher da barra lateral
 * (`SIDEBAR_TRIGGER_FLOATING`): o vidro vai até o anel (`bg-clip-border`) e o
 * realce é o das carteiras, `--sidebar-accent` a 50%. Vale em todo tamanho: no
 * telefone os botões da barra são os mesmos círculos de vidro do desktop
 * (rodada 329). Exportado como `topBarPlateClassName` para o voltar do telefone
 * (`PageHeaderBack`) vestir o mesmo vidro sem copiar a receita.
 */
const TOP_BAR_PLATE =
  "ring-1 ring-foreground/10 bg-popover/85 glass-surface supports-backdrop-filter:bg-popover/60 reduced-transparency:bg-popover rounded-full bg-clip-border [--button-hover-fill:color-mix(in_oklab,var(--sidebar-accent)_50%,transparent)]"

/** As classes por extenso: classe montada em tempo de execução não chega ao CSS. */
const BUSCA_QUEBRA = {
  md: { icone: "md:hidden", pilula: "hidden md:flex" },
  lg: { icone: "lg:hidden", pilula: "hidden lg:flex" },
} as const

/**
 * O gatilho de busca: a pílula com a tecla a partir da quebra, e o ícone abaixo
 * dela (as duas formas de uma peça). É um `button` com cara de campo, e não um
 * `input`: focá-lo não deixa digitar, e quem recebe o texto é a paleta que ele
 * abre. Os atalhos são dele (`listen`): `shortcut` (⌘K) em qualquer lugar, e `/`
 * fora de campo de texto. Quem já escuta o atalho (a paleta do app) passa
 * `listen={false}`, e a tecla continua só desenhada.
 */
function TopBarSearch({
  onOpen,
  label = "Buscar",
  placeholder = "Buscar…",
  shortcut = "mod+k",
  slash = true,
  listen = true,
  collapse = "md",
  glow = false,
  plate = false,
  className,
}: {
  onOpen: () => void
  /** O nome dos dois botões. */
  label?: string
  /** O que a pílula diz; aceita nó, para a frase que troca do catálogo. */
  placeholder?: React.ReactNode
  shortcut?: string
  /** `/` também abre, fora de campo de texto. */
  slash?: boolean
  /** Escuta os atalhos. `false` quando a tela já escuta. */
  listen?: boolean
  /** Abaixo de onde a pílula vira ícone. */
  collapse?: "md" | "lg"
  /** O brilho de marca na borda da pílula (uma por tela). */
  glow?: boolean
  /** O vidro do campo do `CommandDialog` (a superfície `plate` da busca) no lugar do campo. */
  plate?: boolean
  className?: string
}) {
  const abrir = React.useRef(onOpen)
  React.useEffect(() => {
    abrir.current = onOpen
  }, [onOpen])
  React.useEffect(() => {
    if (!listen) return
    const tecla = (e: KeyboardEvent) => {
      const barra = slash && e.key === "/" && !isEditableTarget(e.target)
      if (!barra && !matchShortcut(shortcut, e)) return
      e.preventDefault()
      abrir.current()
    }
    document.addEventListener("keydown", tecla)
    return () => document.removeEventListener("keydown", tecla)
  }, [listen, shortcut, slash])

  const brilho = useBrandGlow<HTMLDivElement>(glow)
  const atalhos = [ariaShortcut(shortcut), slash ? "/" : null].filter(Boolean).join(" ")
  const comum = {
    type: "button" as const,
    onClick: onOpen,
    "aria-haspopup": "dialog" as const,
    "aria-keyshortcuts": atalhos,
    "aria-label": label,
  }
  return (
    <>
      <Button
        {...comum}
        variant="tertiary"
        size="icon-lg"
        data-slot="top-bar-search"
        // `relative` ancora o alvo de toque no botão; sem ele o `::after` se estenderia
        // pela barra inteira e engoliria o toque no ☰ do telefone.
        className={cn(
          "relative rounded-full text-muted-foreground pointer-coarse:after:absolute pointer-coarse:after:-inset-0.5 pointer-coarse:after:content-['']",
          // No telefone, a régua do `TopBarAction`: 44, com o ícone a 20.
          "max-md:size-11 max-md:[&_svg]:size-5",
          BUSCA_QUEBRA[collapse].icone,
          plate && TOP_BAR_SEARCH_PLATE
        )}
      >
        {/* `size-4` explícito: sem ele a regra do `Button` para ícone sem tamanho
            (mais específica) vencia o `max-md:[&_svg]:size-5`. */}
        <MagnifyingGlassIcon className="size-4 opacity-70" aria-hidden />
      </Button>
      <div
        ref={brilho}
        className={cn(
          "relative isolate w-full min-w-0 rounded-full",
          glow && "brand-glow",
          BUSCA_QUEBRA[collapse].pilula,
          className
        )}
      >
        <Button
          {...comum}
          variant="tertiary"
          data-slot="top-bar-search"
          className={cn(
            searchFieldShapeClassName,
            searchFieldSizeClassName.lg,
            searchFieldSurfaceClassName[plate ? "plate" : "field"],
            // O fio do vidro mora dentro da caixa, na borda do botão, e não no `ring-1` (que
            // pinta 1px por fora e cobria metade do arco de 2px do brilho de marca). O vidro
            // vai até a borda: com o fundo no `padding-box`, sobrava 1px vazado.
            plate && "bg-clip-border ring-0 border-foreground/10",
            "w-full justify-start font-normal text-muted-foreground",
            // A pílula não realça nem acende o texto: é um campo, e campo não muda de cor no cursor.
            "[--button-hover-fill:transparent] dark:[--button-hover-fill:transparent]",
            "hover:text-muted-foreground active:text-muted-foreground aria-expanded:text-muted-foreground"
          )}
        >
          <MagnifyingGlassIcon className={searchFieldIconClassName} aria-hidden />
          <span aria-hidden className="min-w-0 flex-1 truncate text-left">
            {placeholder}
          </span>
          {shortcut ? (
            <Kbd keys={shortcut} aria-hidden className={searchFieldShortcutClassName} />
          ) : null}
        </Button>
      </div>
    </>
  )
}

/**
 * A barra esperando: a ponta, o título e as ações, na altura do degrau. É o
 * `TopBar` estático, para medir igual.
 */
function TopBarSkeleton({
  size = "sm",
  actions = 2,
  start = true,
  className,
}: {
  size?: "sm" | "md" | "lg"
  actions?: number
  start?: boolean
  className?: string
}) {
  return (
    <SkeletonGroup
      data-slot="top-bar-skeleton"
      label="Carregando a barra…"
      className={cn(topBarVariants({ size, position: "static" }), className)}
    >
      {start ? <Skeleton className="size-7 shrink-0 rounded-full" /> : null}
      <Skeleton shape="text" className="w-32" />
      <div className="ms-auto flex shrink-0 items-center gap-2">
        {Array.from({ length: actions }, (_, i) => (
          <Skeleton key={i} className="size-7 rounded-full" />
        ))}
      </div>
    </SkeletonGroup>
  )
}

/**
 * O fio de carregamento, na aresta de baixo da barra: com `value`, a proporção;
 * sem ele, indeterminado (`@utility top-bar-progress`). É `role="progressbar"`, com nome.
 */
function TopBarProgress({
  value,
  label = "Carregando",
  className,
}: {
  value?: number
  label?: string
  className?: string
}) {
  const determinado = typeof value === "number"
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={determinado ? 0 : undefined}
      aria-valuemax={determinado ? 100 : undefined}
      aria-valuenow={determinado ? Math.round(value) : undefined}
      data-slot="top-bar-progress"
      className={cn("pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden", className)}
    >
      <div
        className={cn(
          "h-full bg-primary-accent",
          determinado
            ? "origin-left transition-[scale] duration-(--duration-base) ease-(--ease-out)"
            : "top-bar-progress w-2/5"
        )}
        style={determinado ? { scale: Math.min(100, Math.max(0, value)) / 100 + " 1" } : undefined}
      />
    </div>
  )
}

export {
  TopBar,
  TopBarAction,
  TopBarActionGroup,
  TopBarActionSwap,
  TopBarActions,
  TopBarContent,
  TopBarProgress,
  TopBarSearch,
  TopBarSkeleton,
  TopBarStart,
  TopBarTitle,
  TOP_BAR_PLATE as topBarPlateClassName,
  topBarVariants,
}
