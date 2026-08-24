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

export default function TypographyDoc() {
  return (
    <>
      <Usage>
        Os componentes de texto. Use-os em vez de escolher tamanho e peso soltos:
        o próximo título escrito à mão vai nascer{" "}
        <code>text-3xl font-bold</code>{" "}
        e divergir do anterior por dois pixels,
        e ninguém vai notar até as duas telas aparecerem lado a lado.
      </Usage>

      <DocSection
        title="A escala inteira"
        code={`<H1>Título de tela</H1>
<Lead>Abertura.</Lead>
<H2>Seção</H2>
<P>Parágrafo.</P>
<Muted>Texto secundário.</Muted>
<Small>Metadado</Small>
<Caption>Legenda</Caption>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <H1>Suas finanças</H1>
        <Lead>Acompanhe entradas e saídas do mês.</Lead>
        <H2>Este mês</H2>
        <P>
          A fatura do Nubank fecha no dia 28 e vence no dia 5. Compras feitas
          depois do fechamento entram na fatura seguinte.
        </P>
        <H3>Cartões</H3>
        <Muted>Parcelas futuras não entram neste total.</Muted>
        <H4>Fatura aberta</H4>
        <Small>Atualizado agora</Small>
        <Caption>Valores em reais</Caption>
      </DocSection>

      <DocNote title="Um H1 por tela, e ele é o PageHeaderTitle">
        <code>PageHeaderTitle</code> já é o <code>&lt;h1&gt;</code>. Usar{" "}
        <code>H1</code>{" "}
        de novo no corpo cria dois títulos de nível um, e quem
        navega por cabeçalhos passa a ver duas telas onde há uma.
      </DocNote>

      <DocNote title="H2 traz uma régua">
        Ele é o divisor de seção de uma página longa, não um título qualquer.
        Para o título de um bloco dentro de uma tela, o componente é{" "}
        <code>PageSectionTitle</code>, que também é <code>&lt;h2&gt;</code>{" "}
        e não
        desenha régua.
      </DocNote>

      <DocNote title="Muted é cor, não tamanho">
        <code>Muted</code> tem o mesmo tamanho de <code>P</code>, com a cor
        secundária. Para texto menor, os componentes são <code>Small</code> e{" "}
        <code>Caption</code>.
      </DocNote>

      <PropsTable
        title="Componentes"
        rows={[
          { prop: "H1 … H4", type: "ComponentProps<'h1'…'h4'>", description: "Plus Jakarta, tracking apertado. H2 traz a régua." },
          { prop: "Lead", type: "ComponentProps<'p'>", description: "text-lg secundário, para abrir uma tela." },
          { prop: "P", type: "ComponentProps<'p'>", description: "text-sm com leading relaxado." },
          { prop: "Muted", type: "ComponentProps<'p'>", description: "text-sm secundário." },
          { prop: "Small", type: "ComponentProps<'small'>", description: "text-xs com peso médio." },
          { prop: "Caption", type: "ComponentProps<'p'>", description: "text-xs secundário, para legenda." },
        ]}
      />
    </>
  )
}
