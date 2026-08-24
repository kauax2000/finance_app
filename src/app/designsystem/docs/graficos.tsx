"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { currencyCompactBRL } from "@/lib/formatters"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const FLUXO = [
  { mes: "Nov", entradas: 8200, saidas: 6100 },
  { mes: "Dez", entradas: 11400, saidas: 9800 },
  { mes: "Jan", entradas: 8300, saidas: 7200 },
  { mes: "Fev", entradas: 8400, saidas: 6500 },
  { mes: "Mar", entradas: 8432, saidas: 6218 },
]

const CATEGORIAS = [
  { nome: "Mercado", valor: 1840 },
  { nome: "Transporte", valor: 620 },
  { nome: "Lazer", valor: 480 },
  { nome: "Saúde", valor: 310 },
  { nome: "Casa", valor: 260 },
]

const CONFIG_FLUXO = {
  entradas: { label: "Entradas", color: "var(--chart-income)" },
  saidas: { label: "Saídas", color: "var(--chart-expense)" },
} satisfies ChartConfig

const CONFIG_CATEGORIAS = {
  valor: { label: "Gasto", color: "var(--chart-1)" },
} satisfies ChartConfig

export default function GraficosDoc() {
  return (
    <>
      <Usage>
        Duas paletas, e escolher entre elas é a decisão inteira: quando verde e
        vermelho <strong>significam</strong> entrada e saída, a série usa{" "}
        <code>--chart-income</code> e <code>--chart-expense</code>. Quando as
        séries são só categorias diferentes, ela usa a rampa{" "}
        <code>--chart-1</code> a <code>--chart-5</code>.
      </Usage>

      <DocSection
        title="Quando a cor é semântica"
        description="Fluxo de caixa: verde é entrada e vermelho é saída, e trocar por outra cor destruiria a leitura."
        code={`const config = {
  entradas: { label: "Entradas", color: "var(--chart-income)" },
  saidas: { label: "Saídas", color: "var(--chart-expense)" },
} satisfies ChartConfig`}
        previewClassName="items-stretch"
      >
        <ChartContainer config={CONFIG_FLUXO} className="h-56 w-full">
          <BarChart data={FLUXO}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="entradas" fill="var(--color-entradas)" radius={4} />
            <Bar dataKey="saidas" fill="var(--color-saidas)" radius={4} />
          </BarChart>
        </ChartContainer>
      </DocSection>

      <DocSection
        title="Quando a cor é só identificação"
        description="Gasto por categoria: nenhuma delas é boa ou ruim. Aqui a rampa neutra é o certo — com as cores de status, a categoria vermelha leria como problema."
        code={`const config = {
  valor: { label: "Gasto", color: "var(--chart-1)" },
} satisfies ChartConfig`}
        previewClassName="items-stretch"
      >
        <ChartContainer config={CONFIG_CATEGORIAS} className="h-56 w-full">
          <BarChart
            data={CATEGORIAS}
            layout="vertical"
            margin={{ left: 8, right: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            {/* Barra horizontal no Recharts precisa do eixo de categoria
                declarado: sem ele todas as barras caem na mesma posição. */}
            <YAxis
              dataKey="nome"
              type="category"
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
          </BarChart>
        </ChartContainer>
      </DocSection>

      <Group title="Regras" layout="grid">
        <Spec title="O que sempre vale">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Rótulo do eixo em reais</strong>{" "}
              usa <code>currencyCompactBRL</code>. Exemplo:{" "}
              <span className="nums text-foreground">
                {currencyCompactBRL(8432)}
              </span>
              .
            </p>
            <p>
              <strong className="text-foreground">Cor não é o único canal.</strong>{" "}
              Rótulo, legenda ou padrão precisam distinguir as séries também: 8%
              dos homens não separa verde de vermelho.
            </p>
            <p>
              <strong className="text-foreground">O eixo Y começa em zero</strong>{" "}
              em gráfico de barra. Cortar a base multiplica visualmente uma
              diferença de 3%.
            </p>
          </Stack>
        </Spec>

        <Spec title="Como as cores chegam ao Recharts">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <code>ChartContainer</code> lê o <code>config</code> e emite{" "}
              <code>--color-&lt;chave&gt;</code>{" "}
              no escopo do gráfico. A série
              referencia <code>fill=&quot;var(--color-entradas)&quot;</code>.
            </p>
            <p>
              É assim que o gráfico acompanha o tema sem nenhum{" "}
              <code>useTheme</code>: a variável muda, o SVG repinta.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Atributo SVG aceita var(), sim">
        <code>dashboard-cashflow-chart.tsx</code>{" "}
        traz um comentário afirmando
        que &ldquo;SVG/Recharts attrs cannot use var()&rdquo; e por isso fixa{" "}
        <code>#10B981</code> e <code>#E11D48</code>{" "}
        na mão. A premissa está
        errada: <code>fill</code> e <code>stroke</code> resolvem{" "}
        <code>var()</code>{" "}
        em todos os navegadores que este app suporta, e é
        exatamente o que <code>ChartContainer</code>{" "}
        explora. Essas duas cores
        estão no relatório de conformidade.
      </DocNote>
    </>
  )
}
