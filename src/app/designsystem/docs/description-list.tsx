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
        Pares rótulo/valor numa tela de detalhe. É um <code>&lt;dl&gt;</code> de
        verdade, então o leitor de tela associa cada valor ao seu rótulo — duas{" "}
        <code>&lt;div&gt;</code> lado a lado não fazem isso.
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
              <MoneyDisplay value={-1482.3} tone="expense" />
            </DescriptionDetails>
          </DescriptionListItem>
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Em linha"
        description="Rótulo à esquerda e valor à direita a partir de sm. Abaixo disso ele volta a empilhar sozinho — e o layout é declarado uma vez, na lista."
        code={`<DescriptionList layout="inline">
  <DescriptionListItem>
    <DescriptionTerm>Limite total</DescriptionTerm>
    <DescriptionDetails>R$ 8.000,00</DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList layout="inline" className="w-full max-w-sm">
          {[
            ["Limite total", "R$ 8.000,00"],
            ["Limite usado", "R$ 1.482,30"],
            ["Disponível", "R$ 6.517,70"],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>{value}</DescriptionDetails>
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Extrato"
        description="divided põe o fio entre os pares. É o desenho de fatura, e a mesma categoria de fio do ItemGroup: separador de itens repetidos, que é o que torna a lista varrível. A última linha usa size='lg' no valor — o total pesa, e o rótulo dele não."
        code={`<DescriptionList layout="inline" divided>
  …
  <DescriptionListItem>
    <DescriptionTerm>Total</DescriptionTerm>
    <DescriptionDetails size="lg">
      <MoneyDisplay value={-1482.3} tone="expense" />
    </DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList
          layout="inline"
          divided
          className="w-full max-w-sm rounded-xl border border-border px-4 py-3"
        >
          {[
            ["Compras do período", "R$ 1.284,60"],
            ["Parcelamentos", "R$ 197,70"],
            ["Encargos", "R$ 0,00"],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>{value}</DescriptionDetails>
            </DescriptionListItem>
          ))}
          <DescriptionListItem>
            <DescriptionTerm>Total da fatura</DescriptionTerm>
            <DescriptionDetails size="lg">
              <MoneyDisplay value={-1482.3} tone="expense" />
            </DescriptionDetails>
          </DescriptionListItem>
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Em grade"
        description="Duas colunas a partir de sm. Um detalhe com seis campos, empilhado, é uma coluna alta com a metade direita da tela vazia."
        code={`<DescriptionList layout="grid">…</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList layout="grid" className="w-full max-w-md">
          {[
            ["Bandeira", "Mastercard"],
            ["Final", "4821"],
            ["Fechamento", "28 de março"],
            ["Vencimento", "5 de abril"],
            ["Limite total", "R$ 8.000,00"],
            ["Disponível", "R$ 6.517,70"],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>{value}</DescriptionDetails>
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </DocSection>

      <DocNote title="O layout se declara uma vez">
        Ele precisava ser passado <strong>duas</strong> vezes — na lista e em
        cada item —, e a versão anterior desta página documentava isso como se
        fosse regra. Não era: <code>&lt;DescriptionList layout=&quot;inline&quot;&gt;</code>{" "}
        sozinho não fazia nada, calado. Hoje o item lê o do pai por{" "}
        <code>data-layout</code>, e o prop local vira o que devia ser — uma
        sobrescrita para a linha que foge do padrão.
      </DocNote>

      <DocNote title="A armadilha que isso custa">
        <code>in-*</code> compila com <code>:where()</code>, que não soma
        especificidade — uma classe sob esse variante perde para uma classe base
        no mesmo elemento. Funciona aqui porque a base do item é{" "}
        <code>min-w-0</code> e mais nada. Quem acrescentar uma base que colida
        (um <code>flex-col</code> fixo, um <code>text-*</code>) reabre o
        problema.
      </DocNote>

      <DocNote title="Sem gap entre termo e valor">
        O <code>gap</code> do componente fica entre um par e o próximo, nunca
        dentro do par: rótulo sobre valor é o mesmo dado em duas linhas, e quem
        os separa é a entrelinha.
      </DocNote>

      <DocNote title="Figuras tabulares de fábrica">
        <code>.nums</code> sai em todo <code>DescriptionDetails</code>. Dígito em
        lista de detalhe é sempre dado — valor, limite, data, contagem —, e sem
        figuras tabulares uma coluna de números não alinha. Esta página escrevia{" "}
        <code>className=&quot;nums&quot;</code> à mão em três linhas seguidas.
      </DocNote>

      <PropsTable
        title="Props de DescriptionList"
        rows={[
          {
            prop: "layout",
            type: '"stacked" | "inline" | "grid"',
            default: '"stacked"',
            description:
              "Declarado uma vez. Desce para os itens por data-layout.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "O respiro entre pares.",
          },
          {
            prop: "divided",
            type: "boolean",
            default: "false",
            description:
              "Fio entre os pares. Ignorado em grid, onde ele seguiria a ordem do DOM e não a das colunas.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "DescriptionListItem",
            type: 'layout?: "stacked" | "inline" | "grid"',
            default: "herdado",
            description: "Sobrescrita local, para a linha que foge do padrão.",
          },
          {
            prop: "DescriptionTerm",
            type: "ComponentProps<'dt'>",
            description: "O rótulo. Sempre quieto, mesmo na linha do total.",
          },
          {
            prop: "DescriptionDetails",
            type: 'size?: "sm" | "lg"',
            default: '"sm"',
            description:
              "O valor, com .nums. lg é a linha do total — o eixo mora no <dd> porque só ele pesa.",
          },
        ]}
      />
    </>
  )
}
