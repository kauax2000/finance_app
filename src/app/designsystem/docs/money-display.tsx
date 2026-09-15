"use client"

import { MoneyDisplay } from "@/components/ui/money-display"
import { currencyBRL, percentBR, signedCurrencyBRL } from "@/lib/formatters"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const EXEMPLOS = [
  ["currencyBRL(1234.5)", currencyBRL(1234.5), "o padrão: todo valor exibido"],
  ["currencyBRL(1234.5, { compact: true })", currencyBRL(1234.5, { compact: true }), "eixo de gráfico, cartão estreito"],
  ["signedCurrencyBRL(1234.5)", signedCurrencyBRL(1234.5), "coluna onde entrada e saída convivem"],
  ["signedCurrencyBRL(-89.9)", signedCurrencyBRL(-89.9), "o sinal vem do número"],
  ["percentBR(0.8842)", percentBR(0.8842), "orçamento consumido, variação"],
]

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

      <Group
        title="Quando o valor precisa ser string"
        description="Em src/lib/formatters.ts, e o MoneyDisplay usa currencyBRL por dentro. As funções servem para onde um componente não cabe: rótulo de eixo, texto de notificação, aria-label, exportação."
      >
        <Spec title="Saídas" meta="lib/formatters.ts">
          <Stack className="gap-3">
            {EXEMPLOS.map(([chamada, saida, uso]) => (
              <div key={chamada} className="flex flex-col">
                <code className="font-mono text-2xs text-muted-foreground">
                  {chamada}
                </code>
                <span className="nums text-sm font-medium text-foreground">
                  {saida}
                </span>
                <span className="text-xs text-muted-foreground">{uso}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Qual usar">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">MoneyDisplay</strong> —
              quando o valor aparece na tela. Ele já resolve cor, tamanho e
              alinhamento.
            </p>
            <p>
              <strong className="text-foreground">currencyBRL</strong> — quando
              o resultado precisa ser uma string: eixo de gráfico, texto de
              push, <code>aria-label</code>, exportação.
            </p>
            <p>
              <strong className="text-foreground">&lt;Input money&gt;</strong> —
              quando o app <em>recebe</em> o valor. Com rótulo e erro ligados,{" "}
              <strong className="text-foreground">&lt;FormInput money&gt;</strong>.
            </p>
          </Stack>
        </Spec>
      </Group>

      <Group title="A regra do sinal e da cor" layout="grid">
        <Spec title="Numa lista mista">
          <Stack className="gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Salário</span>
              <MoneyDisplay value={8432.15} signed tone="income" mono />
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Mercado</span>
              <MoneyDisplay value={-128.4} signed tone="expense" mono />
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Streaming</span>
              <MoneyDisplay value={-39.9} signed tone="expense" mono />
            </div>
          </Stack>
        </Spec>

        <Spec title="Numa lista de um tipo só">
          <Stack className="gap-1">
            <p className="mb-1 text-2xs text-muted-foreground uppercase">
              Despesas de março
            </p>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Mercado</span>
              <MoneyDisplay value={128.4} mono />
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Streaming</span>
              <MoneyDisplay value={39.9} mono />
            </div>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Sinal e cor juntos são redundantes, e tudo bem">
        Quando entrada e saída convivem na mesma lista, o sinal e a cor dizem a
        mesma coisa de duas formas. Isso é proposital: cerca de 8% dos homens não
        distingue verde de vermelho, e para eles a cor sozinha não carrega nada.
      </DocNote>

      <DocNote title="Numa lista de um tipo só, o sinal atrapalha">
        Numa tela chamada &ldquo;Despesas&rdquo;, um menos na frente de cada
        valor não acrescenta informação e ainda dá a impressão de desconto.
        Sinal só onde há mistura.
      </DocNote>

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
          { prop: "size", type: '"sm" | "md" | "lg" | "xl" | "2xl"', default: '"md"', description: "O tamanho do texto." },
          { prop: "signed", type: "boolean", default: "false", description: "Mostra o + no positivo." },
          { prop: "compact", type: "boolean", default: "false", description: "1,2 mil em vez de 1.234,50." },
          { prop: "mono", type: "boolean", default: "xl e 2xl", description: "Força ou desliga a Geist Mono. A figura tabular fica ligada sempre." },
        ]}
      />
    </>
  )
}
