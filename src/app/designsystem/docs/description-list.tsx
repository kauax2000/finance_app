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
          Pares rótulo/valor numa tela de detalhe. É um <code>&lt;dl&gt;</code> de verdade, então o leitor de tela associa cada valor ao rótulo. Para linhas com mídia e ações é <code>Item</code>; para várias colunas comparáveis, <code>Table</code>.
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
        description="Rótulo à esquerda e valor à direita a partir de sm; abaixo disso, empilha. O layout se declara uma vez, na lista."
        code={`<DescriptionList layout="inline">
  <DescriptionListItem>
    <DescriptionTerm>Limite total</DescriptionTerm>
    <DescriptionDetails>
      <MoneyDisplay value={8000} />
    </DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList layout="inline" className="w-full max-w-sm">
          {[
            ["Limite total", 8000],
            ["Limite usado", 1482.3],
            ["Disponível", 6517.7],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>
                <MoneyDisplay value={value as number} />
              </DescriptionDetails>
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Extrato"
        description="divided põe o fio entre os pares, como numa fatura. A linha do total usa size='lg' no valor — o total pesa, o rótulo não."
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
            ["Compras do período", 1284.6],
            ["Parcelamentos", 197.7],
            ["Encargos", 0],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>
                <MoneyDisplay value={value as number} />
              </DescriptionDetails>
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
        description="Duas colunas a partir de sm, para detalhes com muitos campos."
        code={`<DescriptionList layout="grid">…</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList layout="grid" className="w-full max-w-md">
          {[
            ["Bandeira", "Mastercard"],
            ["Final", "4821"],
            ["Fechamento", "28 de março"],
            ["Vencimento", "5 de abril"],
            ["Limite total", 8000],
            ["Disponível", 6517.7],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>
                {typeof value === "number" ? <MoneyDisplay value={value} /> : value}
              </DescriptionDetails>
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </DocSection>

      <DocNote title="O layout se declara uma vez">
          <code>&lt;DescriptionList layout=&quot;inline&quot;&gt;</code> desce para os itens por <code>data-layout</code>. O prop no item é só a sobrescrita para a linha que foge do padrão.
      </DocNote>

      <DocNote title="Não dê ao item uma base que colida com o layout">
          <code>in-*</code> compila com <code>:where()</code> e perde para uma classe base no mesmo elemento. Funciona porque a base do item é só <code>min-w-0</code>; um <code>flex-col</code> ou <code>text-*</code> fixo quebraria a herança.
      </DocNote>

      <DocNote title="Sem gap entre termo e valor">
        O <code>gap</code> do componente fica entre um par e o próximo, nunca
        dentro do par: rótulo sobre valor é o mesmo dado em duas linhas, e quem
        os separa é a entrelinha.
      </DocNote>

      <DocNote title="Figuras tabulares de fábrica">
          <code>.nums</code> sai em todo <code>DescriptionDetails</code>: dígito em lista de detalhe é dado, e sem figuras tabulares a coluna não alinha. Não escreva <code>className=&quot;nums&quot;</code> à mão.
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
              "Fio entre os pares; ignorado em grid.",
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
              "O valor, com .nums; lg é a linha do total.",
          },
        ]}
      />
    </>
  )
}
