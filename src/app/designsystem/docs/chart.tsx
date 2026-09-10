"use client"

import Link from "next/link"
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
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  chartSeriesColor,
  type ChartConfig,
} from "@/components/ui/chart"
import { currencyBRL } from "@/lib/formatters"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

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
        Duas camadas. <strong>A anatomia</strong> — <code>ChartContainer</code>,{" "}
        <code>ChartGrid</code>, <code>ChartXAxis</code>, <code>ChartTooltip</code>,{" "}
        <code>ChartLegend</code> — é a régua, e quem monta um{" "}
        <code>ComposedChart</code> compõe ela. <strong>As cinco formas</strong> —{" "}
        <code>ChartArea</code>, <code>ChartLine</code>, <code>ChartBars</code>,{" "}
        <code>ChartDonut</code>, <code>ChartSparkline</code> — são a forma curta
        sobre a anatomia, como <code>FormInput</code> é sobre <code>Field</code> +{" "}
        <code>Input</code>. Um número sozinho não é gráfico: é{" "}
        <code>StatCard</code>. Qual paleta a série usa é decisão de{" "}
        <Link href="/designsystem/graficos" className="underline underline-offset-2">
          Gráficos
        </Link>
        , não deste componente.
      </Usage>

      <DocSection
        title="Área"
        description={
          <>
            A série contínua ao longo do tempo. <code>variant</code> escolhe o
            preenchimento — <code>solid</code> chapado a 15%,{" "}
            <code>gradient</code> dissolvendo até 2%, <code>stepped</code> em
            degraus, para o dado que muda de patamar em vez de variar.
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

      <DocNote title="A legenda aparece na segunda série, e some na primeira">
        Não é gosto, é a regra escrita como padrão:{" "}
        <code>legend ?? series.length &gt;= 2</code>. Com uma série o título já a
        nomeia e a legenda repete; com duas, a cor deixa de bastar. Os dois
        primeiros gráficos acima não têm legenda e o terceiro tem, sem ninguém
        ter passado nada.
      </DocNote>

      <DocSection
        title="Linha"
        description={
          <>
            Várias séries no mesmo eixo. <code>variant</code> é a interpolação
            (<code>curved</code> de fábrica, <code>straight</code>,{" "}
            <code>stepped</code>) e <code>dots</code> é o marcador:{" "}
            <code>hover</code> só no ponto ativo — o padrão, e o menos ruidoso —,{" "}
            <code>all</code> em todos, <code>none</code> em nenhum.
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
        Abaixo de 8px de diâmetro o ponto lê como sujeira do traço, não como
        dado. E ele leva <code>stroke</code> de 2px na cor de{" "}
        <code>--chart-surface</code>: sem esse anel, dois pontos de séries
        diferentes que se cruzam viram uma mancha só.
      </DocNote>

      <DocSection
        title="Barras"
        description={
          <>
            A magnitude por categoria. <code>layout=&quot;horizontal&quot;</code> é o
            ranking com nome comprido — e ele declara o eixo de categoria por
            quem chama, que é a armadilha do Recharts que a página de{" "}
            <Link href="/designsystem/graficos" className="underline underline-offset-2">
              Gráficos
            </Link>{" "}
            já documentava. <code>stacked</code> empilha e liga a linha de total
            no tooltip.
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
        <code>radius={`{[4, 4, 0, 0]}`}</code>, nunca{" "}
        <code>radius={`{4}`}</code>. Arredondar os quatro cantos levanta a barra
        da linha do zero — e a base é justamente onde um gráfico de barras diz a
        magnitude. No <code>layout=&quot;horizontal&quot;</code> o raio gira junto:{" "}
        <code>{`[0, 4, 4, 0]`}</code>. Empilhado, só o segmento de cima
        arredonda.
      </DocNote>

      <DocNote title="Os 2px entre segmentos são pintados, não vazados">
        O vão entre barras empilhadas e entre fatias de rosca é um{" "}
        <code>stroke</code> de 2px em <code>var(--chart-surface)</code> — a
        variável que o <code>ChartContainer</code> declara e todo mundo herda.
        Com <code>transparent</code> o vão mostraria o segmento de trás em vez
        de abrir; com um literal, cada marca teria a própria cópia da cor do
        fundo.
      </DocNote>

      <DocSection
        title="Rosca"
        description={
          <>
            A composição de um total. <code>donut</code> deixa o miolo livre
            para o valor, <code>pie</code> fecha o miolo, e <code>gauge</code> é
            o meio-círculo de progresso contra um teto — limite de cartão,
            orçamento consumido. <code>thickness</code> muda a espessura do anel.
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
        <code>children</code> desce para dentro do <code>&lt;PieChart&gt;</code>,
        que é SVG — uma <code>&lt;div&gt;</code> ali não renderiza. Por isso o
        miolo tem prop própria. E ele entra pelo <code>overlay</code> do{" "}
        <code>ChartContainer</code>, não como irmão dele: com um envelope{" "}
        <code>relative</code> por fora, o <code>inset-0</code> mede o envelope, e{" "}
        <strong>medido, o miolo saía 118px à direita do centro do anel</strong>{" "}
        assim que o container era mais estreito que a coluna.
      </DocNote>

      <DocNote title="O medidor não é uma rosca cortada ao meio">
        Com o anel e a caixa da rosca, duas coisas quebravam. A corda interna{" "}
        <strong>na altura do topo do texto</strong> media 42px e{" "}
        <code>76%</code> já ocupava 43 — ele encostava no arco, e{" "}
        <code>100%</code> invadiria. E o Recharts centraliza o círculo inteiro,
        então um meio-arco num quadrado deixava <strong>68px mortos
        embaixo</strong>: não era um <code>gap</code> grande, era vazio dentro do
        SVG, e era ele que afastava a legenda das outras formas.
        <br />
        <br />
        Hoje o medidor tem espessura própria, raio a 130% do máximo (o Recharts
        aceita acima de 100), <code>cy</code> a 86% e proporção{" "}
        <code>standard</code> de fábrica. Medido: corda de <strong>103px</strong>{" "}
        — 30 de folga por lado com <code>76%</code>, 22 com <code>100%</code> —, e
        o vão até a legenda em <strong>25px, igual nas três formas</strong>.
      </DocNote>

      <DocNote title="O anel se centra sobre a própria legenda">
        Numa coluna flex o alinhamento padrão é <code>stretch</code>, e o{" "}
        <code>ChartContainer</code> tem largura própria: ele encostava na
        esquerda de uma caixa que a legenda definia —{" "}
        <strong>208px de anel num envelope de 412, 102px fora do centro</strong>.
        O <code>w-fit</code> fica, porque é <code>fit-content</code> e respeita o
        espaço disponível: trocá-lo por <code>w-full</code> centraria o anel e
        faria a legenda parar de quebrar linha no telefone.
      </DocNote>

      <DocNote title="A legenda da rosca sai do SVG, e isso move o centro">
        Dentro do SVG, a <code>&lt;Legend&gt;</code> do Recharts reserva a faixa
        dela encolhendo o anel — e aí <strong>o centro do anel deixa de ser o
        centro da caixa</strong>, que é exatamente onde o{" "}
        <code>ChartDonutCenter</code> se apoia. Na rosca a legenda é HTML ao
        lado do gráfico, e é por isso que <code>ChartLegendContent</code> lê o
        contexto sem exigi-lo. Como efeito colateral bom, a fileira ganha quebra
        de linha de verdade.
      </DocNote>

      <DocSection
        title="Faísca"
        description={
          <>
            A tendência sem eixo, para dentro de um <code>StatCard</code> ou de
            uma linha de lista. Sem grade, sem eixo, sem legenda e sem tooltip:
            uma faísca é a <em>forma</em> da curva, não os números dela. O nome
            acessível continua obrigatório — é ele que diz o que a curva mostra.
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
            <code>aspect</code> é do componente porque quatro telas do app
            responderam com um literal de pixel (<code>height={`{300}`}</code>{" "}
            duas vezes, <code>240</code>, <code>200</code>) a um componente que
            cravava <code>aspect-video</code> e ensinava proporção.{" "}
            <code>auto</code> é a saída para quem dimensiona por fora.
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
            <code>format</code> é o eixo que faltava, e a falta dele custou
            quatro tooltips escritas à mão: o componente formatava com{" "}
            <code>numberBR</code>, então uma série em reais saía{" "}
            <code>8.432</code>, <strong>sem R$</strong>.{" "}
            <code>indicator</code> escolhe a forma do marcador e{" "}
            <code>total</code> liga a linha de soma no rodapé.
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
        <code>format=&quot;currency&quot;</code> escreve <code>R$ 1.234.567,00</code> no
        tooltip e <code>R$ 1,23 mi</code> no eixo — o eixo deriva{" "}
        <code>compact</code> sozinho. São medidas diferentes de propósito: um
        rótulo de eixo precisa caber numa coluna de ~56px, e um tooltip precisa
        dizer o centavo. Os dois passam por <code>lib/formatters</code>; não há{" "}
        <code>Intl</code> neste componente, e a regra <strong>I</strong> do
        auditor é o que tranca isso.
      </DocNote>

      <DocSection
        title="Legenda interativa"
        description={
          <>
            <code>interactive</code> transforma cada item em{" "}
            <code>&lt;button&gt;</code> com <code>aria-pressed</code>. Clicar
            isola a série — é o que <code>dashboard-expense-categories</code> já
            faz hoje com um <code>&lt;ul&gt;</code> próprio de 40 linhas.
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

      <DocNote title="O estado escondido não é só opacidade">
        O rótulo <strong>risca</strong>, e é isso que sobrevive a quem não
        distingue um degrau de transparência. Opacidade sozinha é a mesma
        armadilha de cor-como-único-canal, um nível acima.
      </DocNote>

      <DocSection
        title="Anatomia livre"
        description={
          <>
            Barras mais linha é composição genuína, e não ganhou embrulho: dois
            casos que diferem em tudo virariam API a mais, não a menos. As peças
            da anatomia servem qualquer gráfico do Recharts —{" "}
            <code>ChartReferenceLine</code> tem <code>tone</code>{" "}
            (<code>zero</code>, <code>average</code>, <code>neutral</code>), que
            são os três papéis que duas telas do app desenham à mão.
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
        description="Nenhum dos oito gráficos do app tem estado vazio hoje. O esqueleto carrega o mesmo eixo `aspect` do gráfico cheio — um esqueleto de altura arbitrária faz a tela saltar quando o dado chega."
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
            <code>dataTable</code> abre um <code>Collapsible</code> com a série
            em <code>Table</code>. É a alternativa não-visual que um gráfico
            deve ter e que não existia em lugar nenhum deste app — quem lê com
            leitor de tela, quem imprime e quem precisa do número exato saem
            todos do mesmo lugar.
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
              "O nome acessível: emite `role=\"img\"` e `aria-label`. Opcional aqui e obrigatório nas cinco formas — a composição livre não pode cobrar.",
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
              "O padrão é a regra: duas séries ou mais sempre têm legenda, uma nunca tem.",
          },
          {
            prop: "dataTable",
            type: "boolean",
            default: "false",
            description:
              "Abre um `Collapsible` com a mesma série em `Table`. Sem ele, nenhum invólucro é renderizado.",
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
              "Só na rosca: o `ChartDonutCenter`. Prop e não `children`, porque `children` desce para dentro do SVG.",
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
              "A forma do marcador de série no tooltip. Já existia antes desta rodada e nunca tinha sido documentado.",
          },
          {
            prop: "total",
            type: "boolean",
            default: "false",
            description:
              "A linha de soma no rodapé do tooltip. As quatro tooltips à mão do app têm uma; empilhado, as formas ligam sozinhas.",
          },
          {
            prop: "interactive · hiddenSeries · onToggle",
            type: "boolean · string[] · (key) => void",
            description:
              "Legenda: cada item vira um `button` com `aria-pressed`, e o item desligado risca o rótulo além de esmaecer.",
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

      <DocNote title="O anel de foco tinha sido apagado, e o gráfico é navegável">
        A versão anterior escrevia <code>outline-hidden</code> em{" "}
        <code>.recharts-layer</code>, <code>.recharts-sector</code> e{" "}
        <code>.recharts-surface</code>. O que isso apagava era o foco de teclado
        que o <code>accessibilityLayer</code> do Recharts v3 desenha — e a
        versão instalada aqui é a <strong>3.8.0</strong>, onde ele vem ligado de
        fábrica. Uma tela chegava a passar{" "}
        <code>accessibilityLayer={`{false}`}</code>, o único do repositório.
        Suprimir o foco não-visível continua certo; suprimir o visível é tirar a
        única pista de que dá para andar no gráfico com <code>Tab</code> e as
        setas.
      </DocNote>

      <DocNote title="A sexta série não é um matiz novo">
        A rampa tem cinco degraus. Do sexto em diante,{" "}
        <code>chartSeriesColor</code> devolve <code>--muted-foreground</code>,
        que lê como &ldquo;não identificado&rdquo; — em vez de repetir{" "}
        <code>--chart-1</code> e dar duas fatias da mesma cor, que é o que{" "}
        <code>BAR_COLORS[idx % 5]</code> faz hoje em{" "}
        <code>credit-cards-history-chart</code>. Quem tem seis categorias agrega
        a cauda em &ldquo;Outros&rdquo;: quem tem os dados é quem pode agregar.
      </DocNote>

      <DocNote title="O que ficou de fora, e por quê">
        <strong>Sem autoplay e sem animação de entrada</strong> — num app de
        finanças, um valor que se move enquanto a pessoa o lê é hostil.{" "}
        <strong>Sem dois eixos Y</strong>: duas medidas de escala diferente são
        dois gráficos, ou uma indexada à outra.{" "}
        <strong>Sem embrulho para <code>ComposedChart</code></strong>, pela
        contagem — dois casos que diferem em tudo. E{" "}
        <strong>as sete telas do app ainda não migraram</strong>: elas estão
        contadas no backlog do <code>AGENTS.md</code>, com as quatro tooltips,
        as três legendas e os quatro <code>Intl</code> redeclarados que esta
        rodada existe para apagar.
      </DocNote>
    </>
  )
}
