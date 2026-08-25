"use client"

import Link from "next/link"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const DADOS = [
  { mes: "Nov", saldo: 2100 },
  { mes: "Dez", saldo: 1600 },
  { mes: "Jan", saldo: 1100 },
  { mes: "Fev", saldo: 1900 },
  { mes: "Mar", saldo: 2214 },
]

const CONFIG = {
  saldo: { label: "Saldo do mês", color: "var(--chart-1)" },
} satisfies ChartConfig

export default function ChartDoc() {
  return (
    <>
      <Usage>
        O invólucro do Recharts: faz as cores virem dos tokens do tema, sem <code>useTheme</code> e sem hex no JSX. Qual paleta usar está em{" "}
        <Link href="/designsystem/graficos" className="underline">
          Gráficos
        </Link>
        .
      </Usage>

      <DocSection
        title="Padrão"
        description="O config mapeia cada série a um rótulo e a uma cor. ChartContainer emite --color-<chave> no escopo do gráfico, e a série referencia essa variável."
        code={`const config = {
  saldo: { label: "Saldo do mês", color: "var(--chart-1)" },
} satisfies ChartConfig

<ChartContainer config={config} className="h-56 w-full">
  <AreaChart data={dados}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="mes" tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Area dataKey="saldo" fill="var(--color-saldo)" stroke="var(--color-saldo)" />
  </AreaChart>
</ChartContainer>`}
        previewClassName="items-stretch"
      >
        <ChartContainer config={CONFIG} className="h-56 w-full">
          <AreaChart data={DADOS}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="saldo"
              type="monotone"
              fill="var(--color-saldo)"
              fillOpacity={0.15}
              stroke="var(--color-saldo)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </DocSection>

      <DocNote title="Como a variável chega ao SVG">
        <code>ChartStyle</code> escreve CSS escopado por <code>[data-chart=…]</code> declarando <code>--color-&lt;chave&gt;</code> por série, com um valor no claro e outro sob <code>.dark</code>. O <code>fill</code> resolve <code>var()</code>, então trocar de tema repinta sem re-renderizar React.
      </DocNote>

      <DocNote title="O container já tem aspecto">
        <code>aspect-video</code> vem por padrão. Passe uma altura em{" "}
        <code>className</code>{" "}
        quando o gráfico dividir a linha com outra coisa —
        o Recharts precisa de uma altura resolvida para desenhar, e um pai sem
        altura produz um gráfico de zero pixel.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "config",
            type: "ChartConfig",
            description: "Mapa de chave da série para { label, color } ou { label, theme }.",
          },
          {
            prop: "children",
            type: "ResponsiveContainer children",
            description: "Um único gráfico do Recharts.",
          },
        ]}
      />
    </>
  )
}
