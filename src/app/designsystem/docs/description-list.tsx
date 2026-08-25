"use client"

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DescriptionListDoc() {
  return (
    <>
      <Usage>
        Pares rótulo/valor numa tela de detalhe. É um <code>&lt;dl&gt;</code> de verdade, então o leitor de tela associa cada valor ao seu rótulo — duas <code>&lt;div&gt;</code> lado a lado não fazem isso.
      </Usage>

      <DocSection
        title="Empilhado"
        description="O padrão, e o que serve no telefone: rótulo em cima, valor embaixo."
        code={`<DescriptionList>
  <DescriptionListItem>
    <DescriptionTerm>Fechamento</DescriptionTerm>
    <DescriptionDetails>28 de março</DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList className="w-full max-w-sm">
          <DescriptionListItem>
            <DescriptionTerm>Fechamento</DescriptionTerm>
            <DescriptionDetails>28 de março</DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Vencimento</DescriptionTerm>
            <DescriptionDetails>5 de abril</DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Total da fatura</DescriptionTerm>
            <DescriptionDetails>
              <MoneyDisplay value={1482.3} tone="expense" />
            </DescriptionDetails>
          </DescriptionListItem>
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Em linha"
        description="Rótulo à esquerda e valor à direita a partir de sm. Abaixo disso ele volta a empilhar sozinho."
        code={`<DescriptionList layout="inline">
  <DescriptionListItem layout="inline">…</DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList layout="inline" className="w-full max-w-sm">
          {[
            ["Limite total", "R$ 8.000,00"],
            ["Limite usado", "R$ 1.482,30"],
            ["Disponível", "R$ 6.517,70"],
          ].map(([term, value]) => (
            <DescriptionListItem key={term} layout="inline">
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails className="nums">{value}</DescriptionDetails>
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </DocSection>

      <DocNote title="Sem gap entre termo e valor">
        O <code>gap</code> do componente fica entre um par e o próximo, nunca dentro do par.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "layout",
            type: '"stacked" | "inline"',
            default: '"stacked"',
            description: "Precisa ser passado na lista e em cada item.",
          },
        ]}
      />
    </>
  )
}
