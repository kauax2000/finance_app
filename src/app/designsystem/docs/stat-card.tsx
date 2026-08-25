"use client"

import { ArrowDownRightIcon, ArrowUpRightIcon } from "@heroicons/react/16/solid"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  StatCard,
  StatCardDelta,
  StatCardLabel,
  StatCardValue,
} from "@/components/ui/stat-card"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function StatCardDoc() {
  return (
    <>
      <Usage>
        Um número que importa, com a variação que o contextualiza. O tom vem do <strong>tipo do dado</strong>: despesa é sempre <code>expense</code>, mesmo quando caiu.
      </Usage>

      <DocSection
        title="Tons"
        code={`<StatCard tone="income">
  <StatCardLabel>Entradas</StatCardLabel>
  <StatCardValue><MoneyDisplay value={8432.15} /></StatCardValue>
  <StatCardDelta>+12% vs. fevereiro</StatCardDelta>
</StatCard>`}
        previewClassName="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2"
      >
        <StatCard tone="income">
          <StatCardLabel>
            <ArrowUpRightIcon aria-hidden />
            Entradas
          </StatCardLabel>
          <StatCardValue>
            <MoneyDisplay value={8432.15} />
          </StatCardValue>
          <StatCardDelta>+12% em relação a fevereiro</StatCardDelta>
        </StatCard>
        <StatCard tone="expense">
          <StatCardLabel>
            <ArrowDownRightIcon aria-hidden />
            Saídas
          </StatCardLabel>
          <StatCardValue>
            <MoneyDisplay value={6218.4} />
          </StatCardValue>
          <StatCardDelta>−4% em relação a fevereiro</StatCardDelta>
        </StatCard>
        <StatCard tone="warning">
          <StatCardLabel>Orçamentos no limite</StatCardLabel>
          <StatCardValue>3</StatCardValue>
          <StatCardDelta>de 8 categorias</StatCardDelta>
        </StatCard>
        <StatCard>
          <StatCardLabel>Transações</StatCardLabel>
          <StatCardValue>42</StatCardValue>
          <StatCardDelta>neste mês</StatCardDelta>
        </StatCard>
      </DocSection>

      <DocNote title="A variação precisa dizer em relação a quê">
        &ldquo;+12%&rdquo; sozinho não é informação: comparado com o mês
        passado? com a média? com a meta? O <code>StatCardDelta</code>{" "}
        carrega a
        frase inteira porque a porcentagem sem referência é a forma mais comum de
        um painel mentir sem querer.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"neutral" | "income" | "expense" | "warning" | "info"',
            default: '"neutral"',
            description: "O tipo do dado, não o julgamento sobre ele.",
          },
        ]}
      />
    </>
  )
}
