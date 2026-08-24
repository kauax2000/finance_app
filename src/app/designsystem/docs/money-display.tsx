"use client"

import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function MoneyDisplayDoc() {
  return (
    <>
      <Usage>
        <strong>Todo</strong> valor em reais que o app mostra. Nunca escreva{" "}
        <code>Intl.NumberFormat</code> nem <code>toLocaleString</code>{" "}
        numa tela:
        cada chamada solta é livre para divergir em casas decimais, símbolo e
        separador, e nenhuma delas aparece quando se procura por &ldquo;como
        formatamos dinheiro&rdquo;.
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
        description="tabular troca para Geist Mono. O tabular-nums já vem por padrão; a mono só é necessária quando os valores empilham e o alinhamento do símbolo também importa."
        code={`<MoneyDisplay value={1111.11} tabular />
<MoneyDisplay value={88.8} tabular />`}
        previewClassName="flex-col items-end gap-1"
      >
        <MoneyDisplay value={1111.11} tabular />
        <MoneyDisplay value={88.8} tabular />
        <MoneyDisplay value={9999.99} tabular />
      </DocSection>

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
          { prop: "tabular", type: "boolean", default: "false", description: "Troca para Geist Mono." },
        ]}
      />
    </>
  )
}
