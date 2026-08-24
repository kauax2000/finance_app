"use client"

import {
  Caption,
  H1,
  H2,
  H3,
  H4,
  Lead,
  Muted,
  P,
  Small,
} from "@/components/ui/typography"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

export default function TipografiaDoc() {
  return (
    <>
      <Usage>
        Três famílias, cada uma com um território: <strong>Inter</strong>{" "}
        no
        corpo, <strong>Plus Jakarta Sans</strong> nos títulos e{" "}
        <strong>Geist Mono</strong>{" "}
        em número que precisa alinhar. Nunca escolha
        tamanho e peso soltos numa tela: use os componentes abaixo, ou o próximo
        título vai nascer <code>text-3xl font-bold</code>{" "}
        e divergir do anterior
        por dois pixels.
      </Usage>

      <DocSection
        title="Títulos"
        description="Todos em Plus Jakarta (font-heading), com tracking apertado. H2 traz uma régua embaixo — é o divisor de seção de uma página longa, não um título qualquer."
        code={`<H1>Suas finanças</H1>
<H2>Este mês</H2>
<H3>Cartões</H3>
<H4>Fatura aberta</H4>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <H1>Suas finanças</H1>
        <H2>Este mês</H2>
        <H3>Cartões</H3>
        <H4>Fatura aberta</H4>
      </DocSection>

      <DocSection
        title="Texto"
        description="Lead abre uma tela. P é o parágrafo. Muted é o mesmo tamanho de P com a cor secundária, para quando o texto explica em vez de afirmar."
        code={`<Lead>Acompanhe entradas e saídas do mês.</Lead>
<P>A fatura fecha no dia 28 e vence no dia 5.</P>
<Muted>Parcelas futuras não entram neste total.</Muted>
<Small>Atualizado agora</Small>
<Caption>Valores em reais</Caption>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Lead>Acompanhe entradas e saídas do mês.</Lead>
        <P>A fatura fecha no dia 28 e vence no dia 5.</P>
        <Muted>Parcelas futuras não entram neste total.</Muted>
        <Small>Atualizado agora</Small>
        <Caption>Valores em reais</Caption>
      </DocSection>

      <Group title="A escala" layout="grid">
        <Spec title="Tamanhos" meta="--text-*">
          <Stack className="gap-2">
            {[
              ["text-2xs", "0,6875rem", "contagem dentro de controle pequeno"],
              ["text-xs", "0,75rem", "legenda, metadado"],
              ["text-control-sm", "0,8rem", "texto de controle size=\"sm\""],
              ["text-sm", "0,875rem", "o corpo do produto"],
              ["text-base", "1rem", "campo no telefone (evita o zoom do iOS)"],
              ["text-lg", "1,125rem", "título de tela"],
              ["text-2xl", "1,5rem", "título de destaque"],
            ].map(([name, size, use]) => (
              <div key={name} className="flex items-baseline gap-3">
                <code className="w-32 shrink-0 font-mono text-2xs text-muted-foreground">
                  {name}
                </code>
                <span className="nums w-20 shrink-0 text-2xs text-muted-foreground">
                  {size}
                </span>
                <span className="text-xs text-muted-foreground">{use}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Números" meta=".nums">
          <Stack>
            <div>
              <p className="text-2xs text-muted-foreground">Sem tabular</p>
              <p className="text-sm">R$ 1.111,11</p>
              <p className="text-sm">R$ 8.888,88</p>
            </div>
            <div>
              <p className="text-2xs text-muted-foreground">Com .nums</p>
              <p className="nums text-sm">R$ 1.111,11</p>
              <p className="nums text-sm">R$ 8.888,88</p>
            </div>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Por que dois degraus fora da escala do Tailwind">
        <code>--text-2xs</code> e <code>--text-control-sm</code>{" "}
        existem porque o
        sistema já tinha ido para <code>text-[10px]</code> e{" "}
        <code>text-[0.8rem]</code>{" "}
        em seis lugares. Valor arbitrário repetido é
        um token que ainda não foi nomeado: cada ocorrência é livre para divergir
        um pixel, e nenhuma delas aparece quando se procura pela escala.
      </DocNote>

      <PropsTable
        title="Componentes"
        rows={[
          { prop: "H1 … H4", type: "ComponentProps<'h1'>", description: "Títulos. H2 traz a régua de seção." },
          { prop: "Lead", type: "ComponentProps<'p'>", description: "Parágrafo de abertura, maior e secundário." },
          { prop: "P", type: "ComponentProps<'p'>", description: "O parágrafo do corpo." },
          { prop: "Muted", type: "ComponentProps<'p'>", description: "Texto secundário, mesmo tamanho de P." },
          { prop: "Small", type: "ComponentProps<'small'>", description: "Metadado com peso médio." },
          { prop: "Caption", type: "ComponentProps<'p'>", description: "Legenda abaixo de um bloco." },
        ]}
      />
    </>
  )
}
