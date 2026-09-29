"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Code } from "@/components/ui/code"
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** O osso de uma linha de transação: ladrilho, descrição sobre categoria, valor. */
function LinhaDeTransacao() {
  return (
    <div className="flex w-full items-center gap-3 text-sm">
      <Skeleton shape="tile" />
      <div className="min-w-0 flex-1">
        <Skeleton shape="text" className="w-32 max-w-full" />
        <Skeleton shape="text" className="w-20 max-w-full text-xs" />
      </div>
      <Skeleton shape="text" className="w-20 shrink-0" />
    </div>
  )
}

function DemoAtraso() {
  const [chave, setChave] = React.useState(0)
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Button type="button" variant="secondary" size="sm" onClick={() => setChave((k) => k + 1)}>
        recarregar
      </Button>
      <SkeletonGroup key={chave} delay label="Carregando transações…" className="flex w-full max-w-md flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <LinhaDeTransacao key={i} />
        ))}
      </SkeletonGroup>
    </div>
  )
}

export default function SkeletonDoc() {
  return (
    <>
      <Usage>
        O osso da tela enquanto o dado não chegou. Precisa ter <strong>a forma do conteúdo que vai substituí-lo</strong>: um retângulo genérico não prepara ninguém e provoca salto de layout. Por isso as formas têm o nome e a medida das peças reais — o ladrilho do <code>ColorTile</code>, o círculo do <code>Avatar</code>, a pílula do <code>Badge</code>, a linha de texto. Para ação curta sem fim conhecido é o <code>Spinner</code>; para um gráfico, o <code>ChartSkeleton</code>.
      </Usage>

      <DocSection
        title="As formas"
        description="shape nomeia a peça que o osso substitui, e size fala a escada dela: circle a do Avatar (24 a 56), tile a do ColorTile (24 a 44), pill a do Badge (14, 18 e 22, medidos). text é uma linha — a caixa tem a entrelinha do corpo e o osso pinta 0,8em no meio. block é o retângulo medido por className."
        code={`<Skeleton shape="text" className="w-40 text-sm" />
<Skeleton shape="circle" size="sm" />
<Skeleton shape="tile" />
<Skeleton shape="pill" size="sm" />
<Skeleton className="h-24 w-full rounded-xl" />`}
        previewClassName="flex-col items-stretch gap-5"
      >
        {(
          [
            ["circle", ["xs", "sm", "md", "lg", "xl"]],
            ["tile", ["xs", "md", "lg", "xl", "2xl"]],
            ["pill", ["xs", "sm", "md"]],
          ] as const
        ).map(([forma, degraus]) => (
          <div key={forma} className="flex flex-wrap items-center gap-4">
            <Code variant="inline" className="w-12 text-muted-foreground">
              {forma}
            </Code>
            {degraus.map((d) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <Skeleton shape={forma} size={d} />
                <Caption>{d}</Caption>
              </div>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <Code variant="inline" className="w-12 text-muted-foreground">
            text
          </Code>
          <Skeleton shape="text" className="w-40 text-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Code variant="inline" className="w-12 text-muted-foreground">
            block
          </Code>
          <Skeleton className="h-16 w-full max-w-sm rounded-xl" />
        </div>
      </DocSection>

      <DocSection
        title="SkeletonText: a altura do texto de verdade"
        description="lines linhas com a entrelinha do corpo, e a última mais curta, como a de um parágrafo. Cada linha mede o que uma linha do texto mede — 20px em text-sm, ao lado —, então o osso com o número de linhas do texto real troca sem saltar."
        code={`<SkeletonText lines={3} className="text-sm" />`}
        previewClassName="grid grid-cols-1 items-start gap-6 sm:grid-cols-2"
      >
        <SkeletonText lines={3} className="text-sm" />
        <p className="text-sm text-muted-foreground">
          A fatura de março fecha no dia 28 e vence no dia 5. As compras feitas depois do fechamento entram na fatura de abril.
        </p>
      </DocSection>

      <DocSection
        title="Com a forma do conteúdo"
        description="O osso de uma linha de transação, montado com as formas: o ladrilho da categoria, a descrição sobre a categoria em duas linhas de texto, o valor à direita. Com a forma da linha real, não há salto."
        code={`<div className="flex items-center gap-3 text-sm">
  <Skeleton shape="tile" />
  <div className="flex-1">
    <Skeleton shape="text" className="w-32" />
    <Skeleton shape="text" className="w-20 text-xs" />
  </div>
  <Skeleton shape="text" className="w-20" />
</div>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {[0, 1, 2].map((i) => (
          <LinhaDeTransacao key={i} />
        ))}
      </DocSection>

      <DocSection
        title="O bloco que espera, e o atraso"
        description="SkeletonGroup é o contêiner: role=&quot;status&quot;, aria-busy e o rótulo que o leitor de tela anuncia (os ossos são aria-hidden). Com delay ele só aparece depois de 300ms, esmaecendo — uma resposta rápida não pisca esqueleto na tela. Recarregue e veja o vão antes dos ossos."
        code={`<SkeletonGroup delay label="Carregando transações…">
  …
</SkeletonGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <DemoAtraso />
      </DocSection>

      <DocNote title="O atraso é CSS, e não um timer">
        O bloco nasce com opacidade zero por <code>@starting-style</code> e a transição espera 300ms antes de subir. Sem JavaScript, sem efeito e sem estado: se o dado chega antes, o bloco sai da tela sem nunca ter aparecido. Onde o navegador não tem <code>@starting-style</code>, ele aparece na hora, que era o comportamento de antes.
      </DocNote>

      <DocNote title="Um movimento só: o pulso, inclusive com movimento reduzido">
        Todo osso pulsa, e não há escolha por tela: dois movimentos para o mesmo estado fariam esqueletos vizinhos se mexerem diferente. Houve um brilho (<code>shimmer</code>) na rodada 176, e ele saiu por isso. O bloco global de <code>prefers-reduced-motion</code> isenta <code>animate-pulse</code>, e é ele que comunica que a tela está viva. O gráfico tem o seu, a <code>wave</code> do <code>ChartSkeleton</code>, porque ali o osso tem a forma das barras.
      </DocNote>

      <DocNote title="Ele tem token próprio">
        <code>--skeleton</code> é um degrau abaixo de <code>--muted</code>: com o cinza de muted, o osso some em telas de baixo gamut e em ambiente claro, e a tela parece vazia em vez de carregando.
      </DocNote>

      <DocNote title="Onde o app usa">
        Onze esqueletos de página (painel, transações, contas, assinaturas, cartões e o detalhe, categorias e o detalhe, membros, conta, atividade e sessões) — todos num <code>SkeletonGroup delay</code> desde a rodada 176. Nove escreviam <code>role=&quot;status&quot;</code> e <code>aria-busy</code> à mão, cada um de um jeito, e dois (o detalhe da categoria e os membros) não anunciavam nada. Das 403 chamadas, as formas que eram peças viraram <code>shape</code> — 23 ladrilhos e 6 pílulas —; o resto são linhas e blocos medidos pela tela, que continuam por <code>className</code>.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "shape",
            type: '"block" | "text" | "circle" | "tile" | "pill"',
            default: '"block"',
            description: "A peça que o osso substitui. text tem a entrelinha do corpo em volta.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl" | "2xl"',
            default: '"md"',
            description: "O degrau da peça: Avatar no circle, ColorTile no tile, Badge no pill.",
          },
          {
            prop: "SkeletonText lines",
            type: "number",
            default: "3",
            description: "Quantas linhas; a última sai com 60% da largura. O corpo vai no className.",
          },
          {
            prop: "SkeletonGroup label · delay",
            type: "string · boolean | number",
            default: '"Carregando…" · false',
            description: "O rótulo anunciado e o atraso (true é 300ms).",
          },
        ]}
      />
    </>
  )
}
