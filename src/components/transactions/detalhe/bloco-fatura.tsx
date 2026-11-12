"use client"

import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { creditCardInvoiceBadgeForRow } from "@/components/transactions/transactions-table"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Caption, Muted } from "@/components/ui/typography"
import { creditCardDetailPath } from "@/config/navigation"
import {
  invoiceWindowForPurchaseDate,
  sumCreditCardExpensesInWindow,
  sumCreditCardRefundsInWindow,
} from "@/lib/credit-card-billing"
import { diaMesCurto, fatiaDoLancamento, mesPorExtenso, rotuloDoPesoNaFatura, tituloDaFatura } from "@/lib/detalhe/blocos"
import { chavesDeFaturasPagas } from "@/lib/fatura/total-com-banco"
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
import {
  BarraNaCor,
  BlocoContexto,
  BlocoContextoEsqueleto,
  PontoNaCor,
  useFatiaDaManchete,
  type AoMudarManchete,
} from "./bloco-contexto"

/** A fatura em que a compra caiu: o mesmo cálculo de Cartões (despesas − estornos na janela). */
export function BlocoFatura({ transaction: t, onManchete }: { transaction: Transaction; onManchete?: AoMudarManchete }) {
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

  const pronta = Boolean(papel && cartao && janela && linhas.data && aux.data)
  const rows = linhas.data
  const total =
    cartao && janela && rows
      ? roundCents(
          sumCreditCardExpensesInWindow(rows, cartao.id, janela.start, janela.end) -
            sumCreditCardRefundsInWindow(rows, cartao.id, janela.start, janela.end),
        )
      : 0
  // A consulta já é a janela da fatura: basta o cartão.
  const compras =
    cartao && rows
      ? rows.filter((r) => r.type === "expense" && r.payment_method === "credit_card" && r.payment_credit_card_id === cartao.id).length
      : 0
  const estado = cartao ? creditCardInvoiceBadgeForRow({ ...t, payment_card: cartao }, pagas) : null
  const rotulo = tituloDaFatura(estado?.dueYmd ?? null, ate)

  // Sem cartão (ou erro), manda o vazio: a fatia velha sai da manchete.
  useFatiaDaManchete(
    onManchete,
    !montar || cartoes.isError || linhas.isError || aux.isError || (cartoes.data && !cartao)
      ? { fatura: null }
      : pronta
        ? { fatura: { rotulo: rotulo.charAt(0).toLowerCase() + rotulo.slice(1), total, valor: Number(t.amount), compras } }
        : null,
  )

  if (!montar || cartoes.isError || linhas.isError || aux.isError) return null
  if (!papel || !cartao || !janela || !rows || !aux.data) {
    // Sem o cartão na carteira, não há fatura a mostrar.
    if (cartoes.data && !cartao) return null
    return <BlocoContextoEsqueleto />
  }

  const cor = t.category?.color
  const mesDaFatura = mesPorExtenso(ate.slice(0, 7))

  return (
    <BlocoContexto
      titulo={rotulo}
      link={{ href: creditCardDetailPath(cartao.id), label: "ver fatura" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <MoneyDisplay value={total} size="lg" />
          {estado?.dueYmd ? <Muted>vence {diaMesCurto(estado.dueYmd)}</Muted> : null}
        </div>
        {estado ? <Badge tone={estado.tone}>{estado.label}</Badge> : null}
      </div>
      {/* Sem total, o máximo seria 0 (o Radix recusa) e não há fatia para mostrar. */}
      {total > 0 ? (
        <BarraNaCor cor={cor}>
          <Progress
            value={total}
            max={total}
            highlight={fatiaDoLancamento(total, Number(t.amount))}
            aria-label={`Esta compra na fatura de ${mesDaFatura}`}
          />
        </BarraNaCor>
      ) : null}
      <Caption>
        <PontoNaCor cor={cor} /> {rotuloDoPesoNaFatura(Number(t.amount), total)} · {cartao.name} · fecha{" "}
        {diaMesCurto(ate)}
      </Caption>
    </BlocoContexto>
  )
}
