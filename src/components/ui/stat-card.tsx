"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { animate, useReducedMotion } from "motion/react"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { currencyBRL, numberBR, percentPointsBR } from "@/lib/formatters"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { Card } from "@/components/ui/card"
import { ChartSparkline, splitPercents } from "@/components/ui/chart"
import { Progress, type ProgressBands } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * O número que a tela veio dizer, com o rótulo que o explica.
 *
 * ## Ele compõe o `Card`, e não reimplementa um
 *
 * A versão anterior montava a superfície à mão: `rounded-xl border
 * border-border/80 bg-card p-4 shadow-xs ring-1 ring-foreground/5`. Cada
 * pedaço disso é um eixo que o `Card` já governa — e o `border-border/80` era um
 * **quarto peso de borda** no app, exatamente o que o `tone` do `Separator`
 * existe para não deixar acontecer.
 *
 * ## O tom mora no detalhe (rodada 223)
 *
 * O cartão inteiro era tingido — verde, vermelho, âmbar —, e quatro lado a lado
 * disputavam o olho com o próprio número. Hoje a superfície é a do `Card`, e o
 * tom aparece onde ele **diz** alguma coisa: no ladrilho do ícone, na cor do
 * número de dinheiro e na faísca. Cada tom publica quatro variáveis
 * (`--stat-tile`, `--stat-tile-ink`, `--stat-figure`, `--stat-chart`), e as
 * peças só as leem — o mecanismo de `--badge-dot` e `--toggle-indicator-*`.
 *
 * ## O rótulo e o valor não levam `gap`
 *
 * Rótulo sobre valor é o par de identidade que o `AGENTS.md` nomeia com estas
 * palavras, e o invariante diz "nem `gap-1`". O respiro existe **entre**
 * blocos diferentes — o cabeçalho, a nota, a faísca, a meta —, e quem o declara
 * é o contêiner, por seletor de filho, como o `ItemGroup variant="divided"`.
 */
const statCardVariants = cva("gap-0", {
  variants: {
    tone: {
      default:
        "[--stat-tile:var(--muted)] [--stat-tile-ink:var(--muted-foreground)] [--stat-figure:var(--foreground)] [--stat-chart:var(--chart-1)]",
      income:
        "[--stat-tile:var(--income-muted)] [--stat-tile-ink:var(--income-muted-foreground)] [--stat-figure:var(--income)] [--stat-chart:var(--chart-income)]",
      expense:
        "[--stat-tile:var(--expense-muted)] [--stat-tile-ink:var(--expense-muted-foreground)] [--stat-figure:var(--expense)] [--stat-chart:var(--chart-expense)]",
      warning:
        "[--stat-tile:var(--warning-muted)] [--stat-tile-ink:var(--warning-muted-foreground)] [--stat-figure:var(--foreground)] [--stat-chart:var(--warning)]",
      info: "[--stat-tile:var(--info-muted)] [--stat-tile-ink:var(--info-muted-foreground)] [--stat-figure:var(--foreground)] [--stat-chart:var(--info)]",
    },
    // O corpo do número, o recuo e o respiro entre os blocos — três medidas que
    // andam juntas. `sm` é o de dentro de uma folha; `md`, o de painel, que
    // sobe um degrau a partir de `sm:` (no telefone a grade é 2×2 e o número
    // de 24px não cabe); `lg`, o herói — o saldo.
    //
    // O valor e a faixa leem `--stat-card-value` e `--stat-card-range`, e o
    // `MoneyDisplay` composto dentro do valor também: quem chama não escreve
    // `size` nele.
    size: {
      sm: [
        "p-3 [--stat-card-value:var(--text-lg)] [--stat-card-range:var(--text-sm)]",
        "[&>[data-slot=stat-card-header]]:mb-2 [&>[data-slot=stat-card-delta]]:mt-1.5",
      ].join(" "),
      md: [
        "p-4 [--stat-card-value:var(--text-xl)] sm:[--stat-card-value:var(--text-2xl)] [--stat-card-range:var(--text-base)]",
        "[&>[data-slot=stat-card-header]]:mb-3 [&>[data-slot=stat-card-delta]]:mt-2",
      ].join(" "),
      lg: [
        "p-5 [--stat-card-value:var(--text-3xl)] sm:[--stat-card-value:var(--text-4xl)] [--stat-card-range:var(--text-lg)]",
        "[&>[data-slot=stat-card-header]]:mb-4 [&>[data-slot=stat-card-delta]]:mt-3",
      ].join(" "),
    },
    /**
     * `horizontal` é a linha compacta: o ladrilho à esquerda ocupando as duas
     * linhas, o rótulo sobre o valor no meio e a variação na ponta. Para dentro
     * de folhas e listas, onde o cartão vertical seria alto demais.
     */
    layout: {
      vertical: "",
      horizontal: [
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3",
        "[&>[data-slot=stat-card-icon]]:row-span-2 [&>[data-slot=stat-card-icon]]:size-10 [&>[data-slot=stat-card-icon]]:rounded-xl",
        "[&>[data-slot=stat-card-label]]:col-start-2 [&>[data-slot=stat-card-label]]:self-end",
        "[&>[data-slot=stat-card-value]]:col-start-2 [&>[data-slot=stat-card-value]]:self-start",
        "[&>[data-slot=stat-card-delta]]:col-start-3 [&>[data-slot=stat-card-delta]]:row-span-2 [&>[data-slot=stat-card-delta]]:row-start-1 [&>[data-slot=stat-card-delta]]:mt-0",
      ].join(" "),
    },
  },
  defaultVariants: {
    tone: "default",
    size: "md",
    layout: "vertical",
  },
})

type StatCardTone = NonNullable<VariantProps<typeof statCardVariants>["tone"]>

const StatCardContext = React.createContext<{ tone: StatCardTone }>({ tone: "default" })

function StatCard({
  className,
  tone,
  size,
  layout,
  interactive,
  asChild,
  ...props
}: React.ComponentProps<typeof Card> & VariantProps<typeof statCardVariants>) {
  const contexto = React.useMemo(() => ({ tone: tone ?? "default" }), [tone])
  return (
    <StatCardContext.Provider value={contexto}>
      <Card
        data-slot="stat-card"
        data-tone={tone ?? "default"}
        data-size={size ?? "md"}
        data-layout={layout ?? "vertical"}
        // `padding="none"` porque o recuo é do `size` daqui — o do `Card` não
        // conhece o corpo do número. `interactive` e `asChild` descem inteiros:
        // o cartão que abre a lista filtrada é o caso óbvio, e o `Card` já traz
        // elevação, par de toque e anel de foco.
        padding="none"
        interactive={interactive}
        asChild={asChild}
        className={cn(statCardVariants({ tone, size, layout }), className)}
        {...props}
      />
    </StatCardContext.Provider>
  )
}

/**
 * A linha de cima: o rótulo (com o ladrilho) à esquerda e a variação à
 * direita. É o desenho que o dashboard escrevia à mão.
 */
function StatCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-header"
      // Na linha do rótulo a variação desce um degrau, para os dois caberem
      // num cartão de quatro colunas.
      className={cn(
        "flex min-w-0 items-center justify-between gap-2 [&>[data-slot=stat-card-delta]]:px-1.5 [&>[data-slot=stat-card-delta]]:text-2xs",
        className
      )}
      {...props}
    />
  )
}

/**
 * O ícone num **ladrilho tonal** — é o primeiro lugar do tom. Recebe um
 * Heroicon `16/solid`; na linha compacta o ladrilho cresce e o ícone não.
 */
function StatCardIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-card-icon"
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-(--stat-tile) text-(--stat-tile-ink) [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}

/**
 * O rótulo em sobrancelha — caixa alta de 11px, a régua do `DescriptionTerm
 * term="eyebrow"` e do cabeçalho da `Table`. Aceita um `StatCardIcon` antes do
 * texto, e o texto trunca em vez de empurrar a variação.
 */
function StatCardLabel({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-label"
      className={cn(
        "flex min-w-0 items-center gap-2 text-2xs font-medium tracking-wide text-muted-foreground uppercase",
        className
      )}
      {...props}
    >
      {/* Texto cru num flex vira item anônimo, e item anônimo não trunca: o
          rótulo passava por baixo da variação (medido, "Resultado" num cartão
          de 192px). O texto entra num `span` que trunca. */}
      {React.Children.map(children, (filho) =>
        typeof filho === "string" || typeof filho === "number" ? (
          <span className="min-w-0 truncate">{filho}</span>
        ) : (
          filho
        )
      )}
    </div>
  )
}

const CONTAGEM_ENTRADA = 0.7
const CONTAGEM_TROCA = 0.45
const CONTAGEM_CURVA = [0.16, 1, 0.3, 1] as const

type FormatoDoValor = "currency" | "number" | "percent"

function formatarValor(
  v: number,
  formato: FormatoDoValor,
  { signed = false, compact = false, inteiro = false } = {}
) {
  if (formato === "currency") return currencyBRL(v, { signed, compact })
  if (formato === "percent") return `${percentPointsBR(v)}%`
  return numberBR(inteiro ? Math.round(v) : v, { maximumFractionDigits: inteiro ? 0 : 1 })
}

/**
 * O número que conta (rodada 223): ao montar, de zero até o valor; ao mudar,
 * do que está escrito até o novo — o mecanismo dos centros dos gráficos. O
 * HTML do servidor já traz o valor final, e o zero só é escrito no efeito de
 * layout, antes da primeira pintura. Com movimento reduzido, salta.
 *
 * A largura não dança: o valor final mora invisível na mesma célula da grade,
 * e o leitor de tela ouve só ele.
 */
function NumeroQueConta({
  value,
  format,
  signed,
  compact,
}: {
  value: number
  format: FormatoDoValor
  signed?: boolean
  compact?: boolean
}) {
  const reduzido = useReducedMotion()
  const ref = React.useRef<HTMLSpanElement>(null)
  const mostrado = React.useRef<number | null>(null)
  const inteiro = format === "number" && Number.isInteger(value)
  const final = formatarValor(value, format, { signed, compact, inteiro })

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const escrever = (v: number) => {
      el.textContent = formatarValor(v, format, { signed, compact, inteiro })
    }
    const de = mostrado.current ?? 0
    if (reduzido || de === value) {
      mostrado.current = value
      escrever(value)
      return
    }
    const controles = animate(de, value, {
      duration: mostrado.current === null ? CONTAGEM_ENTRADA : CONTAGEM_TROCA,
      ease: CONTAGEM_CURVA,
      onUpdate: (v) => {
        mostrado.current = v
        escrever(v)
      },
    })
    return () => controles.stop()
  }, [value, format, signed, compact, inteiro, reduzido])

  return (
    <span data-slot="stat-card-number" className="inline-grid">
      <span ref={ref} aria-hidden className="col-start-1 row-start-1">
        {final}
      </span>
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  )
}

/**
 * O valor.
 *
 * **Com `value`, o cartão escreve e conta o número** (`format`: `currency`,
 * `number` ou `percent`), na cor do tom — dinheiro de entrada em verde, de saída
 * em vermelho; os tons de estado mantêm o número neutro. **Com `children`**, é a
 * figura de antes: um `MoneyDisplay` composto dentro herda o corpo do degrau
 * (`--stat-card-value`), sem `size` escrito na chamada.
 */
function StatCardValue({
  className,
  value,
  format = "currency",
  signed,
  compact,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number
  format?: FormatoDoValor
  signed?: boolean
  compact?: boolean
}) {
  return (
    <div
      data-slot="stat-card-value"
      className={cn(
        // `.nums` e não `tabular-nums` cru: a utility existe, e é o que o resto
        // do sistema escreve.
        "nums min-w-0 font-mono leading-tight font-semibold text-(--stat-figure)",
        "text-(length:--stat-card-value)",
        "[&_[data-slot=money-display]]:text-(length:--stat-card-value) [&_[data-slot=money-display]]:leading-tight [&_[data-slot=money-display]]:font-semibold",
        className
      )}
      {...props}
    >
      {value !== undefined ? (
        <NumeroQueConta value={value} format={format} signed={signed} compact={compact} />
      ) : (
        children
      )}
    </div>
  )
}

/**
 * A variação, e por que ela não deduz o tom do sinal.
 *
 * **Em finanças a direção não determina se é boa notícia.** Despesa caindo é
 * bom; entrada caindo é ruim. Escrita à mão, `direction` desenha a seta e
 * `tone` continua sendo escolha de quem chama.
 *
 * **Calculada** (rodada 223), ela recebe `current`, `previous` e `better` — o
 * sentido que é boa notícia — e decide tudo: a porcentagem, a seta, o tom de
 * **estado** (`success`/`destructive`, e não `income`/`expense`: "melhorou" não
 * é "entrou dinheiro", invariante 3), o "0%" e o "Sem base" quando o período
 * anterior é zero. Era o `DeltaBadge` do dashboard e a conta do resumo da
 * categoria, duas cópias da mesma regra.
 */
const statCardDeltaVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap nums [&_svg]:size-3",
  {
    variants: {
      tone: {
        default: "bg-muted text-muted-foreground",
        income: "bg-income-muted text-income-muted-foreground dark:bg-income-muted/60",
        expense: "bg-expense-muted text-expense-muted-foreground dark:bg-expense-muted/60",
        warning: "bg-warning-muted text-warning-muted-foreground dark:bg-warning-muted/60",
        info: "bg-info-muted text-info-muted-foreground dark:bg-info-muted/60",
        success: "bg-success-muted text-success-muted-foreground dark:bg-success-muted/60",
        destructive:
          "bg-destructive-muted text-destructive-muted-foreground dark:bg-destructive-muted/60",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

type StatCardDeltaTone = NonNullable<VariantProps<typeof statCardDeltaVariants>["tone"]>

/** A regra da variação calculada, exportada para o teste e para quem só precisa do número. */
export function statCardDelta(
  current: number,
  previous: number,
  better: "up" | "down" = "up"
):
  | null
  | { kind: "sem-base" }
  | { kind: "igual" }
  | { kind: "variou"; pct: number; direction: "up" | "down"; good: boolean } {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  if (previous === 0 && current === 0) return null
  if (previous === 0) return { kind: "sem-base" }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  // Arredondado como é mostrado: "0,0%" com seta seria uma mentira pequena.
  if (Math.round(pct * 10) === 0) return { kind: "igual" }
  const direction = pct > 0 ? "up" : "down"
  return { kind: "variou", pct, direction, good: direction === better }
}

function StatCardDelta({
  className,
  tone,
  direction = "none",
  current,
  previous,
  better = "up",
  context = "em relação ao período anterior",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof statCardDeltaVariants> & {
    direction?: "up" | "down" | "none"
    /** O valor deste período. Com `previous`, a variação é calculada. */
    current?: number
    previous?: number
    /** O sentido que é boa notícia: `down` para despesa. */
    better?: "up" | "down"
    /** Contra o quê — lido pelo leitor de tela, e o `title` do chip. */
    context?: string
  }) {
  if (current !== undefined && previous !== undefined) {
    const r = statCardDelta(current, previous, better)
    if (!r) return null
    const desenho = (t: StatCardDeltaTone, conteudo: React.ReactNode, rotulo: string) => (
      <div
        data-slot="stat-card-delta"
        data-tone={t}
        title={rotulo}
        aria-label={rotulo}
        className={cn(statCardDeltaVariants({ tone: t }), className)}
        {...props}
      >
        {conteudo}
        {children}
      </div>
    )
    if (r.kind === "sem-base") {
      return desenho("default", "Sem base", `Sem valor no período anterior para comparar`)
    }
    if (r.kind === "igual") {
      return desenho(
        "default",
        <>
          <MinusIcon aria-hidden />
          <span>0%</span>
        </>,
        `Sem variação ${context}`
      )
    }
    const texto = `${r.pct > 0 ? "+" : ""}${percentPointsBR(r.pct)}%`
    return desenho(
      r.good ? "success" : "destructive",
      <>
        {r.direction === "up" ? <ArrowUpIcon aria-hidden /> : <ArrowDownIcon aria-hidden />}
        <span>{texto}</span>
      </>,
      `${r.direction === "up" ? "Subiu" : "Caiu"} ${percentPointsBR(Math.abs(r.pct))}% ${context}`
    )
  }

  return (
    <div
      data-slot="stat-card-delta"
      data-tone={tone ?? "default"}
      data-direction={direction}
      className={cn(statCardDeltaVariants({ tone }), className)}
      {...props}
    >
      {direction === "up" ? <ArrowUpIcon aria-hidden /> : null}
      {direction === "down" ? <ArrowDownIcon aria-hidden /> : null}
      {/* A seta é só desenho: sem isto o leitor ouvia "12%" sem saber para onde. */}
      {direction === "up" || direction === "down" ? (
        <span className="sr-only">{direction === "up" ? "subiu " : "caiu "}</span>
      ) : null}
      {children}
    </div>
  )
}

/**
 * A nota do pé: o "Previsto no mês R$ …", o "de 8 categorias". Ela não é a
 * segunda linha do valor, então vem com respiro.
 */
function StatCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-footer"
      className={cn(
        "mt-1.5 min-w-0 text-xs text-muted-foreground [&_[data-slot=money-display]]:text-xs",
        className
      )}
      {...props}
    />
  )
}

/**
 * A faixa — mínimo e máximo, um intervalo — na figura do valor, um degrau
 * abaixo (`--stat-card-range`). A análise de contas a escrevia à mão.
 */
function StatCardRange({
  className,
  min,
  max,
  format = "currency",
  ...props
}: React.ComponentProps<"div"> & {
  min: number
  max: number
  format?: FormatoDoValor
}) {
  const a = formatarValor(min, format)
  const b = formatarValor(max, format)
  return (
    <div
      data-slot="stat-card-range"
      className={cn(
        "nums flex min-w-0 flex-wrap items-baseline gap-x-1.5 font-mono leading-tight font-semibold text-foreground",
        "text-(length:--stat-card-range)",
        className
      )}
      {...props}
    >
      <span className="sr-only">de </span>
      <span>{a}</span>
      <span aria-hidden className="font-sans font-normal text-muted-foreground">
        –
      </span>
      <span className="sr-only"> a </span>
      <span>{b}</span>
    </div>
  )
}

/**
 * A faísca no pé do cartão: a tendência dos últimos períodos, na cor do tom.
 * Ela é o `ChartSparkline` (sem eixo, sem grade), e o nome acessível continua
 * obrigatório.
 */
function StatCardChart({
  className,
  data,
  y,
  label,
  variant = "area",
}: {
  className?: string
  data: Record<string, unknown>[]
  y: string
  /** O que a curva mostra — o nome acessível do gráfico. */
  label: string
  variant?: "line" | "area" | "bars"
}) {
  const config = React.useMemo(() => ({ [y]: { label, color: "var(--stat-chart)" } }), [y, label])
  return (
    <div data-slot="stat-card-chart" className={cn("mt-3", className)}>
      <ChartSparkline variant={variant} y={y} data={data} config={config} label={label} />
    </div>
  )
}

/**
 * A meta: "R$ 612 de R$ 800", a barra do `Progress` e os cortes do orçamento
 * (`BUDGET_BANDS`, 85 e 100) — a cor sai da escada de risco, não do tom do
 * cartão. `children` é a legenda da esquerda; a porcentagem fica na direita.
 */
function StatCardProgress({
  className,
  value,
  max,
  bands = BUDGET_BANDS,
  label,
  children,
}: {
  className?: string
  value: number
  max: number
  bands?: ProgressBands
  /** O nome da barra para o leitor de tela. */
  label: string
  children?: React.ReactNode
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div data-slot="stat-card-progress" className={cn("mt-3 flex flex-col gap-1.5", className)}>
      <Progress value={value} max={max} bands={bands} size="sm" aria-label={label} />
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{children}</span>
        <span className="nums shrink-0">{percentPointsBR(pct)}%</span>
      </div>
    </div>
  )
}

const DIVISAO_COR = {
  default: "bg-muted-foreground/40",
  income: "bg-income",
  expense: "bg-expense",
} as const

/**
 * A comparação dividida: dois ou três valores no mesmo cartão — entrou · saiu,
 * este mês · o anterior — e a barra da proporção entre eles. As porcentagens
 * somam 100 pelo maior resto (`splitPercents`, a régua do `ChartSplit`).
 */
function StatCardSplit({
  className,
  items,
  format = "currency",
  ...props
}: React.ComponentProps<"div"> & {
  items: { label: string; value: number; tone?: keyof typeof DIVISAO_COR }[]
  format?: FormatoDoValor
}) {
  const pcts = splitPercents(items.map((i) => i.value))
  return (
    <div data-slot="stat-card-split" className={cn("flex min-w-0 flex-col gap-3", className)} {...props}>
      <dl className="grid min-w-0 gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DIVISAO_COR[item.tone ?? "default"])} />
              <span className="truncate">{item.label}</span>
            </dt>
            <dd className="nums truncate font-mono text-(length:--stat-card-range) leading-tight font-semibold text-foreground">
              {formatarValor(item.value, format)}
            </dd>
          </div>
        ))}
      </dl>
      <div aria-hidden className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
        {items.map((item, i) => (
          <span
            key={item.label}
            className={cn("h-full rounded-full transition-[flex-grow] duration-(--duration-slow) ease-(--ease-out)", DIVISAO_COR[item.tone ?? "default"])}
            style={{ flexGrow: Math.max(pcts[i], 0.5), flexBasis: 0 }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * O esqueleto na medida do valor.
 *
 * Um cartão de número é *a* coisa que espera dado, e sem isto cada tela
 * inventava a própria espera. A altura sai de `--stat-card-value`, então ela
 * acompanha o `size` do cartão em vez de ser uma medida chutada em pixels.
 */
function StatCardValueSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      data-slot="stat-card-value-skeleton"
      className={cn(
        "h-[calc(var(--stat-card-value)*1.2)] w-24 rounded-md",
        className
      )}
      {...props}
    />
  )
}

/**
 * A faixa de cartões (rodada 223).
 *
 * `separate`: cartões soltos com 8px entre eles. `joined`: **um painel só**,
 * dividido por fios — a grade com `gap-px` sobre a cor da borda, e os cartões
 * perdendo moldura, canto e sombra —, como o painel de métricas do Stripe.
 * Duas colunas no telefone e `columns` a partir de `lg`. Os cartões entram em
 * cascata, uma vez (`@utility stat-card-reveal`).
 */
const statCardGroupVariants = cva("stat-card-reveal grid min-w-0", {
  variants: {
    variant: {
      separate: "gap-2",
      joined: [
        "gap-px overflow-hidden rounded-xl border border-border bg-border",
        "[&>[data-slot=stat-card]]:rounded-none [&>[data-slot=stat-card]]:border-0 [&>[data-slot=stat-card]]:shadow-none",
      ].join(" "),
    },
    columns: {
      2: "grid-cols-2",
      3: "grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: {
    variant: "separate",
    columns: 4,
  },
})

function StatCardGroup({
  className,
  variant,
  columns,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof statCardGroupVariants>) {
  return (
    <div
      data-slot="stat-card-group"
      data-variant={variant ?? "separate"}
      className={cn(statCardGroupVariants({ variant, columns }), className)}
      {...props}
    />
  )
}

export {
  StatCard,
  StatCardChart,
  StatCardDelta,
  StatCardFooter,
  StatCardGroup,
  StatCardHeader,
  StatCardIcon,
  StatCardLabel,
  StatCardProgress,
  StatCardRange,
  StatCardSplit,
  StatCardValue,
  StatCardValueSkeleton,
  statCardGroupVariants,
  statCardVariants,
}
