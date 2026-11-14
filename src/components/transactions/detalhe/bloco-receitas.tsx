"use client"

import { useWorkspace } from "@/components/workspace-provider"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Caption, Muted } from "@/components/ui/typography"
import { formatYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { hrefDaLista, mesPorExtenso, rotuloVerOs } from "@/lib/detalhe/blocos"
import { legendaDaReceita, maximoDaBarra } from "@/lib/detalhe/receitas"
import { ehEstornoNoCartao } from "@/lib/expense-month-attribution"
import { currencyBRL } from "@/lib/formatters"
import { roundCents } from "@/lib/money-brl"
import { useSubscriptionsQuery } from "@/lib/queries/use-subscriptions"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import { expandSubscriptionChargesInYmdRange } from "@/lib/subscription-billing-projection"
import type { Transaction } from "@/lib/supabase"
import { filterRangeEndIso, filterRangeStartIso, transactionLocalYmd } from "@/lib/transaction-date"
import { BlocoContexto, BlocoContextoEsqueleto, useFatiaDaManchete, type AoMudarManchete } from "./bloco-contexto"

/** O que entrou no mês da receita e, no mês corrente, o que as receitas recorrentes prometem. */
export function BlocoReceitas({ transaction: t, onManchete }: { transaction: Transaction; onManchete?: AoMudarManchete }) {
  const { currentWorkspaceId } = useWorkspace()
  const ym = (transactionLocalYmd(t.date) ?? "").slice(0, 7)
  const ligado = t.type === "income" && Boolean(ym)
  const mesCorrente = ym === formatYearMonth(new Date())
  const { period_start, period_end } = ym ? periodBoundsFromYearMonth(ym) : { period_start: "", period_end: "" }

  const mes = useTransactionsRangeQuery(
    currentWorkspaceId,
    { from: period_start ? filterRangeStartIso(period_start) : "", to: period_end ? filterRangeEndIso(period_end) : "" },
    { enabled: ligado },
  )
  const assinaturas = useSubscriptionsQuery(ligado && mesCorrente ? currentWorkspaceId : null)

  const pendente = !mes.data || (mesCorrente && assinaturas.isPending)

  // O estorno no cartão é receita no banco, mas abate a fatura: não entra aqui.
  const receitas = (mes.data ?? []).filter((x) => x.type === "income" && !ehEstornoNoCartao(x))
  const total = roundCents(receitas.reduce((s, x) => s + (Number(x.amount) || 0), 0))
  const esperado =
    mesCorrente && assinaturas.data
      ? roundCents(
          assinaturas.data
            .filter((s) => s.kind === "income")
            .flatMap((s) => expandSubscriptionChargesInYmdRange(s, period_start, period_end))
            .reduce((s, c) => s + c.amount, 0),
        )
      : 0

  // Só o mês corrente com receita prometida vira manchete; o resto manda o vazio.
  useFatiaDaManchete(
    onManchete,
    !ligado || mes.isError || (!pendente && !(mesCorrente && esperado > 0))
      ? { receitas: null }
      : pendente
        ? null
        : { receitas: { mes: mesPorExtenso(ym), total, esperado } },
  )

  // A fatia desta receita começa onde as anteriores do mês (por data) terminam; fora da lista, do fim.
  const valor = Number(t.amount) || 0
  const ordem = [...receitas].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const i = ordem.findIndex((x) => x.id === t.id)
  const antes = i >= 0 ? roundCents(ordem.slice(0, i).reduce((s, x) => s + (Number(x.amount) || 0), 0)) : total - valor
  const fatia = { from: antes, to: roundCents(antes + valor) }

  if (!ligado || mes.isError) return null
  if (pendente) return <BlocoContextoEsqueleto />

  return (
    <BlocoContexto
      titulo={`Receitas de ${mesPorExtenso(ym)}`}
      link={
        receitas.length
          ? {
              href: hrefDaLista([{ field: "periodo", operator: "is", values: [period_start, period_end] }], "income"),
              label: rotuloVerOs(receitas.length, "receita"),
            }
          : null
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <MoneyDisplay value={total} size="lg" tone="income" />
        {mesCorrente && esperado > 0 ? <Muted>de {currencyBRL(esperado)}</Muted> : null}
      </div>
      {total > 0 ? (
        <div className="[--progress-highlight:var(--color-income)]">
          <Progress
            value={total}
            max={maximoDaBarra(total, esperado)}
            highlight={fatia}
            aria-label={`Receitas de ${mesPorExtenso(ym)}`}
          />
        </div>
      ) : null}
      {total > 0 ? (
        <Caption>
          <span aria-hidden className="inline-block size-2 rounded-full bg-income" /> Esta, {currencyBRL(valor)} ·{" "}
          {legendaDaReceita({ valor, total, esperado, mesCorrente, mes: mesPorExtenso(ym) })}
        </Caption>
      ) : null}
    </BlocoContexto>
  )
}
