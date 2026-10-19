"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "@heroicons/react/16/solid"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { useOverflowActions } from "@/components/ui/toolbar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Caption, H1, Muted } from "@/components/ui/typography"
import { publishPageTitle } from "@/hooks/use-page-title-dock"
import { topBarBottom } from "@/lib/top-bar-bottom"
import { OverflowMenu } from "@/lib/overflow-menu"
import { cn } from "@/lib/utils"

/**
 * O topo de uma tela: uma grade de duas colunas (também no telefone). A trilha,
 * a faixa de fatos e a navegação atravessam as duas; título e ações dividem a
 * linha do meio. No telefone as ações com ícone viram botões só de ícone (o
 * rótulo vira `sr-only` e continua o nome).
 * Sem régua: quem separa o cabeçalho do conteúdo é o respiro.
 * A escada desce por variável (`--page-title`, como `--toolbar-control`) e não
 * por contexto: `in-*` e `group-*` compilam com `:where()`, que perderia para a
 * classe base.
 * É cliente: o título que sobe para a barra, o ⋯, o voltar pelo histórico e a
 * dica do título cortado leem o DOM.
 */
const pageHeaderVariants = cva(
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-4",
  {
    variants: {
      /**
       * O corpo do título. Abaixo de `sm` cada degrau desce um (o `md` do telefone é
       * o `sm`, 20). A entrelinha não entra: `.page-title` declara `1.25` e vence, por
       * estar fora de `@layer`.
       */
      size: {
        sm: "[--page-title:1.125rem] sm:[--page-title:1.5rem]",
        md: "[--page-title:1.25rem] sm:[--page-title:1.875rem]",
        lg: "[--page-title:1.5rem] sm:[--page-title:2.25rem]",
      },
      /** A cascata de entrada — ver `@utility page-header-reveal`. */
      reveal: {
        true: "page-header-reveal",
        false: "",
      },
    },
    defaultVariants: { size: "md", reveal: true },
  }
)

const PageHeaderContext = React.createContext<{ collapse: boolean }>({ collapse: false })

function PageHeader({
  className,
  size,
  reveal,
  collapse = false,
  ...props
}: React.ComponentProps<"header"> &
  VariantProps<typeof pageHeaderVariants> & {
    /**
     * O título sobe para a barra do topo quando rola para baixo dela; a barra mostra
     * com `TopBarTitle pageTitle`.
     */
    collapse?: boolean
  }) {
  const contexto = React.useMemo(() => ({ collapse }), [collapse])
  const ref = React.useRef<HTMLElement>(null)
  useRecuoDoTexto(ref)
  return (
    <PageHeaderContext value={contexto}>
      <header
        ref={ref}
        data-slot="page-header"
        data-size={size ?? "md"}
        className={cn(
          pageHeaderVariants({ size, reveal }),
          // A caixa de linha do título, derivada uma vez. É o que o voltar, a
          // mídia, o adorno e as ações usam para se centrar nela.
          "[--page-title-line:calc(var(--page-title)*1.25)]",
          // A linha do título é o eixo: com sobrancelha ela desce 28px (16 de linha + 12
          // de respiro), e quem se alinha ao título desce junto.
          "has-[[data-slot=page-header-eyebrow]]:[--page-header-lead:1.75rem]",
          className
        )}
        {...props}
      />
    </PageHeaderContext>
  )
}

/**
 * Onde o texto do título começa, publicado em `--page-header-indent`: com voltar
 * e mídia, a faixa de números recua até a coluna do nome. A navegação não: fica
 * na borda. Medido em runtime (o voltar puxa 8px e devolve 6; a mídia varia).
 */
function useRecuoDoTexto(ref: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const raiz = ref.current
    if (!raiz) return
    const medir = () => {
      const texto = raiz.querySelector<HTMLElement>(
        ":scope > [data-slot=page-header-title-row] > [data-slot=page-header-heading]"
      )
      const recuo = texto ? Math.max(0, texto.getBoundingClientRect().left - raiz.getBoundingClientRect().left) : 0
      raiz.style.setProperty("--page-header-indent", `${Math.round(recuo)}px`)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(raiz)
    const mo = new MutationObserver(medir)
    mo.observe(raiz, { childList: true, subtree: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [ref])
}

/**
 * A trilha, acima de tudo e atravessando as duas colunas. `order-first` porque
 * uma tela de detalhe costuma declarar o título antes dela no JSX.
 */
function PageHeaderBreadcrumb({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-breadcrumb"
      className={cn("order-first col-span-full min-w-0", className)}
      {...props}
    />
  )
}

/**
 * A sobrancelha em versalete. Só se paga quando há um rótulo de pai de verdade
 * (a carteira de onde veio, o mês de uma fatura); título que precisa dela para
 * se explicar está mal escrito.
 */
const pageEyebrowClassName =
  "text-2xs font-medium tracking-eyebrow uppercase"

function PageHeaderEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <Caption
      data-slot="page-header-eyebrow"
      // A linha cravada em 16 é o que torna o `--page-header-lead` exato.
      className={cn(pageEyebrowClassName, "leading-4", className)}
      {...props}
    />
  )
}

/**
 * A identidade ao lado do título (`ColorTile`, `Avatar`, ícone), centrada na
 * linha do título e não no bloco. O `-me-1` aproxima o texto dela (12, e não
 * 16), porque ela pertence ao nome.
 */
function PageHeaderMedia({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="page-header-media"
      className={cn(
        "-me-1 mt-[var(--page-header-lead,0px)] flex h-(--page-title-line) shrink-0 items-center self-start",
        className
      )}
      {...props}
    />
  )
}

/**
 * A linha do título: [voltar] · [mídia] · sobrancelha/título [selo]/descrição · [adorno].
 * `back`, `media`, `badge` e `endAdornment` são props porque cada um tem um
 * lugar que a tela erraria. Tudo se centra numa caixa de uma linha de título
 * (`--page-title-line`), descendo `--page-header-lead` com sobrancelha.
 * O selo mora ao lado do título (o estado qualifica o nome): a coluna do texto é
 * uma grade densa, então ele entra logo depois do título sem tirar a descrição
 * do lugar, e o título cortado em `…` o mantém à vista. `endAdornment` é para o
 * que mora na ponta.
 * O par sobrancelha/título/descrição não leva `gap`: quem separa é a entrelinha.
 */
function PageHeaderTitleRow({
  className,
  back,
  backLabel,
  backHistory,
  media,
  badge,
  endAdornment,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** O destino do voltar. Rende o controle compacto na linha do título. */
  back?: string
  backLabel?: string
  /** `false` faz o voltar ser só o link, sem o histórico. */
  backHistory?: boolean
  /** A identidade da tela — `ColorTile`, `Avatar`, ícone. */
  media?: React.ReactNode
  /** O `Badge` de estado ou de tipo, logo depois do título. */
  badge?: React.ReactNode
  /** O que mora na ponta da linha — um link, um rótulo de categoria. */
  endAdornment?: React.ReactNode
}) {
  return (
    <div
      data-slot="page-header-title-row"
      className={cn("flex min-w-0 items-baseline gap-4", className)}
      {...props}
    >
      {back ? (
        // O `-me-1.5` não é gosto: o `gap` é a distância mínima entre caixas, e a caixa
        // do voltar (32) é 8px mais larga que o glifo desse lado.
        <span className="-me-1.5 mt-[var(--page-header-lead,0px)] flex h-(--page-title-line) shrink-0 items-center self-start">
          <PageHeaderBack href={back} label={backLabel} history={backHistory} />
        </span>
      ) : null}
      {media ? <PageHeaderMedia>{media}</PageHeaderMedia> : null}
      <div
        data-slot="page-header-heading"
        className={cn(
          "grid min-w-0 flex-1 grid-flow-row-dense grid-cols-[minmax(0,max-content)_auto_minmax(0,1fr)]",
          // Todo filho ocupa a linha inteira, menos o título e o selo — e o
          // `dense` devolve o selo ao buraco ao lado do título.
          "[&>*]:col-span-full [&>[data-slot=page-header-badge]]:col-span-1 [&>[data-slot=page-header-title]]:col-span-1",
          // O par do telefone mora aqui, e não no selo: o seletor do pai é mais
          // específico que uma classe no filho, e venceria.
          "max-sm:[&>[data-slot=page-header-badge]]:col-span-full",
          // A sobrancelha é a única que abre um bloco: o contêiner diz qual
          // filho muda de assunto, como o `StatCard` faz com a variação.
          "[&>[data-slot=page-header-eyebrow]]:mb-3"
        )}
      >
        {children}
        {badge ? (
          // No telefone o selo desce para baixo da descrição: ao lado do título deixaria o nome em "A…".
          <span
            data-slot="page-header-badge"
            className="ms-3 flex items-center self-center max-sm:ms-0 max-sm:mt-2 max-sm:justify-self-start"
          >
            {badge}
          </span>
        ) : null}
        {endAdornment ? (
          // No telefone o adorno desce para baixo da descrição (na ponta da linha sobram
          // 50px ao nome a 375). São duas cópias que o CSS alterna; a escondida sai da
          // árvore de acessibilidade (`display: none`).
          <span data-slot="page-header-adornment" className="mt-2 flex sm:hidden">
            {endAdornment}
          </span>
        ) : null}
      </div>
      {endAdornment ? (
        // `flex` e não `block`: filho de flex é blocado, e isso faz um `<a>` de 11px
        // medir a caixa de linha inteira (16).
        <span
          data-slot="page-header-adornment"
          className="mt-[var(--page-header-lead,0px)] flex h-(--page-title-line) shrink-0 items-center self-start max-sm:hidden"
        >
          {endAdornment}
        </span>
      ) : null}
    </div>
  )
}

/** O título não cabe na linha: quem pede `truncate` mostra o resto numa dica. */
function useCortado(el: HTMLElement | null, ativo: boolean) {
  const [cortado, setCortado] = React.useState(false)
  React.useEffect(() => {
    if (!ativo || !el) return
    const medir = () => setCortado(el.scrollWidth > el.clientWidth + 1)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el, ativo])
  return ativo && cortado
}

/**
 * O título sobe para a barra: publica o próprio texto e se já passou por baixo
 * dela. O observador mede contra o documento dele (`root: doc`, barra
 * descontada no `rootMargin`), então funciona no iframe da prévia.
 */
function useTituloQueSobe(el: HTMLElement | null, ativo: boolean) {
  React.useEffect(() => {
    if (!ativo || !el) return
    // O documento é o do título — no iframe da prévia, o dele.
    const doc = el.ownerDocument
    if (!doc.querySelector('[data-slot="top-bar"]')) return
    const base = topBarBottom(doc)
    const janela = doc.defaultView
    if (!janela) return
    const io = new janela.IntersectionObserver(
      ([e]) => {
        const acima = e.boundingClientRect.top < (e.rootBounds?.top ?? base)
        publishPageTitle(doc, { text: el.textContent ?? "", docked: !e.isIntersecting && acima })
      },
      { root: doc, rootMargin: `-${base}px 0px 0px 0px` }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      publishPageTitle(doc, null)
    }
  }, [el, ativo])
}

function PageHeaderTitle({
  className,
  asChild = false,
  truncate = false,
  children,
  ...props
}: React.ComponentProps<"h1"> & {
  asChild?: boolean
  /**
   * Uma linha só, com o resto em `…` e o texto inteiro numa dica, que só existe
   * quando ele de fato não coube.
   */
  truncate?: boolean
}) {
  const { collapse } = React.useContext(PageHeaderContext)
  const [el, setEl] = React.useState<HTMLHeadingElement | null>(null)
  const cortado = useCortado(el, truncate)
  useTituloQueSobe(el, collapse)

  const titulo = (
    <H1
      ref={setEl}
      asChild={asChild}
      data-slot="page-header-title"
      // Focável só quando cortado: a dica tem de chegar a quem usa o teclado,
      // e um título inteiro à vista não é parada de Tab.
      tabIndex={cortado ? 0 : undefined}
      // O `H1` traz a família de display, o peso, o tracking e a entrelinha;
      // o corpo vem do degrau declarado pelo `PageHeader`.
      className={cn(
        "text-(length:--page-title)",
        // `text-nowrap!` porque o `.page-title` declara `text-wrap: balance` fora de
        // `@layer`, e isso religa a quebra que o `truncate` desliga.
        truncate && "truncate text-nowrap!",
        cortado && "rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
        className
      )}
      {...props}
    >
      {children}
    </H1>
  )
  if (!cortado) return titulo
  return (
    <Tooltip>
      <TooltipTrigger asChild>{titulo}</TooltipTrigger>
      <TooltipContent className="max-w-sm">{children}</TooltipContent>
    </Tooltip>
  )
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="page-header-description"
      className={cn("max-w-2xl leading-relaxed text-pretty", className)}
      {...props}
    />
  )
}

/**
 * A faixa de fatos sob o título, sem fio: os números ficam como pares em
 * destaque (`PageHeaderStat`), separados por respiro. É um `<dl>` de fábrica;
 * `asChild` troca o elemento.
 */
function PageHeaderMeta({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"dl"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "dl"
  return (
    <Comp
      data-slot="page-header-meta"
      className={cn(
        // Recua até a coluna do nome quando há voltar ou mídia.
        "col-span-full ms-(--page-header-indent) mt-2 flex flex-wrap items-start gap-x-10 gap-y-4 text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Um par da faixa: rótulo sobre valor, o mesmo dado em duas linhas, sem `gap`.
 * Um corpo só para todo valor: o `MoneyDisplay` herda o do par (20px, semibold).
 * O rótulo é texto comum em cinza, não versalete, para não disputar com a
 * sobrancelha. `delta` é o `StatCardDelta` ao lado do valor.
 */
function PageHeaderStat({
  className,
  label,
  delta,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  delta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div data-slot="page-header-stat" className={cn("flex min-w-0 flex-col", className)} {...props}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "nums flex flex-wrap items-center gap-x-2 gap-y-1 [--page-stat-value:var(--text-xl)] text-(length:--page-stat-value) leading-tight font-semibold tracking-tight text-foreground",
          "[&_[data-slot=money-display]]:text-(length:--page-stat-value) [&_[data-slot=money-display]]:leading-tight [&_[data-slot=money-display]]:font-semibold"
        )}
      >
        {children}
        {delta}
      </dd>
    </div>
  )
}

/**
 * A linha de navegação sob o título: abas de rota (`TabsNav`) ou um segmento.
 * Atravessa as duas colunas e encosta na base do cabeçalho.
 */
function PageHeaderNav({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-nav"
      // A navegação não recua: ela é a régua da tela inteira, e começa na borda.
      className={cn("col-span-full min-w-0", className)}
      {...props}
    />
  )
}

/**
 * As ações, à direita da linha do título, também no telefone: abaixo de `sm`
 * todo `Button` com ícone vira quadrado e o rótulo vira `sr-only`.
 * O ⋯ (`overflow="menu"`) é o da `Toolbar`, com outra conta: as ações cabem no
 * cabeçalho menos o que a linha do título ocupa (voltar, mídia, adorno) e menos
 * a reserva do nome (35% da largura, até 240px).
 */
function PageHeaderActions({
  className,
  overflow,
  moreLabel = "Mais ações",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  overflow?: "menu"
  /** O nome do ⋯. */
  moreLabel?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const fora = useOverflowActions(ref, overflow === "menu", CASA_DO_CABECALHO)
  return (
    <div
      ref={ref}
      data-slot="page-header-actions"
      data-overflow={overflow}
      className={cn(
        // Na linha do título, descendo com a sobrancelha como o resto.
        "mt-[var(--page-header-lead,0px)] flex min-h-(--page-title-line) shrink-0 items-center justify-end gap-2 self-start",
        overflow ? "flex-nowrap" : "flex-wrap",
        "max-sm:[&>[data-slot=button]:has(>svg)]:aspect-square max-sm:[&>[data-slot=button]:has(>svg)]:px-0",
        "max-sm:[&>[data-slot=button]:has(>svg)>[data-slot=button-label]]:sr-only",
        className
      )}
      {...props}
    >
      {fora.length ? <OverflowMenu items={fora} label={moreLabel} /> : null}
      {children}
    </div>
  )
}

const CASA_DO_CABECALHO = {
  raiz: "[data-slot=page-header]",
  espaco: (raiz: HTMLElement) => {
    const linha = raiz.querySelector<HTMLElement>(":scope > [data-slot=page-header-title-row]")
    const gap = linha ? parseFloat(getComputedStyle(linha).columnGap) || 0 : 0
    const fixos = linha
      ? [...linha.children]
          .filter((f): f is HTMLElement => f instanceof HTMLElement && f.dataset.slot !== "page-header-heading")
          .filter((f) => f.getClientRects().length > 0)
          .reduce((soma, f) => soma + f.getBoundingClientRect().width + gap, 0)
      : 0
    const nome = Math.min(raiz.clientWidth * 0.35, 240)
    const gapDaGrade = parseFloat(getComputedStyle(raiz).columnGap) || 0
    return raiz.clientWidth - gapDaGrade - fixos - nome
  },
}

/**
 * A pessoa veio de dentro do app? Então voltar é o histórico (a lista volta com
 * filtro e rolagem). A Navigation API diz qual é a entrada anterior; sem ela, o
 * `referrer` da mesma origem é a pista.
 */
function veioDeDentro(): boolean {
  const nav = (window as Window & {
    navigation?: { currentEntry?: { index: number } | null; entries: () => { url: string | null }[] }
  }).navigation
  try {
    if (nav?.currentEntry && nav.currentEntry.index > 0) {
      const anterior = nav.entries()[nav.currentEntry.index - 1]
      return Boolean(anterior?.url) && new URL(anterior.url as string).origin === window.location.origin
    }
    if (nav) return false
    return (
      window.history.length > 1 &&
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin
    )
  } catch {
    return false
  }
}

/**
 * O voltar compacto, `icon-md` (32), o mesmo do `TopBar` no telefone. Quando a
 * pessoa veio de dentro do app o clique é `router.back()`; o `href` fica como
 * saída (link direto, nova aba, ⌘-clique). `history={false}` volta ao link simples.
 * O recuo `-ms-2` existe porque o ícone (16) tem 8px de folga de cada lado: assim
 * o ícone alinha com o texto.
 */
function PageHeaderBack({
  href,
  label = "Voltar",
  history = true,
  className,
}: {
  href: string
  label?: string
  history?: boolean
  className?: string
}) {
  const router = useRouter()
  return (
    <Button
      variant="tertiary"
      size="icon-lg"
      className={cn(
        "relative -ms-2 shrink-0",
        // No dedo o `icon-md` já mede 40 (o piso do `Button`); o pseudo-elemento
        // leva o alvo a 44 sem crescer a caixa. 40 + 4 = 44.
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-0.5 pointer-coarse:after:content-['']",
        // No telefone, a régua das ações da barra do topo: 44, com o ícone a 20.
        "max-md:size-11 max-md:[&_svg]:size-5",
        className
      )}
      asChild
    >
      <Link
        href={href}
        aria-label={label}
        onClick={(e) => {
          if (!history || e.defaultPrevented || e.button !== 0) return
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
          if (!veioDeDentro()) return
          e.preventDefault()
          router.back()
        }}
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
      </Link>
    </Button>
  )
}

/**
 * O esqueleto com a forma do cabeçalho, para os `loading.tsx`: título na altura
 * do degrau, descrição, ações e faixa de pares.
 */
function PageHeaderSkeleton({
  size = "md",
  description = true,
  actions = 1,
  stats = 0,
  className,
}: {
  size?: "sm" | "md" | "lg"
  description?: boolean
  actions?: number
  stats?: number
  className?: string
}) {
  return (
    <SkeletonGroup
      data-slot="page-header-skeleton"
      label="Carregando o cabeçalho…"
      className={cn(
        pageHeaderVariants({ size, reveal: false }),
        "[--page-title-line:calc(var(--page-title)*1.25)]",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex h-(--page-title-line) items-center">
          <Skeleton className="h-[calc(var(--page-title)*0.8)] w-56 max-w-full" />
        </div>
        {description ? <Skeleton shape="text" className="w-80 max-w-full" /> : null}
      </div>
      {actions > 0 ? (
        <div className="flex min-h-(--page-title-line) items-center gap-2 self-start">
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton
              key={i}
              className={cn("size-8 rounded-full", i === actions - 1 && "sm:w-32")}
            />
          ))}
        </div>
      ) : null}
      {stats > 0 ? (
        <div className="col-span-full mt-1 flex flex-wrap gap-x-8 gap-y-3">
          {Array.from({ length: stats }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      ) : null}
    </SkeletonGroup>
  )
}

export {
  PageHeader,
  PageHeaderActions,
  PageHeaderBack,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderMedia,
  PageHeaderMeta,
  PageHeaderNav,
  PageHeaderSkeleton,
  PageHeaderStat,
  PageHeaderTitle,
  PageHeaderTitleRow,
  pageEyebrowClassName,
  pageHeaderVariants,
}
