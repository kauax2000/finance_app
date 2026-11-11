"use client"

import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { creditCardInvoiceBadgeForRow } from "@/components/transactions/transactions-table"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { creditCardDetailPath } from "@/config/navigation"
import {
  invoiceWindowForPurchaseDate,
  sumCreditCardExpensesInWindow,
  sumCreditCardRefundsInWindow,
} from "@/lib/credit-card-billing"
import { diaMesCurto, tituloDaFatura } from "@/lib/detalhe/blocos"
import { chavesDeFaturasPagas } from "@/lib/fatura/total-com-banco"
import { currencyBRL } from "@/lib/formatters"
import { roundCents } from "@/lib/money-brl"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"
import type { Transaction } from "@/lib/supabase"
import {
  filterRangeEndIso,
  filterRangeStartIso,
  localYmdFromDate,
  parseYmdLocal,
  transactionLocalYmd,
} from "@/lib/transaction-date"
import { BlocoContexto, BlocoContextoEsqueleto } from "./bloco-contexto"

/** A fatura em que a compra caiu: o mesmo cálculo de Cartões (despesas − estornos na janela). */
export function BlocoFatura({ transaction: t }: { transaction: Transaction }) {
  const { currentWorkspaceId, papel } = useWorkspace()
  const cardId = t.type === "expense" && t.payment_method === "credit_card" ? t.payment_credit_card_id ?? null : null
  const convidado = papel === "guest"
  const montar = Boolean(cardId) && !convidado

  const cartoes = useCreditCardsQuery(montar && !t.payment_card ? currentWorkspaceId : null)
  const cartao = t.payment_card ?? cartoes.data?.find((c) => c.id === cardId) ?? null
  const compra = parseYmdLocal(transactionLocalYmd(t.date) ?? "")
  const janela = cartao && compra ? invoiceWindowForPurchaseDate(compra, cartao.closing_day) : null
  const de = janela ? localYmdFromDate(janela.start) : ""
  const ate = janela ? localYmdFromDate(janela.end) : ""

  const linhas = useTransactionsRangeQuery(
    currentWorkspaceId,
    { from: de ? filterRangeStartIso(de) : "", to: ate ? filterRangeEndIso(ate) : "" },
    { enabled: montar && Boolean(janela) },
  )
  const aux = useTransactionsWorkspaceAuxQuery(currentWorkspaceId, montar)
  const pagas = useMemo(() => chavesDeFaturasPagas(aux.data?.invoicePayments ?? []), [aux.data?.invoicePayments])

  if (!montar || cartoes.isError || linhas.isError || aux.isError) return null
  if (!papel || !cartao || !janela || !linhas.data || !aux.data) {
    // Sem o cartão na carteira, não há fatura a mostrar.
    if (cartoes.data && !cartao) return null
    return <BlocoContextoEsqueleto />
  }

  const rows = linhas.data
  const total = roundCents(
    sumCreditCardExpensesInWindow(rows, cartao.id, janela.start, janela.end) -
      sumCreditCardRefundsInWindow(rows, cartao.id, janela.start, janela.end),
  )
  const emParcelas = sumCreditCardExpensesInWindow(
    rows.filter((r) => r.installment_plan_id),
    cartao.id,
    janela.start,
    janela.end,
  )
  const estado = creditCardInvoiceBadgeForRow({ ...t, payment_card: cartao }, pagas)

  return (
    <BlocoContexto
      titulo={tituloDaFatura(estado?.dueYmd ?? null, ate)}
      link={{ href: creditCardDetailPath(cartao.id), label: "ver fatura" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MoneyDisplay value={total} size="lg" />
        {estado ? <Badge tone={estado.tone}>{estado.label}</Badge> : null}
      </div>
      <Caption>
        {[
          cartao.name,
          estado?.slot === "open" ? `fecha ${diaMesCurto(ate)}` : null,
          emParcelas > 0 ? `${currencyBRL(emParcelas)} em parcelas` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Caption>
    </BlocoContexto>
  )
}
