"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import {
  currencyBRL,
  currencyCompactBRL,
  numberBR,
  percentBR,
} from "@/lib/formatters"
import {
  formatTransactionDayMonthPtBr,
  formatTransactionMonthYearPtBr,
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
 * ## Ele tinha 1 consumidor em 8, e a causa cabia numa linha
 *
 * A versão anterior fazia **uma** coisa: ler `config` e emitir
 * `--color-<chave>` num `<style>` escopado por `[data-chart]`. Tudo o mais que
 * um gráfico precisa — o tooltip que formata dinheiro, a legenda, os eixos, a
 * altura, o estado vazio — ficava de fora, e sete das oito telas que renderizam
 * Recharts neste app escreviam tudo à mão: 4 tooltips (a mesma casca
 * `rounded-lg border-border/80 bg-popover`, quatro vezes), 3 legendas,
 * 4 `Intl.NumberFormat` redeclarados com `currencyBRL` existindo ao lado, e
 * 4 `tickFormatter` compactos inline sem nenhum chamar `currencyCompactBRL` —
 * que é exatamente a regra que a página `/designsystem/graficos` manda seguir.
 *
 * A raiz do abandono era esta linha:
 *
 * ```tsx
 * {typeof item.value === "number" ? numberBR(item.value) : item.value}
 * ```
 *
 * Num app de finanças, uma série em reais saía `8.432` — **sem `R$`**. Quem
 * precisava de dinheiro no tooltip não tinha como pedir, e escrevia o próprio.
 * É a mesma inversão que as rodadas do `Form`, do `MoneyInput` e do `Alert` já
 * registraram: a resposta não é reclassificar o componente, é fazer o
 * componente ser o que o nome promete.
 *
 * ## As duas camadas
 *
 * **A anatomia** (`ChartContainer`, `ChartGrid`, `ChartXAxis`, `ChartYAxis`,
 * `ChartTooltip`, `ChartLegend`, `ChartReferenceLine`) é a régua, e continua
 * livre: quem monta um `ComposedChart` compõe estas peças.
 *
 * **As formas** (`ChartArea`, `ChartLine`, `ChartBars`, `ChartDonut`,
 * `ChartSparkline`) são a forma curta sobre a anatomia, como `FormInput` é
 * sobre `Field` + `Input`. Elas cobram `label` — o nome acessível — porque a
 * forma curta pode cobrar e a composição livre não pode.
 */

/**
 * A proporção é do componente, e é eixo porque quatro telas responderam com
 * um literal de pixel (`height={300}` ×2, `240`, `200`) a um componente que
 * cravava `aspect-video` e ensinava proporção. `auto` é a saída para quem
 * dimensiona por fora — e é o que o `ChartSparkline` usa.
 */
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
    "[&_.recharts-radial-bar-background-sector]:fill-muted",
    "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/60",
    "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
    "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
    "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
    // O anel de foco. A versão anterior escrevia `outline-hidden` em
    // `.recharts-layer`, `.recharts-sector` e `.recharts-surface` — e o que
    // isso apagava era o foco de teclado que o `accessibilityLayer` do
    // Recharts v3 desenha, que vem ligado de fábrica na 3.8.0 instalada aqui.
    // Suprimir o foco não-visível continua certo; suprimir o visível é tirar a
    // única pista de que o gráfico é navegável.
    //
    // Duas armadilhas, as duas medidas com `Tab` de verdade:
    //
    // 1. **`outline-none` e `outline-2` escrevem propriedades diferentes** —
    //    `outline-style` e `outline-width`. Com a supressão em `:focus` e o
    //    anel em `:focus-visible`, os dois seletores empatam em (0,2,0) e as
    //    duas declarações valem: chegava largura 2px com estilo `none`, ou
    //    seja, anel nenhum. Por isso a supressão é a base **sem pseudo**
    //    (0,2,0) e o anel é `:focus-visible` (0,3,0), que vence sempre — e por
    //    isso `outline-solid` precisa estar escrito.
    // 2. Foco por script não liga `:focus-visible`. Verificar isto com
    //    `element.focus()` reporta "sem anel" numa implementação correta.
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
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

/* -------------------------------------------------------------------------
 * Formatação
 * ---------------------------------------------------------------------- */

/**
 * Um nome para cada formatação, e cada um resolve num helper de `lib/`. A
 * regra **I** do auditor proíbe `Intl` fora de `lib/formatters` e
 * `lib/transaction-date`, e este arquivo era onde ela vazava: o tooltip
 * chamava `numberBR` direto e as telas respondiam redeclarando o `Intl` delas.
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
  // `minimumFractionDigits: 0` é o que torna `compact` de fato compacto abaixo
  // de mil: com o padrão de 2 do `currencyBRL`, o eixo saía "R$ 0,00" e
  // "R$ 600,00" — centavos num rótulo de eixo são ruído, e é justamente a
  // largura que `compact` existe para economizar. Acima de mil nada muda:
  // 1.234.567 continua "R$ 1,23 mi".
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

/**
 * O eixo comprime e o tooltip não, e isso é decisão e não descuido: um rótulo
 * de eixo precisa caber numa coluna de ~48px, e um tooltip precisa dizer o
 * centavo. `currency` no gráfico vira `compact` no eixo; o resto não muda.
 */
function axisFormatFor(format: ChartFormat): ChartFormat {
  return format === "currency" ? "compact" : format
}

/* -------------------------------------------------------------------------
 * Cor da série
 * ---------------------------------------------------------------------- */

/**
 * As marcas não animam ao montar, e isso é decisão de produto.
 *
 * Num app de finanças, um valor que se move enquanto a pessoa o lê é hostil — e
 * o Recharts anima de fábrica, sem olhar `prefers-reduced-motion`. Era também
 * um defeito visível: medido, com a animação ligada as barras e as áreas
 * desenhavam na carga da página e **as roscas só apareciam quando a pessoa
 * rolava até elas**, porque a animação do `Pie` só começa quando o setor entra
 * em cena. Um gráfico que não existe até ser olhado não é uma transição, é uma
 * ausência.
 */
const CHART_ANIMATION = false

const CHART_RAMP_LENGTH = 5

/**
 * A rampa tem cinco degraus e não tem um sexto. Uma sexta série não é um matiz
 * novo — ela vira "Outros", e quem agrega é quem tem os dados. O que este
 * resolvedor garante é que ele **não minta**: do sexto em diante a cor é
 * `--muted-foreground`, que lê como "não identificado", em vez de repetir
 * `--chart-1` e dar duas fatias da mesma cor. `credit-cards-history-chart.tsx`
 * hoje faz `BAR_COLORS[idx % 5]` e é exatamente o defeito que isto evita.
 */
export function chartSeriesColor(index: number): string {
  return index < CHART_RAMP_LENGTH
    ? `var(--chart-${index + 1})`
    : "var(--color-muted-foreground)"
}

/** A rampa inteira, na ordem. Fixa: cor segue a entidade, nunca o ranking. */
export const chartRamp = Array.from({ length: CHART_RAMP_LENGTH }, (_, i) =>
  chartSeriesColor(i)
)

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
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof chartContainerVariants> & {
    config: ChartConfig
    children: React.ComponentProps<typeof ResponsiveContainer>["children"]
    /**
     * O nome acessível. Um `<svg>` sem nome é anunciado como "imagem" e nada
     * mais — a mesma medição que o `Popover` e o `resizable` já pagaram. Só
     * **um** dos oito gráficos do app tem um hoje. Ele é opcional aqui porque
     * a composição livre não pode cobrar; as cinco formas curtas cobram.
     */
    label?: string
    /** Uma frase sobre o que o gráfico mostra, ligada por `aria-describedby`. */
    description?: string
    /**
     * O que se sobrepõe ao gráfico — hoje, o `ChartDonutCenter`. Ele é prop e
     * não irmão porque **a caixa que tem tamanho é esta**: medido, com o
     * envelope `relative` por fora, um `ChartContainer` de 176px dentro de uma
     * coluna larga deixava o miolo 118px à direita do centro do anel.
     */
    overlay?: React.ReactNode
  }) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`
  const descriptionId = description ? `${chartId}-desc` : undefined

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        data-aspect={aspect ?? "video"}
        role={label ? "img" : undefined}
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
        {/*
          O `ResponsiveContainer` é item de um flex, então a largura dele seria
          automática — encolhe até o conteúdo. As dimensões explícitas mais
          `min-w-0` tiram essa ambiguidade.
          Elas **não** calam o aviso "The width(-1) and height(-1) of chart
          should be greater than 0" do Recharts na primeira medição: medido, ele
          continua saindo na carga da página e some assim que o layout assenta,
          com os gráficos desenhando certo. É medição de primeiro quadro, não
          defeito de caixa — e fica dito assim em vez de aparentar consertado.
        */}
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

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const entries = Object.entries(config).filter(
    ([, cfg]) => "theme" in cfg || "color" in cfg
  )
  if (!entries.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart="${id}"] {
${entries
  .map(([key, itemConfig]) => {
    const color =
      "theme" in itemConfig && itemConfig.theme
        ? itemConfig.theme[theme as keyof typeof itemConfig.theme]
        : "color" in itemConfig
          ? itemConfig.color
          : undefined
    return color ? `  --color-${key}: ${color};` : null
  })
  .filter(Boolean)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
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
  /**
   * Como o valor é escrito. O padrão continua `number` para não trocar por
   * baixo o único chamador que existia antes desta rodada; as formas curtas
   * passam `currency`, que é o que um app de finanças quer sete vezes em oito.
   */
  format?: ChartFormat
  /** O cabeçalho do tooltip, quando ele carrega uma data em vez de um rótulo. */
  labelFormat?: ChartFormat
  /** A linha de soma no rodapé. As quatro tooltips à mão do app têm uma. */
  total?: boolean
  totalLabel?: string
  nameKey?: string
  labelKey?: string
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
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/80 bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md",
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
                          "shrink-0 rounded-xs border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
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
                      <span className="nums font-mono font-medium text-foreground">
                        {formatChartValue(item.value, format)}
                      </span>
                    ) : null}
                  </div>
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
  /**
   * A legenda da rosca vive **fora** do `ChartContainer`, e por isso ela lê o
   * contexto sem exigi-lo. Dentro do SVG o Recharts reserva a faixa da legenda
   * encolhendo o anel — e o centro do anel deixa de ser o centro da caixa,
   * que é onde o `ChartDonutCenter` se apoia.
   */
  config?: ChartConfig
  verticalAlign?: "top" | "bottom"
  /** Onde a fileira encosta. `center` é o padrão do Recharts e continua sendo. */
  align?: "start" | "center" | "end"
  hideIcon?: boolean
  nameKey?: string
  /** O valor ao lado do rótulo. As três legendas à mão do app mostram um. */
  format?: ChartFormat
  /**
   * Clicar isola a série. `dashboard-expense-categories` já faz isso com um
   * `<ul>` próprio de 40 linhas. Quando ligado, cada item vira `<button>` com
   * `aria-pressed` — o estado não chega por opacidade e nada mais.
   */
  interactive?: boolean
  /**
   * As séries desligadas. Chama-se `hiddenSeries` e não `hidden` porque
   * `hidden` é atributo de `<div>` — um `boolean` — e a colisão não é teórica:
   * o `tsc` a pegou como `Type 'string[]' is not assignable to 'true'`.
   */
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
        "flex flex-wrap items-center gap-x-4 gap-y-1.5",
        align === "start" && "justify-start",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item, index) => {
        // Duas chaves, e confundi-las é bug medido: `nameKey` diz **em que
        // campo do payload** está o nome, então usá-la como chave do React dá
        // a mesma chave para todos os itens — cinco fatias de rosca com
        // `key="nome"`, e o React reclamando de chave duplicada. A identidade
        // do item vem do payload dele.
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
            ) : (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-xs"
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

        // `<button>` cru, e o motivo fica escrito, como a rodada da composição
        // pede. Vestir `Button variant="tertiary" size="xs"` exigiria quatro
        // contra-classes — `h-auto` (o item quebra de linha na fileira e não
        // tem altura de controle), `text-xs`, `font-normal` — mais o `<span>`
        // de escape da maiúscula inicial do CTA, que aqui seria errada: o
        // rótulo vem do `config` e pode ser "iFood". Quatro de quatro anuladas
        // é reimplementar ao contrário.
        return (
          <button
            key={key}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle?.(key)}
            className={cn(
              classes,
              "rounded-md px-1 py-0.5 -mx-1 outline-none transition-colors",
              "hover:bg-accent/60 active:bg-accent/60",
              "focus-visible:ring-3 focus-visible:ring-ring/70",
              // O estado não é só opacidade: o rótulo risca, e é isso que
              // sobrevive a quem não distingue o degrau de transparência.
              off && "text-muted-foreground line-through opacity-60"
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

/**
 * A grade é horizontal e recessiva. Cada tela do app escreve
 * `<CartesianGrid vertical={false} />`; aqui isso é o padrão, e a linha
 * vertical volta com `vertical`.
 */
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
 * O eixo de valor começa em zero, e isso é padrão e não conselho. Truncar a
 * base multiplica visualmente uma diferença de 3% — é a regra que
 * `/designsystem/graficos` escreve e que nenhum eixo do app aplicava sozinho.
 * Quem tiver um caso legítimo (uma série que não cruza zero, num gráfico de
 * linha) passa `domain` e assume.
 */
function ChartYAxis({
  format = "compact",
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  // `auto` e não um número: com largura fixa, um rótulo mais longo que a calha
  // é **cortado à esquerda**. Medido a 375px, `R$ 22 mil` e `R$ 5,5 mil` saíam
  // como `$ 22 mil` e `$ 5,5 mil` — o cifrão comido — num eixo de 56px que
  // servia bem no desktop. O Recharts 3 calcula a calha a partir dos rótulos.
  width = "auto" as const,
  domain = [0, "auto"] as const,
  ...props
}: React.ComponentProps<typeof YAxis> & { format?: ChartFormat }) {
  return (
    <YAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      width={width}
      domain={domain as never}
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

/**
 * A linha de referência tem tom, não cor: zero, média e neutra são três
 * papéis, e duas telas do app desenham dois deles à mão.
 */
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
  /**
   * A legenda. O padrão é a regra, não um gosto: **duas séries ou mais sempre
   * têm legenda; uma série nunca tem** — ali quem nomeia é o título.
   */
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
  if (cfg && "color" in cfg && cfg.color) return `var(--color-${key})`
  if (cfg && "theme" in cfg && cfg.theme) return `var(--color-${key})`
  return chartSeriesColor(index)
}

/**
 * O casco das cinco formas. Ele não desenha nada quando `dataTable` está
 * desligado — sem invólucro, sem `gap`, sem nó a mais na árvore.
 */
function ChartFrame({
  dataTable,
  data,
  series,
  config,
  x,
  format,
  children,
}: {
  dataTable?: boolean
  data: Record<string, unknown>[]
  series: string[]
  config: ChartConfig
  x?: string
  format: ChartFormat
  children: React.ReactNode
}) {
  if (!dataTable) return <>{children}</>

  return (
    <div className="flex flex-col gap-2">
      {children}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1.5 self-start rounded-md text-xs text-muted-foreground outline-none hover:text-foreground active:text-foreground focus-visible:ring-3 focus-visible:ring-ring/70">
          <CollapsibleMarker className="size-3.5" />
          Ver os dados como tabela
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ChartDataTable
            data={data}
            series={series}
            config={config}
            x={x}
            format={format}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
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
  children,
}: ChartFormProps & {
  x: string
  xFormat?: ChartFormat
  variant?: keyof typeof chartAreaShape
  stacked?: boolean
}) {
  const chaves = useSeries(config, series)
  const gradiente = variant === "gradient"
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
      >
        <AreaChart data={data} accessibilityLayer>
          {gradiente ? (
            <defs>
              {chaves.map((key, i) => (
                <linearGradient
                  key={key}
                  id={`chart-area-${key}`}
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
              content={<ChartTooltipContent format={format} total={stacked} />}
            />
          ) : null}
          {mostrarLegenda ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {chaves.map((key, i) => (
            <Area
              key={key}
              isAnimationActive={CHART_ANIMATION}
              dataKey={key}
              type={chartAreaShape[variant]}
              stackId={stacked ? "a" : undefined}
              stroke={serieColor(key, i, config)}
              strokeWidth={2}
              fill={gradiente ? `url(#chart-area-${key})` : serieColor(key, i, config)}
              fillOpacity={gradiente ? 1 : 0.15}
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: "var(--chart-surface)",
              }}
            />
          ))}
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
  children,
}: ChartFormProps & {
  x: string
  xFormat?: ChartFormat
  variant?: keyof typeof chartLineShape
  /** O marcador. `hover` só no ponto ativo — o padrão, e o menos ruidoso. */
  dots?: "none" | "hover" | "all"
}) {
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
      >
        <LineChart data={data} accessibilityLayer>
          <ChartGrid />
          <ChartXAxis dataKey={x} format={xFormat} />
          <ChartYAxis format={axisFormatFor(format)} />
          {tooltip ? (
            <ChartTooltip content={<ChartTooltipContent format={format} />} />
          ) : null}
          {mostrarLegenda ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {chaves.map((key, i) => (
            <Line
              key={key}
              isAnimationActive={CHART_ANIMATION}
              dataKey={key}
              type={chartLineShape[variant]}
              stroke={serieColor(key, i, config)}
              strokeWidth={2}
              // O marcador tem 8px de diâmetro: abaixo disso ele lê como
              // sujeira do traço, não como ponto de dado.
              dot={
                dots === "all"
                  ? { r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }
                  : false
              }
              activeDot={
                dots === "none"
                  ? false
                  : { r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }
              }
            />
          ))}
          {children}
        </LineChart>
      </ChartContainer>
    </ChartFrame>
  )
}

function ChartBars({
  layout = "vertical",
  stacked = false,
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
  children,
}: ChartFormProps & {
  x: string
  xFormat?: ChartFormat
  /**
   * `vertical` são barras que sobem (o padrão); `horizontal` são barras que
   * correm para a direita, que é a forma de um ranking de categorias com nome
   * comprido. Barra horizontal no Recharts precisa do eixo de categoria
   * declarado — sem ele todas as barras caem na mesma posição —, e é o que
   * esta peça faz por quem chama.
   */
  layout?: "vertical" | "horizontal"
  stacked?: boolean
}) {
  const chaves = useSeries(config, series)
  const horizontal = layout === "horizontal"
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
              <ChartXAxis type="number" format={axisFormatFor(format)} />
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
              <ChartYAxis format={axisFormatFor(format)} />
            </>
          )}
          {tooltip ? (
            <ChartTooltip
              cursor={{ fillOpacity: 0.5 }}
              content={<ChartTooltipContent format={format} total={stacked} />}
            />
          ) : null}
          {mostrarLegenda ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {chaves.map((key, i) => (
            <Bar
              key={key}
              isAnimationActive={CHART_ANIMATION}
              dataKey={key}
              stackId={stacked ? "a" : undefined}
              fill={serieColor(key, i, config)}
              // A ponta arredonda e a base não. Arredondar os quatro cantos
              // levanta a barra da linha do zero, e a base é justamente o que
              // um gráfico de barras usa para dizer a magnitude.
              radius={
                stacked && i < chaves.length - 1
                  ? 0
                  : horizontal
                    ? [0, 4, 4, 0]
                    : [4, 4, 0, 0]
              }
              // Os 2px de superfície entre segmentos empilhados. Pintados com
              // a cor do fundo e não com transparência: transparente mostraria
              // o segmento de trás.
              stroke={stacked ? "var(--chart-surface)" : undefined}
              strokeWidth={stacked ? 2 : undefined}
            />
          ))}
          {children}
        </BarChart>
      </ChartContainer>
    </ChartFrame>
  )
}

const chartDonutThickness = { sm: 0.72, md: 0.62, lg: 0.48 } as const

/**
 * O medidor tem geometria própria, e ela saiu de três medidas.
 *
 * **O arco era grosso demais para o número.** Com o anel da rosca (raio interno
 * 62% do máximo), a corda interna no topo do texto media **42px** e `76%` já
 * ocupava 43 — encostava. `100%` invadiria. Um medidor é convencionalmente um
 * arco fino: o miolo dele é o número, não uma reserva.
 *
 * **E a caixa era quase metade vazia.** O Recharts centraliza o círculo
 * inteiro, então um meio-arco num quadrado deixava **68px mortos embaixo** —
 * era esse vazio, e não um `gap`, que afastava a legenda das outras formas.
 * `cy` a 86% encosta o arco na base, e o raio passa de 130% do máximo, que o
 * Recharts aceita: a caixa deixa de ser quadrada e o arco cresce nela.
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
  children,
}: Omit<ChartFormProps, "series"> & {
  /**
   * `donut` deixa o miolo livre para o total (é a forma dos três donuts do
   * app); `pie` fecha o miolo; `gauge` é o meio-círculo de progresso contra
   * um teto — orçamento consumido, limite de cartão.
   */
  variant?: "donut" | "pie" | "gauge"
  thickness?: keyof typeof chartDonutThickness
  nameKey: string
  dataKey: string
  /** O `ChartDonutCenter`. Ele é irmão do gráfico, nunca filho — ver abaixo. */
  center?: React.ReactNode
}) {
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

  // Quem chama escreve `<ChartDonutCenter value="76%" />` sem saber que o
  // medidor ancora diferente: a variante é do `ChartDonut`, então é ele que
  // injeta. Mesmo recurso que o `Button` e o `Stepper` usam com `asChild`.
  const centro =
    medidor && React.isValidElement<{ align?: "center" | "gauge" }>(center)
      ? React.cloneElement(center, { align: "gauge" })
      : center

  // A legenda da rosca é HTML ao lado do gráfico, e não a `<Legend>` do
  // Recharts. Dentro do SVG ela reserva espaço encolhendo o anel, e o centro
  // do anel deixa de coincidir com o centro da caixa — que é exatamente onde o
  // `ChartDonutCenter` se apoia. Fora, o anel fica centrado e a fileira ganha
  // quebra de linha de verdade.
  const legendaPayload = React.useMemo(
    () =>
      data.map((linha, i) => ({
        value: chaves[i],
        dataKey: chaves[i],
        color: serieColor(chaves[i], i, config),
        payload: linha,
      })),
    [chaves, config, data]
  )

  return (
    <ChartFrame
      dataTable={dataTable}
      data={data}
      series={[dataKey]}
      config={config}
      x={nameKey}
      format={format}
    >
      {/*
        `items-center` centra o anel sobre a legenda. Sem ele o alinhamento é
        `stretch`, e como o `ChartContainer` tem largura própria ele encosta na
        esquerda de uma caixa que a legenda define: medido, uma rosca de 208px
        dentro de um envelope de 412 saía **102px fora do centro** da própria
        legenda. O medidor escondia isso, porque a legenda de dois itens é mais
        estreita que o anel.

        `w-fit` fica: ele é `fit-content`, que respeita o espaço disponível,
        então a legenda continua quebrando linha no telefone em vez de esticar
        o envelope.
      */}
      <div className="flex w-fit flex-col items-center">
        <ChartContainer
          config={config}
          aspect={proporcao}
          label={label}
          description={description}
          className={className}
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
              // Onde o rótulo do medidor se apoia: 5 pontos acima da origem do
              // arco. `bottom` em porcentagem resolve contra a **altura**, e é
              // isso que faz esta âncora não depender da proporção da caixa.
              "--chart-donut-label-b": `${100 - CHART_GAUGE_CY + 5}%`,
            } as React.CSSProperties
          }
        >
          <PieChart accessibilityLayer>
            {tooltip ? (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    format={format}
                    nameKey={nameKey}
                    hideLabel
                  />
                }
              />
            ) : null}
            <Pie
              isAnimationActive={CHART_ANIMATION}
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
                  fill={serieColor(chaves[i], i, config)}
                />
              ))}
            </Pie>
            {children}
          </PieChart>
        </ChartContainer>
        {mostrarLegenda ? (
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
 * O miolo da rosca. Ele chega pelo prop `center` e **não** pelos `children`,
 * porque `children` desce para dentro do `<PieChart>`, que é SVG: uma `<div>`
 * ali não renderiza. O `ChartDonut` o entrega ao `overlay` do
 * `ChartContainer`, que é a caixa que tem tamanho — ver a nota lá.
 *
 * A escada de corpo por comprimento do valor está hoje duplicada em dois
 * arquivos do app e ausente num terceiro, que trunca. `R$ 1.284,60` e
 * `R$ 128.400,00` não cabem na mesma medida dentro de um furo de rosca.
 */
function ChartDonutCenter({
  value,
  label,
  align = "center",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  value: string
  label?: React.ReactNode
  /**
   * `center` é o furo da rosca. `gauge` apoia o bloco na origem do arco, e
   * quem o passa é o `ChartDonut` por clone — o medidor não é decisão de quem
   * escreve o rótulo.
   */
  align?: "center" | "gauge"
}) {
  // O corpo é conta, e não escada de faixas — as faixas mentiam de dois jeitos.
  // Por não conhecerem a caixa: `R$ 3.510,00` cabe folgado numa rosca de 300px
  // e transborda numa de 176. E por suporem que o texto quebra: o `Intl`
  // separa `R$` do número com espaço **inseparável**, então `text-balance` e
  // `max-width` não fazem nada — medido, 145px de texto dentro de um furo de
  // 109, numa linha só, por cima do anel.
  //
  // A conta: o furo mede `--chart-donut-hole` da caixa (62% no degrau padrão),
  // a face mono avança ~0,6em por caractere, logo cabe
  // `62 / (0,6 × n)` ≈ `103 / n` por cento da caixa. O 88 é isso com folga —
  // medido depois, 93px de texto num furo de 109, 8px de cada lado. A 96 cabia
  // pela conta e encostava no anel à vista, que é a diferença entre passar e
  // ficar bom.
  //
  // O 0,6 custou uma medição errada antes: uma sonda que clonava o `<span>`
  // para fora do contexto de container query lia `cqw` como inválido, media a
  // fonte herdada e reportava 0,75em. A constante saiu 20% pequena demais e o
  // número da rosca encolheu à vista. Quando a medida contraria o mecanismo,
  // o instrumento é o primeiro suspeito.
  //
  // Vai em `style` e não em classe porque **classe montada em tempo de
  // execução não existe** — o Tailwind varre o código como texto.
  const corpo = `min(1.5rem, ${(88 / Math.max(value.length, 1)).toFixed(2)}cqw)`

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
        {value}
      </span>
      {label ? (
        <span
          className="max-w-(--chart-donut-hole,62%) leading-tight text-muted-foreground"
          // Pela mesma razão do valor: proporcional à caixa, em `style` e não
          // em classe. O piso é `--text-2xs`, o menor degrau do sistema — sem
          // ele, uma rosca pequena escreveria a legenda abaixo da escala.
          style={{ fontSize: "min(0.75rem, max(0.6875rem, 6.5cqw))" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}

/**
 * A tendência sem eixo, para dentro de um `StatCard` ou de uma linha de lista.
 * Ela não tem grade, nem eixo, nem legenda, e por padrão nem tooltip: uma
 * faísca é a forma da curva, não os números dela. O nome acessível continua
 * obrigatório — é ele que diz o que a curva mostra.
 */
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

  const marca =
    variant === "bars" ? (
      <BarChart data={data} accessibilityLayer>
        {tooltip ? (
          <ChartTooltip content={<ChartTooltipContent format={format} hideLabel />} />
        ) : null}
        <Bar
          dataKey={y}
          fill={cor}
          radius={[2, 2, 0, 0]}
          isAnimationActive={CHART_ANIMATION}
        />
      </BarChart>
    ) : variant === "area" ? (
      <AreaChart data={data} accessibilityLayer>
        {tooltip ? (
          <ChartTooltip content={<ChartTooltipContent format={format} hideLabel />} />
        ) : null}
        <Area
          isAnimationActive={CHART_ANIMATION}
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
          <ChartTooltip content={<ChartTooltipContent format={format} hideLabel />} />
        ) : null}
        <Line
          dataKey={y}
          type="monotone"
          stroke={cor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={CHART_ANIMATION}
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

/**
 * O esqueleto ocupa a **mesma caixa** do gráfico cheio, e é por isso que ele
 * carrega o eixo `aspect`: um esqueleto de altura arbitrária faz a tela saltar
 * quando o dado chega.
 */
function ChartSkeleton({
  aspect,
  className,
  bars = 7,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof chartContainerVariants> & { bars?: number }) {
  return (
    <div
      data-slot="chart-skeleton"
      aria-hidden
      className={cn(
        chartContainerVariants({ aspect }),
        "w-full items-end gap-2 px-1 pb-6",
        className
      )}
      {...props}
    >
      {Array.from({ length: bars }, (_, i) => (
        <Skeleton
          key={i}
          className="min-w-0 flex-1 rounded-t-md rounded-b-none"
          // Alturas fixas e não aleatórias: um esqueleto que muda de desenho a
          // cada render pisca em toda revalidação.
          style={{ height: `${[52, 78, 40, 92, 64, 84, 48][i % 7]}%` }}
        />
      ))}
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

/**
 * A mesma série como tabela. É a alternativa que um gráfico deve ter e que não
 * existia em lugar nenhum deste app — quem lê com leitor de tela, quem imprime
 * e quem precisa do número exato saem todos do mesmo lugar.
 */
function ChartDataTable({
  data,
  series,
  config,
  x,
  format = "currency",
  xFormat = "text",
  className,
}: {
  data: Record<string, unknown>[]
  series: string[]
  config: ChartConfig
  x?: string
  format?: ChartFormat
  xFormat?: ChartFormat
  className?: string
}) {
  return (
    <Table data-slot="chart-data-table" className={className}>
      <TableHeader>
        <TableRow>
          {x ? <TableHead>Período</TableHead> : null}
          {series.map((key) => (
            <TableHead key={key} className="text-right">
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
              <TableCell key={key} className="nums text-right font-mono">
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
  ChartArea,
  ChartBars,
  ChartContainer,
  ChartDataTable,
  ChartDonut,
  ChartDonutCenter,
  ChartEmpty,
  ChartError,
  ChartGrid,
  ChartLegend,
  ChartLegendContent,
  ChartLine,
  ChartReferenceLine,
  ChartSkeleton,
  ChartSparkline,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  useChart,
}
