"use client"

import * as React from "react"
import { Bar, ComposedChart, Line } from "recharts"
import {
  ChartBarSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import { ArrowPathIcon, ArrowTrendingUpIcon } from "@heroicons/react/16/solid"

import {
  ChartArea,
  ChartBars,
  ChartContainer,
  ChartDonut,
  ChartDonutCenter,
  ChartEmpty,
  ChartError,
  ChartGrid,
  ChartHeatmap,
  ChartLegend,
  ChartLegendContent,
  ChartLine,
  ChartRadar,
  ChartRadial,
  ChartReferenceLine,
  ChartSkeleton,
  ChartSparkline,
  ChartSplit,
  ChartTooltip,
  CHART_ENTER_MS,
  CHART_UPDATE_MS,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  chartSeriesColor,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { currencyBRL, currencyCompactBRL } from "@/lib/formatters"
import { addDaysYmd } from "@/lib/transaction-date"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const FLUXO = [
  { mes: "Out", entradas: 7900, saidas: 6400, saldo: 1500 },
  { mes: "Nov", entradas: 8200, saidas: 6100, saldo: 2100 },
  { mes: "Dez", entradas: 11400, saidas: 9800, saldo: 1600 },
  { mes: "Jan", entradas: 8300, saidas: 7200, saldo: 1100 },
  { mes: "Fev", entradas: 8400, saidas: 6500, saldo: 1900 },
  { mes: "Mar", entradas: 8432, saidas: 6218, saldo: 2214 },
]

const CATEGORIAS = [
  { nome: "Mercado", valor: 1840 },
  { nome: "Transporte", valor: 620 },
  { nome: "Lazer", valor: 480 },
  { nome: "Saúde", valor: 310 },
  { nome: "Casa", valor: 260 },
]

const TOTAL_CATEGORIAS = CATEGORIAS.reduce((a, c) => a + c.valor, 0)

const CONFIG_SALDO = {
  saldo: { label: "Saldo do mês", color: "var(--chart-1)" },
} satisfies ChartConfig

const CONFIG_FLUXO = {
  entradas: { label: "Entradas", color: "var(--chart-income)" },
  saidas: { label: "Saídas", color: "var(--chart-expense)" },
} satisfies ChartConfig

/** Sem `color`: as cinco fatias caem na rampa, na ordem. */
const CONFIG_CATEGORIAS = {
  Mercado: { label: "Mercado" },
  Transporte: { label: "Transporte" },
  Lazer: { label: "Lazer" },
  Saúde: { label: "Saúde" },
  Casa: { label: "Casa" },
} satisfies ChartConfig

const CONSUMO = [{ nome: "Usado", valor: 3820 }, { nome: "Disponível", valor: 1180 }]

const CONFIG_CONSUMO = {
  Usado: { label: "Usado" },
  Disponível: { label: "Disponível" },
} satisfies ChartConfig

const ANO = [
  { mes: "Jan", entradas: 8300, saidas: 6200, investido: 900 },
  { mes: "Fev", entradas: 8400, saidas: 5600, investido: 1200 },
  { mes: "Mar", entradas: 8432, saidas: 6218, investido: 1000 },
  { mes: "Abr", entradas: 8100, saidas: 5100, investido: 1400 },
  { mes: "Mai", entradas: 9200, saidas: 6900, investido: 800 },
  { mes: "Jun", entradas: 8600, saidas: 5400, investido: 1600 },
  { mes: "Jul", entradas: 8800, saidas: 6100, investido: 1100 },
  { mes: "Ago", entradas: 9400, saidas: 5900, investido: 1800 },
  { mes: "Set", entradas: 8900, saidas: 4800, investido: 1300 },
]

const CONFIG_ANO = {
  entradas: { label: "Entradas", color: "var(--chart-income)" },
  saidas: { label: "Saídas", color: "var(--chart-expense)" },
  investido: { label: "Investido", color: "var(--chart-3)" },
} satisfies ChartConfig

/** O saldo do mês dia a dia — com os dias que ainda não vieram em `null`. */
const SALDO_DIAS = Array.from({ length: 30 }, (_, i) => {
  const dia = i + 1
  const saldo =
    dia > 24
      ? null
      : Math.round(4200 - dia * 95 + Math.sin(dia / 2.3) * 420 + (dia >= 5 ? 1800 : 0))
  return { dia: String(dia).padStart(2, "0"), saldo }
})

const ORCAMENTOS = [
  { nome: "Mercado", gasto: 1420, teto: 1600 },
  { nome: "Lazer", gasto: 690, teto: 600 },
  { nome: "Transporte", gasto: 380, teto: 700 },
  { nome: "Casa", gasto: 510, teto: 600 },
]

const CONFIG_ORCAMENTOS = {
  Mercado: { label: "Mercado" },
  Lazer: { label: "Lazer" },
  Transporte: { label: "Transporte" },
  Casa: { label: "Casa" },
} satisfies ChartConfig

/** Gasto por dia, determinístico: um esqueleto que muda a cada render pisca. */
const HOJE = "2026-09-24"
const GASTO_DIARIO = Array.from({ length: 371 }, (_, i) => {
  const date = addDaysYmd(HOJE, -i)
  const onda = Math.sin(i * 1.7) * Math.cos(i * 0.37)
  const value = onda < -0.35 ? 0 : Math.round((onda + 0.4) * 180 + (i % 30 === 5 ? 2400 : 0))
  return { date, value }
})

const PERFIL = [
  { categoria: "Mercado", mes: 1420, media: 1310 },
  { categoria: "Casa", mes: 510, media: 820 },
  { categoria: "Transporte", mes: 380, media: 460 },
  { categoria: "Lazer", mes: 690, media: 420 },
  { categoria: "Saúde", mes: 210, media: 300 },
  { categoria: "Assinaturas", mes: 190, media: 180 },
]

const CONFIG_PERFIL = {
  mes: { label: "Setembro" },
  media: { label: "Média de 6 meses" },
} satisfies ChartConfig

const DIVISAO = [
  { parte: "fixas", valor: 3120 },
  { parte: "variaveis", valor: 2310 },
  { parte: "parcelas", valor: 788 },
]

const CONFIG_DIVISAO = {
  fixas: { label: "Fixas" },
  variaveis: { label: "Variáveis" },
  parcelas: { label: "Parcelas" },
} satisfies ChartConfig

const CONFIG_FATURA = {
  parcelas: { label: "Parcelas e recorrências", color: "var(--chart-3)" },
  compras: { label: "Compras do período", color: "var(--chart-2)" },
} satisfies ChartConfig

/** Três períodos do mesmo mês a mês, para a troca de filtro ter o que mover. */
const PERIODOS = {
  jul: { rotulo: "Julho", fator: [0.7, 1.3, 0.6, 1.1, 0.9], fim: "2026-07-31" },
  ago: { rotulo: "Agosto", fator: [1, 0.8, 1.2, 0.7, 1.3], fim: "2026-08-31" },
  set: { rotulo: "Setembro", fator: [1.25, 1, 0.9, 1.4, 0.6], fim: "2026-09-24" },
} as const

type Periodo = keyof typeof PERIODOS

function dadosDoPeriodo(periodo: Periodo) {
  const { fator, fim } = PERIODOS[periodo]
  const categorias = CATEGORIAS.map((c, i) => ({ ...c, valor: Math.round(c.valor * fator[i]) }))
  const orcamentos = ORCAMENTOS.map((o, i) => ({ ...o, gasto: Math.round(o.gasto * fator[i]) }))
  const semanas = Array.from({ length: 6 }, (_, i) => ({
    semana: `S${i + 1}`,
    saldo: Math.round(2400 + Math.sin(i * fator[i % 5] + fator[0]) * 900 + i * 150 * fator[1]),
  }))
  const divisao = DIVISAO.map((d, i) => ({ ...d, valor: Math.round(d.valor * fator[i + 1]) }))
  const dias = GASTO_DIARIO.map((d, i) => ({ ...d, value: Math.round(d.value * fator[i % 5]) }))
  return { categorias, orcamentos, semanas, divisao, dias, fim }
}

/** A troca de filtro, em todas as formas de uma vez. */
function DemoMovimento() {
  const [periodo, setPeriodo] = React.useState<Periodo>("set")
  const [rodada, setRodada] = React.useState(0)
  const d = dadosDoPeriodo(periodo)
  const total = d.categorias.reduce((a, c) => a + c.valor, 0)

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <TabsList>
            {(Object.keys(PERIODOS) as Periodo[]).map((k) => (
              <TabsTrigger key={k} value={k}>
                {PERIODOS[k].rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="tertiary" onClick={() => setRodada((r) => r + 1)}>
          <ArrowPathIcon />
          rever a entrada
        </Button>
      </div>
      <div key={rodada} className="grid gap-8 md:grid-cols-2">
        <ChartBars
          layout="horizontal"
          config={CONFIG_CATEGORIAS}
          data={d.categorias}
          series={["valor"]}
          x="nome"
          label="Gasto por categoria no período"
          legend={false}
          className="w-full"
        />
        <ChartArea
          variant="gradient"
          config={CONFIG_SALDO}
          data={d.semanas}
          x="semana"
          label="Saldo por semana no período"
          className="w-full"
        />
        <div className="flex flex-wrap items-start justify-center gap-8">
          <ChartDonut
            config={CONFIG_CATEGORIAS}
            data={d.categorias}
            nameKey="nome"
            dataKey="valor"
            label="Composição do gasto no período"
            className="w-44"
            aspect="square"
            center={<ChartDonutCenter amount={total} label="no mês" />}
          />
          <ChartRadial
            bands={BUDGET_BANDS}
            config={CONFIG_ORCAMENTOS}
            data={d.orcamentos}
            nameKey="nome"
            dataKey="gasto"
            maxKey="teto"
            label="Orçamento consumido no período"
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-6">
          <ChartSplit
            config={CONFIG_DIVISAO}
            data={d.divisao}
            nameKey="parte"
            dataKey="valor"
            label="Gasto do período por tipo"
          />
          <ChartHeatmap end={d.fim} data={d.dias} label="Gasto por dia no período" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="w-24 shrink-0">faísca</span>
            <ChartSparkline
              variant="area"
              y="saldo"
              config={CONFIG_SALDO}
              data={d.semanas}
              label="Saldo por semana, faísca"
              className="h-10 max-w-64"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** O cartão da referência "Bar Chart", nas peças da casa. */
function CartaoAno() {
  const [periodo, setPeriodo] = React.useState("ano")
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Fluxo do ano
          <Badge tone="income" size="sm">
            <ArrowTrendingUpIcon />
            5,2%
          </Badge>
        </CardTitle>
        <CardDescription>Janeiro a setembro de 2026</CardDescription>
        <CardAction>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger size="sm" aria-label="Período">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ano">Este ano</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartBars
          shape="pill"
          track
          stacked
          config={CONFIG_ANO}
          data={ANO}
          x="mes"
          label="Entradas, saídas e investido por mês"
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}

/** A referência "BTC" sem o ao vivo: o saldo até hoje, linha ou área. */
function CartaoSaldo() {
  const [forma, setForma] = React.useState("linha")
  const comum = {
    config: CONFIG_SALDO,
    data: SALDO_DIAS,
    x: "dia",
    marker: "last" as const,
    label: "Saldo de setembro até hoje",
    className: "w-full",
  }
  return (
    <Card variant="brand" className="w-full max-w-md">
      <CardHeader>
        <CardDescription>Saldo hoje</CardDescription>
        <CardTitle className="nums font-mono text-2xl">
          {currencyBRL(SALDO_DIAS[23].saldo ?? 0)}
        </CardTitle>
        <CardAction>
          <Tabs value={forma} onValueChange={setForma}>
            <TabsList size="sm">
              <TabsTrigger value="linha">Linha</TabsTrigger>
              <TabsTrigger value="area">Área</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        {forma === "linha" ? (
          <ChartLine {...comum} />
        ) : (
          <ChartArea {...comum} variant="gradient" />
        )}
      </CardContent>
    </Card>
  )
}

/** A referência "Sleep": a leitura em cima, o gráfico no meio. */
function CartaoOrcamento() {
  const gasto = ORCAMENTOS.reduce((a, o) => a + o.gasto, 0)
  const teto = ORCAMENTOS.reduce((a, o) => a + o.teto, 0)
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Orçamentos de setembro</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <DescriptionList className="grid w-full grid-cols-3 text-center">
          <DescriptionListItem>
            <DescriptionTerm>Gasto</DescriptionTerm>
            <DescriptionDetails className="nums font-mono">
              {currencyCompactBRL(gasto)}
            </DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Teto</DescriptionTerm>
            <DescriptionDetails className="nums font-mono">
              {currencyCompactBRL(teto)}
            </DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Estourou</DescriptionTerm>
            <DescriptionDetails>1 de 4</DescriptionDetails>
          </DescriptionListItem>
        </DescriptionList>
        <ChartRadial
          bands={BUDGET_BANDS}
          config={CONFIG_ORCAMENTOS}
          data={ORCAMENTOS}
          nameKey="nome"
          dataKey="gasto"
          maxKey="teto"
          label="Orçamento consumido por categoria"
          className="w-48"
        />
      </CardContent>
    </Card>
  )
}

const ASPECTOS = [
  ["video", "16/9 — o padrão, e a proporção de um painel de dashboard"],
  ["wide", "21/9 — a tira larga, para uma série longa no topo de uma tela"],
  ["standard", "4/3 — mais alto, quando o eixo de valor tem muitos degraus"],
  ["square", "1/1 — a rosca, que é redonda"],
  ["auto", "sem proporção — a altura vem de fora, e é o que a faísca usa"],
] as const

function LegendaInterativa() {
  const [ocultas, setOcultas] = React.useState<string[]>([])
  const chaves = ["entradas", "saidas"]
  const visiveis = chaves.filter((k) => !ocultas.includes(k))

  return (
    <div className="flex w-full flex-col">
      <ChartBars
        config={CONFIG_FLUXO}
        data={FLUXO}
        series={visiveis}
        x="mes"
        label="Entradas e saídas por mês"
        legend={false}
        className="w-full max-w-2xl"
      />
      <ChartLegendContent
        config={CONFIG_FLUXO}
        payload={chaves.map((k) => ({
          value: k,
          dataKey: k,
          color: `var(--color-${k})`,
        }))}
        interactive
        hiddenSeries={ocultas}
        onToggle={(k) =>
          setOcultas((atual) =>
            atual.includes(k) ? atual.filter((x) => x !== k) : [...atual, k]
          )
        }
      />
    </div>
  )
}

export default function ChartDoc() {
  return (
    <>
      <Usage>
        Todo gráfico do app. <strong>A anatomia</strong> — <code>ChartContainer</code>, <code>ChartGrid</code>, os eixos, <code>ChartTooltip</code>, <code>ChartLegend</code> — compõe qualquer gráfico do Recharts; <strong>as formas</strong> — <code>ChartArea</code>, <code>ChartLine</code>, <code>ChartBars</code>, <code>ChartDonut</code>, <code>ChartSparkline</code>, e desde a rodada 135 <code>ChartSplit</code>, <code>ChartRadial</code>, <code>ChartHeatmap</code> e <code>ChartRadar</code> — são a forma curta sobre ela. Um número sozinho não é gráfico: é <code>StatCard</code>.
      </Usage>

      <DocSection
        title="A cor da série: quando ela significa"
        description="Quando verde e vermelho significam entrada e saída, a série usa --chart-income e --chart-expense. Trocar por outra cor destrói a leitura do fluxo de caixa."
        code={`const config = {
  entradas: { label: "Entradas", color: "var(--chart-income)" },
  saidas: { label: "Saídas", color: "var(--chart-expense)" },
} satisfies ChartConfig`}
        previewClassName="items-stretch p-6"
      >
        <ChartBars
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas por mês"
          className="h-56 w-full"
          aspect="auto"
        />
      </DocSection>

      <DocSection
        title="A cor da série: quando ela só identifica"
        description="Categoria não é boa nem ruim: use a rampa neutra --chart-1 a --chart-5, que é o padrão sem color no config. Com cores de status, a categoria vermelha leria como problema. A cor segue a entidade, nunca o ranking."
        code={`// Sem \`color\` no config: as fatias caem na rampa, na ordem.
const config = {
  Mercado: { label: "Mercado" },
  Transporte: { label: "Transporte" },
} satisfies ChartConfig`}
        previewClassName="flex-wrap items-start justify-center gap-8 p-6"
      >
        <ChartBars
          layout="horizontal"
          config={CONFIG_CATEGORIAS}
          data={CATEGORIAS}
          series={["valor"]}
          x="nome"
          label="Gasto por categoria"
          legend={false}
          className="h-56 w-80"
          aspect="auto"
        />
        <ChartDonut
          config={CONFIG_CATEGORIAS}
          data={CATEGORIAS}
          nameKey="nome"
          dataKey="valor"
          label="Composição do gasto por categoria"
          className="h-44 w-44"
          aspect="auto"
        />
      </DocSection>

      <DocSection
        title="Área"
        description={
          <>
            A série contínua no tempo. <code>variant</code>: <code>solid</code> chapado, <code>gradient</code> dissolvendo, <code>stepped</code> para o dado que muda de patamar.
          </>
        }
        code={`<ChartArea
  config={CONFIG_SALDO}
  data={FLUXO}
  x="mes"
  label="Saldo por mês"
/>  {/* variant="solid", format="currency", os dois de fábrica */}`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartArea
          config={CONFIG_SALDO}
          data={FLUXO}
          x="mes"
          label="Saldo por mês, área chapada"
          className="w-full max-w-2xl"
        />
        <ChartArea
          variant="gradient"
          config={CONFIG_SALDO}
          data={FLUXO}
          x="mes"
          label="Saldo por mês, área em degradê"
          className="w-full max-w-2xl"
        />
        <ChartArea
          variant="stepped"
          stacked
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas empilhadas, em degraus"
          className="w-full max-w-2xl"
        />
      </DocSection>

      <DocNote title="Legenda a partir da segunda série">
        O padrão é <code>legend ?? series.length &gt;= 2</code>: com uma série o título já a nomeia; com duas, a cor sozinha não basta.
      </DocNote>

      <DocSection
        title="Linha"
        description={
          <>
            Várias séries no mesmo eixo. <code>variant</code> é a interpolação (<code>curved</code> de fábrica, <code>straight</code>, <code>stepped</code>); <code>dots</code> é o marcador — <code>hover</code>, o padrão e o menos ruidoso, <code>all</code> ou <code>none</code>.
          </>
        }
        code={`<ChartLine variant="straight" dots="all" … />`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartLine
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas por mês, linha curva"
          className="w-full max-w-2xl"
        />
        <ChartLine
          variant="straight"
          dots="all"
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas por mês, linha reta com marcadores"
          className="w-full max-w-2xl"
        />
      </DocSection>

      <DocNote title="O marcador tem 8px, e o anel dele é a superfície">
        Abaixo de 8px o ponto lê como sujeira do traço. O <code>stroke</code> de 2px em <code>--chart-surface</code> impede que dois pontos que se cruzam virem uma mancha só.
      </DocNote>

      <DocSection
        title="O ponto de hoje"
        description={
          <>
            <code>marker=&quot;last&quot;</code> marca o último ponto <strong>com valor</strong> de cada série, e um halo pulsa atrás dele. Um mês que ainda não terminou traz os dias futuros em <code>null</code>, e o marcador para em hoje, não no dia 30. Vale em <code>ChartLine</code> e <code>ChartArea</code>.
          </>
        }
        code={`// Dias depois de hoje com saldo: null
<ChartLine marker="last" x="dia" data={saldoDoMes} … />`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartLine
          marker="last"
          config={CONFIG_SALDO}
          data={SALDO_DIAS}
          x="dia"
          label="Saldo de setembro até hoje"
          className="w-full max-w-2xl"
        />
      </DocSection>

      <DocNote title="A única coisa que se move dentro de um gráfico">
        Nenhum <strong>valor</strong> se move enquanto a pessoa o lê, e isso continua de pé. O halo não é valor: é a marca do ponto em que a série está agora, e o precedente é o <code>BadgeDot pulse</code>. Ele é <code>animate-ping</code>, então o bloco global de movimento reduzido o corta.
      </DocNote>

      <DocSection
        title="Barras"
        description={
          <>
            A magnitude por categoria. <code>layout=&quot;horizontal&quot;</code> para nome comprido; <code>stacked</code> empilha e liga o total no tooltip.
          </>
        }
        code={`<ChartBars layout="horizontal" x="nome" … />
<ChartBars stacked x="mes" … />`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartBars
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas por mês, barras agrupadas"
          className="w-full max-w-2xl"
        />
        <ChartBars
          stacked
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas por mês, barras empilhadas"
          className="w-full max-w-2xl"
        />
        <ChartBars
          layout="horizontal"
          config={CONFIG_CATEGORIAS}
          data={CATEGORIAS}
          series={["valor"]}
          x="nome"
          label="Gasto por categoria"
          legend={false}
          className="w-full max-w-2xl"
        />
      </DocSection>

      <DocNote title="A ponta arredonda e a base não">
        <code>radius={`{[4, 4, 0, 0]}`}</code>, nunca <code>radius={`{4}`}</code>: a base é onde a barra diz a magnitude, e arredondá-la a levanta da linha do zero. Na horizontal, <code>{`[0, 4, 4, 0]`}</code>; empilhado, só o segmento de cima arredonda.
      </DocNote>

      <DocNote title="Os 2px entre segmentos são pintados, não vazados">
        O vão entre barras empilhadas e entre fatias é um <code>stroke</code> de 2px em <code>var(--chart-surface)</code>, que o <code>ChartContainer</code> declara. Com <code>transparent</code> o vão mostraria o segmento de trás.
      </DocNote>

      <DocSection
        title="Pílula e trilho"
        description={
          <>
            <code>shape=&quot;pill&quot;</code> arredonda o segmento inteiro, para poucas colunas sem eixo que leem como peça; empilhado, cada segmento vira uma pílula solta. <code>track</code> desenha a coluna inteira em <code>--muted</code> atrás, até o máximo: o espaço que sobra.
          </>
        }
        code={`<ChartBars shape="pill" track stacked x="mes" … />`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartBars
          shape="pill"
          track
          stacked
          config={CONFIG_ANO}
          data={ANO}
          x="mes"
          label="Entradas, saídas e investido por mês, em pílula com trilho"
          className="w-full max-w-2xl"
        />
        <ChartBars
          shape="pill"
          track
          config={CONFIG_SALDO}
          data={FLUXO}
          x="mes"
          label="Saldo por mês, em pílula com trilho"
          className="w-full max-w-2xl"
        />
      </DocSection>

      <DocSection
        title="Rosca"
        description={
          <>
            A composição de um total. <code>donut</code> deixa o miolo para o valor, <code>pie</code> o fecha, e <code>gauge</code> é o progresso contra um teto — limite de cartão, orçamento. <code>thickness</code> muda a espessura do anel.
          </>
        }
        code={`<ChartDonut
  config={CONFIG_CATEGORIAS}
  data={CATEGORIAS}
  nameKey="nome"
  dataKey="valor"
  label="Gasto por categoria"
  center={<ChartDonutCenter value={currencyBRL(total)} label="no mês" />}
/>`}
        previewClassName="flex-wrap items-start justify-center gap-8 p-6"
      >
        <ChartDonut
          config={CONFIG_CATEGORIAS}
          data={CATEGORIAS}
          nameKey="nome"
          dataKey="valor"
          label="Gasto por categoria"
          className="w-52"
          aspect="square"
          center={
            <ChartDonutCenter
              value={currencyBRL(TOTAL_CATEGORIAS)}
              label="no mês"
            />
          }
        />
        <ChartDonut
          variant="pie"
          config={CONFIG_CATEGORIAS}
          data={CATEGORIAS}
          nameKey="nome"
          dataKey="valor"
          label="Gasto por categoria, pizza"
          className="w-52"
          aspect="square"
        />
        <ChartDonut
          variant="gauge"
          config={CONFIG_CONSUMO}
          data={CONSUMO}
          nameKey="nome"
          dataKey="valor"
          label="Limite do cartão consumido"
          className="w-52"
          center={<ChartDonutCenter value="76%" label="do limite" />}
        />
      </DocSection>

      <DocNote title="O miolo chega por `center`, e a caixa dele é a que tem tamanho">
        <code>children</code> desce para dentro do SVG, onde uma <code>&lt;div&gt;</code> não renderiza; por isso o miolo é prop, e entra pelo <code>overlay</code> do <code>ChartContainer</code>, a caixa que tem tamanho.
      </DocNote>

      <DocNote title="A legenda da rosca é HTML, fora do SVG">
        Dentro do SVG a legenda encolheria o anel e tiraria o miolo do centro. Na rosca ela é HTML ao lado do gráfico, e <code>ChartLegendContent</code> lê o contexto sem exigi-lo.
      </DocNote>

      <DocSection
        title="Divisão"
        description={
          <>
            <code>ChartSplit</code> divide um total em duas a quatro partes numa barra só. É o que a rosca de duas fatias quer dizer, sem gastar um quadrado. <code>labels=&quot;below&quot;</code> escreve nome e porcentagem sob cada segmento (menos de 12% cai para a legenda); <code>legend</code> põe tudo numa fileira. As porcentagens somam 100 pelo maior resto.
          </>
        }
        code={`<ChartSplit
  config={config}
  data={[{ parte: "fixas", valor: 3120 }, …]}
  nameKey="parte"
  dataKey="valor"
  label="Gasto do mês por tipo"
/>`}
        previewClassName="flex-col items-stretch gap-8 p-6"
      >
        <ChartSplit
          config={CONFIG_DIVISAO}
          data={DIVISAO}
          nameKey="parte"
          dataKey="valor"
          label="Gasto do mês por tipo"
          className="max-w-md"
        />
        <ChartSplit
          labels="legend"
          config={CONFIG_FATURA}
          data={[
            { parte: "parcelas", valor: 1240 },
            { parte: "compras", valor: 2580 },
          ]}
          nameKey="parte"
          dataKey="valor"
          label="Composição da fatura"
          className="max-w-md"
        />
      </DocSection>

      <DocSection
        title="Anéis"
        description={
          <>
            <code>ChartRadial</code> é o <code>Progress</code> dobrado em círculo: um anel por categoria, cada um contra o próprio teto (<code>maxKey</code>). Com <code>bands</code> a cor diz <strong>estado</strong>, com os mesmos cortes do orçamento (<code>BUDGET_BANDS</code>), e o estouro enche o anel e fica vermelho; sem <code>bands</code>, a cor só identifica. Cinco anéis no máximo.
          </>
        }
        code={`<ChartRadial
  bands={BUDGET_BANDS}
  config={config}
  data={orcamentos}
  nameKey="nome"
  dataKey="gasto"
  maxKey="teto"
  label="Orçamento consumido por categoria"
/>`}
        previewClassName="flex-wrap items-start justify-center gap-10 p-6"
      >
        <ChartRadial
          bands={BUDGET_BANDS}
          config={CONFIG_ORCAMENTOS}
          data={ORCAMENTOS}
          nameKey="nome"
          dataKey="gasto"
          maxKey="teto"
          label="Orçamento consumido por categoria, com os cortes"
          className="w-52"
        />
        <ChartRadial
          config={CONFIG_ORCAMENTOS}
          data={ORCAMENTOS}
          nameKey="nome"
          dataKey="gasto"
          maxKey="teto"
          label="Orçamento consumido por categoria, na rampa"
          className="w-52"
          center={<ChartDonutCenter value="3" label="no limite" />}
        />
      </DocSection>

      <DocSection
        title="Calendário"
        description={
          <>
            <code>ChartHeatmap</code> mostra o ritmo por dia: uma coluna por semana, domingo em cima. A intensidade é <strong>dinheiro</strong>, em cinco degraus do tom (<code>expense</code> ou <code>income</code>) sobre <code>--muted</code>, cortados nos quartis dos dias com valor, para o dia do aluguel não apagar o resto. O rodapé mostra o dia sob o ponteiro ou o toque.
          </>
        }
        code={`<ChartHeatmap
  range="quarter"   // ou "year", que rola no telefone
  tone="expense"
  data={[{ date: "2026-09-24", value: 84 }, …]}
  label="Gasto por dia"
/>`}
        previewClassName="flex-col items-start gap-8 p-6"
      >
        <ChartHeatmap
          data={GASTO_DIARIO}
          label="Gasto por dia, últimos três meses"
          dataTable
        />
        <ChartHeatmap
          range="year"
          tone="income"
          data={GASTO_DIARIO}
          label="Entradas por dia, último ano"
          className="max-w-full"
        />
      </DocSection>

      <DocNote title="As células não são focáveis, de propósito">
        Um ano são 365 paradas de <code>Tab</code>. Por teclado e leitor de tela, o caminho é o <code>dataTable</code>, e o nome acessível já resume o total e o dia de pico.
      </DocNote>

      <DocSection
        title="Perfil"
        description={
          <>
            <code>ChartRadar</code> põe várias categorias ao mesmo tempo, uma por eixo, com duas ou três séries sobrepostas: este mês contra a média. Ele mostra <strong>onde o mês fugiu do normal</strong>, não a magnitude, porque comprimento em eixos que irradiam se compara mal. Use de 3 a 8 eixos. A segunda série é tracejada.
          </>
        }
        code={`<ChartRadar x="categoria" grid="polygon" config={config} data={perfil} … />`}
        previewClassName="flex-wrap items-start justify-center gap-10 p-6"
      >
        <ChartRadar
          config={CONFIG_PERFIL}
          data={PERFIL}
          x="categoria"
          label="Gasto de setembro contra a média de seis meses"
          className="w-80"
        />
        <ChartRadar
          grid="circle"
          config={CONFIG_PERFIL}
          data={PERFIL}
          x="categoria"
          label="Gasto de setembro contra a média de seis meses, grade circular"
          className="w-80"
        />
      </DocSection>

      <DocSection
        title="Faísca"
        description={
          <>
            A tendência sem eixo, para dentro de um <code>StatCard</code> ou de uma linha de lista: sem grade, legenda nem tooltip. O nome acessível continua obrigatório.
          </>
        }
        code={`<ChartSparkline y="saldo" config={CONFIG_SALDO} data={FLUXO} label="Saldo, últimos 6 meses" />`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        {(["line", "area", "bars"] as const).map((variant) => (
          <div key={variant} className="flex items-center gap-4">
            <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
              {variant}
            </span>
            <ChartSparkline
              variant={variant}
              y="saldo"
              config={CONFIG_SALDO}
              data={FLUXO}
              label={`Saldo dos últimos seis meses, ${variant}`}
              className="h-10 max-w-64"
            />
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Proporção"
        description={
          <>
            <code>aspect</code> é do componente: a altura sai da proporção, nunca de um <code>height</code> em pixel. <code>auto</code> é para quem dimensiona por fora.
          </>
        }
        code={`<ChartArea aspect="wide" … />`}
        previewClassName="flex-col items-stretch gap-5 p-6"
      >
        {ASPECTOS.map(([nome, dica]) => (
          <div key={nome} className="flex items-start gap-4">
            <div className="w-24 shrink-0">
              <code className="font-mono text-xs text-foreground">{nome}</code>
            </div>
            {nome === "auto" ? (
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-10 w-40 shrink-0 rounded-md border border-dashed border-border" />
                <span className="text-xs text-muted-foreground">{dica}</span>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <ChartSkeleton
                  aspect={nome}
                  bars={5}
                  className="w-40 shrink-0"
                />
                <span className="text-xs text-muted-foreground">{dica}</span>
              </div>
            )}
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Tooltip"
        description={
          <>
            <code>format</code> escreve o valor — <code>currency</code> para reais —, <code>indicator</code> escolhe o marcador e <code>total</code> liga a soma no rodapé.
          </>
        }
        code={`<ChartTooltip
  content={<ChartTooltipContent format="currency" indicator="line" total />}
/>`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartContainer
          config={CONFIG_FLUXO}
          label="Entradas e saídas por mês"
          className="w-full max-w-2xl"
        >
          <ComposedChart data={FLUXO} accessibilityLayer>
            <ChartGrid />
            <ChartXAxis dataKey="mes" />
            <ChartYAxis />
            <ChartTooltip
              content={
                <ChartTooltipContent format="currency" indicator="line" total />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="entradas" fill="var(--color-entradas)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ChartContainer>
      </DocSection>

      <DocNote title="O eixo comprime e o tooltip não">
        <code>format=&quot;currency&quot;</code> escreve <code>R$ 1.234.567,00</code> no tooltip e <code>R$ 1,23 mi</code> no eixo, que deriva <code>compact</code> sozinho: o rótulo precisa caber na calha, o tooltip precisa do centavo. Tudo passa por <code>lib/formatters</code>; não há <code>Intl</code> no gráfico, e a regra <strong>I</strong> do auditor tranca.
      </DocNote>

      <DocSection
        title="Legenda interativa"
        description={
          <>
            <code>interactive</code> transforma cada item em <code>&lt;button&gt;</code> com <code>aria-pressed</code>. Desligado, o rótulo <strong>risca</strong> além de esmaecer: opacidade sozinha é cor como único canal.
          </>
        }
        code={`<ChartLegendContent
  interactive
  hiddenSeries={ocultas}
  onToggle={(k) => alternar(k)}
/>`}
        previewClassName="items-stretch p-6"
      >
        <LegendaInterativa />
      </DocSection>

      <DocSection
        title="Anatomia livre"
        description={
          <>
            Barras mais linha é composição livre, sem embrulho. <code>ChartReferenceLine</code> tem <code>tone</code>: <code>zero</code>, <code>average</code> e <code>neutral</code>.
          </>
        }
        code={`<ChartContainer config={config} label="…">
  <ComposedChart data={data} accessibilityLayer>
    <ChartGrid />
    <ChartXAxis dataKey="mes" />
    <ChartYAxis />
    <ChartReferenceLine y={media} tone="average" />
    <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} />
    <Line dataKey="saldo" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
  </ComposedChart>
</ChartContainer>`}
        previewClassName="items-stretch p-6"
      >
        <ChartContainer
          config={CONFIG_FLUXO}
          label="Saídas por mês com a média do período"
          description="Barras de saída mês a mês, com uma linha tracejada na média de seis meses."
          className="w-full max-w-2xl"
        >
          <ComposedChart data={FLUXO} accessibilityLayer>
            <ChartGrid />
            <ChartXAxis dataKey="mes" />
            <ChartYAxis />
            <ChartTooltip content={<ChartTooltipContent format="currency" />} />
            <ChartReferenceLine y={7036} tone="average" />
            <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} />
            <Line
              dataKey="saldo"
              type="monotone"
              stroke={chartSeriesColor(2)}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </DocSection>

      <DocSection
        title="Movimento"
        description={
          <>
            Todo gráfico <strong>chega</strong> e <strong>se ajusta</strong>. A entrada toca uma vez, quando a caixa rola para dentro da tela: as barras sobem da base, o traço se desenha, as fatias e os anéis varrem, as células do calendário entram em onda, e os números contam de zero. Depois, cada troca de dado interpola do quadro anterior. Troque o período para ver.
          </>
        }
        code={`// Nada a declarar: toda forma já entra e já interpola.
<ChartDonutCenter amount={total} label="no mês" />  // o miolo que conta
<ChartDonutCenter value="76%" />                    // texto pronto, parado`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <DemoMovimento />
      </DocSection>

      <Group title="Os tempos do movimento" layout="grid">
        <Spec title="Entrada">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">{CHART_ENTER_MS}ms</strong> (<code>--duration-spring</code>) em <code>--ease-out</code>, com as séries escalonadas a 60ms. Ela é disparada pelo <code>IntersectionObserver</code>. Até lá o gráfico já está montado, com o dado final e invisível, e aparece na impressão.
            </p>
          </Stack>
        </Spec>
        <Spec title="Troca de dado">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">{CHART_UPDATE_MS}ms</strong> (<code>--duration-slow</code>) em <code>--ease-out</code>. Quem interpola é o Recharts, do quadro anterior. A divisão transiciona o <code>flex-grow</code>, o calendário a cor do degrau, e o número conta do valor antigo.
            </p>
          </Stack>
        </Spec>
        <Spec title="A curva é serena no dado">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <code>--ease-out</code> não passa do alvo: uma barra nunca mostra, nem por um quadro, um valor maior que o real. A mola (<code>--ease-spring</code>) fica para o que <strong className="text-foreground">aparece</strong>: célula, rótulo e legenda.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Movimento reduzido, impressão e faísca">
        Com <code>prefers-reduced-motion</code> nada entra e nada interpola: o <code>&apos;auto&apos;</code> do Recharts desliga as marcas, o bloco global corta as transições e o número é escrito direto. A faísca não entra, porque dez numa lista entrando juntas são ruído; ela aparece pronta e só transita quando o dado muda.
      </DocNote>

      <DocSection
        title="Estado"
        description={`Vazio, carregando e erro têm peça. O esqueleto usa o mesmo aspect do gráfico cheio, para a tela não saltar quando o dado chega. variant="wave" sobe e desce as barras em onda, para o gráfico principal de uma tela: é um laço, então é um por tela, e o movimento reduzido o para.`}
        code={`{carregando ? <ChartSkeleton aspect="wide" />
 : erro       ? <ChartError description={erro} />
 : vazio      ? <ChartEmpty description="Nenhum lançamento entre 1 e 31 de março." />
 : <ChartArea … />}`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartSkeleton aspect="wide" className="w-full max-w-2xl" />
        <ChartSkeleton
          variant="wave"
          aspect="wide"
          bars={14}
          className="w-full max-w-2xl"
        />
        <ChartEmpty
          aspect="wide"
          className="max-w-2xl"
          icon={<ChartBarSquareIcon />}
          description="Nenhum lançamento entre 1 e 31 de março."
        />
        <ChartError
          aspect="wide"
          className="max-w-2xl"
          icon={<ExclamationTriangleIcon />}
          description="Tente de novo em alguns segundos."
        />
      </DocSection>

      <DocSection
        title="A mesma série como tabela"
        description={
          <>
            <code>dataTable</code> abre a série num <code>Table</code> dentro de um <code>Collapsible</code>: a alternativa não-visual para leitor de tela, impressão e número exato.
          </>
        }
        code={`<ChartBars dataTable … />`}
        previewClassName="items-stretch p-6"
      >
        <ChartBars
          dataTable
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas por mês"
          className="w-full max-w-2xl"
        />
      </DocSection>

      <PropsTable
        title="ChartContainer"
        rows={[
          {
            prop: "config",
            type: "ChartConfig",
            description:
              "Rótulo, cor e ícone por chave de série. A cor vira `--color-<chave>` no escopo do gráfico.",
          },
          {
            prop: "aspect",
            type: '"video" | "wide" | "standard" | "square" | "auto"',
            default: '"video"',
            description:
              "A proporção da caixa. `auto` para quem dimensiona por fora.",
          },
          {
            prop: "label",
            type: "string",
            description:
              "O nome acessível (`role=\"img\"` e `aria-label`), obrigatório nas cinco formas.",
          },
          {
            prop: "description",
            type: "string",
            description:
              "Uma frase sobre o que o gráfico mostra, ligada por `aria-describedby` num `sr-only`.",
          },
        ]}
      />

      <PropsTable
        title="As formas"
        rows={[
          {
            prop: "data · config · x · label",
            type: "obrigatórios",
            description:
              "`x` é a chave do eixo de categoria; na rosca ele se chama `nameKey` e há `dataKey` junto.",
          },
          {
            prop: "series",
            type: "string[]",
            default: "Object.keys(config)",
            description:
              "Quais chaves viram série, e em que ordem. A cor segue a entidade, nunca o ranking.",
          },
          {
            prop: "format",
            type: "ChartFormat",
            default: '"currency"',
            description:
              "Como o valor é escrito no tooltip. O eixo de valor deriva daqui e comprime.",
          },
          {
            prop: "legend",
            type: "boolean",
            default: "series.length >= 2",
            description:
              "Duas séries ou mais têm legenda; uma nunca tem.",
          },
          {
            prop: "dataTable",
            type: "boolean",
            default: "false",
            description:
              "A mesma série num `Table` dentro de um `Collapsible`.",
          },
          {
            prop: "variant",
            type: "por forma",
            description:
              "Área: `solid | gradient | stepped`. Linha: `straight | curved | stepped`. Rosca: `donut | pie | gauge`. Faísca: `line | area | bars`.",
          },
          {
            prop: "stacked · layout · dots · thickness",
            type: "por forma",
            description:
              "`stacked` em área e barras; `layout` em barras; `dots` em linha; `thickness` na rosca.",
          },
          {
            prop: "center",
            type: "ReactNode",
            description:
              "Na rosca e nos anéis: o `ChartDonutCenter`, como prop porque `children` desce para o SVG.",
          },
          {
            prop: "shape · track",
            type: '"rounded" | "pill" · boolean',
            default: '"rounded" · false',
            description:
              "Só nas barras: a pílula inteira e o trilho em `--muted` até o máximo.",
          },
          {
            prop: "marker",
            type: '"last"',
            description:
              "Linha e área: o último ponto com valor, marcado e pulsando.",
          },
          {
            prop: "labels",
            type: '"below" | "legend"',
            default: '"below"',
            description:
              "Só na divisão: rótulos sob os segmentos, ou numa legenda só.",
          },
          {
            prop: "maxKey · bands",
            type: "string · [aviso, perigo]",
            description:
              "Só nos anéis: o teto de cada anel e os cortes que pintam o estado.",
          },
          {
            prop: "range · tone · end",
            type: '"quarter" | "year" · "expense" | "income" · YYYY-MM-DD',
            default: '"quarter" · "expense" · o dia mais recente',
            description:
              "Só no calendário. `data` é `{ date, value }[]`.",
          },
          {
            prop: "grid",
            type: '"polygon" | "circle"',
            default: '"polygon"',
            description: "Só no perfil: a forma da grade.",
          },
        ]}
      />

      <PropsTable
        title="ChartTooltipContent e ChartLegendContent"
        rows={[
          {
            prop: "format",
            type: "ChartFormat",
            default: '"number" (tooltip)',
            description:
              "`text | number | currency | compact | percent | date | month`. Na legenda ele escreve o valor ao lado do rótulo.",
          },
          {
            prop: "indicator",
            type: '"dot" | "line" | "dashed"',
            default: '"dot"',
            description:
              "A forma do marcador de série no tooltip.",
          },
          {
            prop: "total",
            type: "boolean",
            default: "false",
            description:
              "A linha de soma no rodapé do tooltip; empilhado, as formas a ligam sozinhas.",
          },
          {
            prop: "interactive · hiddenSeries · onToggle",
            type: "boolean · string[] · (key) => void",
            description:
              "Na legenda, cada item vira `button` com `aria-pressed`; desligado, o rótulo risca e esmaece.",
          },
          {
            prop: "align",
            type: '"start" | "center" | "end"',
            default: '"center"',
            description: "Onde a fileira da legenda encosta.",
          },
          {
            prop: "config",
            type: "ChartConfig",
            description:
              "Só quando a legenda vive fora do `ChartContainer` — que é o caso da rosca.",
          },
        ]}
      />

      <DocNote title="O anel de foco fica: o gráfico é navegável">
        O <code>accessibilityLayer</code> do Recharts 3 vem ligado e permite andar pelo gráfico com <code>Tab</code> e as setas. Suprimir o foco visível apaga a única pista disso; não passe <code>accessibilityLayer={`{false}`}</code>.
      </DocNote>

      <DocNote title="A sexta série não é um matiz novo">
        A rampa tem cinco degraus; do sexto em diante <code>chartSeriesColor</code> devolve <code>--muted-foreground</code> em vez de repetir <code>--chart-1</code>. Quem tem seis categorias agrega a cauda em &ldquo;Outros&rdquo;: quem tem os dados é quem pode agregar.
      </DocNote>

      <DocSection
        title="O cartão em volta"
        description={
          <>
            O cabeçalho do gráfico não é peça do <code>Chart</code>: é <code>Card</code> + <code>CardHeader</code>, com o <code>Badge</code> do delta, o <code>Select</code> do período ou as <code>Tabs</code> da forma no <code>CardAction</code>, e a leitura em <code>DescriptionList</code>. O <code>Card variant=&quot;brand&quot;</code> é o único jeito de a marca encostar num gráfico: o brilho fica na borda, nunca no dado. Um por tela.
          </>
        }
        code={`<Card>
  <CardHeader>
    <CardTitle>Fluxo do ano <Badge tone="income">5,2%</Badge></CardTitle>
    <CardAction><Select …/></CardAction>
  </CardHeader>
  <CardContent><ChartBars shape="pill" track … /></CardContent>
</Card>`}
        previewClassName="flex-wrap items-start justify-center gap-6 p-6"
      >
        <CartaoAno />
        <CartaoSaldo />
        <CartaoOrcamento />
      </DocSection>

      <Group title="Regras que atravessam telas" layout="grid">
        <Spec title="O que sempre vale">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Rótulo do eixo em reais</strong>{" "}
              usa <code>currencyCompactBRL</code>. Exemplo:{" "}
              <span className="nums text-foreground">
                {currencyCompactBRL(8432)}
              </span>
              . <code>ChartYAxis</code> faz isso de fábrica com{" "}
              <code>format=&quot;compact&quot;</code>.
            </p>
            <p>
              <strong className="text-foreground">Cor não é o único canal.</strong>{" "}
              Rótulo, legenda ou padrão também distinguem as séries: 8% dos
              homens não separa verde de vermelho.
            </p>
            <p>
              <strong className="text-foreground">O eixo Y começa em zero.</strong>{" "}
              Cortar a base multiplica visualmente uma diferença pequena.{" "}
              <code>ChartYAxis</code> ancora em <code>[0, &quot;auto&quot;]</code>;
              quem tem caso legítimo passa <code>domain</code>.
            </p>
          </Stack>
        </Spec>

        <Spec title="A forma sai do trabalho do dado">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Magnitude entre categorias</strong>{" "}
              → barras. Nome comprido → <code>layout=&quot;horizontal&quot;</code>.
            </p>
            <p>
              <strong className="text-foreground">Mudança ao longo do tempo</strong>{" "}
              → linha; com volume por baixo, área.
            </p>
            <p>
              <strong className="text-foreground">Composição de um total</strong>{" "}
              → rosca, e só quando as fatias são poucas. Progresso contra um
              teto → <code>variant=&quot;gauge&quot;</code>.
            </p>
            <p>
              <strong className="text-foreground">Divisão de um total em 2 a 4 partes</strong>{" "}
              → <code>ChartSplit</code>. <strong className="text-foreground">Cada categoria contra o próprio teto</strong>{" "}
              → <code>ChartRadial</code>. <strong className="text-foreground">Ritmo por dia</strong>{" "}
              → <code>ChartHeatmap</code>. <strong className="text-foreground">Perfil contra a média</strong>{" "}
              → <code>ChartRadar</code>.
            </p>
            <p>
              <strong className="text-foreground">Um número só</strong> não é
              gráfico: é <code>StatCard</code>. Com tendência ao lado,{" "}
              <code>ChartSparkline</code>.
            </p>
          </Stack>
        </Spec>

        <Spec title="Como as cores chegam ao Recharts">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <code>ChartContainer</code> lê o <code>config</code> e emite{" "}
              <code>--color-&lt;chave&gt;</code> no escopo do gráfico. A série
              referencia <code>fill=&quot;var(--color-entradas)&quot;</code>.
            </p>
            <p>
              É assim que o gráfico acompanha o tema sem nenhum{" "}
              <code>useTheme</code>: a variável muda, o SVG repinta.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="fill e stroke aceitam var()">
        Atributo SVG resolve <code>var()</code>, e é o que o <code>ChartContainer</code> explora. Nunca fixe hex numa série: o gráfico deixa de acompanhar o tema escuro.
      </DocNote>

      <DocNote title="Fora, de propósito">
        <strong>Sem autoplay</strong>: nenhum valor muda sem o dado mudar. O que se move é a chegada (uma vez, ao entrar na tela) e a troca (quando o filtro muda). Em laço, só o halo de <code>marker=&quot;last&quot;</code> e o esqueleto em onda. <strong>Sem arco-íris no dado</strong>: a marca encosta no gráfico pelo <code>Card variant=&quot;brand&quot;</code>, na borda. <strong>Sem dois eixos Y</strong>: escalas diferentes são dois gráficos, ou uma indexada à outra. <strong>Sem embrulho para <code>ComposedChart</code></strong>: componha a anatomia.
      </DocNote>
    </>
  )
}
