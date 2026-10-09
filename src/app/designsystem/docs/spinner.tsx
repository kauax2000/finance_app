"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { FormSubmit } from "@/components/ui/form"
import { Spinner, SpinnerBlock } from "@/components/ui/spinner"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TAMANHOS = ["sm", "md", "lg", "xl", "2xl"] as const

function DemoBloco() {
  const [chave, setChave] = React.useState(0)
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Button type="button" variant="secondary" size="sm" onClick={() => setChave((k) => k + 1)}>
        recarregar
      </Button>
      <SpinnerBlock key={chave} label="Carregando os membros…" className="h-32 w-full rounded-surface border border-dashed border-border" />
    </div>
  )
}

export default function SpinnerDoc() {
  return (
    <>
      <Usage>
        Carregamento <strong>sem fim conhecido</strong> e curto: dentro de um botão que salva, ao lado de uma ação que confirma, numa região pequena que espera. Para uma tela inteira é o <code>Skeleton</code> — o spinner não diz o que vem depois.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="size fala a escada do ícone: sm 14, md 16 (o padrão), lg 20, xl 24 e 2xl 32. A roda é desenhada — um arco de um quarto sobre um trilho a 20% da tinta —, e a tinta é currentColor, então ela pega a cor do texto em volta."
        code={`<Spinner size="sm" />
<Spinner />
<Spinner size="xl" className="text-primary-accent" />`}
        previewClassName="items-end gap-6"
      >
        {TAMANHOS.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <Spinner size={s} />
            <Caption>{s}</Caption>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Dentro de um botão"
        description="Num formulário é o FormSubmit com pending: ele desabilita, marca aria-busy, põe o spinner e troca o rótulo. Fora dele, o Button fica desabilitado e o rótulo vai para o gerúndio — trocar só o ícone deixa o botão parecendo clicável. Sem margem no spinner: o Button já tem o respiro entre ícone e texto."
        code={`<FormSubmit pending pendingLabel="salvando…">salvar</FormSubmit>

<Button variant="outline" disabled>
  <Spinner />
  sincronizando…
</Button>`}
        previewClassName="flex-wrap items-center gap-3"
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <FormSubmit pending pendingLabel="salvando…">
            salvar
          </FormSubmit>
        </form>
        <Button variant="outline" disabled>
          <Spinner />
          sincronizando…
        </Button>
      </DocSection>

      <DocSection
        title="Sozinho, sem texto ao lado"
        description="Aí ele precisa de label, e vira role=&quot;status&quot; com nome. Sem label o spinner é invisível ao leitor de tela, de propósito: quase sempre o rótulo já está ao lado."
        code={`<Spinner size="xl" label="Carregando transações" />`}
      >
        <Spinner size="xl" label="Carregando transações" />
      </DocSection>

      <DocSection
        title="O bloco de espera"
        description="SpinnerBlock é a roda com o texto, centrada numa região — e é ele quem anuncia. Com delay (o padrão) ele só aparece depois de 300ms, esmaecendo, e o espaço fica reservado desde o primeiro quadro: a espera curta não pisca, e nada salta quando ele entra. Recarregue."
        code={`<SpinnerBlock label="Carregando os membros…" className="h-32" />`}
        previewClassName="flex-col items-stretch"
      >
        <DemoBloco />
      </DocSection>

      <DocSection
        title="A versão de marca"
        description="O anel em arco-íris da marca, com a cauda transparente: a cor corre pelo anel conforme ele gira. É o da tela de abertura do app, ao lado do wordmark em arco-íris — lá num SpinnerBlock sem texto visível e com 600ms de atraso. Uma por tela."
        code={`<Spinner variant="brand" size="2xl" />

<SpinnerBlock label="Carregando o aplicativo" showLabel={false} variant="brand" size="xl" delay={600} />`}
        previewClassName="items-end gap-6"
      >
        {TAMANHOS.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <Spinner size={s} variant="brand" />
            <Caption>{s}</Caption>
          </div>
        ))}
      </DocSection>

      <DocNote title="Uma roda, e não a seta de atualizar">
        Até a rodada 177 o spinner era o <code>ArrowPathIcon</code> girando — e no app essa seta é o &ldquo;tentar novamente&rdquo;: a tela de erro, o <code>Button iconMotion=&quot;spin&quot;</code>. Um botão salvando e um botão de atualizar desenhavam o mesmo glifo. A roda desenhada não significa nada além de &ldquo;espere&rdquo;, e é a exceção que o auditor sempre reservou ao spinner (<code>DRAWN_SVG_FILES</code>): um primitivo cuja geometria é o comportamento.
      </DocNote>

      <DocNote title="Ele gira com movimento reduzido">
        O bloco global de <code>prefers-reduced-motion</code> <strong>isenta</strong> <code>animate-spin</code>: uma roda parada não diz que algo acontece. (A versão anterior desta página dizia o contrário — que ele parava —, e estava errada.)
      </DocNote>

      <DocNote title="Onde o app usa">
        Vinte e cinco rodas: o <code>FormSubmit</code>, o toast de carregamento, os botões de membros, convites, exclusão de conta, perfil e sessões, o polegar do <code>Switch pending</code> (desde a rodada 179, no interruptor de uma assinatura) — e a tela de abertura, que desde a rodada 178 é um <code>SpinnerBlock</code> de marca no lugar de um <code>setTimeout</code> com opacidade trocada. Dez rodas dentro de botões tinham <code>mr-2</code> ou <code>mr-1.5</code>, somando margem ao respiro que o <code>Button</code> já dá; saíram, com os tamanhos à mão (<code>size-3.5</code> virou <code>size=&quot;sm&quot;</code>) e um <code>aria-hidden</code> que repetia o padrão.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "size", type: '"sm" | "md" | "lg" | "xl" | "2xl"', default: '"md"', description: "O corpo: 14, 16, 20, 24 e 32px." },
          { prop: "variant", type: '"default" | "brand"', default: '"default"', description: "brand é o anel em arco-íris. Uma por tela." },
          { prop: "label", type: "string", description: "Com ele, role=\"status\" e o nome. Sem ele, aria-hidden — para quando o texto já está do lado." },
          { prop: "SpinnerBlock label", type: "string", description: "O texto que se lê e se anuncia. Obrigatório." },
          { prop: "SpinnerBlock showLabel", type: "boolean", default: "true", description: "false deixa o texto só para o leitor de tela." },
          { prop: "SpinnerBlock delay", type: "boolean | number", default: "true (300ms)", description: "O bloco só aparece depois do atraso, esmaecendo, com o espaço reservado." },
        ]}
      />
    </>
  )
}
