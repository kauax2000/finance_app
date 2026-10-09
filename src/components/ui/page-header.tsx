"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "@heroicons/react/16/solid"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { OverflowActionsMenu, useOverflowActions } from "@/components/ui/toolbar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Caption, H1, Muted } from "@/components/ui/typography"
import { publishPageTitle } from "@/hooks/use-page-title-dock"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { useTopBarBottom } from "@/hooks/use-top-bar-bottom"
import { cn } from "@/lib/utils"

/**
 * O topo de uma tela.
 *
 * **Ele era uma linha de flex, e a trilha caía dentro dela.** Medido a 1280px,
 * na demonstração "Completo" da própria página do componente: `sm:flex-row` sem
 * `flex-wrap` punha `PageHeaderBreadcrumb` (618px) **à esquerda** do título, o
 * `PageHeaderTitleRow` saía com **largura 0** e 362px de altura — a descrição
 * quebrando uma palavra por linha — e o título passava por baixo do botão de
 * ação. Hoje é grade. A trilha, a faixa de fatos e a navegação atravessam as
 * duas colunas; título e ações dividem a linha do meio.
 *
 * **A grade tem duas colunas também no telefone** (rodada 232, o "telefone
 * compacto"): as ações ficam na linha do título, e as que têm ícone viram
 * botões só de ícone — o rótulo vira `sr-only` e continua sendo o nome. Antes
 * elas empilhavam embaixo, cada uma numa largura, e o título descia um degrau
 * a menos do que precisava.
 *
 * **Não há régua** (rodada 232): quem separa o cabeçalho do conteúdo é o
 * respiro, como as tiras do `Card` e do `Dialog`. Havia `variant="ruled"`, um
 * fio de 1px embaixo, e ele saiu a pedido do dono: no peso e na cor dos
 * divisores de lista, com uma lista logo abaixo ele lia como mais um divisor, e
 * ninguém via diferença para o `plain`. Nenhuma tela o usava.
 *
 * **A escada desce por variável, e não por contexto React.** `--page-title` é
 * declarada aqui e lida lá embaixo — o mesmo mecanismo de `--toolbar-control`.
 * `in-*` e `group-*` compilam com `:where()`, que não soma especificidade e
 * perderia para a classe base no mesmo elemento. Variável herda e não disputa.
 *
 * **É cliente desde a rodada 232.** Era um dos poucos componentes de `ui/` de
 * servidor; os comportamentos que entraram — o título que sobe para a barra, o
 * ⋯ das ações, o voltar pelo histórico e a dica do título cortado — leem o
 * DOM. Nenhuma tela o importa de um componente de servidor.
 */
const pageHeaderVariants = cva(
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-4",
  {
    variants: {
      /**
       * O corpo do título. Abaixo de `sm` cada degrau **desce um**: o `md` do
       * telefone é o que o `sm` tinha (20), e o `sm` desce a 18 — a linha do
       * título divide a largura com as ações agora.
       *
       * A entrelinha não entra aqui: `.page-title` declara `1.25` e vence, por
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
     * O título sobe para a barra do topo quando rola para baixo dela — o
     * título grande do iOS. A barra mostra com `TopBarTitle pageTitle`.
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
          // **A linha do título é o eixo** (rodada 232): com sobrancelha, ela
          // desce 28px (16 de linha + 12 de respiro), e quem se alinha ao
          // título desce junto. Sem isso o voltar, o adorno e as ações se
          // alinhavam à sobrancelha, e a mídia flutuava no meio do bloco.
          "has-[[data-slot=page-header-eyebrow]]:[--page-header-lead:1.75rem]",
          className
        )}
        {...props}
      />
    </PageHeaderContext>
  )
}

/**
 * Onde o texto do título começa, publicado em `--page-header-indent` (rodada
 * 232): com voltar e mídia, a faixa de números recua até a coluna do nome,
 * em vez de começar sob a seta. A navegação não — ela fica na borda. **Medido, e não cravado**: o
 * voltar puxa 8px para fora e devolve 6, e a mídia pode ser um ladrilho de 36
 * ou um avatar de 40 — um número na classe erraria um dos casos. Sem voltar
 * nem mídia o recuo é zero.
 */
function useRecuoDoTexto(ref: React.RefObject<HTMLElement | null>) {
  useIsomorphicLayoutEffect(() => {
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
 * A trilha, acima de tudo e atravessando as duas colunas.
 *
 * `order-first` porque uma tela de detalhe costuma declarar o título antes da
 * trilha no JSX, e a ordem de leitura da tela é a inversa.
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
 * A sobrancelha em versalete.
 *
 * **Não é enfeite acima de todo título.** Ela só se paga quando há um rótulo de
 * pai de verdade a dizer — a carteira de onde a tela veio, o mês de uma fatura,
 * a marca no índice. Um título que precisa de uma palavra pequena em cima para
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
 * A identidade ao lado do título (rodada 232): o `ColorTile` da categoria, o
 * `Avatar` de quem, o ícone de uma conta. **Centrada na linha do título**, e
 * não no bloco: no meio do bloco ela caía entre a sobrancelha e a descrição e
 * não pertencia a linha nenhuma. O `-me-1` aproxima o texto dela (12, e não
 * os 16 do `gap`), porque ela pertence ao nome.
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
 *
 * `back`, `media`, `badge` e `endAdornment` são props, e não composição,
 * porque cada um tem um lugar que a tela erraria.
 *
 * **Tudo se alinha à linha do título** (rodada 232): o voltar, a mídia e o
 * adorno se centram numa caixa de exatamente uma linha de título
 * (`--page-title-line`), descendo `--page-header-lead` quando há sobrancelha.
 * Antes o adorno alinhava pela linha de base da primeira linha — que, com
 * sobrancelha, é a sobrancelha — e a mídia se centrava no bloco inteiro.
 *
 * **O selo (`badge`) mora ao lado do título**, e não na ponta da linha: o
 * estado qualifica o nome, e na ponta ele encostava nas ações. A coluna do
 * texto é uma grade densa — o título numa coluna que encolhe até zero, o selo
 * na seguinte, e o resto em linha inteira —, então ele entra logo depois do
 * título sem tirar a descrição do lugar, e o título cortado em `…` o mantém à
 * vista. `endAdornment` fica para o que mora na ponta — um link, uma categoria.
 *
 * O par sobrancelha/título/descrição **não leva `gap`**: é o mesmo dado em
 * linhas, e quem o separa é a entrelinha.
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
        // O `-me-1.5` não é compensação de gosto: o `gap` é a distância mínima
        // entre **caixas**, e a caixa do voltar (32) é 8px mais larga que o
        // glifo desse lado. Devolvendo 6 deles, a distância seta→título cai nos
        // mesmos 18px que o cabeçalho do app renderiza.
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
          // No telefone o selo desce para baixo da descrição: ao lado do
          // título, a 375, ele deixava o nome em "A…" — medido.
          <span
            data-slot="page-header-badge"
            className="ms-3 flex items-center self-center max-sm:ms-0 max-sm:mt-2 max-sm:justify-self-start"
          >
            {badge}
          </span>
        ) : null}
        {endAdornment ? (
          // **No telefone o adorno desce para baixo da descrição**: na ponta da
          // linha, ao lado do voltar, da mídia e das ações, ele deixava 50px
          // para o nome a 375 — medido. São duas cópias que o CSS alterna; a
          // escondida sai da árvore de acessibilidade junto (`display: none`).
          <span data-slot="page-header-adornment" className="mt-2 flex sm:hidden">
            {endAdornment}
          </span>
        ) : null}
      </div>
      {endAdornment ? (
        // `flex` e não `block`: um filho de flex é blocado, e é isso que faz
        // um `<a>` de 11px medir a caixa de linha inteira (16) em vez dos 14
        // de uma caixa em linha.
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
 * O título sobe para a barra: ele publica o próprio texto e se já passou por
 * baixo dela. O observador mede contra o documento **dele** (`root: doc`, com
 * a barra descontada no `rootMargin`), então funciona também dentro do iframe
 * da prévia num iPhone.
 */
function useTituloQueSobe(el: HTMLElement | null, ativo: boolean) {
  // O documento é o do título — no iframe da prévia, o dele.
  const ref = React.useMemo(() => ({ current: el }), [el])
  const base = useTopBarBottom(ativo, el, ref)
  React.useEffect(() => {
    if (!ativo || !el || base == null) return
    const doc = el.ownerDocument
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
  }, [el, ativo, base])
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
   * Uma linha só, com o resto em `…` — e o texto inteiro numa dica no cursor
   * e no foco, que só existe quando ele de fato não coube (rodada 232).
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
        // `text-nowrap!` porque o `.page-title` declara `text-wrap: balance`
        // fora de `@layer` — e `text-wrap` religa a quebra que o `truncate`
        // desliga: medido, o título longo saía em quatro linhas.
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
 * A faixa de fatos sob o título — **sem fio desde a rodada 232**: os números
 * ficam como pares em destaque (`PageHeaderStat`), separados por respiro. É um
 * `<dl>` de fábrica, porque o caso comum num app de finanças é termo e valor;
 * `asChild` troca o elemento quando ela carrega outra coisa.
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
 * Um par da faixa (rodada 232): o rótulo e, embaixo, o valor em destaque —
 * rótulo sobre valor é o mesmo dado em duas linhas, sem `gap`.
 *
 * **Um corpo só para todo valor**: o `MoneyDisplay` traz o próprio `text-sm`,
 * e na primeira versão o dinheiro saía em 14px ao lado de um "42" em 18. Aqui
 * ele herda o corpo do par (20px, semibold), como no `StatCardValue`. O rótulo
 * é texto comum em cinza, e não versalete: a sobrancelha do título já fala em
 * caixa alta, e três rótulos espaçados disputavam com ela. `delta` é a
 * variação ao lado do valor — o `StatCardDelta`, com a seta e o tom de estado.
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
 * A linha de navegação sob o título (rodada 232): abas de rota (`TabsNav`) ou
 * um segmento. Atravessa as duas colunas e encosta na base do cabeçalho.
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
 * As ações, à direita da linha do título — **também no telefone**.
 *
 * Abaixo de `sm` todo `Button` que tem ícone vira quadrado e o rótulo vira
 * `sr-only` (o nome continua o mesmo); um botão sem ícone fica com o texto.
 * O ⋯ (`overflow="menu"`) é o da `Toolbar`, com outra conta: as ações cabem
 * no cabeçalho menos o que a linha do título já ocupa (o voltar, a mídia, o
 * adorno) e menos a reserva do nome — 35% da largura, até 240px. A primeira
 * conta reservava só metade da largura para a linha inteira, e a 375 o nome
 * ficava com 50px.
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
      {fora.length ? <OverflowActionsMenu items={fora} label={moreLabel} /> : null}
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
 * A pessoa veio de dentro do app? Então voltar é o histórico — a lista volta
 * com o filtro e a rolagem em que ela estava. A Navigation API diz qual é a
 * entrada anterior; sem ela, o `referrer` da mesma origem é a pista.
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
 * O voltar compacto, `icon-md` (32) — o mesmo do voltar do `TopBar` no
 * telefone.
 *
 * **Volta pelo histórico** (rodada 232): quando a pessoa veio de dentro do app,
 * o clique é `router.back()`, e a lista de onde ela saiu volta com o filtro e
 * a rolagem; o `href` fica como saída — link aberto direto, nova aba, ⌘-clique.
 * `history={false}` volta ao link simples.
 *
 * O recuo é `-ms-2` porque o ícone tem 16 dentro de uma caixa de 32: 8px de
 * folga de cada lado. Puxando exatamente isso, **o ícone alinha com o texto**.
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
      size="icon-md"
      className={cn(
        "relative -ms-2 shrink-0",
        // O alvo cresce por pseudo-elemento porque crescer de verdade mudaria a
        // caixa que `--page-title-line` centraliza. 30 + 16 = 46.
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-2 pointer-coarse:after:content-['']",
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
 * O esqueleto com a forma do cabeçalho (rodada 232), para os `loading.tsx`:
 * o título na altura do degrau, a descrição, as ações (a última larga, as
 * outras quadradas, e no telefone todas quadradas) e a faixa de pares.
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
