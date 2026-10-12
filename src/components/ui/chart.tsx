"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  useActiveTooltipDataPoints,
  useActiveTooltipLabel,
} from "recharts"


import { useCountUp } from "@/hooks/use-count-up"
import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"
import { menuPanelSurfaceClassName } from "@/lib/menu-classes"
import {
  currencyBRL,
  currencyCompactBRL,
  numberBR,
  percentBR,
} from "@/lib/formatters"
import {
  addDaysYmd,
  compareYmd,
  formatMonthShortPtBr,
  formatTransactionDayMonthPtBr,
  formatTransactionMonthYearPtBr,
  localYmdFromDate,
  parseYmdLocal,
} from "@/lib/transaction-date"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleMarker,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  progressToneForBands,
  type ProgressBands,
} from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * # Chart
 *
 * Duas camadas. A anatomia (`ChartContainer`, `ChartGrid`, `ChartXAxis`,
 * `ChartYAxis`, `ChartTooltip`, `ChartLegend`, `ChartReferenceLine`) é a régua e
 * fica livre: quem monta um `ComposedChart` compõe estas peças. As formas
 * (`ChartArea`, `ChartLine`, `ChartBars`, `ChartDonut`, `ChartSparkline`,
 * `ChartSplit`, `ChartRadial`, `ChartHeatmap`, `ChartRadar`, `ChartWaterfall`,
 * `ChartBarList`) são a forma curta sobre a anatomia, como `FormInput` é sobre
 * `Field` + `Input`, e cobram `label` (o nome acessível), que a composição livre
 * não pode cobrar.
 *
 * O `ChartContainer` emite `--color-<chave>` num `<style>` escopado por
 * `[data-chart]`; o tooltip formata dinheiro (`format`, senão uma série em reais
 * sairia `8.432` sem `R$`), e a legenda, os eixos, a altura e o estado vazio
 * também são daqui. Barras: `signed`, `valueLabels`, `selected` + `onSelect`
 * (o gráfico vira `role="group"` e anuncia a seleção). Rosca: fatia ativa,
 * `legend="list"`, `bands` no `gauge`. Área e linha: `brush`, `delta`,
 * `config.dashed`. `ChartAnnotation` é o fio vertical com rótulo num ponto do
 * tempo. O tooltip da rosca escreve a fatia em % do total.
 */

/** A proporção é do componente (eixo, para telas não cravarem `height` em pixel); `auto` é a saída de quem dimensiona por fora, e é o que o `ChartSparkline` usa. */
const chartContainerVariants = cva(
  [
    "flex justify-center text-xs",
    // A superfície por baixo das marcas. O vão de 2px entre segmentos
    // empilhados e entre fatias de rosca é pintado com ela, não com
    // transparência: um `stroke` transparente mostraria a marca de trás.
    "[--chart-surface:var(--color-card)]",
    "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
    "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
    "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
    "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border",
    "[&_.recharts-polar-angle-axis-tick_text]:fill-muted-foreground",
    "[&_.recharts-radial-bar-background-sector]:fill-muted",
    "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/60",
    "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
    "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
    "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
    // O recorte de período: o Brush do Recharts nasce com texto preto e moldura `#fff`; os tokens da casa entram por aqui.
    "[&_.recharts-brush-texts_text]:fill-muted-foreground",
    "[&_.recharts-brush-traveller_rect]:fill-muted-foreground",
    // O anel de foco: suprimir o foco não-visível é certo, mas o `outline-hidden`
    // antigo apagava também o foco de teclado do `accessibilityLayer` do
    // Recharts v3. `outline-none` e `outline-2` escrevem propriedades diferentes
    // (`outline-style` e `outline-width`), e a supressão e o anel em `:focus` /
    // `:focus-visible` empatam em (0,2,0); por isso a supressão é a base sem
    // pseudo (0,2,0), o anel é `:focus-visible` (0,3,0) e `outline-solid`
    // precisa estar escrito. Foco por script não liga `:focus-visible`: teste
    // com `Tab` de verdade.
    "[&_.recharts-sector]:outline-none",
    "[&_.recharts-surface]:outline-none",
    "[&_.recharts-sector:focus-visible]:outline-solid",
    "[&_.recharts-sector:focus-visible]:outline-2",
    "[&_.recharts-sector:focus-visible]:outline-offset-2",
    "[&_.recharts-sector:focus-visible]:outline-ring",
    "[&_.recharts-surface:focus-visible]:outline-solid",
    "[&_.recharts-surface:focus-visible]:outline-2",
    "[&_.recharts-surface:focus-visible]:outline-offset-2",
    "[&_.recharts-surface:focus-visible]:outline-ring",
  ],
  {
    variants: {
      aspect: {
        video: "aspect-video",
        wide: "aspect-[21/9]",
        standard: "aspect-[4/3]",
        square: "aspect-square",
        auto: "aspect-auto",
      },
    },
    defaultVariants: {
      aspect: "video",
    },
  }
)

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
    /** A série tracejada: a projeção que continua o real, ou a referência (a média). O traço é o segundo canal: cor sozinha não diz "isto ainda não aconteceu". */
    dashed?: boolean
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

/* -------------------------------------------------------------------------
 * Formatação
 * ---------------------------------------------------------------------- */

/**
 * Um nome para cada formatação, cada um resolvendo num helper de `lib/` (a
 * regra **I** do auditor proíbe `Intl` fora de `lib/formatters` e
 * `lib/transaction-date`).
 */
export type ChartFormat =
  | "text"
  | "number"
  | "currency"
  | "compact"
  | "percent"
  | "date"
  | "month"

const CHART_FORMATTERS: Record<ChartFormat, (value: unknown) => string> = {
  text: (v) => (v == null ? "" : String(v)),
  number: (v) => (typeof v === "number" ? numberBR(v) : String(v ?? "")),
  currency: (v) => (typeof v === "number" ? currencyBRL(v) : String(v ?? "")),
  // `minimumFractionDigits: 0` torna `compact` de fato compacto abaixo de mil
  // (o padrão de 2 escreveria "R$ 600,00" num eixo); acima de mil nada muda.
  compact: (v) =>
    typeof v === "number"
      ? currencyCompactBRL(v, { minimumFractionDigits: 0 })
      : String(v ?? ""),
  // `percentBR` recebe a fração, não o inteiro: 0,42 sai "42%".
  percent: (v) => (typeof v === "number" ? percentBR(v) : String(v ?? "")),
  date: (v) => (typeof v === "string" ? formatTransactionDayMonthPtBr(v) : String(v ?? "")),
  month: (v) => (typeof v === "string" ? formatTransactionMonthYearPtBr(v) : String(v ?? "")),
}

export function formatChartValue(value: unknown, format: ChartFormat): string {
  return CHART_FORMATTERS[format](value)
}

/** O eixo comprime e o tooltip não: um rótulo de eixo cabe em ~48px, um tooltip diz o centavo. `currency` vira `compact` no eixo. */
function axisFormatFor(format: ChartFormat): ChartFormat {
  return format === "currency" ? "compact" : format
}

/* -------------------------------------------------------------------------
 * Cor da série
 * ---------------------------------------------------------------------- */

/**
 * # O movimento do gráfico
 *
 * Todo gráfico chega e se ajusta: entra ao montar e interpola do quadro
 * anterior quando o dado troca (um filtro, um período, uma série religada).
 * Quem anima é o próprio Recharts: o `isAnimationActive` `'auto'` desliga a
 * animação sob movimento reduzido e no SSR, e a impressão vê o gráfico pronto.
 * Um relógio (`useChartEntering`) separa a entrada (`CHART_ENTER_MS`, séries
 * escalonadas) da troca (`CHART_UPDATE_MS`) que vem depois.
 *
 * As formas HTML (divisão, calendário, lista de barras, legendas) entram por
 * `@starting-style` (`starting:`), e o bloco global de movimento reduzido corta
 * a transição. A rosca começa em `begin: 0`: o `Pie` esperando 400ms de
 * `animationBegin` reiniciava a animação a cada re-render e gravava o quadro
 * anterior em t=0, deixando setores com ângulo zero (que o `Sector` não
 * desenha). A faísca não entra, só transita.
 *
 * A curva no dado é `--ease-out`, que não passa do alvo (uma barra nunca mostra
 * valor maior que o real); a mola da casa fica para o que aparece (célula,
 * rótulo, legenda).
 */
export const CHART_ENTER_MS = 500
export const CHART_UPDATE_MS = 300
/** `--ease-out`. O tipo do Recharts diz só as cinco palavras do CSS, mas o
 *  `configEasing` dele aceita `cubic-bezier(…)` em tempo de execução. */
export const CHART_EASING = "cubic-bezier(0.16, 1, 0.3, 1)"
const CHART_EASING_MARK = CHART_EASING as unknown as "ease"
/** A mesma curva, na forma que o `animate` do `motion` lê. */
const CHART_EASING_POINTS = [0.16, 1, 0.3, 1] as const

/** O atraso entre séries na entrada, e o teto: a quinta não espera mais. */
const CHART_STAGGER_MS = 60
const CHART_STAGGER_MAX = 4

/** Os props de animação de uma marca do Recharts depois da entrada: a troca. */
const CHART_MARK_UPDATE = {
  isAnimationActive: "auto",
  animationBegin: 0,
  animationDuration: CHART_UPDATE_MS,
  animationEasing: CHART_EASING_MARK,
} as const

/**
 * Se a forma ainda está entrando: um relógio do mount até o fim da entrada mais
 * o escalonamento. Trocar a duração depois do fim não reanima nada, porque o
 * Recharts parte do último quadro, que já é o alvo.
 */
function useChartEntering() {
  const [entrando, setEntrando] = React.useState(true)
  React.useEffect(() => {
    const t = window.setTimeout(
      () => setEntrando(false),
      CHART_ENTER_MS + CHART_STAGGER_MS * (CHART_STAGGER_MAX - 1)
    )
    return () => window.clearTimeout(t)
  }, [])
  return entrando
}

/** Os props de animação de uma marca: a entrada escalonada por série (`i`) e a troca depois. A rosca e os anéis passam `i` 0 (o `begin` deles é zero). */
function chartMarkMotion(entrando: boolean, i = 0) {
  if (!entrando) return CHART_MARK_UPDATE
  return {
    ...CHART_MARK_UPDATE,
    animationDuration: CHART_ENTER_MS,
    animationBegin: Math.min(i, CHART_STAGGER_MAX - 1) * CHART_STAGGER_MS,
  }
}

/** A faísca no primeiro quadro: pronta, sem entrada. */
const CHART_MARK_STILL = { ...CHART_MARK_UPDATE, isAnimationActive: false } as const

/** O tooltip desliza entre pontos no tempo de atualização, na mesma curva. */
const CHART_TOOLTIP_MOTION = {
  animationDuration: CHART_UPDATE_MS,
  animationEasing: CHART_EASING_MARK,
} as const

const CHART_RAMP_LENGTH = 5

/**
 * A rampa tem cinco degraus: uma sexta série vira "Outros", e quem agrega é quem
 * tem os dados. Do sexto em diante a cor é `--muted-foreground`, para não
 * repetir `--chart-1` e dar duas fatias da mesma cor.
 */
export function chartSeriesColor(index: number): string {
  return index < CHART_RAMP_LENGTH
    ? `var(--chart-${index + 1})`
    : "var(--color-muted-foreground)"
}

/* -------------------------------------------------------------------------
 * Container
 * ---------------------------------------------------------------------- */

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return ctx
}

function ChartContainer({
  id,
  className,
  children,
  config,
  aspect,
  label,
  description,
  overlay,
  interactive = false,
  ref,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof chartContainerVariants> & {
    config: ChartConfig
    children: React.ComponentProps<typeof ResponsiveContainer>["children"]
    /** O nome acessível (um `<svg>` sem nome é anunciado só como "imagem"); opcional aqui porque a composição livre não pode cobrar, mas as formas curtas cobram. */
    label?: string
    /** Uma frase sobre o que o gráfico mostra, ligada por `aria-describedby`. */
    description?: string
    /** O que se sobrepõe ao gráfico (hoje o `ChartDonutCenter`); é prop porque a caixa que tem tamanho é esta, e com um envelope `relative` por fora o miolo saía 118px fora do centro. */
    overlay?: React.ReactNode
    /** O gráfico recebe ação (barra que seleciona, recorte): o papel deixa de ser `img` (que torna os filhos apresentacionais) e passa a `group`. */
    interactive?: boolean
  }) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`
  const descriptionId = description ? `${chartId}-desc` : undefined

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-slot="chart"
        data-chart={chartId}
        data-aspect={aspect ?? "video"}
        role={label ? (interactive ? "group" : "img") : undefined}
        aria-label={label}
        aria-describedby={descriptionId}
        className={cn(
          chartContainerVariants({ aspect }),
          overlay && "relative",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {description ? (
          <span id={descriptionId} className="sr-only">
            {description}
          </span>
        ) : null}
        {/* O `ResponsiveContainer` é item de um flex e a largura seria
            automática; as dimensões explícitas mais `min-w-0` tiram a
            ambiguidade. O aviso "The width(-1) and height(-1)…" do Recharts na
            primeira medição continua saindo: é medição de primeiro quadro. */}
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="min-w-0 flex-1"
        >
          {children}
        </ResponsiveContainer>
        {overlay}
      </div>
    </ChartContext.Provider>
  )
}

/**
 * O CSS das cores de série, montado a partir do `config`.
 *
 * Chave e cor entram num `<style>`: uma cor com `}` fechava a regra e injetava
 * CSS arbitrário na página. Só passam chave de identificador e cor sem
 * `;{}<>`, que cobre hex, `var(--x)`, `oklch()` e `rgb()`. Exportada para teste.
 */
const SAFE_CHART_KEY = /^[A-Za-z0-9_-]+$/

/** A chave de série como nome de variável CSS ("Cartão Nubank" vira "Cart-o-Nubank"); quem escreve a cor e quem a lê (`serieColor`) passam por aqui. */
function chartKeyToken(key: string): string {
  return key.replace(/[^A-Za-z0-9_-]/g, "-")
}
const SAFE_CHART_COLOR = /^[#\w\s().,%/-]+$/

export function chartStyleCss(id: string, config: ChartConfig): string | null {
  const entries = Object.entries(config).filter(
    ([key, cfg]) => SAFE_CHART_KEY.test(chartKeyToken(key)) && ("theme" in cfg || "color" in cfg)
  )
  if (!entries.length) return null
  const safeId = id.replace(/[^A-Za-z0-9_:-]/g, "")

  return Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const lines = entries
        .map(([key, itemConfig]) => {
          const color =
            "theme" in itemConfig && itemConfig.theme
              ? itemConfig.theme[theme as keyof typeof itemConfig.theme]
              : "color" in itemConfig
                ? itemConfig.color
                : undefined
          return color && SAFE_CHART_COLOR.test(color) ? `  --color-${chartKeyToken(key)}: ${color};` : null
        })
        .filter(Boolean)
        .join("\n")
      return `\n${prefix} [data-chart="${safeId}"] {\n${lines}\n}\n`
    })
    .join("\n")
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const css = chartStyleCss(id, config)
  if (!css) return null
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

/* -------------------------------------------------------------------------
 * Tooltip
 * ---------------------------------------------------------------------- */

const ChartTooltip = Tooltip

/** Recharts tooltip payload entry (shape varies by chart). */
type TooltipPayloadItem = {
  dataKey?: string | number
  name?: string | number
  value?: string | number
  color?: string
  payload?: Record<string, unknown>
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  format = "number",
  total = false,
  totalLabel = "Total",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormat,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  delta,
  share,
}: React.ComponentProps<"div"> & {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  labelClassName?: string
  labelFormatter?: (
    label: unknown,
    payload: TooltipPayloadItem[]
  ) => React.ReactNode
  formatter?: (
    value: unknown,
    name: unknown,
    item: TooltipPayloadItem,
    index: number,
    payload: unknown
  ) => React.ReactNode
  color?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  /** A forma do marcador de série. Já existia e nunca tinha sido documentada. */
  indicator?: "line" | "dot" | "dashed"
  /** Como o valor é escrito; o padrão é `number`, e as formas curtas passam `currency`. */
  format?: ChartFormat
  /** O cabeçalho do tooltip, quando ele carrega uma data em vez de um rótulo. */
  labelFormat?: ChartFormat
  /** A linha de soma no rodapé. As quatro tooltips à mão do app têm uma. */
  total?: boolean
  totalLabel?: string
  nameKey?: string
  labelKey?: string
  /** A variação contra o ponto anterior ("+12% vs. fev"); o tooltip só recebe o ponto ativo, então as formas passam a série inteira com a chave do eixo. */
  delta?: { data: Record<string, unknown>[]; x: string; xFormat?: ChartFormat }
  /** O total da rosca: cada fatia ganha a porcentagem dele ao lado do valor. */
  share?: number
}) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const raw =
      !labelKey && typeof label === "string"
        ? (config[label]?.label ?? label)
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(raw, payload)}
        </div>
      )
    }
    const value = labelFormat ? formatChartValue(raw, labelFormat) : raw
    if (!value) return null
    return <div className={cn("font-medium", labelClassName)}>{value}</div>
  }, [
    label,
    labelFormat,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== "dot"
  const soma = total
    ? payload.reduce(
        (acc, item) => acc + (typeof item.value === "number" ? item.value : 0),
        0
      )
    : null

  return (
    <div
      data-slot="chart-tooltip-content"
      className={cn(
        // A placa flutuante da casa, a mesma do `Tooltip`, do `Popover` e dos menus.
        "grid min-w-32 items-start gap-1.5 px-2.5 py-1.5 text-xs",
        menuPanelSurfaceClassName,
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color ?? item.payload?.fill ?? item.color

          return (
            <div
              key={item.dataKey ?? index}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-xs border-(--indicator-border) bg-(--indicator-bg)",
                          {
                            // A amostra é um ponto, como a da legenda; o traço do `line` e o tracejado continuam traço.
                            "size-2 rounded-full": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            // Nomes próprios: `--color-border` local sombreava
                            // o token do tema para tudo dentro do indicador.
                            "--indicator-bg": indicatorColor,
                            "--indicator-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between gap-3 leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      {/* O texto veste token de texto, nunca a cor da série:
                          quem carrega a identidade é o marcador ao lado. */}
                      <span className="text-muted-foreground">
                        {itemConfig?.label ?? item.name}
                      </span>
                    </div>
                    {item.value !== undefined ? (
                      <span className="flex items-baseline gap-1.5">
                        <span className="nums font-mono font-medium text-foreground">
                          {formatChartValue(item.value, format)}
                        </span>
                        {share && typeof item.value === "number" ? (
                          <span className="nums font-mono text-muted-foreground">
                            {formatChartValue(item.value / share, "percent")}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  {delta && typeof item.value === "number" ? (
                    <ChartTooltipDelta
                      delta={delta}
                      row={item.payload}
                      dataKey={String(item.dataKey ?? "")}
                      value={item.value}
                    />
                  ) : null}
                </>
              )}
            </div>
          )
        })}
        {soma !== null ? (
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-1.5 leading-none">
            <span className="text-muted-foreground">{totalLabel}</span>
            <span className="nums font-mono font-medium text-foreground">
              {formatChartValue(soma, format)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** A variação contra o ponto anterior, numa linha miúda sob o valor. O sinal é escrito (`+`/`−`) e a tinta é neutra: subir é bom no saldo e ruim no gasto. */
function ChartTooltipDelta({
  delta,
  row,
  dataKey,
  value,
}: {
  delta: NonNullable<React.ComponentProps<typeof ChartTooltipContent>["delta"]>
  row: Record<string, unknown> | undefined
  dataKey: string
  value: number
}) {
  const i = row ? delta.data.indexOf(row) : -1
  const anterior = i > 0 ? delta.data[i - 1] : undefined
  const base = anterior?.[dataKey]
  if (typeof base !== "number" || base === 0) return null
  const variacao = (value - base) / Math.abs(base)
  const sinal = variacao > 0 ? "+" : variacao < 0 ? "−" : ""
  return (
    <span data-slot="chart-tooltip-delta" className="basis-full ps-4.5 text-2xs text-muted-foreground">
      <span className="nums font-mono">
        {sinal}
        {formatChartValue(Math.abs(variacao), "percent")}
      </span>{" "}
      vs. {formatChartValue(anterior?.[delta.x], delta.xFormat ?? "text")}
    </span>
  )
}

/* -------------------------------------------------------------------------
 * Legenda
 * ---------------------------------------------------------------------- */

const ChartLegend = Legend

type LegendPayloadItem = {
  value?: string | number
  dataKey?: string | number
  color?: string
  payload?: Record<string, unknown>
}

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  align = "center",
  nameKey,
  format,
  interactive = false,
  hiddenSeries,
  onToggle,
  config: configProp,
}: Omit<React.ComponentProps<"div">, "onToggle"> & {
  payload?: LegendPayloadItem[]
  /** A legenda da rosca vive fora do `ChartContainer` (dentro do SVG o Recharts reservaria a faixa encolhendo o anel e o centro deixaria de ser o da caixa), então lê o contexto sem exigi-lo. */
  config?: ChartConfig
  verticalAlign?: "top" | "bottom"
  /** Onde a fileira encosta. `center` é o padrão do Recharts e continua sendo. */
  align?: "start" | "center" | "end"
  hideIcon?: boolean
  nameKey?: string
  /** O valor ao lado do rótulo. As três legendas à mão do app mostram um. */
  format?: ChartFormat
  /** Clicar isola a série: cada item vira `<button>` com `aria-pressed`. */
  interactive?: boolean
  /** As séries desligadas. Não se chama `hidden`, que é atributo de `<div>` (`boolean`) e colide no tipo. */
  hiddenSeries?: string[]
  onToggle?: (key: string) => void
}) {
  // `useChart` lança fora do provedor, e aqui isso seria errado: esta peça é
  // usada solta, ao lado do gráfico.
  const ctx = React.useContext(ChartContext)
  const config = configProp ?? ctx?.config ?? {}

  if (!payload?.length) return null

  return (
    <div
      data-slot="chart-legend-content"
      className={cn(
        // O corpo é da legenda, e não herdado: na rosca e nos anéis ela mora
        // fora do `ChartContainer`, que é quem declara `text-xs` — e numa grade
        // sem corpo próprio ela saía no tamanho do texto corrido.
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs",
        // A legenda entra inteira, depois das marcas começarem: ela é o que
        // *aparece*, e sobe na mola. O atraso só pesa na entrada, porque a
        // caixa não transiciona mais nada.
        chartRiseClassName,
        "delay-150",
        align === "start" && "justify-start",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item, index) => {
        // Duas chaves: `nameKey` diz em que campo do payload está o nome, então
        // usá-la como chave do React daria a mesma chave a todos os itens. A
        // identidade do item vem do payload.
        const key = `${item.dataKey ?? item.value ?? index}`
        const configKey = `${nameKey ?? item.dataKey ?? item.value ?? "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, configKey)
        const off = hiddenSeries?.includes(key) ?? false
        const valor =
          format && typeof item.payload?.value === "number"
            ? formatChartValue(item.payload.value, format)
            : null

        const corpo = (
          <>
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : itemConfig?.dashed ? (
              // A série tracejada é traço na legenda também: dois quadrados da
              // mesma cor não dizem qual das duas é a projeção.
              <span
                aria-hidden
                className="w-3 shrink-0 border-t-2 border-dashed"
                style={{ borderColor: item.color }}
              />
            ) : (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span>{itemConfig?.label ?? item.value}</span>
            {valor ? (
              <span className="nums font-mono text-muted-foreground">
                {valor}
              </span>
            ) : null}
          </>
        )

        const classes =
          "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"

        if (!interactive) {
          return (
            <div key={key} className={classes}>
              {corpo}
            </div>
          )
        }

        // `<button>` cru: vestir `Button variant="tertiary" size="xs"` exigiria
        // quatro contra-classes mais o `<span>` de escape da maiúscula inicial
        // do CTA, que aqui seria errada (o rótulo vem do `config`, pode ser
        // "iFood").
        return (
          <button
            key={key}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle?.(key)}
            className={cn(
              classes,
              // Ligar e desligar uma série é controle, e controle é cápsula; o
              // realce é o chapado da casa (tinta do texto a 8%).
              "rounded-full px-2 py-0.5 -mx-1 outline-none transition-colors duration-(--duration-fast) ease-(--ease-out)",
              "hover:bg-foreground/8 active:bg-foreground/8",
              "focus-visible:ring-3 focus-visible:ring-ring/45",
              // O estado não é só opacidade: o rótulo risca, e é isso que
              // sobrevive a quem não distingue o degrau de transparência.
              off && "text-muted-foreground line-through"
            )}
          >
            {corpo}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Anatomia cartesiana
 * ---------------------------------------------------------------------- */

/** A grade é horizontal e recessiva por padrão; `vertical` traz a linha vertical. */
function ChartGrid({
  vertical = false,
  horizontal = true,
  ...props
}: React.ComponentProps<typeof CartesianGrid>) {
  return (
    <CartesianGrid
      vertical={vertical}
      horizontal={horizontal}
      strokeDasharray="3 3"
      {...props}
    />
  )
}

function ChartXAxis({
  format = "text",
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  minTickGap = 12,
  ...props
}: React.ComponentProps<typeof XAxis> & { format?: ChartFormat }) {
  return (
    <XAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      tickFormatter={(value) => formatChartValue(value, format)}
      {...props}
    />
  )
}

/**
 * O eixo de valor começa em zero por padrão: truncar a base multiplica
 * visualmente uma diferença de 3%. Quem tiver caso legítimo (série que não
 * cruza zero, num gráfico de linha) passa `domain` e assume.
 */
function ChartYAxis({
  format = "compact",
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  // `auto` e não um número: com largura fixa um rótulo mais longo que a calha é
  // cortado à esquerda (`R$ 22 mil` saía `$ 22 mil` a 375px). O Recharts 3 calcula a calha a partir dos rótulos.
  width = "auto" as const,
  domain,
  ...props
}: React.ComponentProps<typeof YAxis> & { format?: ChartFormat }) {
  return (
    <YAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      width={width}
      // `[0, "auto"]` é para eixo de número; um `domain={undefined}` explícito
      // caía no padrão e o aplicava ao eixo de categorias das barras deitadas.
      domain={(domain ?? (props.type === "category" ? undefined : [0, "auto"])) as never}
      tickFormatter={(value) => formatChartValue(value, format)}
      {...props}
    />
  )
}

const chartReferenceTone = {
  neutral: "var(--color-border)",
  average: "var(--color-muted-foreground)",
  zero: "var(--color-foreground)",
} as const

/** A linha de referência tem tom, não cor: zero, média e neutra são três papéis. */
function ChartReferenceLine({
  tone = "neutral",
  strokeDasharray = "4 4",
  ...props
}: React.ComponentProps<typeof ReferenceLine> & {
  tone?: keyof typeof chartReferenceTone
}) {
  return (
    <ReferenceLine
      stroke={chartReferenceTone[tone]}
      strokeDasharray={tone === "zero" ? undefined : strokeDasharray}
      strokeWidth={1}
      {...props}
    />
  )
}

/**
 * Uma anotação no eixo do tempo: o fio vertical num ponto do eixo X, com o
 * rótulo no topo ("salário", "fechamento da fatura"); é a `ChartReferenceLine`
 * com `x`. O rótulo é texto do SVG e não chega ao leitor de tela pelo
 * `role="img"`: quem tem anotação que importa a escreve também no `description`.
 */
function ChartAnnotation({
  x,
  label,
  tone = "average",
  ...props
}: Omit<React.ComponentProps<typeof ReferenceLine>, "label" | "x"> & {
  /** O valor do eixo X onde a marca pousa — o mesmo do `x` dos dados. */
  x: string | number
  label: string
  tone?: keyof typeof chartReferenceTone
}) {
  return (
    <ReferenceLine
      x={x}
      stroke={chartReferenceTone[tone]}
      strokeDasharray="3 3"
      strokeWidth={1}
      label={(p: { viewBox?: { x?: number; y?: number } }) => (
        <text
          data-slot="chart-annotation-label"
          x={(p.viewBox?.x ?? 0) + 4}
          y={(p.viewBox?.y ?? 0) + 10}
          className="fill-muted-foreground text-2xs"
        >
          {label}
        </text>
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------
 * As formas
 * ---------------------------------------------------------------------- */

type ChartFormProps = {
  config: ChartConfig
  data: Record<string, unknown>[]
  /** As chaves de `config` que viram série. O padrão é todas, na ordem. */
  series?: string[]
  /** O nome acessível. Cobrado: a forma curta pode cobrar. */
  label: string
  description?: string
  /** Como o valor é escrito no tooltip. O eixo deriva daqui e comprime. */
  format?: ChartFormat
  aspect?: VariantProps<typeof chartContainerVariants>["aspect"]
  className?: string
  /** A legenda: duas séries ou mais sempre têm; uma série nunca (quem nomeia é o título). */
  legend?: boolean
  tooltip?: boolean
  /** A mesma série como tabela, dentro de um `Collapsible`. */
  dataTable?: boolean
  /** `ChartReferenceLine`, `Brush`, o que a forma não prevê. */
  children?: React.ReactNode
}

function useSeries(config: ChartConfig, series?: string[]) {
  return React.useMemo(
    () => series ?? Object.keys(config),
    [config, series]
  )
}

function serieColor(key: string, index: number, config: ChartConfig): string {
  const cfg = config[key]
  if (cfg && "color" in cfg && cfg.color) return `var(--color-${chartKeyToken(key)})`
  if (cfg && "theme" in cfg && cfg.theme) return `var(--color-${chartKeyToken(key)})`
  return chartSeriesColor(index)
}

/** O casco das formas. Não desenha nada quando `dataTable` está desligado (sem invólucro, sem `gap`, sem nó a mais). */
function ChartFrame({
  dataTable,
  data,
  series,
  config,
  x,
  xLabel,
  xFormat,
  format,
  children,
}: {
  dataTable?: boolean
  data: Record<string, unknown>[]
  series: string[]
  config: ChartConfig
  x?: string
  xLabel?: string
  xFormat?: ChartFormat
  format: ChartFormat
  children: React.ReactNode
}) {
  if (!dataTable) return <>{children}</>

  return (
    <div className="flex flex-col gap-2">
      {children}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1.5 self-start rounded-md text-xs text-muted-foreground outline-none hover:text-foreground active:text-foreground focus-visible:ring-3 focus-visible:ring-ring/45">
          <CollapsibleMarker className="size-3.5" />
          Ver os dados como tabela
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ChartDataTable
            data={data}
            series={series}
            config={config}
            x={x}
            xLabel={xLabel}
            xFormat={xFormat}
            format={format}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/** O último ponto com valor de cada série (o "hoje" de um saldo): uma série do mês inteiro traz os dias futuros como `null`. */
function ultimoIndiceComValor(data: Record<string, unknown>[], key: string) {
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i]?.[key] != null) return i
  }
  return -1
}

type ChartDotProps = { cx?: number; cy?: number; index?: number }

/**
 * O marcador de "hoje": o ponto de 8px da casa com um halo que pulsa atrás.
 * É a única coisa que se move num gráfico, de propósito: não é valor, é a marca
 * do ponto em que a série está agora (como o `BadgeDot pulse`), e é
 * `animate-ping` para o movimento reduzido cortá-lo. `transform-box: fill-box`
 * é estrutural: num SVG a origem da transformação é a do `<svg>`, e sem ela o
 * `scale(2)` afasta o halo do ponto.
 */
function ChartMarkerDot({
  cx,
  cy,
  color,
}: {
  cx: number
  cy: number
  color: string
}) {
  return (
    <g data-slot="chart-marker">
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        className="origin-center animate-ping opacity-75 [transform-box:fill-box]"
      />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke="var(--chart-surface)"
        strokeWidth={2}
      />
    </g>
  )
}

/** O `dot` de uma série com `marker="last"`: o marcador no último ponto com valor, e nos outros o ponto comum (`dots="all"`) ou nada. */
function chartMarkerDot(ultimo: number, color: string, todos: boolean) {
  function MarkerDot({ cx, cy, index }: ChartDotProps) {
    if (cx == null || cy == null) return <g />
    if (index === ultimo) return <ChartMarkerDot cx={cx} cy={cy} color={color} />
    if (!todos) return <g />
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke="var(--chart-surface)"
        strokeWidth={2}
      />
    )
  }
  return MarkerDot
}

/** O traço da série tracejada: a projeção e a referência (`config.dashed`). */
const CHART_DASH = "5 4"

function tracejada(config: ChartConfig, key: string) {
  return config[key]?.dashed === true
}

/**
 * O recorte de período, para série longa: a faixa de baixo escolhe o trecho e o
 * gráfico desenha só ele (`true` abre nos últimos 12 pontos; um número, nos
 * últimos N). É o `Brush` do Recharts com moldura e fundo dos tokens.
 */
function chartBrush(
  data: Record<string, unknown>[],
  x: string,
  xFormat: ChartFormat,
  brush: boolean | number | undefined
) {
  if (!brush || data.length < 2) return null
  const janela = typeof brush === "number" ? brush : 12
  return (
    <Brush
      dataKey={x}
      height={24}
      travellerWidth={8}
      startIndex={Math.max(0, data.length - janela)}
      stroke="var(--color-border)"
      fill="var(--chart-surface)"
      tickFormatter={(v) => formatChartValue(v, xFormat)}
    />
  )
}

const chartAreaShape = {
  solid: "monotone",
  gradient: "monotone",
  stepped: "step",
} as const

function ChartArea({
  variant = "solid",
  stacked = false,
  marker,
  x,
  xFormat = "text",
  config,
  data,
  series,
  label,
  description,
  format = "currency",
  aspect,
  className,
  legend,
  tooltip = true,
  dataTable,
  delta = false,
  brush,
  children,
}: ChartFormProps & {
  x: string
  xFormat?: ChartFormat
  variant?: keyof typeof chartAreaShape
  stacked?: boolean
  /** O último ponto com valor, marcado e pulsando: o "hoje" da série. */
  marker?: "last"
  /** O tooltip mostra a variação contra o ponto anterior. */
  delta?: boolean
  /** O recorte de período: `true` abre nos últimos 12 pontos, um número nos últimos N. */
  brush?: boolean | number
}) {
  const entrando = useChartEntering()
  const chaves = useSeries(config, series)
  const gradiente = variant === "gradient"
  // O id do gradiente é global no documento: duas áreas com a mesma chave na
  // página pintavam as duas com o gradiente da primeira.
  const gradienteId = React.useId().replace(/:/g, "")
  const mostrarLegenda = legend ?? chaves.length >= 2

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={chaves}
      config={config}
      x={x}
      format={format}
    >
      <ChartContainer
        config={config}
        aspect={aspect}
        label={label}
        description={description}
        className={className}
        interactive={!!brush}
      >
        <AreaChart data={data} accessibilityLayer>
          {gradiente ? (
            <defs>
              {chaves.map((key, i) => (
                <linearGradient
                  key={key}
                  id={`chart-area-${gradienteId}-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={serieColor(key, i, config)}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor={serieColor(key, i, config)}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
          ) : null}
          <ChartGrid />
          <ChartXAxis dataKey={x} format={xFormat} />
          <ChartYAxis format={axisFormatFor(format)} />
          {tooltip ? (
            <ChartTooltip
              {...CHART_TOOLTIP_MOTION}
              content={
                <ChartTooltipContent
                  format={format}
                  total={stacked}
                  delta={delta ? { data, x, xFormat } : undefined}
                />
              }
            />
          ) : null}
          {mostrarLegenda ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {chaves.map((key, i) => (
            <Area
              key={key}
              {...chartMarkMotion(entrando, i)}
              dataKey={key}
              type={chartAreaShape[variant]}
              stackId={stacked ? "a" : undefined}
              stroke={serieColor(key, i, config)}
              strokeWidth={2}
              strokeDasharray={tracejada(config, key) ? CHART_DASH : undefined}
              fill={gradiente ? `url(#chart-area-${gradienteId}-${key})` : serieColor(key, i, config)}
              // A projeção é só o traço: volume embaixo de algo que ainda não
              // aconteceu leria como dinheiro que já está lá.
              fillOpacity={tracejada(config, key) ? 0 : gradiente ? 1 : 0.15}
              dot={
                marker === "last"
                  ? chartMarkerDot(
                      ultimoIndiceComValor(data, key),
                      serieColor(key, i, config),
                      false
                    )
                  : false
              }
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: "var(--chart-surface)",
              }}
            />
          ))}
          {chartBrush(data, x, xFormat, brush)}
          {children}
        </AreaChart>
      </ChartContainer>
    </ChartFrame>
  )
}

const chartLineShape = {
  straight: "linear",
  curved: "monotone",
  stepped: "step",
} as const

function ChartLine({
  variant = "curved",
  dots = "hover",
  marker,
  x,
  xFormat = "text",
  config,
  data,
  series,
  label,
  description,
  format = "currency",
  aspect,
  className,
  legend,
  tooltip = true,
  dataTable,
  delta = false,
  brush,
  children,
}: ChartFormProps & {
  /** O tooltip mostra a variação contra o ponto anterior. */
  delta?: boolean
  /** O recorte de período: `true` abre nos últimos 12 pontos, um número nos últimos N. */
  brush?: boolean | number
  x: string
  xFormat?: ChartFormat
  variant?: keyof typeof chartLineShape
  /** O marcador. `hover` só no ponto ativo — o padrão, e o menos ruidoso. */
  dots?: "none" | "hover" | "all"
  /** O último ponto com valor, marcado e pulsando: o "hoje" da série. */
  marker?: "last"
}) {
  const entrando = useChartEntering()
  const chaves = useSeries(config, series)
  const mostrarLegenda = legend ?? chaves.length >= 2

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={chaves}
      config={config}
      x={x}
      format={format}
    >
      <ChartContainer
        config={config}
        aspect={aspect}
        label={label}
        description={description}
        className={className}
        interactive={!!brush}
      >
        <LineChart data={data} accessibilityLayer>
          <ChartGrid />
          <ChartXAxis dataKey={x} format={xFormat} />
          <ChartYAxis format={axisFormatFor(format)} />
          {tooltip ? (
            <ChartTooltip
              {...CHART_TOOLTIP_MOTION}
              content={
                <ChartTooltipContent
                  format={format}
                  delta={delta ? { data, x, xFormat } : undefined}
                />
              }
            />
          ) : null}
          {mostrarLegenda ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {chaves.map((key, i) => (
            <Line
              key={key}
              {...chartMarkMotion(entrando, i)}
              dataKey={key}
              type={chartLineShape[variant]}
              stroke={serieColor(key, i, config)}
              strokeWidth={2}
              strokeDasharray={tracejada(config, key) ? CHART_DASH : undefined}
              // O marcador tem 8px de diâmetro: abaixo disso ele lê como
              // sujeira do traço, não como ponto de dado.
              dot={
                marker === "last"
                  ? chartMarkerDot(
                      ultimoIndiceComValor(data, key),
                      serieColor(key, i, config),
                      dots === "all"
                    )
                  : dots === "all"
                    ? // O miolo é a cor da série: sem `fill`, o Recharts pinta o
                      // ponto de branco, e ele abria um buraco no traço.
                      { r: 4, strokeWidth: 2, stroke: "var(--chart-surface)", fill: serieColor(key, i, config) }
                    : false
              }
              activeDot={
                dots === "none"
                  ? false
                  : { r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }
              }
            />
          ))}
          {chartBrush(data, x, xFormat, brush)}
          {children}
        </LineChart>
      </ChartContainer>
    </ChartFrame>
  )
}

/** Maior que qualquer meia barra: o Recharts o reduz ao que cabe. */
const CHART_PILL_RADIUS = 999

/** O rótulo ativo do tooltip, publicado para fora do SVG: liga a seleção de barra ao teclado (o Enter do contêiner seleciona o rótulo lido aqui). Mora dentro do gráfico porque o gancho lê o estado do Recharts. */
function ChartActiveLabel({ onChange }: { onChange: (label: unknown) => void }) {
  const ativo = useActiveTooltipLabel()
  React.useEffect(() => {
    onChange(ativo)
  }, [ativo, onChange])
  return null
}

/** O apagado do que não está selecionado — o mesmo degrau da divisão. */
const CHART_DIM_OPACITY = 0.35

/** O apagado do que não está sob o cursor: as outras barras recuam e a do cursor fica (no lugar do retângulo cinza do Recharts). Mais leve que o da seleção, porque é passagem e não escolha. */
const CHART_HOVER_DIM_OPACITY = 0.45

/** Com uma barra escolhida, a do cursor (ou do teclado) fica no meio do caminho; sem o retângulo do Recharts, apagada ela não teria marca além da dica. */
const CHART_HOVER_OVER_SELECTION_OPACITY = 0.7

/** A ponta da barra: 8px e base reta. O Recharts limita o raio à meia largura, então uma barra fina sai com ponta de cápsula sozinha. */
const CHART_BAR_TIP = 8

function ChartBars({
  layout = "vertical",
  stacked = false,
  shape = "rounded",
  track = false,
  x,
  xFormat = "text",
  config,
  data,
  series,
  label,
  description,
  format = "currency",
  aspect,
  className,
  legend,
  tooltip = true,
  dataTable,
  signed = false,
  valueLabels = false,
  selected,
  onSelect,
  delta = false,
  children,
}: ChartFormProps & {
  /** Barras com sinal (saldo cruzando o zero): acima `--chart-income`, abaixo `--chart-expense`, com a linha do zero desenhada (cor não é o único canal). Uma série. */
  signed?: boolean
  /** O valor escrito na ponta de cada barra, comprimido como o eixo. Empilhado, o total. */
  valueLabels?: boolean
  /** O valor de `x` da barra selecionada. As outras apagam. */
  selected?: string | null
  /** Clicar seleciona e clicar de novo solta (`null`); pelo teclado, setas andam e Enter seleciona. Com ele o gráfico é `role="group"` e anuncia a seleção numa região viva. */
  onSelect?: (x: string | null) => void
  /** O tooltip mostra a variação contra o ponto anterior. */
  delta?: boolean
  x: string
  xFormat?: ChartFormat
  /** `vertical` (padrão) sobe; `horizontal` corre para a direita (ranking de nomes compridos); o Recharts precisa do eixo de categoria declarado, o que esta peça faz. */
  layout?: "vertical" | "horizontal"
  stacked?: boolean
  /** `rounded` (padrão) arredonda só a ponta; `pill` arredonda o segmento inteiro e lê como peça (poucas colunas sem eixo Y), com o vão de 2px em `--chart-surface` entre os segmentos. */
  shape?: "rounded" | "pill"
  /** O trilho: a coluna inteira em `--muted` atrás da barra, até o máximo do eixo; só a primeira série o desenha. */
  track?: boolean
}) {
  const entrando = useChartEntering()
  const chaves = useSeries(config, series)
  const horizontal = layout === "horizontal"
  // O Recharts limita o raio a meia largura/altura do retângulo, então um raio
  // grande é a pílula em qualquer tamanho de barra.
  const pilula = shape === "pill" ? CHART_PILL_RADIUS : null
  const pontaRaio: [number, number, number, number] = horizontal
    ? [0, CHART_BAR_TIP, CHART_BAR_TIP, 0]
    : [CHART_BAR_TIP, CHART_BAR_TIP, 0, 0]
  const mostrarLegenda = legend ?? (!signed && chaves.length >= 2)
  // O rótulo que o teclado alcançou, para o Enter selecionar.
  const ativoRef = React.useRef<unknown>(undefined)
  // A categoria sob o cursor (ou o teclado), que acende e apaga as outras.
  const [emFoco, setEmFoco] = React.useState<string | null>(null)
  const lerAtivo = React.useCallback((v: unknown) => {
    ativoRef.current = v
    setEmFoco(v == null ? null : String(v))
  }, [])
  const apagada = (linha: Record<string, unknown>) =>
    selected != null
      ? String(linha[x]) === selected
        ? 1
        : String(linha[x]) === emFoco
          ? CHART_HOVER_OVER_SELECTION_OPACITY
          : CHART_DIM_OPACITY
      : emFoco != null && String(linha[x]) !== emFoco
        ? CHART_HOVER_DIM_OPACITY
        : 1
  const alternar = (valor: unknown) => {
    if (!onSelect || valor == null) return
    const chave = String(valor)
    onSelect(chave === selected ? null : chave)
  }
  // O eixo de valor inclui o negativo (a base `[0, auto]` cortaria os meses no
  // vermelho). `auto` nos dois lados e não funções: com funções o Recharts não
  // arredonda. A linha do zero garante o zero com `ifOverflow="extendDomain"`.
  const dominioComSinal = ["auto", "auto"]
  const corDaBarra = (key: string, i: number, linha: Record<string, unknown>) =>
    signed
      ? Number(linha[key] ?? 0) < 0
        ? "var(--color-chart-expense)"
        : "var(--color-chart-income)"
      : serieColor(key, i, config)

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={chaves}
      config={config}
      x={x}
      format={format}
    >
      <ChartContainer
        config={config}
        aspect={aspect}
        label={label}
        description={
          onSelect
            ? `${description ? `${description} ` : ""}Use as setas para percorrer e Enter para selecionar.`
            : description
        }
        className={className}
        interactive={!!onSelect}
        onKeyDown={
          onSelect
            ? (e) => {
                if (e.key !== "Enter" && e.key !== " ") return
                e.preventDefault()
                alternar(ativoRef.current)
              }
            : undefined
        }
        overlay={
          onSelect ? (
            <span className="sr-only" aria-live="polite">
              {selected ? `${formatChartValue(selected, xFormat)} selecionado` : ""}
            </span>
          ) : undefined
        }
      >
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          accessibilityLayer
          barCategoryGap={horizontal ? "22%" : "18%"}
        >
          <ChartGrid vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <ChartXAxis
                type="number"
                format={axisFormatFor(format)}
                domain={signed ? (dominioComSinal as never) : undefined}
              />
              <ChartYAxis
                type="category"
                dataKey={x}
                format={xFormat}
                domain={undefined}
              />
            </>
          ) : (
            <>
              <ChartXAxis dataKey={x} format={xFormat} />
              <ChartYAxis
                format={axisFormatFor(format)}
                domain={signed ? (dominioComSinal as never) : undefined}
              />
            </>
          )}
          {signed ? (
            horizontal ? (
              <ChartReferenceLine x={0} tone="zero" ifOverflow="extendDomain" />
            ) : (
              <ChartReferenceLine y={0} tone="zero" ifOverflow="extendDomain" />
            )
          ) : null}
          <ChartActiveLabel onChange={lerAtivo} />
          {tooltip ? (
            <ChartTooltip
              {...CHART_TOOLTIP_MOTION}
              // Sem o retângulo por trás da coluna: quem marca a categoria é a própria barra, com as outras apagando.
              cursor={false}
              content={
                <ChartTooltipContent
                  format={format}
                  total={stacked}
                  delta={delta ? { data, x, xFormat } : undefined}
                />
              }
            />
          ) : null}
          {mostrarLegenda ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {chaves.map((key, i) => (
            <Bar
              key={key}
              {...chartMarkMotion(entrando, i)}
              dataKey={key}
              stackId={stacked ? "a" : undefined}
              fill={serieColor(key, i, config)}
              // A ponta arredonda e a base não. Arredondar os quatro cantos
              // levanta a barra da linha do zero, e a base é justamente o que
              // um gráfico de barras usa para dizer a magnitude.
              radius={
                pilula ?? (stacked && i < chaves.length - 1 ? 0 : pontaRaio)
              }
              background={
                track && i === 0
                  ? {
                      fill: "var(--color-muted)",
                      // O tipo do `background` diz `number`, mas quem o desenha é
                      // o mesmo `Rectangle` da barra (aceita os quatro cantos), e
                      // o trilho precisa da base reta dela.
                      radius: (pilula ?? pontaRaio) as number,
                    }
                  : undefined
              }
              // Os 2px de superfície entre segmentos empilhados. Pintados com
              // a cor do fundo e não com transparência: transparente mostraria
              // o segmento de trás.
              stroke={stacked ? "var(--chart-surface)" : undefined}
              strokeWidth={stacked ? 2 : undefined}
              onClick={
                onSelect
                  ? (entrada: { payload?: Record<string, unknown> }) =>
                      alternar(entrada.payload?.[x])
                  : undefined
              }
              style={onSelect ? { cursor: "pointer" } : undefined}
            >
              {data.map((linha, j) => (
                <Cell
                  key={String(linha[x] ?? j)}
                  fill={corDaBarra(key, i, linha)}
                  fillOpacity={apagada(linha)}
                  className="transition-[fill-opacity] duration-(--duration-base) ease-(--ease-out)"
                />
              ))}
              {valueLabels && (!stacked || i === chaves.length - 1) ? (
                <LabelList
                  position={horizontal ? "right" : "top"}
                  offset={6}
                  className="fill-foreground"
                  fontSize={11}
                  // Empilhado, o rótulo é o total da coluna, na ponta do último
                  // segmento — um rótulo por segmento empilharia números.
                  valueAccessor={(entrada: { payload?: Record<string, unknown> }) =>
                    stacked
                      ? chaves.reduce((acc, k) => acc + Number(entrada.payload?.[k] ?? 0), 0)
                      : (entrada.payload?.[key] as number)
                  }
                  formatter={(v: unknown) => formatChartValue(v, axisFormatFor(format))}
                />
              ) : null}
            </Bar>
          ))}
          {children}
        </BarChart>
      </ChartContainer>
    </ChartFrame>
  )
}

const chartDonutThickness = { sm: 0.72, md: 0.62, lg: 0.48 } as const

/** A fatia sob o tooltip, publicada para fora do SVG: acende a rosca ativa pelo ponteiro e pelo teclado (o `accessibilityLayer` move o mesmo tooltip). */
function ChartActiveSlice({
  nameKey,
  onChange,
}: {
  nameKey: string
  onChange: (nome: string | null) => void
}) {
  const pontos = useActiveTooltipDataPoints() as Record<string, unknown>[] | undefined
  const ponto = pontos?.[0]
  const nome = ponto == null ? null : String(ponto[nameKey] ?? "")
  React.useEffect(() => {
    onChange(nome)
  }, [nome, onChange])
  return null
}

/**
 * O medidor tem geometria própria: o arco é fino (com o anel da rosca, 62% de
 * raio interno, a corda interna media 42px e `76%` já ocupava 43) e a caixa não
 * é quadrada. O Recharts centraliza o círculo inteiro, deixando 68px mortos
 * embaixo de um meio-arco; `cy` a 86% encosta o arco na base, e o raio passa de
 * 130% do máximo, que o Recharts aceita.
 */
const chartGaugeThickness = { sm: 0.86, md: 0.78, lg: 0.66 } as const

/** Raio externo do medidor, em % do raio máximo — acima de 100 de propósito. */
const CHART_GAUGE_OUTER = 130

/** Onde fica a origem do arco, em % da altura. O rótulo se apoia nela. */
const CHART_GAUGE_CY = 86

function ChartDonut({
  variant = "donut",
  thickness = "md",
  nameKey,
  dataKey,
  config,
  data,
  label,
  description,
  format = "currency",
  aspect,
  className,
  legend,
  tooltip = true,
  dataTable,
  center,
  bands,
  active,
  onActiveChange,
  children,
}: Omit<ChartFormProps, "series" | "legend"> & {
  /** A fatia acesa pelo nome (`nameKey`), para quem tem a própria lista (a da fatura, de links). */
  active?: string | null
  /** A fatia que o ponteiro ou o teclado acendeu no gráfico, para a tela acender a linha. */
  onActiveChange?: (nome: string | null) => void
  /** `true` é a fileira embaixo (padrão a partir de duas fatias); `list` é a lista ao lado do anel, com valor e porcentagem (desce abaixo do anel em `sm`). */
  legend?: boolean | "list"
  /** Os cortes de aviso e perigo, só no `gauge`: o arco usado pinta o estado (mesmos tokens e cortes do `Progress`) e o resto vira o trilho em `--muted`. */
  bands?: ProgressBands
  /** `donut` deixa o miolo livre para o total; `pie` fecha o miolo; `gauge` é o meio-círculo de progresso contra um teto (orçamento, limite de cartão). */
  variant?: "donut" | "pie" | "gauge"
  thickness?: keyof typeof chartDonutThickness
  nameKey: string
  dataKey: string
  /** O `ChartDonutCenter`. Ele é irmão do gráfico, nunca filho — ver abaixo. */
  center?: React.ReactNode
}) {
  const entrando = useChartEntering()
  const pizza = variant === "pie"
  const medidor = variant === "gauge"
  // O padrão é por variante, como `size` no `Tabs` e `stretch` no `Carousel`:
  // a rosca é redonda e quer um quadrado; o meio-arco não.
  const proporcao = aspect ?? (medidor ? "standard" : "square")
  const externo = medidor ? `${CHART_GAUGE_OUTER}%` : "80%"
  const interno = pizza
    ? 0
    : medidor
      ? `${Math.round(chartGaugeThickness[thickness] * CHART_GAUGE_OUTER)}%`
      : `${Math.round(chartDonutThickness[thickness] * 100)}%`
  const chaves = React.useMemo(
    () => data.map((d) => String(d[nameKey] ?? "")),
    [data, nameKey]
  )
  const mostrarLegenda = legend ?? data.length >= 2
  const emLista = legend === "list"

  // A rosca ativa: o tooltip (ponteiro e teclado) e a lista acendem uma fatia, as outras apagam, e o miolo passa a mostrá-la.
  const [ativoGrafico, setAtivoGraficoLocal] = React.useState<string | null>(null)
  const [ativoLista, setAtivoLista] = React.useState<number | null>(null)
  const setAtivoGrafico = React.useCallback(
    (nome: string | null) => {
      setAtivoGraficoLocal(nome)
      onActiveChange?.(nome)
    },
    [onActiveChange]
  )
  const indiceAtivo =
    ativoLista ??
    (ativoGrafico != null
      ? chaves.indexOf(ativoGrafico)
      : active != null
        ? chaves.indexOf(active)
        : -1)
  const ativo = indiceAtivo >= 0 ? indiceAtivo : null
  const valores = React.useMemo(
    () => data.map((d) => (typeof d[dataKey] === "number" ? (d[dataKey] as number) : 0)),
    [data, dataKey]
  )
  const total = valores.reduce((acc, v) => acc + v, 0)
  const pcts = React.useMemo(() => splitPercents(valores), [valores])
  // O medidor com faixas: o usado no estado, o resto no trilho.
  const pctUsado = total > 0 ? (valores[0] / total) * 100 : 0
  const corDaFatia = (i: number) =>
    medidor && bands
      ? i === 0
        ? chartRadialColor(pctUsado, bands, serieColor(chaves[0], 0, config))
        : "var(--color-muted)"
      : serieColor(chaves[i], i, config)

  // A variante é do `ChartDonut`, então é ele que a injeta no `ChartDonutCenter` (quem escreve o rótulo não decide o medidor).
  const centroFixo =
    medidor && React.isValidElement<{ align?: "center" | "gauge" }>(center)
      ? React.cloneElement(center, { align: "gauge" })
      : center
  // Com uma fatia acesa, o miolo da rosca passa a ser dela.
  const centro =
    center && ativo != null && !medidor ? (
      <ChartDonutCenter
        amount={valores[ativo]}
        format={format}
        label={config[chaves[ativo]]?.label ?? chaves[ativo]}
      />
    ) : (
      centroFixo
    )

  // A legenda é HTML ao lado do gráfico, e não a `<Legend>` do Recharts: dentro
  // do SVG ela reserva espaço encolhendo o anel e o centro deixa de coincidir
  // com o da caixa, onde o `ChartDonutCenter` se apoia.
  const legendaPayload = React.useMemo(
    () =>
      data.map((linha, i) => ({
        value: chaves[i],
        dataKey: chaves[i],
        color:
          medidor && bands
            ? i === 0
              ? chartRadialColor(pctUsado, bands, serieColor(chaves[0], 0, config))
              : "var(--color-muted)"
            : serieColor(chaves[i], i, config),
        payload: linha,
      })),
    [bands, chaves, config, data, medidor, pctUsado]
  )

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={[dataKey]}
      config={config}
      x={nameKey}
      xLabel="Categoria"
      format={format}
    >
      {/* `items-center` centra o anel sobre a legenda (com `stretch` ele
          encostava na esquerda: 102px fora do centro). `w-fit` respeita o
          espaço disponível, então a legenda quebra linha no telefone em vez de
          esticar o envelope. */}
      <div
        className={cn(
          "flex flex-col items-center",
          emLista ? "w-full gap-4 sm:flex-row sm:gap-8" : "w-fit"
        )}
        onPointerLeave={() => setAtivoLista(null)}
      >
        <ChartContainer
          config={config}
          aspect={proporcao}
          label={label}
          description={description}
          className={cn(emLista && "shrink-0", className)}
          overlay={centro}
          style={
            {
              // O furo, em fração da largura: o raio interno do Recharts é
              // percentual do raio máximo, então `innerRadius="62%"` dá um furo
              // de 62% da caixa. O miolo lê isto para não transbordar.
              "--chart-donut-hole": `${Math.round(
                (pizza
                  ? 0
                  : medidor
                    ? chartGaugeThickness[thickness]
                    : chartDonutThickness[thickness]) * 100
              )}%`,
              // O rótulo do medidor se apoia 5 pontos acima da origem do arco;
              // `bottom` em porcentagem resolve contra a altura, sem depender da proporção da caixa.
              "--chart-donut-label-b": `${100 - CHART_GAUGE_CY + 5}%`,
            } as React.CSSProperties
          }
        >
          <PieChart accessibilityLayer>
            {tooltip ? (
              <ChartTooltip
{...CHART_TOOLTIP_MOTION}
                content={
                  <ChartTooltipContent
                    format={format}
                    nameKey={nameKey}
                    hideLabel
                    share={total}
                  />
                }
              />
            ) : null}
            <ChartActiveSlice nameKey={nameKey} onChange={setAtivoGrafico} />
            <Pie
              {...chartMarkMotion(entrando)}
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={interno}
              outerRadius={externo}
              startAngle={medidor ? 180 : 90}
              endAngle={medidor ? 0 : -270}
              cy={medidor ? `${CHART_GAUGE_CY}%` : undefined}
              paddingAngle={1}
              // Os mesmos 2px de superfície das barras empilhadas.
              stroke="var(--chart-surface)"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell
                  key={chaves[i] || i}
                  fill={corDaFatia(i)}
                  fillOpacity={ativo != null && ativo !== i ? CHART_DIM_OPACITY : 1}
                  className="transition-[fill-opacity] duration-(--duration-base) ease-(--ease-out)"
                />
              ))}
            </Pie>
            {children}
          </PieChart>
        </ChartContainer>
        {mostrarLegenda && emLista ? (
          <ul
            data-slot="chart-donut-legend"
            className="grid w-full min-w-0 gap-1 text-xs sm:flex-1"
          >
            {data.map((_, i) => (
              <li
                key={chaves[i] || i}
                data-active={ativo === i || undefined}
                className={cn(
                  // A linha da lista veste o degrau linha, com 28px: a 24, 12 era a metade e saía pílula.
                  "flex items-center gap-2 rounded-row px-2 py-1.5",
                  "transition-[opacity,background-color] duration-(--duration-base) ease-(--ease-out)",
                  ativo === i && "bg-muted",
                  ativo != null && ativo !== i && "opacity-60",
                  chartRiseClassName
                )}
                // A fatia acende com o cursor; o toque a deixaria acesa.
                onPointerEnter={(e) => {
                  if (ehCursor(e)) setAtivoLista(i)
                }}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: corDaFatia(i) }}
                />
                <span className="min-w-0 flex-1 truncate">
                  {config[chaves[i]]?.label ?? chaves[i]}
                </span>
                <span className="nums font-mono text-foreground">
                  {formatChartValue(valores[i], format)}
                </span>
                <span className="nums w-9 text-right font-mono text-muted-foreground">
                  {pcts[i]}%
                </span>
              </li>
            ))}
          </ul>
        ) : mostrarLegenda ? (
          <ChartLegendContent
            config={config}
            payload={legendaPayload}
            nameKey={nameKey}
          />
        ) : null}
      </div>
    </ChartFrame>
  )
}

/**
 * O valor do miolo: texto pronto (`value`), que fica parado — o "76%" do
 * medidor —, ou número (`amount` + `format`), que conta na entrada e na troca.
 */
type ChartDonutCenterValue =
  | { value: string; amount?: never; format?: never }
  | { value?: never; amount: number; format?: ChartFormat }

/**
 * O miolo da rosca. Chega pelo prop `center` e não por `children`, que desce
 * para dentro do `<PieChart>` (SVG, onde uma `<div>` não renderiza); o
 * `ChartDonut` o entrega ao `overlay` do `ChartContainer`, a caixa que tem
 * tamanho.
 */
function ChartDonutCenter({
  value,
  amount,
  format = "currency",
  label,
  align = "center",
  className,
  ...props
}: React.ComponentProps<"div"> & ChartDonutCenterValue & {
  label?: React.ReactNode
  /**
   * `center` é o furo da rosca. `gauge` apoia o bloco na origem do arco, e
   * quem o passa é o `ChartDonut` por clone — o medidor não é decisão de quem
   * escreve o rótulo.
   */
  align?: "center" | "gauge"
}) {
  // O corpo é conta, e não escada de faixas, que não conheceriam a caixa
  // (`R$ 3.510,00` cabe numa rosca de 300px e transborda numa de 176) e supõem
  // que o texto quebra (o `Intl` separa `R$` com espaço inseparável, então
  // `text-balance` e `max-width` não agem). O furo mede `--chart-donut-hole`
  // da caixa (62%), a face mono avança ~0,6em por caractere, logo cabe
  // `62 / (0,6 × n)` ≈ `103 / n` por cento; o 88 é isso com folga (a 96 cabia
  // e encostava no anel). Em `style` e não em classe: classe montada em tempo
  // de execução não existe para o Tailwind. Com `amount`, a medida sai do texto
  // final, para o corpo não encolher e crescer junto na contagem.
  const texto = amount != null ? formatChartValue(amount, format) : (value ?? "")
  const corpo = `min(1.5rem, ${(88 / Math.max(texto.length, 1)).toFixed(2)}cqw)`

  return (
    <div
      data-slot="chart-donut-center"
      aria-hidden
      className={cn(
        "pointer-events-none absolute flex flex-col items-center gap-0 text-center @container",
        align === "gauge"
          ? // Ancorado na origem do arco, e não no centro da caixa: o bloco
            // cresce para cima, de onde o meio-arco tem espaço.
            "inset-x-0 bottom-(--chart-donut-label-b,19%)"
          : "inset-0 justify-center",
        className
      )}
      {...props}
    >
      <span
        className="nums leading-tight font-mono font-semibold text-foreground"
        style={{ fontSize: corpo }}
      >
        {amount != null ? <ChartNumber value={amount} format={format} /> : value}
      </span>
      {label ? (
        <span
          className="max-w-(--chart-donut-hole,62%) leading-tight text-muted-foreground"
          // Pela mesma razão do valor: proporcional à caixa, em `style` e não
          // em classe. O piso é `--text-2xs`, o menor degrau do sistema — sem
          // ele, uma rosca pequena escreveria a legenda abaixo da escala.
          style={{ fontSize: "min(var(--text-xs), max(var(--text-2xs), 6.5cqw))" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}

/* As formas de divisão, anéis, calendário e perfil */

/**
 * A raiz das formas que são HTML e não SVG (`ChartSplit`, `ChartHeatmap`): elas
 * não passam pelo `ChartContainer` (o `ResponsiveContainer` só mede gráfico do
 * Recharts), mas precisam do escopo `data-chart` com as `--color-<chave>` do
 * `config`, do contexto e do nome acessível.
 */
function ChartHtmlRoot({
  config,
  label,
  description,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  label: string
  description?: string
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${uniqueId.replace(/:/g, "")}`
  const descriptionId = description ? `${chartId}-desc` : undefined

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        role="img"
        aria-label={label}
        aria-describedby={descriptionId}
        className={cn("text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {description ? (
          <span id={descriptionId} className="sr-only">
            {description}
          </span>
        ) : null}
        {children}
      </div>
    </ChartContext.Provider>
  )
}

/**
 * O número que conta: de 0 na entrada, do valor anterior na troca. Escreve por
 * `ref` e não por estado (um re-render por quadro seria trabalho invisível), e o
 * `span` que conta não tem filho do React (trocar `textContent` de um nó que o
 * React acha dele quebra a desmontagem). A caixa é reservada pelo valor final
 * num irmão invisível, e o leitor de tela ouve só o final (`sr-only`).
 */
function ChartNumber({
  value,
  format,
  step,
  className,
}: {
  value: number
  format: ChartFormat
  /** O passo dos intermediários. O padrão é 1 quando o final é inteiro — um
   *  "3" contando não passa por "2,37". */
  step?: number
  className?: string
}) {
  const passo = step ?? (Number.isInteger(value) ? 1 : undefined)
  const final = formatChartValue(value, format)
  // Conta de 0 ao montar, junto com as marcas, e do valor anterior na troca.
  const ref = useCountUp(
    value,
    (v) => formatChartValue(passo ? Math.round(v / passo) * passo : v, format),
    {
      chave: `${format}:${passo}`,
      entrada: CHART_ENTER_MS / 1000,
      troca: CHART_UPDATE_MS / 1000,
      ease: CHART_EASING_POINTS,
    }
  )

  return (
    <span data-slot="chart-number" className={cn("inline-grid", className)}>
      <span ref={ref} aria-hidden className="col-start-1 row-start-1" />
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  )
}

/** Porcentagens inteiras que somam 100, pelo maior resto (arredondar cada parte daria "33% · 33% · 33%" para três terços). */
export function splitPercents(values: number[]): number[] {
  const positivos = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0))
  const total = positivos.reduce((acc, v) => acc + v, 0)
  if (total === 0) return positivos.map(() => 0)
  const exatos = positivos.map((v) => (v / total) * 100)
  const inteiros = exatos.map(Math.floor)
  let falta = 100 - inteiros.reduce((acc, v) => acc + v, 0)
  const porResto = exatos
    .map((v, i) => ({ i, resto: v - Math.floor(v) }))
    .filter(({ i }) => positivos[i] > 0)
    .sort((a, b) => b.resto - a.resto || a.i - b.i)
  for (const { i } of porResto) {
    if (falta <= 0) break
    inteiros[i] += 1
    falta -= 1
  }
  return inteiros
}

/** O comprimento de um segmento da divisão é dado: na troca transiciona em `--ease-out`, que não passa do alvo; o esmaecer do hover divide a mesma transição. */
const chartSplitGrowClassName =
  "transition-[flex-grow,opacity] duration-(--duration-slow) ease-(--ease-out)"

/** A entrada da divisão é uma revelação da esquerda, e não o `flex-grow` subindo de 0 (todos crescendo juntos mantêm a proporção e a barra saía pronta no primeiro quadro). */
const chartSplitRevealClassName =
  "[clip-path:inset(0)] transition-[clip-path] duration-(--duration-spring) ease-(--ease-out) starting:[clip-path:inset(0_100%_0_0)]"

/** O que aparece (rótulo, legenda, item de lista) sobe 4px e acende na mola da casa; não é dado. */
const chartRiseClassName =
  "transition-[opacity,translate] duration-(--duration-spring) ease-(--ease-spring) starting:translate-y-1 starting:opacity-0"

/** Abaixo disto o segmento não cabe o próprio rótulo, e ele vai para a legenda. */
const CHART_SPLIT_LABEL_MIN = 12

/** A divisão de um total em duas a quatro partes numa barra só: a forma certa para "quanto de cada" com poucas partes (a rosca gastaria um quadrado inteiro). */
function ChartSplit({
  labels = "below",
  nameKey,
  dataKey,
  config,
  data,
  label,
  description,
  format = "currency",
  className,
  dataTable,
}: Omit<ChartFormProps, "series" | "aspect" | "legend" | "tooltip" | "children"> & {
  nameKey: string
  dataKey: string
  /** `below` escreve nome e porcentagem sob o começo de cada segmento (o que tem menos de 12% cai para uma legenda embaixo); `legend` põe todos numa legenda só. */
  labels?: "below" | "legend"
}) {
  const [ativo, setAtivo] = React.useState<number | null>(null)
  const chaves = data.map((d) => String(d[nameKey] ?? ""))
  const valores = data.map((d) => (typeof d[dataKey] === "number" ? (d[dataKey] as number) : 0))
  const pcts = splitPercents(valores)
  const cores = chaves.map((k, i) => serieColor(k, i, config))
  const nome = (i: number) => config[chaves[i]]?.label ?? chaves[i]
  const resumo = chaves
    .map((_, i) => `${nome(i)} ${pcts[i]}% (${formatChartValue(valores[i], format)})`)
    .join(", ")
  const naLegenda = chaves
    .map((k, i) => i)
    .filter((i) => valores[i] > 0 && (labels === "legend" || pcts[i] < CHART_SPLIT_LABEL_MIN))

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={[dataKey]}
      config={config}
      x={nameKey}
      xLabel="Parte"
      format={format}
    >
      <ChartHtmlRoot
        config={config}
        label={`${label}: ${resumo}`}
        description={description}
        className={cn("flex w-full flex-col", className)}
      >
        <div
          data-slot="chart-split-bar"
          className={cn("flex w-full gap-1", chartSplitRevealClassName)}
          onPointerLeave={() => setAtivo(null)}
        >
          {chaves.map((k, i) =>
            valores[i] > 0 ? (
              <div
                key={k || i}
                className={cn(
                  "h-2 min-w-1 rounded-full",
                  chartSplitGrowClassName,
                  ativo !== null && ativo !== i && "opacity-35"
                )}
                // `flex-grow` com o valor cru: o comprimento é a medida exata, o texto é que arredonda.
                style={{
                  flex: `${valores[i]} 1 0`,
                  backgroundColor: cores[i],
                }}
                onPointerEnter={(e) => {
                  if (ehCursor(e)) setAtivo(i)
                }}
              />
            ) : null
          )}
        </div>
        {labels === "below" ? (
          <div
            aria-hidden
            className={cn("flex w-full gap-1 pt-2", chartRiseClassName)}
          >
            {chaves.map((k, i) =>
              valores[i] > 0 ? (
                <div
                  key={k || i}
                  className={cn("flex min-w-1 flex-col", chartSplitGrowClassName)}
                  style={{ flex: `${valores[i]} 1 0` }}
                >
                  {pcts[i] >= CHART_SPLIT_LABEL_MIN ? (
                    <>
                      <span className="truncate font-medium text-foreground">
                        {nome(i)}
                      </span>
                      <ChartNumber
                        value={pcts[i] / 100}
                        format="percent"
                        step={0.01}
                        className="nums truncate font-mono text-muted-foreground"
                      />
                    </>
                  ) : null}
                </div>
              ) : null
            )}
          </div>
        ) : null}
        {naLegenda.length ? (
          <ChartLegendContent
            aria-hidden
            align="start"
            format="percent"
            payload={naLegenda.map((i) => ({
              value: chaves[i],
              dataKey: chaves[i],
              color: cores[i],
              payload: { value: pcts[i] / 100 },
            }))}
          />
        ) : null}
      </ChartHtmlRoot>
    </ChartFrame>
  )
}

/** A cor de um anel. Com `bands` diz estado (tokens de estado, não a rampa): o único gráfico em que verde e vermelho significam o que significam. Sem `bands` só identifica a categoria. */
export function chartRadialColor(
  pct: number,
  bands: ProgressBands | undefined,
  identidade: string
): string {
  if (!bands) return identidade
  return `var(--color-${progressToneForBands(pct, bands)})`
}

/** Anéis concêntricos, um por categoria contra o próprio teto: o `Progress` dobrado em círculo (mesmos cortes `BUDGET_BANDS`, mesmo estouro). Cinco no máximo. */
function ChartRadial({
  bands,
  nameKey,
  dataKey,
  maxKey,
  config,
  data,
  label,
  description,
  format = "currency",
  aspect = "square",
  className,
  legend = true,
  dataTable,
  center,
  children,
}: Omit<ChartFormProps, "series" | "tooltip"> & {
  nameKey: string
  dataKey: string
  /** O teto de cada anel — o orçamento da categoria. */
  maxKey: string
  /** Os cortes de aviso e perigo, em %. Sem eles a cor é a da categoria. */
  bands?: ProgressBands
  /** O `ChartDonutCenter`, como na rosca. */
  center?: React.ReactNode
}) {
  const entrando = useChartEntering()
  const aneis = React.useMemo(
    () =>
      data.slice(0, CHART_RAMP_LENGTH).map((linha, i) => {
        const nome = String(linha[nameKey] ?? "")
        const valor = typeof linha[dataKey] === "number" ? (linha[dataKey] as number) : 0
        const teto = typeof linha[maxKey] === "number" ? (linha[maxKey] as number) : 0
        const pct = teto > 0 ? (valor / teto) * 100 : 0
        return {
          nome,
          valor,
          teto,
          pct,
          // O arco para em 100: o estouro já está na cor e no número.
          arco: Math.min(pct, 100),
          cor: chartRadialColor(pct, bands, serieColor(nome, i, config)),
        }
      }),
    [bands, config, data, dataKey, maxKey, nameKey]
  )
  // O Recharts desenha o primeiro item no anel de dentro; a leitura é de fora
  // para dentro, na ordem da legenda.
  const desenho = React.useMemo(() => [...aneis].reverse(), [aneis])

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={[dataKey, maxKey]}
      config={config}
      x={nameKey}
      xLabel="Categoria"
      format={format}
    >
      <div
        className="flex w-fit flex-col items-center"
      >
        <ChartContainer
          config={config}
          aspect={aspect}
          label={label}
          description={description}
          className={className}
          overlay={center}
          style={{ "--chart-donut-hole": "40%" } as React.CSSProperties}
        >
          <RadialBarChart
            data={desenho}
            innerRadius="42%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barCategoryGap="22%"
            accessibilityLayer
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              {...chartMarkMotion(entrando)}
              dataKey="arco"
              background
              cornerRadius={CHART_PILL_RADIUS}
            >
              {desenho.map((anel, i) => (
                <Cell key={anel.nome || i} fill={anel.cor} />
              ))}
            </RadialBar>
            {children}
          </RadialBarChart>
        </ChartContainer>
        {legend ? (
          <ul data-slot="chart-radial-legend" className="grid w-full gap-1.5 pt-3 text-xs">
            {aneis.map((anel, i) => (
              <li
                key={anel.nome || i}
                className={cn("flex items-center gap-2", chartRiseClassName)}
                // Um item atrás do outro, na ordem dos anéis de fora para dentro.
                // A linha só transiciona na entrada, então o atraso não pesa depois.
                style={{ transitionDelay: `${150 + i * CHART_STAGGER_MS}ms` }}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: anel.cor }}
                />
                <span className="min-w-0 flex-1 truncate">
                  {config[anel.nome]?.label ?? anel.nome}
                </span>
                <span className="nums font-mono text-muted-foreground">
                  {formatChartValue(anel.valor, format)} de{" "}
                  {formatChartValue(anel.teto, format)}
                </span>
                <ChartNumber
                  value={Math.round(anel.pct) / 100}
                  format="percent"
                  step={0.01}
                  className="nums w-10 justify-items-end font-mono font-medium text-foreground"
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </ChartFrame>
  )
}

/** Os degraus do calendário, de 0 a 4: zero é o dia sem movimento e os outros quatro são os quartis dos dias com valor (uma escala linear até o máximo deixaria o mês no primeiro degrau por causa do aluguel). */
export function chartHeatLevels(values: number[]): number[] {
  const comValor = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (!comValor.length) return values.map(() => 0)
  const quantil = (q: number) =>
    comValor[Math.min(comValor.length - 1, Math.ceil(q * comValor.length) - 1)]
  const cortes = [quantil(0.25), quantil(0.5), quantil(0.75)]
  return values.map((v) => {
    if (!(v > 0)) return 0
    if (v <= cortes[0]) return 1
    if (v <= cortes[1]) return 2
    if (v <= cortes[2]) return 3
    return 4
  })
}

/**
 * Os cinco degraus, escritos por extenso (o Tailwind varre o código como
 * texto). O tom entra por `--chart-heat`, e o degrau mistura mais ou menos dele
 * sobre `--muted`. A mistura é em `oklab` e não em `oklch`: `--muted` é cinza
 * de matiz 0, e em `oklch` a interpolação partia do verde (152) para o 0, com
 * os degraus do meio de `income` saindo marrons e oliva.
 */
const CHART_HEAT_LEVEL = [
  "bg-muted",
  "bg-[color-mix(in_oklab,var(--chart-heat)_25%,var(--color-muted))]",
  "bg-[color-mix(in_oklab,var(--chart-heat)_50%,var(--color-muted))]",
  "bg-[color-mix(in_oklab,var(--chart-heat)_75%,var(--color-muted))]",
  "bg-(--chart-heat)",
] as const

const chartHeatmapVariants = cva(
  "flex w-full flex-col gap-2 [--heat-cell:calc(var(--spacing)*3)]",
  {
    variants: {
      /** A intensidade é dinheiro e o tom diz de que lado: `expense` para o ritmo de gasto, `income` para o de entrada; não há tom neutro (cinco degraus de uma cor de série diriam "categoria"). */
      tone: {
        expense: "[--chart-heat:var(--color-chart-expense)]",
        income: "[--chart-heat:var(--color-chart-income)]",
      },
      range: {
        quarter: "[--heat-cell:calc(var(--spacing)*4)]",
        year: "",
      },
    },
    defaultVariants: { tone: "expense", range: "quarter" },
  }
)

/** Quanto a onda da entrada leva para cruzar o calendário, qualquer largura. */
const CHART_HEAT_SWEEP_MS = 400

/** A célula aparece ao montar (opacidade e escala na mola, por `@starting-style`); a troca de filtro só muda a cor do degrau. Cada propriedade tem a própria transição: a onda (`--heat-delay`, por coluna) atrasa só a entrada. */
const chartHeatCellClassName =
  "[transition:opacity_var(--duration-spring)_var(--ease-spring)_var(--heat-delay,0ms),scale_var(--duration-spring)_var(--ease-spring)_var(--heat-delay,0ms),background-color_var(--duration-slow)_var(--ease-out)] starting:scale-50 starting:opacity-0"

const CHART_HEAT_WEEKS = { quarter: 13, year: 53 } as const
/** Domingo primeiro, como o calendário brasileiro; só três rótulos cabem. */
const CHART_HEAT_WEEKDAYS = ["", "seg", "", "qua", "", "sex", ""] as const

type ChartHeatmapDay = { date: string; value: number }

/**
 * O ritmo por dia (calendário de gasto): cada coluna uma semana, cada linha um
 * dia da semana, em cinco degraus do tom de dinheiro. As células não são
 * focáveis (365 paradas de `Tab` seriam hostis); o caminho por teclado e leitor
 * de tela é o `dataTable`, e o nome acessível resume o total e o dia de pico.
 */
function ChartHeatmap({
  data,
  end,
  range = "quarter",
  tone,
  label,
  description,
  format = "currency",
  className,
  dataTable,
}: {
  data: ChartHeatmapDay[]
  /** O último dia, `YYYY-MM-DD`. O padrão é o dia mais recente de `data`. */
  end?: string
  range?: keyof typeof CHART_HEAT_WEEKS
  tone?: VariantProps<typeof chartHeatmapVariants>["tone"]
  label: string
  description?: string
  format?: ChartFormat
  className?: string
  dataTable?: boolean
}) {
  const [lido, setLido] = React.useState<ChartHeatmapDay | null>(null)
  const semanas = CHART_HEAT_WEEKS[range]

  const { colunas, meses, inicio, fim, resumo, comValor } = React.useMemo(() => {
    const porDia = new Map(data.map((d) => [d.date, d.value]))
    const ultimo =
      end ?? data.reduce((acc, d) => (compareYmd(d.date, acc) > 0 ? d.date : acc), data[0]?.date ?? localYmdFromDate(new Date()))
    const diaDaSemana = parseYmdLocal(ultimo)?.getDay() ?? 0
    const primeiro = addDaysYmd(ultimo, -diaDaSemana - (semanas - 1) * 7)

    const dias: (ChartHeatmapDay | null)[] = []
    for (let i = 0; i < semanas * 7; i++) {
      const date = addDaysYmd(primeiro, i)
      dias.push(compareYmd(date, ultimo) > 0 ? null : { date, value: porDia.get(date) ?? 0 })
    }
    const niveis = chartHeatLevels(dias.map((d) => d?.value ?? 0))
    const colunas = Array.from({ length: semanas }, (_, s) =>
      dias.slice(s * 7, s * 7 + 7).map((dia, d) => (dia ? { ...dia, nivel: niveis[s * 7 + d] } : null))
    )

    // Um rótulo de mês onde o mês da coluna muda, e só se houver três colunas de espaço desde o anterior.
    const meses: { coluna: number; nome: string }[] = []
    let anterior = -1
    colunas.forEach((col, s) => {
      const primeiroDia = col[0]
      if (!primeiroDia) return
      const mes = primeiroDia.date.slice(0, 7)
      const mesAnterior = s > 0 ? colunas[s - 1][0]?.date.slice(0, 7) : null
      if (s === 0 || mes !== mesAnterior) {
        if (anterior < 0 || s - anterior >= 3) {
          meses.push({ coluna: s, nome: formatMonthShortPtBr(parseYmdLocal(primeiroDia.date)!) })
          anterior = s
        }
      }
    })

    const validos = dias.filter((d): d is ChartHeatmapDay => d !== null)
    const total = validos.reduce((acc, d) => acc + d.value, 0)
    const pico = validos.reduce<ChartHeatmapDay | null>((acc, d) => (!acc || d.value > acc.value ? d : acc), null)
    const resumo =
      pico && pico.value > 0
        ? `Total ${formatChartValue(total, format)}; maior dia ${formatChartValue(pico.date, "date")}, ${formatChartValue(pico.value, format)}.`
        : "Sem movimento no período."

    return {
      colunas,
      meses,
      inicio: primeiro,
      fim: ultimo,
      resumo,
      comValor: validos.filter((d) => d.value > 0),
    }
  }, [data, end, format, semanas])

  // O ano não cabe no telefone: a grade rola e abre rolada até hoje. O viewport
  // do `ScrollArea` não é o pai da grade (o Radix põe um invólucro `display:
  // table`), então é achado pelo atributo que o Radix carimba.
  const gradeRef = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const viewport = gradeRef.current?.closest<HTMLElement>(
      "[data-radix-scroll-area-viewport]"
    )
    if (viewport) viewport.scrollLeft = viewport.scrollWidth
  }, [semanas])

  const grade = { "--heat-cols": `repeat(${semanas}, var(--heat-cell))` } as React.CSSProperties

  return (
    <ChartFrame
      dataTable={dataTable}
      data={comValor}
      series={["value"]}
      config={{ value: { label: "Valor" } }}
      x="date"
      xLabel="Dia"
      xFormat="date"
      format={format}
    >
      <div
        className={cn(chartHeatmapVariants({ tone, range }), className)}
      >
        <ChartHtmlRoot config={{}} label={`${label}. ${resumo}`} description={description}>
          <ScrollArea orientation="horizontal" variant="fade">
            <div
              ref={gradeRef}
              className="grid w-max grid-cols-[auto_auto] gap-x-2 gap-y-1"
              onPointerLeave={(e) => {
                // No toque a leitura fica: o dedo sai logo depois de tocar, e
                // apagar ali seria mostrar o dia por um quadro.
                if (e.pointerType === "mouse") setLido(null)
              }}
            >
              <span />
              <div className="grid grid-cols-(--heat-cols) gap-1" style={grade}>
                {meses.map((m) => (
                  <span
                    key={m.coluna}
                    className="text-2xs whitespace-nowrap text-muted-foreground"
                    style={{ gridColumnStart: m.coluna + 1 }}
                  >
                    {m.nome}
                  </span>
                ))}
              </div>
              <div className="grid grid-rows-7 gap-1">
                {CHART_HEAT_WEEKDAYS.map((dia, i) => (
                  <span key={i} className="flex h-(--heat-cell) items-center text-2xs leading-none text-muted-foreground">
                    {dia}
                  </span>
                ))}
              </div>
              <div className="grid grid-flow-col grid-cols-(--heat-cols) grid-rows-7 gap-1" style={grade}>
                {colunas.flat().map((dia, i) =>
                  dia ? (
                    <span
                      key={dia.date}
                      data-level={dia.nivel}
                      className={cn(
                        "size-(--heat-cell) rounded-sm",
                        CHART_HEAT_LEVEL[dia.nivel],
                        chartHeatCellClassName,
                        lido?.date === dia.date && "ring-2 ring-foreground/60"
                      )}
                      // A onda da entrada anda por coluna, e cruza a grade
                      // inteira em 400ms seja um trimestre ou um ano.
                      style={
                        {
                          "--heat-delay": `${Math.round(Math.floor(i / 7) * (CHART_HEAT_SWEEP_MS / semanas))}ms`,
                        } as React.CSSProperties
                      }
                      onPointerEnter={() => setLido(dia)}
                      onPointerDown={() => setLido(dia)}
                    />
                  ) : (
                    <span key={`vazio-${i}`} />
                  )
                )}
              </div>
            </div>
          </ScrollArea>
        </ChartHtmlRoot>
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground",
            chartRiseClassName
          )}
        >
          <output aria-live="polite" className="nums">
            {lido
              ? `${formatChartValue(lido.date, "date")} · ${formatChartValue(lido.value, format)}`
              : `${formatChartValue(inicio, "date")} – ${formatChartValue(fim, "date")}`}
          </output>
          <div aria-hidden className="flex items-center gap-1">
            <span className="pr-1">menos</span>
            {CHART_HEAT_LEVEL.map((classe) => (
              <span key={classe} className={cn("size-(--heat-cell) rounded-sm", classe)} />
            ))}
            <span className="pl-1">mais</span>
          </div>
        </div>
      </div>
    </ChartFrame>
  )
}

/** O perfil: várias categorias, uma por eixo, com duas ou três séries sobrepostas (este mês contra a média). Serve a "onde o mês fugiu do normal", não a magnitude; para o número, as barras. */
function ChartRadar({
  grid = "polygon",
  x,
  xFormat = "text",
  config,
  data,
  series,
  label,
  description,
  format = "currency",
  aspect = "square",
  className,
  legend,
  tooltip = true,
  dataTable,
  children,
}: ChartFormProps & {
  /** A chave do eixo — o nome da categoria em cada ponta. */
  x: string
  xFormat?: ChartFormat
  grid?: "polygon" | "circle"
}) {
  const entrando = useChartEntering()
  const chaves = useSeries(config, series)
  const mostrarLegenda = legend ?? chaves.length >= 2

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={chaves}
      config={config}
      x={x}
      xLabel="Categoria"
      xFormat={xFormat}
      format={format}
    >
      <ChartContainer
        config={config}
        aspect={aspect}
        label={label}
        description={description}
        className={className}
      >
        <RadarChart data={data} outerRadius="70%" accessibilityLayer>
          <PolarGrid gridType={grid} />
          <PolarAngleAxis
            dataKey={x}
            tickFormatter={(v) => formatChartValue(v, xFormat)}
          />
          {tooltip ? (
            <ChartTooltip {...CHART_TOOLTIP_MOTION} content={<ChartTooltipContent format={format} />} />
          ) : null}
          {mostrarLegenda ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {chaves.map((key, i) => (
            <Radar
              key={key}
              {...chartMarkMotion(entrando, i)}
              dataKey={key}
              stroke={serieColor(key, i, config)}
              strokeWidth={1.5}
              // A segunda série é tracejada: cor não é o único canal, e a
              // comparação típica é "este mês × a média", que é referência.
              strokeDasharray={i === 1 ? "4 3" : undefined}
              fill={serieColor(key, i, config)}
              fillOpacity={0.12}
            />
          ))}
          {children}
        </RadarChart>
      </ChartContainer>
    </ChartFrame>
  )
}

/* Cascata e ranking */

/** Um degrau da cascata. `total` é um saldo desenhado do zero; sem `value`, o acumulado. */
export type ChartWaterfallStep = { name: string; value?: number; total?: boolean }

/** Os degraus da cascata, com a faixa de cada barra (`[de, até]`) e o saldo acumulado depois dela; um `total` sem valor fecha no acumulado. Exportada para teste. */
export function waterfallSteps(data: ChartWaterfallStep[]) {
  let acumulado = 0
  return data.map((d) => {
    if (d.total) {
      const v = d.value ?? acumulado
      acumulado = v
      return {
        name: d.name,
        value: v,
        faixa: [Math.min(0, v), Math.max(0, v)] as [number, number],
        acumulado,
        tipo: "total" as const,
      }
    }
    const v = d.value ?? 0
    const de = acumulado
    acumulado += v
    return {
      name: d.name,
      value: v,
      faixa: [Math.min(de, acumulado), Math.max(de, acumulado)] as [number, number],
      acumulado,
      tipo: v < 0 ? ("down" as const) : ("up" as const),
    }
  })
}

const CHART_WATERFALL_COLOR = {
  up: "var(--color-chart-income)",
  down: "var(--color-chart-expense)",
  // O saldo não é entrada nem saída: neutro, para não ler como um dos dois.
  total: "var(--color-muted-foreground)",
} as const

const CHART_WATERFALL_CONFIG = {
  up: { label: "Entrada" },
  down: { label: "Saída" },
  total: { label: "Saldo" },
} satisfies ChartConfig

/** O tooltip da cascata: o degrau com sinal e o saldo depois dele. */
function ChartWaterfallTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean
  payload?: { payload?: ReturnType<typeof waterfallSteps>[number] }[]
  format: ChartFormat
}) {
  const d = payload?.[0]?.payload
  if (!active || !d) return null
  const sinal = d.tipo === "total" ? "" : d.value < 0 ? "−" : "+"
  return (
    <div
      data-slot="chart-tooltip-content"
      className={cn("grid min-w-32 gap-1.5 px-2.5 py-1.5 text-xs", menuPanelSurfaceClassName)}
    >
      <div className="font-medium">{d.name}</div>
      <div className="flex items-center justify-between gap-3 leading-none">
        <span className="text-muted-foreground">{CHART_WATERFALL_CONFIG[d.tipo].label}</span>
        <span className="nums font-mono font-medium text-foreground">
          {sinal}
          {formatChartValue(Math.abs(d.value), format)}
        </span>
      </div>
      {d.tipo !== "total" ? (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-1.5 leading-none">
          <span className="text-muted-foreground">Saldo depois</span>
          <span className="nums font-mono font-medium text-foreground">
            {formatChartValue(d.acumulado, format)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/**
 * A cascata do saldo: do saldo inicial ao final, cada entrada sobe e cada saída
 * desce. É uma barra de faixa do Recharts (`dataKey` devolvendo `[de, até]`),
 * que deixa o saldo cruzar o zero sem pilha de barras transparentes. A cor diz o
 * sentido e a posição também.
 */
function ChartWaterfall({
  data,
  label,
  description,
  format = "currency",
  aspect,
  className,
  legend = true,
  tooltip = true,
  valueLabels = false,
  dataTable,
  children,
}: {
  data: ChartWaterfallStep[]
  label: string
  description?: string
  format?: ChartFormat
  aspect?: VariantProps<typeof chartContainerVariants>["aspect"]
  className?: string
  /** Entrada, saída e saldo. Ligada: as três cores precisam de nome. */
  legend?: boolean
  tooltip?: boolean
  /** O degrau escrito na ponta de cada barra, com sinal e comprimido. */
  valueLabels?: boolean
  dataTable?: boolean
  children?: React.ReactNode
}) {
  const entrando = useChartEntering()
  const degraus = React.useMemo(() => waterfallSteps(data), [data])
  const [emFoco, setEmFoco] = React.useState<string | null>(null)
  const notarFoco = React.useCallback((v: unknown) => setEmFoco(v == null ? null : String(v)), [])

  return (
    <ChartFrame
      dataTable={dataTable}
      data={degraus}
      series={["value", "acumulado"]}
      config={{ value: { label: "Degrau" }, acumulado: { label: "Saldo depois" } }}
      x="name"
      xLabel="Etapa"
      format={format}
    >
        <div className="flex w-full flex-col">
          <ChartContainer
            config={CHART_WATERFALL_CONFIG}
            aspect={aspect}
            label={label}
            description={description}
            className={className}
          >
            <BarChart data={degraus} accessibilityLayer barCategoryGap="18%">
              <ChartGrid />
              <ChartXAxis dataKey="name" />
              <ChartYAxis
                format={axisFormatFor(format)}
                domain={[(min: number) => Math.min(0, min), "auto"] as never}
              />
              <ChartReferenceLine y={0} tone="zero" />
              <ChartActiveLabel onChange={notarFoco} />
              {tooltip ? (
                <ChartTooltip
                  {...CHART_TOOLTIP_MOTION}
                  cursor={false}
                  content={<ChartWaterfallTooltip format={format} />}
                />
              ) : null}
              {/* A ponta arredonda e a base não, como em toda barra da casa:
                  o saldo (`total`) nasce na linha do zero, e um degrau
                  flutuante não ganha nada com a base redonda. */}
              <Bar {...chartMarkMotion(entrando)} dataKey="faixa" radius={[CHART_BAR_TIP, CHART_BAR_TIP, 0, 0]}>
                {degraus.map((d, i) => (
                  <Cell
                    key={`${d.name}-${i}`}
                    fill={CHART_WATERFALL_COLOR[d.tipo]}
                    fillOpacity={emFoco != null && d.name !== emFoco ? CHART_HOVER_DIM_OPACITY : 1}
                    className="transition-[fill-opacity] duration-(--duration-base) ease-(--ease-out)"
                  />
                ))}
                {valueLabels ? (
                  <LabelList
                    position="top"
                    offset={6}
                    className="fill-foreground"
                    fontSize={11}
                    valueAccessor={(entrada: { payload?: ReturnType<typeof waterfallSteps>[number] }) => {
                      const d = entrada.payload
                      if (!d) return ""
                      const sinal = d.tipo === "total" ? "" : d.value < 0 ? "−" : "+"
                      return `${sinal}${formatChartValue(Math.abs(d.value), axisFormatFor(format))}`
                    }}
                  />
                ) : null}
              </Bar>
              {children}
            </BarChart>
          </ChartContainer>
          {legend ? (
            <ChartLegendContent
              config={CHART_WATERFALL_CONFIG}
              payload={(["up", "down", "total"] as const).map((k) => ({
                value: k,
                dataKey: k,
                color: CHART_WATERFALL_COLOR[k],
              }))}
            />
          ) : null}
        </div>
    </ChartFrame>
  )
}

/**
 * O ranking em lista: nome e valor numa linha, a barra proporcional embaixo
 * ("maiores gastos", "top categorias"). É texto de verdade: o nome quebra, o
 * leitor lê uma lista (a raiz é `figure`) e o valor conta na entrada. A cor é
 * uma só (`--chart-1`) a menos que o `config` dê cor por nome (cor que segue a
 * posição não segue a entidade); a ordem é de quem chama.
 */
function ChartBarList({
  data,
  nameKey,
  dataKey,
  config = {},
  label,
  description,
  format = "currency",
  share = false,
  className,
}: {
  data: Record<string, unknown>[]
  nameKey: string
  dataKey: string
  config?: ChartConfig
  label: string
  description?: string
  format?: ChartFormat
  /** A porcentagem do total ao lado do valor (somando 100, pelo maior resto). */
  share?: boolean
  className?: string
}) {
  const entrando = useChartEntering()
  const valores = data.map((d) => (typeof d[dataKey] === "number" ? (d[dataKey] as number) : 0))
  const maximo = Math.max(0, ...valores)
  const pcts = splitPercents(valores)

  return (
    <ChartHtmlRoot
      role="figure"
      data-slot="chart-bar-list"
      config={config}
      label={label}
      description={description}
      className={cn("w-full text-sm", className)}
    >
        <ul className="grid gap-3">
          {data.map((linha, i) => {
            const nome = String(linha[nameKey] ?? "")
            return (
              <li key={nome || i} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-words">{config[nome]?.label ?? nome}</span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <ChartNumber
                      value={valores[i]}
                      format={format}
                      className="nums font-mono font-medium text-foreground"
                    />
                    {share ? (
                      <span className="nums w-9 text-right font-mono text-xs text-muted-foreground">
                        {pcts[i]}%
                      </span>
                    ) : null}
                  </span>
                </div>
                <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    // Cresce do zero ao montar (`@starting-style`), escalonada e
                    // no tempo de entrada; depois, da largura anterior na troca.
                    className={cn(
                      "h-full w-(--bar-w) rounded-full transition-[width] ease-(--ease-out) starting:w-0",
                      entrando ? "duration-(--duration-spring)" : "duration-(--duration-slow)"
                    )}
                    style={
                      {
                        "--bar-w": `${maximo > 0 ? (Math.max(0, valores[i]) / maximo) * 100 : 0}%`,
                        backgroundColor: serieColor(nome, 0, config),
                        transitionDelay: entrando
                          ? `${Math.min(i, CHART_STAGGER_MAX) * CHART_STAGGER_MS}ms`
                          : undefined,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </li>
            )
          })}
        </ul>
    </ChartHtmlRoot>
  )
}

/** A tendência sem eixo, para dentro de um `StatCard` ou de uma linha: sem grade, eixo, legenda nem tooltip por padrão (a forma da curva, não os números). O nome acessível continua obrigatório. */
function ChartSparkline({
  variant = "line",
  y,
  config,
  data,
  label,
  description,
  className,
  tooltip = false,
  format = "currency",
}: Omit<ChartFormProps, "series" | "children" | "aspect" | "legend" | "dataTable"> & {
  variant?: "line" | "area" | "bars"
  y: string
}) {
  const cor = serieColor(y, 0, config)
  // A faísca não entra (dez numa lista seriam ruído): o primeiro quadro desenha parado e só a troca anima.
  const [montado, setMontado] = React.useState(false)
  React.useEffect(() => setMontado(true), [])
  const movimento = montado ? CHART_MARK_UPDATE : CHART_MARK_STILL

  const marca =
    variant === "bars" ? (
      <BarChart data={data} accessibilityLayer>
        {tooltip ? (
          <ChartTooltip {...CHART_TOOLTIP_MOTION} content={<ChartTooltipContent format={format} hideLabel />} />
        ) : null}
        <Bar
          dataKey={y}
          fill={cor}
          radius={[3, 3, 0, 0]}
          {...movimento}
        />
      </BarChart>
    ) : variant === "area" ? (
      <AreaChart data={data} accessibilityLayer>
        {tooltip ? (
          <ChartTooltip {...CHART_TOOLTIP_MOTION} content={<ChartTooltipContent format={format} hideLabel />} />
        ) : null}
        <Area
          {...movimento}
          dataKey={y}
          type="monotone"
          stroke={cor}
          strokeWidth={2}
          fill={cor}
          fillOpacity={0.15}
          dot={false}
        />
      </AreaChart>
    ) : (
      <LineChart data={data} accessibilityLayer>
        {tooltip ? (
          <ChartTooltip {...CHART_TOOLTIP_MOTION} content={<ChartTooltipContent format={format} hideLabel />} />
        ) : null}
        <Line
          dataKey={y}
          type="monotone"
          stroke={cor}
          strokeWidth={2}
          dot={false}
          {...movimento}
        />
      </LineChart>
    )

  return (
    <ChartContainer
      config={config}
      aspect="auto"
      label={label}
      description={description}
      className={cn("h-10 w-full", className)}
    >
      {marca}
    </ChartContainer>
  )
}

/* -------------------------------------------------------------------------
 * Estado
 * ---------------------------------------------------------------------- */

/** O esqueleto ocupa a mesma caixa do gráfico cheio (daí o eixo `aspect`), senão a tela salta quando o dado chega. */
const CHART_SKELETON_HEIGHTS = [52, 78, 40, 92, 64, 84, 48]

function ChartSkeleton({
  aspect,
  variant = "pulse",
  className,
  bars = 7,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof chartContainerVariants> & {
    bars?: number
    /** `pulse` é o esqueleto da casa; `wave` sobe e desce as barras em onda, para o gráfico que é a peça principal da tela e demora. Um por tela. */
    variant?: "pulse" | "wave"
  }) {
  return (
    <div
      data-slot="chart-skeleton"
      data-variant={variant}
      aria-hidden
      className={cn(
        chartContainerVariants({ aspect }),
        "w-full items-end gap-2 px-1 pb-6",
        className
      )}
      {...props}
    >
      {Array.from({ length: bars }, (_, i) => {
        // Alturas fixas e não aleatórias: um esqueleto que muda de desenho a
        // cada render pisca em toda revalidação.
        const height = `${CHART_SKELETON_HEIGHTS[i % CHART_SKELETON_HEIGHTS.length]}%`
        return variant === "wave" ? (
          // Não é o `Skeleton`: ele traz `animate-pulse`, que disputa a
          // propriedade `animation` com a onda e ainda tira a barra do corte
          // do movimento reduzido. A tinta é a mesma.
          <div
            key={i}
            className="chart-wave min-w-0 flex-1 rounded-t-md bg-skeleton"
            style={{ height, "--chart-wave-i": i } as React.CSSProperties}
          />
        ) : (
          <Skeleton
            key={i}
            className="min-w-0 flex-1 rounded-t-md rounded-b-none"
            style={{ height }}
          />
        )
      })}
    </div>
  )
}

function ChartEmpty({
  title = "Sem dados no período",
  description,
  icon,
  aspect,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof EmptyState>, "title"> &
  VariantProps<typeof chartContainerVariants> & {
    title?: React.ReactNode
    description?: React.ReactNode
    icon?: React.ReactNode
  }) {
  return (
    <EmptyState
      data-slot="chart-empty"
      variant="plain"
      className={cn(chartContainerVariants({ aspect }), "w-full", className)}
      {...props}
    >
      {icon ? <EmptyStateIcon>{icon}</EmptyStateIcon> : null}
      <EmptyStateTitle>{title}</EmptyStateTitle>
      {description ? (
        <EmptyStateDescription>{description}</EmptyStateDescription>
      ) : null}
      {children}
    </EmptyState>
  )
}

function ChartError({
  title = "Não deu para carregar o gráfico",
  description,
  icon,
  aspect,
  className,
  children,
  ...props
}: React.ComponentProps<typeof ChartEmpty>) {
  return (
    <EmptyState
      data-slot="chart-error"
      variant="plain"
      className={cn(chartContainerVariants({ aspect }), "w-full", className)}
      {...props}
    >
      {icon ? <EmptyStateIcon tone="destructive">{icon}</EmptyStateIcon> : null}
      <EmptyStateTitle>{title}</EmptyStateTitle>
      {description ? (
        <EmptyStateDescription>{description}</EmptyStateDescription>
      ) : null}
      {children}
    </EmptyState>
  )
}

/* -------------------------------------------------------------------------
 * A alternativa não-visual
 * ---------------------------------------------------------------------- */

/** A mesma série como tabela: a alternativa para quem lê com leitor de tela, imprime ou precisa do número exato. */
function ChartDataTable({
  data,
  series,
  config,
  x,
  xLabel = "Período",
  format = "currency",
  xFormat = "text",
  className,
}: {
  data: Record<string, unknown>[]
  series: string[]
  config: ChartConfig
  x?: string
  /** O nome da primeira coluna. A rosca rotula categorias, não períodos. */
  xLabel?: string
  format?: ChartFormat
  xFormat?: ChartFormat
  className?: string
}) {
  return (
    <Table size="sm" data-slot="chart-data-table" className={className}>
      <TableHeader>
        <TableRow>
          {x ? <TableHead>{xLabel}</TableHead> : null}
          {series.map((key) => (
            <TableHead key={key} numeric>
              {config[key]?.label ?? key}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={x ? String(row[x] ?? i) : i}>
            {x ? (
              <TableCell>{formatChartValue(row[x], xFormat)}</TableCell>
            ) : null}
            {series.map((key) => (
              <TableCell key={key} numeric className="font-mono">
                {formatChartValue(row[key], format)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) return undefined

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

export {
  chartContainerVariants,
  ChartAnnotation,
  ChartArea,
  ChartBarList,
  ChartBars,
  ChartContainer,
  ChartDataTable,
  ChartDonut,
  ChartDonutCenter,
  ChartEmpty,
  ChartError,
  ChartGrid,
  ChartHeatmap,
  chartHeatmapVariants,
  ChartLegend,
  ChartLegendContent,
  ChartLine,
  ChartReferenceLine,
  ChartSkeleton,
  ChartRadar,
  ChartRadial,
  ChartSparkline,
  ChartSplit,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartWaterfall,
  ChartXAxis,
  ChartYAxis,
  useChart,
}
