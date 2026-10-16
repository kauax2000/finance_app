"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { menuPanelSurfaceClassName } from "@/lib/menu-classes"
import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { Button } from "@/components/ui/button"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Caption } from "@/components/ui/typography"
import { useCloseOnScroll } from "@/hooks/use-close-on-scroll"

/**
 * Uma prévia rica ao pousar o cursor; é sempre redundante, porque no toque ela
 * não existe e clicar precisa levar à mesma informação.
 *
 * A superfície repete a do popover (teto `max-h-(--radix-hover-card-content-available-height)`,
 * rolagem e `collisionPadding`); as classes com o nome da primitiva ficam
 * literais em cada arquivo. Atrasos: 400 abre (acima da pausa intencional, sem
 * disparar em toda passagem de cursor) e 200 fecha (tempo de atravessar o vão).
 * O gatilho precisa ser focável (link ou `Button`), porque o Radix também abre
 * no foco. No toque, segurar 500ms abre; `touch={false}` desliga.
 */

const hoverCardContentVariants = cva(
  [
    /** Acima do véu da Sheet (`z-(--z-sheet)`); abaixo do Toaster (`z-(--z-toast)`). */
    "z-(--z-popover) flex flex-col origin-(--radix-hover-card-content-transform-origin)",
    menuPanelSurfaceClassName,
    "text-sm outline-hidden",
    // A casca tem o teto e não rola; quem rola é o `hover-card-viewport`.
    "max-h-(--radix-hover-card-content-available-height) max-w-(--radix-hover-card-content-available-width)",
    // `hover-card-unveil`: sobe 8px saindo de um desfoque, sem pulo — ela chega
    // porque o cursor parou, não por um clique.
    "hover-card-unveil",
  ],
  {
    variants: {
      /** A largura: `sm` um dado só, `md` o par identidade + meta, `lg` um parágrafo (teto; acima disso é página). */
      size: { sm: "w-56", md: "w-64", lg: "w-80" },
      /**
       * O mesmo eixo do `PopoverContent`; `none` zera o `gap` junto. O recuo sai
       * em `--hover-card-pad` e quem o aplica é o viewport, que herda o `gap`.
       */
      padding: {
        default:
          "gap-2.5 [--hover-card-pad:--spacing(2.5)] [--hover-card-strip-px:0px] [--hover-card-strip-py:0px]",
        none: "gap-0 [--hover-card-pad:0px] [--hover-card-strip-px:--spacing(3)] [--hover-card-strip-py:--spacing(2)]",
      },
    },
    defaultVariants: { size: "md", padding: "default" },
  }
)

/**
 * Os vizinhos abrem na hora: enquanto uma prévia do grupo está aberta, e por
 * `skipDelay` depois de a última fechar, as outras abrem sem atraso (o
 * `skipDelayDuration` do `Tooltip`).
 */
const HoverCardGroupContext = React.createContext<{
  aquecido: boolean
  abriu: () => void
  fechou: () => void
} | null>(null)

function HoverCardGroup({
  skipDelay = 300,
  children,
}: {
  /** Quanto tempo depois de a última fechar o grupo continua "aquecido". */
  skipDelay?: number
  children: React.ReactNode
}) {
  const [aquecido, setAquecido] = React.useState(false)
  const abertasRef = React.useRef(0)
  const esfriarRef = React.useRef<number | undefined>(undefined)

  const abriu = React.useCallback(() => {
    abertasRef.current += 1
    window.clearTimeout(esfriarRef.current)
    setAquecido(true)
  }, [])
  const fechou = React.useCallback(() => {
    abertasRef.current = Math.max(0, abertasRef.current - 1)
    if (abertasRef.current > 0) return
    window.clearTimeout(esfriarRef.current)
    esfriarRef.current = window.setTimeout(() => setAquecido(false), skipDelay)
  }, [skipDelay])
  React.useEffect(() => () => window.clearTimeout(esfriarRef.current), [])

  const valor = React.useMemo(
    () => ({ aquecido, abriu, fechou }),
    [aquecido, abriu, fechou]
  )
  return (
    <HoverCardGroupContext.Provider value={valor}>
      {children}
    </HoverCardGroupContext.Provider>
  )
}

/** O que o gatilho precisa da raiz para o toque longo. */
const HoverCardTouchContext = React.createContext<{
  touch: boolean
  abrir: () => void
} | null>(null)

function HoverCard({
  openDelay = 400,
  closeDelay = 200,
  touch = true,
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root> & {
  /** Segurar o gatilho no toque abre a prévia. */
  touch?: boolean
}) {
  const grupo = React.useContext(HoverCardGroupContext)
  const abertaRef = React.useRef(false)

  // A prévia fecha quando a página rola (`useCloseOnScroll`).
  const [open, setOpen] = useCloseOnScroll({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: (proximo: boolean) => {
      // O grupo conta as abertas pela transição, não pelo pedido: o Radix
      // pede `false` de novo para uma que já fechou.
      if (proximo !== abertaRef.current) {
        abertaRef.current = proximo
        if (proximo) grupo?.abriu()
        else grupo?.fechou()
      }
      onOpenChange?.(proximo)
    },
    closed: false,
  })

  const toque = React.useMemo(
    () => ({ touch, abrir: () => setOpen(true) }),
    [touch, setOpen]
  )

  return (
    <HoverCardTouchContext.Provider value={toque}>
      <HoverCardPrimitive.Root
        data-slot="hover-card"
        openDelay={grupo?.aquecido ? 0 : openDelay}
        closeDelay={closeDelay}
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    </HoverCardTouchContext.Provider>
  )
}

/**
 * O gatilho. `variant="inline"` é o nome dentro de um parágrafo, com sublinhado
 * pontilhado. Sem `asChild` ele é um `<button>`: o `<a>` sem `href` do Radix
 * não é focável.
 */
const hoverCardInlineClassName =
  "cursor-default rounded-xs underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/45 data-[state=open]:decoration-foreground"

function HoverCardTrigger({
  variant = "default",
  asChild,
  className,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onClickCapture,
  onContextMenu,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger> & {
  variant?: "default" | "inline"
}) {
  const toque = React.useContext(HoverCardTouchContext)
  const timerRef = React.useRef<number | undefined>(undefined)
  const abriuNoToqueRef = React.useRef(false)
  const ultimoToqueRef = React.useRef(false)

  const cancelar = () => window.clearTimeout(timerRef.current)
  React.useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(e)
      ultimoToqueRef.current = e.pointerType === "touch"
      if (!toque?.touch || e.pointerType !== "touch") return
      abriuNoToqueRef.current = false
      cancelar()
      timerRef.current = window.setTimeout(() => {
        abriuNoToqueRef.current = true
        toque.abrir()
      }, 500)
    },
    onPointerUp: (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerUp?.(e)
      cancelar()
    },
    onPointerLeave: (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerLeave?.(e)
      cancelar()
    },
    onPointerCancel: (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerCancel?.(e)
      cancelar()
    },
    // O soltar do toque longo dispara um clique: engolido, senão o link do
    // gatilho levaria embora a prévia que acabou de abrir.
    onClickCapture: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (abriuNoToqueRef.current) {
        abriuNoToqueRef.current = false
        e.preventDefault()
        e.stopPropagation()
      }
      onClickCapture?.(e)
    },
    // O toque longo também é `contextmenu`: ele é da prévia, não do menu da
    // linha em volta. O botão direito do mouse continua passando.
    onContextMenu: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (toque?.touch && ultimoToqueRef.current) {
        e.preventDefault()
        e.stopPropagation()
      }
      onContextMenu?.(e)
    },
  }
  // O balão "copiar/abrir link" do iOS e a seleção de texto disputariam o gesto.
  const semBalao = toque?.touch && "[-webkit-touch-callout:none] pointer-coarse:select-none"

  if (variant === "inline" && !asChild) {
    return (
      <HoverCardPrimitive.Trigger
        asChild
        data-slot="hover-card-trigger"
        data-variant="inline"
        {...props}
        {...handlers}
      >
        <button
          type="button"
          className={cn(hoverCardInlineClassName, semBalao, className)}
        >
          {children}
        </button>
      </HoverCardPrimitive.Trigger>
    )
  }
  return (
    <HoverCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      data-variant={variant}
      asChild={asChild}
      className={cn(variant === "inline" && hoverCardInlineClassName, semBalao, className)}
      {...props}
      {...handlers}
    >
      {children}
    </HoverCardPrimitive.Trigger>
  )
}

/**
 * Quem rola dentro da casca, pela razão do `popoverViewportClassName`: a seta é
 * um `<span>` absoluto fora da caixa, e o bloco que o contém é a casca (o
 * `backdrop-filter` da placa a faz bloco de contenção mesmo estática). Com a
 * casca rolando, a seta caía no próprio recorte — medido na prévia "Ana Ribeiro"
 * do texto corrido: 6px de rolagem em repouso e a seta invisível. Este nó não
 * pode ganhar `relative`, `transform` nem `filter`.
 */
const hoverCardViewportClassName =
  "flex min-h-0 flex-1 flex-col rounded-[inherit] [gap:inherit] p-(--hover-card-pad) overflow-y-auto overscroll-contain"

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  size,
  padding,
  pending = false,
  children,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content> &
  VariantProps<typeof hoverCardContentVariants> & {
    /** O dado ainda está chegando: mostra o esqueleto da prévia no lugar do conteúdo. */
    pending?: boolean
  }) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        data-padding={padding}
        aria-busy={pending || undefined}
        className={cn(hoverCardContentVariants({ size, padding }), className)}
        {...props}
      >
        <div data-slot="hover-card-viewport" className={hoverCardViewportClassName}>
          {pending ? <HoverCardSkeleton /> : children}
        </div>
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  )
}

/**
 * A seta. Numa prévia sobre uma palavra de um parágrafo ela é o que diz de qual
 * delas o cartão fala. Não leva o anel da casca: o fio passa reto pela base,
 * e dar o anel ao triângulo traçaria uma diagonal dentro dele. `fill-popover` e
 * não `bg-popover`, porque quem pinta um triângulo vetorial é o `fill`.
 */
function HoverCardArrow({
  className,
  width = 12,
  height = 6,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Arrow>) {
  return (
    <HoverCardPrimitive.Arrow
      data-slot="hover-card-arrow"
      width={width}
      height={height}
      className={cn(
        // Os alfas espelham `menuPanelSurfaceClassName` à mão (`fill` não é
        // `background`); o `glass.test.ts` compara os dois.
        "fill-popover/85 supports-backdrop-filter:fill-popover/60 reduced-transparency:fill-popover",
        className,
      )}
      {...props}
    />
  )
}

/**
 * As tiras espelham o `PopoverContent`, sem fio nem tinta. Título sobre
 * descrição é par de identidade (sem `gap`). Sem `shrink-0`: aqui a faixa vive
 * numa linha ao lado de um avatar, e `shrink-0` impediria a quebra horizontal
 * e o texto sairia recortado.
 */
function HoverCardHeader({
  className,
  children,
  endAdornment,
  media,
  ...props
}: React.ComponentProps<"div"> & {
  /** O que fica no canto superior direito (um `Badge` de estado, uma contagem); a grade com `items-start` o prende ao topo. */
  endAdornment?: React.ReactNode
  /** O avatar, o ladrilho ou o ícone antes do par, centrado nas duas linhas. */
  media?: React.ReactNode
}) {
  const pair = <div className="flex min-w-0 flex-col">{children}</div>
  const comGrade = endAdornment != null || media != null

  return (
    <div
      data-slot="hover-card-header"
      className={cn(
        "min-w-0 text-sm",
        comGrade
          ? "grid w-full items-start gap-3"
          : "flex flex-col",
        media != null && endAdornment != null && "grid-cols-[auto_minmax(0,1fr)_auto]",
        media != null && endAdornment == null && "grid-cols-[auto_minmax(0,1fr)]",
        media == null && endAdornment != null && "grid-cols-[minmax(0,1fr)_auto]",
        "px-(--hover-card-strip-px) py-(--hover-card-strip-py)",
        className
      )}
      {...props}
    >
      {media != null ? (
        <div data-slot="hover-card-header-media" className="flex shrink-0 self-center">
          {media}
        </div>
      ) : null}
      {comGrade ? pair : children}
      {endAdornment != null ? (
        <div data-slot="hover-card-header-adornment" className="shrink-0">
          {endAdornment}
        </div>
      ) : null}
    </div>
  )
}

function HoverCardTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="hover-card-title"
      className={cn("font-heading font-medium text-balance", className)}
      {...props}
    />
  )
}

function HoverCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption
      data-slot="hover-card-description"
      className={cn("text-pretty", className)}
      {...props}
    />
  )
}

/**
 * O corpo, a região do meio. Com `padding="none"` cada região é dona do seu
 * respiro; o `py` próprio faz a distância entre regiões (16) ser o dobro da
 * interna (8). Ele não rola: uma prévia que precisa rolar é `Popover`. Em
 * `padding="default"` as variáveis valem zero.
 */
function HoverCardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="hover-card-body"
      className={cn(
        "flex min-w-0 flex-col gap-2",
        "px-(--hover-card-strip-px) py-(--hover-card-strip-py)",
        className
      )}
      {...props}
    />
  )
}

/** Espelho do cabeçalho, e sem fio pela mesma razão. */
function HoverCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="hover-card-footer"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2",
        "px-(--hover-card-strip-px) py-(--hover-card-strip-py)",
        className
      )}
      {...props}
    />
  )
}

/**
 * O caminho do clique ("Ver fatura"): um `Button variant="link"` pequeno no
 * rodapé; quem chama passa o `Link` por `asChild`.
 */
function HoverCardLink({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="hover-card-link"
      variant="link"
      size="sm"
      className={cn("ms-auto px-0", className)}
      {...props}
    />
  )
}

/** O esqueleto da prévia (avatar, par do cabeçalho, uma linha), que o `pending` mostra. */
function HoverCardSkeleton({
  media = true,
  label = "Carregando prévia",
}: {
  media?: boolean
  label?: string
}) {
  return (
    <SkeletonGroup
      label={label}
      data-slot="hover-card-skeleton"
      className="flex flex-col gap-3 px-(--hover-card-strip-px) py-(--hover-card-strip-py)"
    >
      <div className="flex items-center gap-3">
        {media ? <Skeleton shape="circle" size="md" /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <Skeleton shape="text" className="w-2/3" />
          <Skeleton shape="text" className="w-1/2 text-xs" />
        </div>
      </div>
      <Skeleton shape="text" className="w-4/5" />
    </SkeletonGroup>
  )
}

export {
  hoverCardContentVariants,
  HoverCard,
  HoverCardGroup,
  HoverCardLink,
  HoverCardSkeleton,
  HoverCardArrow,
  HoverCardBody,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
}
