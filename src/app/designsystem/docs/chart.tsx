"use client"

import * as React from "react"
import { Bar, ComposedChart, Line } from "recharts"
import {
  ChartBarSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

import {
  ChartArea,
  ChartBars,
  ChartContainer,
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
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  chartSeriesColor,
  type ChartConfig,
} from "@/components/ui/chart"
import { currencyBRL, currencyCompactBRL } from "@/lib/formatters"
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
        Todo gráfico do app. <strong>A anatomia</strong> — <code>ChartContainer</code>, <code>ChartGrid</code>, os eixos, <code>ChartTooltip</code>, <code>ChartLegend</code> — compõe qualquer gráfico do Recharts; <strong>as cinco formas</strong> — <code>ChartArea</code>, <code>ChartLine</code>, <code>ChartBars</code>, <code>ChartDonut</code>, <code>ChartSparkline</code> — são a forma curta sobre ela. Um número sozinho não é gráfico: é <code>StatCard</code>.
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
        title="Estado"
        description="Vazio, carregando e erro têm peça. O esqueleto usa o mesmo aspect do gráfico cheio, para a tela não saltar quando o dado chega."
        code={`{carregando ? <ChartSkeleton aspect="wide" />
 : erro       ? <ChartError description={erro} />
 : vazio      ? <ChartEmpty description="Nenhum lançamento entre 1 e 31 de março." />
 : <ChartArea … />}`}
        previewClassName="flex-col items-stretch gap-6 p-6"
      >
        <ChartSkeleton aspect="wide" className="w-full max-w-2xl" />
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
        title="As cinco formas"
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
              "Só na rosca: o `ChartDonutCenter`, como prop porque `children` desce para o SVG.",
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
        <strong>Sem autoplay e sem animação de entrada</strong>: um valor que se move enquanto a pessoa o lê é hostil. <strong>Sem dois eixos Y</strong>: escalas diferentes são dois gráficos, ou uma indexada à outra. <strong>Sem embrulho para <code>ComposedChart</code></strong>: componha a anatomia.
      </DocNote>
    </>
  )
}
