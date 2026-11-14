"use client"

import { useWorkspace } from "@/components/workspace-provider"
import { DescriptionDetails, DescriptionList, DescriptionListItem, DescriptionTerm } from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { hrefDaLista, mesPorExtenso } from "@/lib/detalhe/blocos"
import { aggregateIncomeExpenseForMonth, buildCreditCardClosingLookup } from "@/lib/expense-month-attribution"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import type { Transaction } from "@/lib/supabase"
import { filterRangeEndIso, filterRangeStartIso, transactionLocalYmd } from "@/lib/transaction-date"
import { BlocoContexto, BlocoContextoEsqueleto } from "./bloco-contexto"

/** Entrou, saiu e sobra no mês da receita, com as contas do Painel. */
export function BlocoSaldoDoMes({ transaction: t }: { transaction: Transaction }) {
  const { currentWorkspaceId } = useWorkspace()
  const ym = (transactionLocalYmd(t.date) ?? "").slice(0, 7)
  const ligado = t.type === "income" && t.payment_method !== "credit_card" && Boolean(ym)
  const { period_start, period_end } = ym ? periodBoundsFromYearMonth(ym) : { period_start: "", period_end: "" }

  // A janela do Painel: um mês de cada lado, porque a compra no cartão cai no mês da fatura.
  const janela = ym
    ? {
        from: filterRangeStartIso(periodBoundsFromYearMonth(shiftYearMonth(ym, -1)).period_start),
        to: filterRangeEndIso(periodBoundsFromYearMonth(shiftYearMonth(ym, 1)).period_end),
      }
    : { from: "", to: "" }
  const linhas = useTransactionsRangeQuery(currentWorkspaceId, janela, { enabled: ligado })
  const cartoes = useCreditCardsQuery(ligado ? currentWorkspaceId : null)

  const saldo =
    linhas.data && cartoes.data
      ? aggregateIncomeExpenseForMonth(linhas.data, ym, buildCreditCardClosingLookup(cartoes.data))
      : null

  if (!ligado || linhas.isError || cartoes.isError) return null
  if (!saldo) return <BlocoContextoEsqueleto />

  const colunas = [
    ["entrou", saldo.income, "income"],
    ["saiu", saldo.expense, "expense"],
    ["sobra", saldo.net, saldo.net < 0 ? "expense" : "default"],
  ] as const

  return (
    <BlocoContexto
      titulo={"Saldo de " + mesPorExtenso(ym)}
      link={{ href: hrefDaLista([{ field: "periodo", operator: "is", values: [period_start, period_end] }]), label: "Ver o mês" }}
    >
      <DescriptionList columns={3} term="eyebrow" size="sm">
        {colunas.map(([termo, valor, tom]) => (
          <DescriptionListItem key={termo}>
            <DescriptionTerm>{termo}</DescriptionTerm>
            <DescriptionDetails size="lg">
              <MoneyDisplay value={valor} size="lg" tone={tom} />
            </DescriptionDetails>
          </DescriptionListItem>
        ))}
      </DescriptionList>
    </BlocoContexto>
  )
}
