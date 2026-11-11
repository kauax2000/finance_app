"use client"

import { useWorkspace } from "@/components/workspace-provider"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { formatYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { hrefDaLista, mesPorExtenso, rotuloVerOs } from "@/lib/detalhe/blocos"
import { ehEstornoNoCartao } from "@/lib/expense-month-attribution"
import { currencyBRL } from "@/lib/formatters"
import { roundCents } from "@/lib/money-brl"
import { useSubscriptionsQuery } from "@/lib/queries/use-subscriptions"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import { expandSubscriptionChargesInYmdRange } from "@/lib/subscription-billing-projection"
import type { Transaction } from "@/lib/supabase"
import { filterRangeEndIso, filterRangeStartIso, transactionLocalYmd } from "@/lib/transaction-date"
import { BlocoContexto, BlocoContextoEsqueleto } from "./bloco-contexto"

/** O que entrou no mês da receita e, no mês corrente, o que as receitas recorrentes prometem. */
export function BlocoReceitas({ transaction: t }: { transaction: Transaction }) {
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

  if (!ligado || mes.isError) return null
  if (!mes.data || (mesCorrente && assinaturas.isPending)) return <BlocoContextoEsqueleto />

  // O estorno no cartão é receita no banco, mas abate a fatura: não entra aqui.
  const receitas = mes.data.filter((x) => x.type === "income" && !ehEstornoNoCartao(x))
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
      <MoneyDisplay value={total} size="lg" tone="income" />
      {esperado > 0 ? <Caption>de {currencyBRL(esperado)} esperados</Caption> : null}
    </BlocoContexto>
  )
}
