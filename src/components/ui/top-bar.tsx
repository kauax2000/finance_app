"use client"

import * as React from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { tagChipUnreadCount } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { useViewportWindow } from "@/hooks/use-mobile"
import { usePageTitleDock } from "@/hooks/use-page-title-dock"
import { barSurfaceClassName } from "@/lib/glass-classes"
import { alvoDaRolagem, proximoEscondido } from "@/lib/hide-on-scroll"
import {
  searchFieldIconClassName,
  searchFieldShapeClassName,
  searchFieldShortcutClassName,
  searchFieldSizeClassName,
  searchFieldSurfaceClassName,
} from "@/lib/search-field-classes"
import { ariaShortcut, isEditableTarget, matchShortcut } from "@/lib/shortcut"
import { cn } from "@/lib/utils"

/**
 * A barra do topo da janela.
 *
 * `PageHeader` é o topo **de dentro** da tela, e `DialogHeader`/`CardHeader`
 * são o topo de uma superfície. Esta é a barra que fica parada enquanto a tela
 * rola — e ela existia escrita à mão duas vezes: o `AppHeader` do produto e o
 * `DsTopBar` do catálogo, já divergentes em borrão, camada e altura.
 *
 * **A altura é do `<header>`, com o fio e a área segura dentro.** O degrau
 * publica `--top-bar-h`, `fixed` publica `--top-bar-safe`, e a caixa é a soma
 * das duas em `border-box`. Assim o total no telefone é exatamente
 * `--mobile-header-offset` — o `AppHeader` media o fio **por fora**, e o
 * conteúdo começava 1px debaixo dele.
 *
 * **`sticky` mora em `--z-sticky`, e não em `--z-header`.** A faixa de aviso
 * (`offline-banner`) é `fixed md:top-0` em `--z-banner` e cobre a barra do
 * desktop de propósito; a 40 a barra a esconderia. `fixed` é o telefone, onde a
 * faixa desce para baixo da barra, e ali ela vai a `--z-header`.
 *
 * **O fio lê `--sidebar-inset-rule`**, que o `SidebarInset` publica: numa
 * `Sidebar` `floating` a placa não tem `border-r` para ele encostar, e ele
 * sumiria em vez de ficar pendurado. Fora de um `SidebarInset`, 1px.
 *
 * O padrão é `sm`: **48 no telefone e no desktop**, um tamanho só, com a
 * barra lateral aberta ou recolhida — decisão do dono. No telefone a área
 * segura soma por dentro. O que anima é o fundo, quando o vidro acende, na
 * curva da casa.
 */
const topBarVariants = cva(
  [
    "flex w-full min-w-0 shrink-0 items-center gap-2",
    // A área segura por variável (`--top-bar-safe-area`), e não `env()` cru:
    // a prévia num iPhone do catálogo é um iframe, onde `env()` vale zero, e
    // só uma variável ela consegue emular.
    "[--top-bar-safe-area:env(safe-area-inset-top,0px)]",
    "h-[calc(var(--top-bar-h)+var(--top-bar-safe,0px))] pt-[var(--top-bar-safe,0px)]",
    "border-b border-b-[length:var(--sidebar-inset-rule,1px)] border-border",
    // **O fio só ao rolar** (rodada 237): no `scroll`, ele aparece junto com o
    // vidro — em repouso a barra é a página, e o fio sobre nada é ruído.
    "data-[scrolled=false]:border-b-transparent",
    // **Some ao rolar** (rodada 237): no telefone, a barra sobe inteira — a
    // área segura e a calha da flutuante junto.
    "max-md:data-hidden:-translate-y-[calc(100%+var(--top-bar-safe-area)+--spacing(4))]",
    // **O título no meio** (rodada 237), no telefone: uma grade de três áreas
    // com as pontas iguais, para o título ficar no meio da tela, e não do vão.
    "data-[title-align=center]:max-md:grid data-[title-align=center]:max-md:grid-cols-[minmax(0,1fr)_minmax(0,max-content)_minmax(0,1fr)] data-[title-align=center]:max-md:[grid-template-areas:'start_title_actions']",
    // O borrão do `backdrop-filter` ignora o recorte de todo ancestral no
    // Chromium — `overflow-hidden`, `clip-path`, máscara e `contain: paint`,
    // os quatro medidos — e só respeita o raio do **próprio** elemento. Quem põe
    // a barra no topo de uma caixa arredondada publica `--top-bar-r` (a moldura
    // do catálogo publica); fora disso, 0.
    "rounded-t-[var(--top-bar-r,0px)]",
    "transition-[background-color,border-color,translate] duration-(--duration-slow) ease-(--ease-emphasized)",
  ],
  {
    variants: {
      size: {
        sm: "[--top-bar-h:3rem]",
        md: "[--top-bar-h:3.5rem]",
        // **O degrau `lg`** (rodada 237): 64, a barra das páginas públicas e
        // de marca. O título fica no corpo da barra; a marca é que cresce.
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
      },
      /**
       * **A flutuante** (rodada 237): a pílula solta da casa — a placa, o anel
       * de 1px e a sombra, a 8px das bordas —, a família do `Tabs` e do
       * `Sidebar` flutuantes. A área segura sai de dentro da caixa e vai para a
       * distância do topo: a pílula desce inteira abaixo do notch.
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

type TopBarSurface = "solid" | "glass" | "scroll"

/**
 * O que acontece na rolagem: se o conteúdo saiu do topo (o vidro e o fio do
 * `scroll`) e se a barra deve sumir (`hideOnScroll`).
 *
 * Quem faz o conteúdo passar por baixo de uma barra `sticky` é o ancestral que
 * rola — a janela, no app; uma região rolável, na moldura do catálogo ou numa
 * coluna de painel. Por isso a escuta é em **captura** na janela, e o alvo é
 * decidido a cada evento: vale a janela, ou um ancestral da barra. Uma lista
 * rolando **dentro** da tela não é ancestral, e não acende nada.
 *
 * Resolver o ancestral uma vez, na montagem, foi a primeira versão, e falhou
 * medida: dentro da moldura o CSS chega depois do efeito, o `overflow` ainda
 * lia `visible`, e a barra passava a escutar a janela errada para sempre.
 *
 * **Sumir** é rolar para baixo passada a altura da barra; voltar é rolar para
 * cima. Nunca com o foco dentro dela — quem está num campo da barra não pode
 * vê-lo fugir —, e quem decide que só vale no telefone é o CSS (`max-md:`).
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
        // Os valores entram já lidos: o React pode rodar o atualizador depois
        // de `antes` virar `y`, e aí não haveria movimento nenhum.
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
  ...props
}: React.ComponentProps<"header"> &
  Omit<VariantProps<typeof topBarVariants>, "surface"> & {
    /** `scroll` é `solid` até o conteúdo rolar por baixo, e `glass` depois. */
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
      />
    </TopBarContext>
  )
}

/**
 * **Uma árvore para os dois tamanhos** (rodada 237): toda ponta aceita
 * `phone`, o que ela mostra abaixo de `md`. Sem ele, a ponta é a mesma nas
 * duas larguras; com `phone={null}`, ela some no telefone. A barra do app
 * escrevia duas árvores inteiras, uma `md:hidden` e outra `hidden
 * md:contents`.
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
      // Quando o gatilho da barra lateral vai para dentro dela e esta ponta
      // fica vazia, ela devolve o `gap` da barra, e o título encosta na calha
      // deslizando, no passo da vaga que encolhe.
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
 * mostra; `asChild` para quando a tela já tem o seu.
 *
 * Fica cru, e não sobre `H4`: o átomo traria corpo, peso e entrelinha que os
 * três seriam anulados aqui — é a mesma conta do `CardTitle`.
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
   * **O título que sobe** (rodada 232): quando o título de um `PageHeader
   * collapse` rola para baixo da barra, ele aparece aqui — subindo 6px e
   * acendendo —, e o que a barra mostrava (`children`) cede o lugar. Ao
   * voltar, desce. É o título grande do iOS. O texto que sobe é
   * `aria-hidden`: o `<h1>` da página continua sendo o nome dela.
   */
  pageTitle?: boolean
  /** O título abaixo de `md`; `null` o esconde no telefone. */
  phone?: React.ReactNode
  /**
   * **Tocar no título sobe ao topo** (rodada 237), no telefone — o gesto da
   * barra de status do iOS. É um atalho a mais, e não o único caminho: o
   * título continua um `<h1>`, sem papel de botão.
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
 * **A ação da barra** (rodada 237): o botão de ícone com o nome, a dica — com
 * a tecla, se houver atalho — e a contagem. O sino e a busca do app escreviam
 * isso à mão, e a contagem do sino era um `span` posicionado com nove classes.
 *
 * A contagem é `aria-hidden` e entra **no nome** (`countLabel`, ou o número):
 * "Notificações, 3 não lidas". Acima de 99, "99+". No dedo o alvo vai a 44
 * por pseudo-elemento, para a fileira não crescer.
 */
function TopBarAction({
  label,
  count,
  countLabel,
  shortcut,
  tooltip = true,
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
}) {
  const temContagem = typeof count === "number" && count > 0
  const nome = temContagem ? label + ", " + (countLabel ?? count) : label
  const botao = (
    <Button
      variant="tertiary"
      size="icon-md"
      aria-label={nome}
      aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
      data-slot="top-bar-action"
      className={cn(
        "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']",
        className
      )}
      {...props}
    >
      {children}
      {temContagem ? (
        <span
          aria-hidden
          data-slot="top-bar-action-count"
          className={cn(
            "nums absolute top-0 right-0 z-10 flex h-4 min-w-4 translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full px-1 text-2xs leading-none font-semibold ring-2 ring-background",
            tagChipUnreadCount
          )}
        >
          {count > 99 ? "99+" : count}
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

/** As classes por extenso: classe montada em tempo de execução não chega ao CSS. */
const BUSCA_QUEBRA = {
  md: { icone: "md:hidden", pilula: "hidden md:flex" },
  lg: { icone: "lg:hidden", pilula: "hidden lg:flex" },
} as const

/**
 * **O gatilho de busca** (rodada 237): a pílula com a tecla a partir da
 * quebra, e o ícone abaixo dela — as duas formas de uma peça só, porque o
 * catálogo escrevia dois botões e o app um terceiro. É um `button` com cara de
 * campo, e não um `input`: focá-lo não deixa digitar, e quem recebe o texto é
 * a paleta que ele abre.
 *
 * **Os atalhos** são dele (`listen`): `shortcut` (⌘K) em qualquer lugar, e
 * `/` fora de campo de texto. Quem já escuta o atalho — a paleta do app —
 * passa `listen={false}`, e a tecla continua só desenhada.
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
        size="icon-md"
        data-slot="top-bar-search"
        // `relative` ancora o alvo de toque no botão. Sem ele o `::after` se
        // estendia pela barra inteira e engolia o toque no ☰ do telefone.
        className={cn(
          "relative rounded-full text-muted-foreground pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']",
          BUSCA_QUEBRA[collapse].icone
        )}
      >
        <MagnifyingGlassIcon className="opacity-70" aria-hidden />
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
            searchFieldSizeClassName.md,
            searchFieldSurfaceClassName.field,
            "w-full justify-start font-normal text-muted-foreground",
            // A pílula não realça nem acende o texto: é um campo, e campo
            // não muda de cor no cursor.
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
 * **A barra esperando** (rodada 237): a ponta, o título e as ações, na altura
 * do degrau. É o `TopBar` estático, para medir igual.
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
 * **O fio de carregamento** (rodada 237), na aresta de baixo da barra: com
 * `value`, a proporção; sem ele, indeterminado (`@utility top-bar-progress`).
 * É `role="progressbar"`, com nome.
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
  TopBarActions,
  TopBarContent,
  TopBarProgress,
  TopBarSearch,
  TopBarSkeleton,
  TopBarStart,
  TopBarTitle,
  topBarVariants,
}
