"use client"

import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function MoneyDisplayDoc() {
  return (
    <>
      <Usage>
        <strong>Todo</strong> valor em reais que o app mostra. Nunca escreva <code>Intl.NumberFormat</code> numa tela: cada chamada solta é livre para divergir em casas decimais, símbolo e separador.
      </Usage>

      <DocSection
        title="Tons"
        description="income e expense são a cor do dado. muted é para um valor de referência que não é o assunto da linha."
        code={`<MoneyDisplay value={1234.5} />
<MoneyDisplay value={1234.5} tone="income" />
<MoneyDisplay value={-89.9} tone="expense" />
<MoneyDisplay value={1234.5} tone="muted" />`}
      >
        <MoneyDisplay value={1234.5} />
        <MoneyDisplay value={1234.5} tone="income" />
        <MoneyDisplay value={-89.9} tone="expense" />
        <MoneyDisplay value={1234.5} tone="muted" />
      </DocSection>

      <DocSection
        title="Tamanhos"
        code={`<MoneyDisplay value={1234.5} size="sm" />
<MoneyDisplay value={1234.5} />
<MoneyDisplay value={1234.5} size="lg" />
<MoneyDisplay value={1234.5} size="xl" />
<MoneyDisplay value={1234.5} size="2xl" />`}
        description="A partir de xl as figuras vão para Geist Mono sozinhas: ali o valor é o assunto da tela, não um dado de linha."
        previewClassName="items-baseline"
      >
        <MoneyDisplay value={1234.5} size="sm" />
        <MoneyDisplay value={1234.5} />
        <MoneyDisplay value={1234.5} size="lg" />
        <MoneyDisplay value={1234.5} size="xl" />
        <MoneyDisplay value={1234.5} size="2xl" />
      </DocSection>

      <DocSection
        title="Sinal e forma compacta"
        description="signed força o + no positivo, para uma coluna em que entrada e saída convivem. compact é para eixo de gráfico e cartão estreito, nunca para o valor que a pessoa vai conferir."
        code={`<MoneyDisplay value={1234.5} signed tone="income" />
<MoneyDisplay value={-89.9} signed tone="expense" />
<MoneyDisplay value={1234567} compact />`}
      >
        <MoneyDisplay value={1234.5} signed tone="income" />
        <MoneyDisplay value={-89.9} signed tone="expense" />
        <MoneyDisplay value={1234567} compact />
      </DocSection>

      <DocSection
        title="Coluna alinhada"
        description="mono força a Geist Mono nos tamanhos pequenos, para quando os valores empilham e o alinhamento do símbolo também importa. Ele também desliga a mono num tamanho grande, se a tela pedir a sans. A figura tabular não é opcional: ela está sempre ligada."
        code={`<MoneyDisplay value={1111.11} mono />
<MoneyDisplay value={88.8} mono />`}
        previewClassName="flex-col items-end gap-1"
      >
        <MoneyDisplay value={1111.11} mono />
        <MoneyDisplay value={88.8} mono />
        <MoneyDisplay value={9999.99} mono />
      </DocSection>

      <DocSection
        title="Sem valor, e valor compacto"
        description="null e undefined desenham travessão, não R$ 0,00 — “ainda não carregou” e “o saldo é zero” são respostas diferentes, e num app de finanças a segunda é a que ninguém pode inventar. O compacto carrega o valor cheio no title e no nome acessível, porque R$ 1,23 mi não diz se são 1.234.567 ou 1.230.000."
        code={`<MoneyDisplay value={null} />
<MoneyDisplay value={1234567} compact />`}
      >
        <MoneyDisplay value={null} />
        <MoneyDisplay value={undefined} tone="muted" />
        <MoneyDisplay value={1234567} compact />
        <MoneyDisplay value={1234567} compact size="xl" />
      </DocSection>

      <DocNote title="O menos é o tipográfico, nos dois caminhos">
        O <code>Intl</code> devolve <code>-R$ 89,90</code>{" "}
        com hífen-menos (U+002D), e o caminho de <code>signed</code>{" "}
        sempre usou o menos de verdade (U+2212). Numa coluna que mistura os dois
        — um extrato com filtro de entradas — o traço trocava de largura de
        linha para linha. Hoje os dois passam pelo mesmo glifo.
      </DocNote>

      <DocNote title="A face muda com o tamanho, e é de propósito">
        Do <code>sm</code> ao <code>lg</code>{" "}
        o valor é Inter com <code>tabular-nums</code> — é um dado de linha, e
        precisa pertencer ao texto ao redor. Em <code>xl</code> e{" "}
        <code>2xl</code>{" "}
        ele vira Geist Mono: ali o valor é o herói da tela, e a face de extrato é
        a que ele merece. Mono nas 46 linhas de um extrato viraria textura; num
        saldo, é registro de livro-caixa.
      </DocNote>

      <DocNote title="value aceita null">
        Um valor que ainda não chegou vira <code>0</code> formatado, não{" "}
        <code>NaN</code>{" "}
        nem string vazia. Se a distinção entre &ldquo;zero&rdquo;
        e &ldquo;não sei ainda&rdquo; importa naquela tela, mostre um{" "}
        <code>Skeleton</code> no lugar do componente.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "number | null | undefined", description: "O valor. null vira zero." },
          { prop: "tone", type: '"default" | "income" | "expense" | "muted"', default: '"default"', description: "A cor do valor." },
          { prop: "size", type: '"sm" | "default" | "lg" | "xl" | "2xl"', default: '"default"', description: "O tamanho do texto." },
          { prop: "signed", type: "boolean", default: "false", description: "Mostra o + no positivo." },
          { prop: "compact", type: "boolean", default: "false", description: "1,2 mil em vez de 1.234,50." },
          { prop: "tabular", type: "boolean", default: "xl e 2xl", description: "Força ou desliga a Geist Mono." },
        ]}
      />
    </>
  )
}
