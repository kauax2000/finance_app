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
        Um número que importa, com a variação que o contextualiza. O tom vem do{" "}
        <strong>tipo do dado</strong>: despesa é sempre <code>expense</code>,
        mesmo quando caiu.
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
        description="md é o cartão de painel; sm é o de dentro de uma folha, onde quatro deles dividem a largura. O size governa o corpo do número, o recuo e a folga da variação juntos."
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
        description="Um cartão de número é a coisa que espera dado. E quando ele abre a lista filtrada, é interactive + asChild — os dois herdados do Card."
        code={`<StatCard>
  <StatCardLabel>Total pago</StatCardLabel>
  <StatCardValueSkeleton />
</StatCard>

<StatCard interactive asChild>
  <a href="/transacoes?categoria=mercado">…</a>
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
        Em finanças <strong>subir não é boa notícia por si só</strong>: despesa
        caindo é bom, entrada caindo é ruim. Um componente que pintasse de verde
        tudo que sobe mentiria em metade dos cartões deste app. Por isso{" "}
        <code>direction</code> só desenha a seta, e <code>tone</code> continua
        sendo escolha de quem chama — repare acima: as duas primeiras variações
        são <code>income</code>, e uma delas aponta para baixo.
      </DocNote>

      <DocNote title="A variação precisa dizer em relação a quê">
        &ldquo;+12%&rdquo; sozinho não é informação: comparado com o mês passado?
        com a média? com a meta? O <code>StatCardDelta</code> carrega a frase
        inteira porque a porcentagem sem referência é a forma mais comum de um
        painel mentir sem querer.
      </DocNote>

      <DocNote title="Rótulo e valor não levam gap">
        Eram <code>gap-2</code> — <strong>8px medidos</strong> entre &ldquo;Total
        pago 90d&rdquo; e o número. É o par de identidade que o design system
        nomeia com estas palavras (&ldquo;rótulo sobre valor&rdquo;), e o
        invariante diz &ldquo;nem <code>gap-1</code>&rdquo;. O respiro voltou a
        existir só <strong>entre o par e a variação</strong>, que é outra coisa —
        e quem o declara é o contêiner, não a variação.
      </DocNote>

      <DocNote title="Uma figura só">
        <code>StatCardValue</code> reimplementava <code>MoneyDisplay
        size=&quot;2xl&quot;</code> à mão e divergia num ponto:{" "}
        <strong>letter-spacing −0,6px contra normal</strong>, medidos. A face
        mono está certa — é decisão registrada do <code>MoneyDisplay</code> para
        figura-herói —, mas duas definições da mesma figura não podem diferir por
        um <code>tracking-tight</code>. Hoje as duas produzem o mesmo resultado
        computado, e o corpo sai de <code>--stat-card-value</code>.
      </DocNote>

      <DocNote title="Ele compõe o Card">
        A superfície era montada à mão: <code>rounded-xl border border-border/80
        bg-card p-4 shadow-xs ring-1 ring-foreground/5</code>. Cada pedaço é um
        eixo que o <code>Card</code> já governa — e o <code>border-border/80</code>{" "}
        era um quarto peso de borda no app. O que fica sendo do{" "}
        <code>StatCard</code> é o <strong>tom de dinheiro</strong>, que é
        justamente o que o <code>Card</code> não tem.
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
            description:
              "Do Card: elevação, par de toque e anel de foco; asChild torna o cartão o próprio link.",
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
