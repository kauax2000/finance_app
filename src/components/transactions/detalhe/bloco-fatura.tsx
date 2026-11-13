"use client"

import { useMemo } from "react"
import { CreditCardIcon } from "@heroicons/react/20/solid"
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
  BlocoContexto,
  BlocoContextoEsqueleto,
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

  return (
    <BlocoContexto
      // O selo sobe ao título (H5): a direita do corpo fica livre e o estado lê junto do nome da fatura.
      titulo={
        <span className="inline-flex items-center gap-2">
          {rotulo}
          {estado ? (
            <Badge tone={estado.tone} size="xs">
              {estado.label}
            </Badge>
          ) : null}
        </span>
      }
      link={{ href: creditCardDetailPath(cartao.id), label: "ver fatura" }}
    >
      <div className="flex items-center gap-3">
        {/* O ícone de cartão no ladrilho neutro (cor do tema, não da pessoa: `bg-muted`, não `ColorTile`). */}
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-row bg-muted text-muted-foreground">
          <CreditCardIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <MoneyDisplay value={total} size="lg" />
          {/* O valor da compra já está no topo do detalhe: aqui só as datas da fatura. */}
          <Caption>
            {[
              estado?.dueYmd ? `vence ${diaMesCurto(estado.dueYmd)}` : null,
              estado?.slot === "open" ? `fecha ${diaMesCurto(ate)}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Caption>
        </div>
      </div>
    </BlocoContexto>
  )
}
