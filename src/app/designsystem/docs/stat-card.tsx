"use client"

import * as React from "react"
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChevronRightIcon,
  CreditCardIcon,
  ScaleIcon,
} from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
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
} from "@/components/ui/stat-card"
import { DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

const VARIANTES = ["separate", "joined"] as const
const TAMANHOS = ["sm", "md", "lg"] as const
const LAYOUTS = ["vertical", "horizontal"] as const

const SEMANAS = [
  { semana: "S1", gasto: 1420 },
  { semana: "S2", gasto: 1610 },
  { semana: "S3", gasto: 1380 },
  { semana: "S4", gasto: 1820 },
  { semana: "S5", gasto: 1990 },
  { semana: "S6", gasto: 1760 },
  { semana: "S7", gasto: 2140 },
]


/** Os quatro números do dashboard, com os eixos à mão. */
function DemoNaTela() {
  const [variant, setVariant] = React.useState<(typeof VARIANTES)[number]>("separate")
  const [size, setSize] = React.useState<(typeof TAMANHOS)[number]>("md")
  const [layout, setLayout] = React.useState<(typeof LAYOUTS)[number]>("vertical")
  const horizontal = layout === "horizontal"

  const cartao = (
    rotulo: string,
    Icone: typeof ArrowTrendingDownIcon,
    tone: "income" | "expense" | "default",
    valor: number,
    anterior: number | null,
    better: "up" | "down"
  ) => {
    const delta =
      anterior === null ? null : (
        <StatCardDelta current={valor} previous={anterior} better={better} context="em relação a setembro" />
      )
    return horizontal ? (
      <StatCard key={rotulo} tone={tone} size={size} layout="horizontal">
        <StatCardIcon>
          <Icone />
        </StatCardIcon>
        <StatCardLabel>{rotulo}</StatCardLabel>
        <StatCardValue value={valor} />
        {delta}
      </StatCard>
    ) : (
      <StatCard key={rotulo} tone={tone} size={size}>
        <StatCardHeader>
          <StatCardLabel>
            <StatCardIcon>
              <Icone />
            </StatCardIcon>
            {rotulo}
          </StatCardLabel>
          {delta}
        </StatCardHeader>
        <StatCardValue value={valor} />
      </StatCard>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Eixo rotulo="Grupo" valores={VARIANTES} valor={variant} onChange={setVariant} />
        <Eixo rotulo="Tamanho" valores={TAMANHOS} valor={size} onChange={setSize} />
        <Eixo rotulo="Layout" valores={LAYOUTS} valor={layout} onChange={setLayout} />
      </div>
      {/* `key` remonta o grupo a cada troca, para a cascata e a contagem tocarem de novo. */}
      <StatCardGroup key={`${variant}-${size}-${layout}`} variant={variant} columns={horizontal ? 2 : 4}>
        {cartao("Despesas", ArrowTrendingDownIcon, "expense", 6218.4, 6480, "down")}
        {cartao("Receitas", ArrowTrendingUpIcon, "income", 8432.15, 7530, "up")}
        {cartao("Resultado", ScaleIcon, "income", 2213.75, 1050, "up")}
        {cartao("Faturas abertas", CreditCardIcon, "default", 1284.6, null, "up")}
      </StatCardGroup>
    </div>
  )
}

function DemoHeroi() {
  const [periodo, setPeriodo] = React.useState(0)
  const saldos = [18432.9, 21107.35, 16980.4]
  return (
    <div className="flex w-full flex-col gap-3">
      <StatCard size="lg" tone="income">
        <StatCardHeader>
          <StatCardLabel>
            <StatCardIcon>
              <BanknotesIcon />
            </StatCardIcon>
            Saldo de todas as carteiras
          </StatCardLabel>
          <StatCardDelta
            current={saldos[periodo]}
            previous={saldos[(periodo + 2) % 3]}
            context="em relação ao período anterior"
          />
        </StatCardHeader>
        <StatCardValue value={saldos[periodo]} />
        <StatCardFooter>Atualizado agora há pouco</StatCardFooter>
      </StatCard>
      <Button variant="outline" className="self-start" onClick={() => setPeriodo((p) => (p + 1) % 3)}>
        trocar o período
      </Button>
    </div>
  )
}

export default function StatCardDoc() {
  return (
    <>
      <Usage>
        O número que a tela veio dizer, com o rótulo que o explica e o que o contextualiza — a variação, a tendência, a meta. A faixa de números de um painel é o <code>StatCardGroup</code>. O tom é o <strong>tipo do dado</strong>: despesa é sempre <code>expense</code>, mesmo quando caiu. Número dentro de texto corrido é <code>MoneyDisplay</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="A anatomia: o rótulo em sobrancelha com o ícone num ladrilho tonal, a variação no canto, o número embaixo. Troque o grupo (soltos ou num painel só), o degrau e a linha compacta."
        code={`<StatCardGroup columns={4}>
  <StatCard tone="expense">
    <StatCardHeader>
      <StatCardLabel>
        <StatCardIcon><ArrowTrendingDownIcon /></StatCardIcon>
        Despesas
      </StatCardLabel>
      <StatCardDelta current={6218.4} previous={6480} better="down" />
    </StatCardHeader>
    <StatCardValue value={6218.4} />
  </StatCard>
  …
</StatCardGroup>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="O tom mora no detalhe">
        A superfície é a do <code>Card</code>. O tom aparece no ladrilho do ícone, na cor do número de dinheiro e na faísca — quatro cartões inteiros tingidos lado a lado disputavam o olho com o próprio número. Os tons de estado (<code>warning</code>, <code>info</code>) pintam o ladrilho e deixam o número neutro.
      </DocNote>

      <DocSection
        title="A variação calculada"
        description="Com current, previous e better, o StatCardDelta decide a porcentagem, a seta e o tom — de estado, success ou destructive, porque “melhorou” não é “entrou dinheiro”. Período anterior zerado é “Sem base”; sem mudança, 0%."
        code={`<StatCardDelta current={6218.4} previous={6480} better="down" />
<StatCardDelta current={7530} previous={8432} />
<StatCardDelta current={120} previous={0} />`}
        previewClassName="flex-wrap items-center gap-3"
      >
        <StatCardDelta current={6218.4} previous={6480} better="down" context="em relação a setembro" />
        <StatCardDelta current={7530} previous={8432} context="em relação a setembro" />
        <StatCardDelta current={7120} previous={6480} better="down" context="em relação a setembro" />
        <StatCardDelta current={120} previous={0} />
        <StatCardDelta current={500} previous={500} />
      </DocSection>

      <DocNote title="A direção não decide o tom">
        Despesa caindo é boa notícia; entrada caindo é ruim. Por isso <code>better</code> diz qual sentido é bom. Escrita à mão, a variação continua com <code>tone</code> e <code>direction</code> separados — a seta é da direção, a cor é escolha de quem chama.
      </DocNote>

      <DocSection
        title="Faísca, meta, nota e faixa"
        description="StatCardChart é a tendência no pé, na cor do tom. StatCardProgress é a meta com os cortes do orçamento. StatCardFooter é a linha secundária; StatCardRange, o intervalo na figura, um degrau abaixo."
        code={`<StatCardChart data={semanas} y="gasto" label="Gasto por semana" />
<StatCardProgress value={612.4} max={800} label="Uso do orçamento">de R$ 800,00</StatCardProgress>
<StatCardFooter>Previsto no mês …</StatCardFooter>
<StatCardRange min={182.3} max={341.9} />`}
        previewClassName="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2"
      >
        <StatCard tone="expense">
          <StatCardHeader>
            <StatCardLabel>Gasto nas últimas semanas</StatCardLabel>
            <StatCardDelta current={2140} previous={1760} better="down" context="em relação à semana anterior" />
          </StatCardHeader>
          <StatCardValue value={2140} />
          <StatCardChart data={SEMANAS} y="gasto" label="Gasto por semana nas últimas sete semanas" />
        </StatCard>
        <StatCard tone="expense">
          <StatCardHeader>
            <StatCardLabel>Mercado</StatCardLabel>
          </StatCardHeader>
          <StatCardValue value={612.4} />
          <StatCardProgress value={612.4} max={800} label="Uso do orçamento de mercado">
            de <MoneyDisplay value={800} /> no mês
          </StatCardProgress>
        </StatCard>
        <StatCard>
          <StatCardHeader>
            <StatCardLabel>Despesas</StatCardLabel>
          </StatCardHeader>
          <StatCardValue value={6218.4} />
          <StatCardFooter>
            Previsto no mês <MoneyDisplay value={7400} />
          </StatCardFooter>
        </StatCard>
        <StatCard>
          <StatCardHeader>
            <StatCardLabel>Mín – máx (12 últimos)</StatCardLabel>
          </StatCardHeader>
          <StatCardRange min={182.3} max={341.9} />
        </StatCard>
      </DocSection>

      <DocSection
        title="Comparação dividida"
        description="Dois ou três valores no mesmo cartão, com a barra da proporção entre eles; as porcentagens somam 100 pelo maior resto."
        code={`<StatCardSplit items={[
  { label: "Entrou", value: 8432.15, tone: "income" },
  { label: "Saiu", value: 6218.4, tone: "expense" },
]} />`}
        previewClassName="items-stretch"
      >
        <StatCard className="w-full max-w-md">
          <StatCardHeader>
            <StatCardLabel>Outubro</StatCardLabel>
          </StatCardHeader>
          <StatCardSplit
            items={[
              { label: "Entrou", value: 8432.15, tone: "income" },
              { label: "Saiu", value: 6218.4, tone: "expense" },
            ]}
          />
        </StatCard>
      </DocSection>

      <DocSection
        title="O herói, e o número que conta"
        description="size lg é o número-herói, o saldo. O valor conta até o número ao entrar e ao mudar — troque o período. Com movimento reduzido, ele salta."
        code={`<StatCard size="lg">
  …
  <StatCardValue value={saldo} />
</StatCard>`}
        previewClassName="items-stretch"
      >
        <DemoHeroi />
      </DocSection>

      <DocSection
        title="Esperando, e clicável"
        description="Um cartão de número espera dado: StatCardValueSkeleton tem a altura do degrau. Quando ele abre a lista filtrada, é interactive + asChild, herdados do Card."
        code={`<StatCard>
  <StatCardHeader><StatCardLabel>Total pago</StatCardLabel></StatCardHeader>
  <StatCardValueSkeleton />
</StatCard>

<StatCard interactive asChild>
  <a href="/transactions?category=mercado">…</a>
</StatCard>`}
        previewClassName="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2"
      >
        <StatCard>
          <StatCardHeader>
            <StatCardLabel>Total pago 90d</StatCardLabel>
          </StatCardHeader>
          <StatCardValueSkeleton />
        </StatCard>
        <StatCard interactive asChild tone="expense">
          <a href="#">
            <StatCardHeader>
              <StatCardLabel>Mercado</StatCardLabel>
              <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
            </StatCardHeader>
            <StatCardValue value={1284.6} />
            <StatCardDelta tone="expense" direction="up">
              18% acima da média
            </StatCardDelta>
          </a>
        </StatCard>
      </DocSection>

      <DocNote title="Rótulo e valor não levam gap">
        Rótulo sobre valor é par de identidade: quem os separa é a entrelinha. O respiro existe entre blocos diferentes — o cabeçalho, a nota, a faísca, a meta —, e quem o declara é o cartão, por degrau.
      </DocNote>

      <DocNote title="O valor escreve o número, ou herda a figura">
        <code>StatCardValue value</code> escreve, conta e pinta o número. Com um <code>MoneyDisplay</code> dentro, ele herda o corpo do degrau (<code>--stat-card-value</code>) — não escreva <code>size</code> nele.
      </DocNote>

      <DocNote title="Ele compõe o Card">
        Superfície, borda, recuo e sombra são eixos do <code>Card</code>. No grupo <code>joined</code> os cartões perdem moldura, canto e sombra, e o painel desenha os fios com <code>gap-px</code> sobre a cor da borda — por isso o número de cartões deve encher as linhas.
      </DocNote>

      <PropsTable
        title="StatCard"
        rows={[
          {
            prop: "tone",
            type: '"default" | "income" | "expense" | "warning" | "info"',
            default: '"default"',
            description: "O tipo do dado, não o julgamento sobre ele. Pinta o ladrilho, o número de dinheiro e a faísca.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "Corpo do número, recuo e respiro. md sobe um degrau a partir de sm:; lg é o herói.",
          },
          {
            prop: "layout",
            type: '"vertical" | "horizontal"',
            default: '"vertical"',
            description: "horizontal é a linha compacta: ladrilho à esquerda, rótulo sobre valor, variação na ponta.",
          },
          {
            prop: "interactive / asChild",
            type: "boolean",
            default: "false",
            description: "Do Card: elevação, par de toque e anel de foco; asChild torna o cartão o próprio link.",
          },
        ]}
      />

      <PropsTable
        title="StatCardGroup"
        rows={[
          {
            prop: "variant",
            type: '"separate" | "joined"',
            default: '"separate"',
            description: "Cartões soltos, ou um painel só dividido por fios. Os cartões entram em cascata.",
          },
          {
            prop: "columns",
            type: "2 | 3 | 4",
            default: "4",
            description: "Colunas a partir de lg; no telefone são duas.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "StatCardHeader",
            type: "ComponentProps<'div'>",
            description: "A linha de cima: o rótulo à esquerda, a variação à direita.",
          },
          {
            prop: "StatCardLabel / StatCardIcon",
            type: "ComponentProps<'div' | 'span'>",
            description: "O rótulo em sobrancelha; o ícone (16/solid) num ladrilho tonal.",
          },
          {
            prop: "StatCardValue",
            type: '{ value?, format?: "currency" | "number" | "percent", signed?, compact? }',
            description: "Com value, escreve e conta o número; com children, a figura que um MoneyDisplay herda.",
          },
          {
            prop: "StatCardDelta",
            type: '{ current, previous, better?, context? } | { tone, direction }',
            description: "Calculada ou escrita à mão. A calculada usa success/destructive, “Sem base” e 0%.",
          },
          {
            prop: "StatCardFooter / StatCardRange",
            type: "ComponentProps<'div'> / { min, max, format? }",
            description: "A nota do pé; o intervalo na figura, um degrau abaixo.",
          },
          {
            prop: "StatCardChart",
            type: '{ data, y, label, variant?: "area" | "line" | "bars" }',
            description: "A faísca no pé, na cor do tom. label é o nome acessível.",
          },
          {
            prop: "StatCardProgress",
            type: "{ value, max, label, bands? }",
            description: "A meta, com os cortes do orçamento (85 e 100) e a porcentagem.",
          },
          {
            prop: "StatCardSplit",
            type: "{ items: { label, value, tone? }[] }",
            description: "Dois ou três valores e a barra da proporção.",
          },
          {
            prop: "StatCardValueSkeleton",
            type: "ComponentProps<typeof Skeleton>",
            description: "A espera na medida do valor — a altura sai de --stat-card-value.",
          },
        ]}
      />
    </>
  )
}
