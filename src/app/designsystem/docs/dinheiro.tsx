"use client"

import { currencyBRL, percentBR, signedCurrencyBRL } from "@/lib/formatters"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const EXEMPLOS = [
  ["currencyBRL(1234.5)", currencyBRL(1234.5), "o padrão: todo valor exibido"],
  ["currencyBRL(1234.5, { compact: true })", currencyBRL(1234.5, { compact: true }), "eixo de gráfico, cartão estreito"],
  ["signedCurrencyBRL(1234.5)", signedCurrencyBRL(1234.5), "coluna onde entrada e saída convivem"],
  ["signedCurrencyBRL(-89.9)", signedCurrencyBRL(-89.9), "o sinal vem do número"],
  ["percentBR(0.8842)", percentBR(0.8842), "orçamento consumido, variação"],
]

export default function DinheiroDoc() {
  return (
    <>
      <Usage>
        O padrão mais importante deste design system, porque é o assunto do produto. <strong>Nunca</strong> escreva <code>Intl.NumberFormat</code> numa tela: cada chamada solta diverge, e nenhuma aparece quando alguém procura como o app formata dinheiro.
      </Usage>

      <Group
        title="As funções"
        description="Em src/lib/formatters.ts. Elas devolvem string, e servem para onde um componente não cabe: rótulo de eixo, texto de notificação, conteúdo de aria-label."
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
              <strong className="text-foreground">MoneyDisplay</strong>{" "}
              — quando
              o valor aparece na tela. Ele já usa <code>currencyBRL</code>{" "}
              por
              dentro e ainda resolve cor, tamanho e alinhamento.
            </p>
            <p>
              <strong className="text-foreground">currencyBRL</strong>{" "}
              — quando
              o resultado precisa ser uma string: eixo de gráfico, texto de push,{" "}
              <code>aria-label</code>, exportação.
            </p>
            <p>
              <strong className="text-foreground">MoneyInput</strong>{" "}
              — quando o
              app <em>recebe</em> o valor.
            </p>
          </Stack>
        </Spec>
      </Group>

      <Group title="A regra do sinal e da cor" layout="grid">
        <Spec title="Numa lista mista">
          <Stack className="gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Salário</span>
              <MoneyDisplay value={8432.15} signed tone="income" tabular />
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Mercado</span>
              <MoneyDisplay value={-128.4} signed tone="expense" tabular />
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Streaming</span>
              <MoneyDisplay value={-39.9} signed tone="expense" tabular />
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
              <MoneyDisplay value={128.4} tabular />
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Streaming</span>
              <MoneyDisplay value={39.9} tabular />
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

      <DocNote title="Sempre tabular-nums">
        <code>MoneyDisplay</code>{" "}
        já traz. Sem ele, uma coluna de valores dança a
        cada dígito que muda e o olho perde a linha que estava seguindo.{" "}
        <code>tabular</code>{" "}
        vai além e troca para Geist Mono, quando o
        alinhamento do símbolo também importa.
      </DocNote>
    </>
  )
}
