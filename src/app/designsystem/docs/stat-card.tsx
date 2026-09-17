"use client"

import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/16/solid"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  StatCard,
  StatCardDelta,
  StatCardIcon,
  StatCardLabel,
  StatCardValue,
  StatCardValueSkeleton,
} from "@/components/ui/stat-card"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function StatCardDoc() {
  return (
    <>
      <Usage>
        Um número que importa, com a variação que o contextualiza. O tom vem do <strong>tipo do dado</strong>: despesa é sempre <code>expense</code>, mesmo quando caiu. Número dentro de texto corrido é <code>MoneyDisplay</code>.
      </Usage>

      <DocSection
        title="Tons"
        code={`<StatCard tone="income">
  <StatCardLabel>Entradas</StatCardLabel>
  <StatCardValue><MoneyDisplay value={8432.15} size="2xl" /></StatCardValue>
  <StatCardDelta tone="income" direction="up">+12% vs. fevereiro</StatCardDelta>
</StatCard>`}
        previewClassName="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2"
      >
        <StatCard tone="income">
          <StatCardLabel>
            <StatCardIcon>
              <ArrowUpRightIcon />
            </StatCardIcon>
            Entradas
          </StatCardLabel>
          <StatCardValue>
            <MoneyDisplay value={8432.15} size="2xl" />
          </StatCardValue>
          <StatCardDelta tone="income" direction="up">
            12% em relação a fevereiro
          </StatCardDelta>
        </StatCard>
        <StatCard tone="expense">
          <StatCardLabel>
            <StatCardIcon>
              <ArrowDownRightIcon />
            </StatCardIcon>
            Saídas
          </StatCardLabel>
          <StatCardValue>
            <MoneyDisplay value={6218.4} size="2xl" />
          </StatCardValue>
          <StatCardDelta tone="income" direction="down">
            4% em relação a fevereiro
          </StatCardDelta>
        </StatCard>
        <StatCard tone="warning">
          <StatCardLabel>Orçamentos no limite</StatCardLabel>
          <StatCardValue>3</StatCardValue>
          <StatCardDelta tone="warning">de 8 categorias</StatCardDelta>
        </StatCard>
        <StatCard>
          <StatCardLabel>Transações</StatCardLabel>
          <StatCardValue>42</StatCardValue>
          <StatCardDelta>neste mês</StatCardDelta>
        </StatCard>
      </DocSection>

      <DocSection
        title="Escada"
        description="md é o cartão de painel; sm é o de dentro de uma folha, onde quatro dividem a largura. size governa o número, o recuo e a folga da variação juntos."
        code={`<StatCard size="sm">…</StatCard>`}
        previewClassName="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2"
      >
        {(["sm", "md"] as const).map((s) => (
          <StatCard key={s} size={s} tone="info">
            <StatCardLabel>Limite disponível</StatCardLabel>
            <StatCardValue>
              <MoneyDisplay value={6517.7} size={s === "sm" ? "xl" : "2xl"} />
            </StatCardValue>
            <StatCardDelta>size=&ldquo;{s}&rdquo;</StatCardDelta>
          </StatCard>
        ))}
      </DocSection>

      <DocSection
        title="Esperando, e clicável"
        description="Um cartão de número espera dado. Quando ele abre a lista filtrada, é interactive + asChild, herdados do Card."
        code={`<StatCard>
  <StatCardLabel>Total pago</StatCardLabel>
  <StatCardValueSkeleton />
</StatCard>

<StatCard interactive asChild>
  <a href="/transactions?category=mercado">…</a>
</StatCard>`}
        previewClassName="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2"
      >
        <StatCard>
          <StatCardLabel>Total pago 90d</StatCardLabel>
          <StatCardValueSkeleton />
        </StatCard>
        <StatCard interactive asChild>
          <a href="#">
            <StatCardLabel>
              Mercado
              <StatCardIcon className="ms-auto">
                <ChevronRightIcon />
              </StatCardIcon>
            </StatCardLabel>
            <StatCardValue>
              <MoneyDisplay value={1284.6} size="2xl" tone="expense" />
            </StatCardValue>
            <StatCardDelta tone="expense" direction="up">
              18% acima da média
            </StatCardDelta>
          </a>
        </StatCard>
      </DocSection>

      <DocNote title="A direção não decide o tom">
        Em finanças subir não é boa notícia por si só: despesa caindo é bom, entrada caindo é ruim. <code>direction</code> só desenha a seta, e <code>tone</code> é escolha de quem chama — acima, as duas primeiras variações são <code>income</code> e uma aponta para baixo.
      </DocNote>

      <DocNote title="A variação diz em relação a quê">
        &ldquo;+12%&rdquo; sozinho não informa: contra o mês passado, a média ou a meta? O <code>StatCardDelta</code> carrega a frase inteira, porque porcentagem sem referência é a forma mais comum de um painel mentir sem querer.
      </DocNote>

      <DocNote title="Rótulo e valor não levam gap">
        Rótulo sobre valor é par de identidade: quem os separa é a entrelinha. O respiro existe só entre o par e a variação, e quem o declara é o contêiner.
      </DocNote>

      <DocNote title="O valor é o MoneyDisplay">
        Quando o valor é dinheiro, componha um <code>MoneyDisplay</code> dentro de <code>StatCardValue</code> em vez de reescrever a figura: duas definições dela divergem. O corpo sai de <code>--stat-card-value</code>, que o <code>size</code> declara.
      </DocNote>

      <DocNote title="Ele compõe o Card">
        Superfície, borda, recuo e sombra são eixos do <code>Card</code>. O que é do <code>StatCard</code> é o <strong>tom de dinheiro</strong>, que o <code>Card</code> não tem.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"default" | "income" | "expense" | "warning" | "info"',
            default: '"default"',
            description: "O tipo do dado, não o julgamento sobre ele.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "Corpo do número, recuo e a folga da variação.",
          },
          {
            prop: "interactive / asChild",
            type: "boolean",
            default: "false",
            description: "Do Card: elevação, par de toque e anel de foco; asChild torna o cartão o próprio link.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "StatCardLabel",
            type: "ComponentProps<'div'>",
            description: "O rótulo. Aceita um StatCardIcon antes do texto.",
          },
          {
            prop: "StatCardValue",
            type: "ComponentProps<'div'>",
            description:
              "A figura. Quando o valor é dinheiro, componha um MoneyDisplay dentro.",
          },
          {
            prop: "StatCardDelta",
            type: 'tone + direction: "up" | "down" | "none"',
            default: 'tone="default", direction="none"',
            description: "A seta é da direção; a cor é do tipo do dado.",
          },
          {
            prop: "StatCardValueSkeleton",
            type: "ComponentProps<typeof Skeleton>",
            description:
              "A espera na medida do valor — a altura sai de --stat-card-value.",
          },
        ]}
      />
    </>
  )
}
