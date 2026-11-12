"use client"

import type { InstallmentSummary } from "@/components/transactions/installment-purchase-section"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Caption, Muted } from "@/components/ui/typography"
import { ROUTES } from "@/config/navigation"
import { diaMesCurto, ultimaParcela } from "@/lib/detalhe/blocos"
import { currencyBRL } from "@/lib/formatters"
import type { Transaction, TransactionInstallmentPlanRef } from "@/lib/supabase"
import {
  BlocoContexto,
  BlocoContextoEsqueleto,
  useFatiaDaManchete,
  type AoMudarManchete,
} from "./bloco-contexto"

/**
 * A compra parcelada, no lugar do `InstallmentPurchaseSection`: o painel já
 * carrega as parcelas (`useInstallmentSlices`) e resume (`summarizeInstallmentPlan`),
 * e passa o resumo; o bloco não lê nada.
 */
export function BlocoParcelada({
  transaction: t,
  plano,
  resumo,
  kn,
  onManchete,
  onVerParcelas,
}: {
  transaction: Transaction
  plano: TransactionInstallmentPlanRef
  resumo: InstallmentSummary
  kn: { k: number; n: number } | null
  onManchete?: AoMudarManchete
  /** Abre a folha do plano; sem ela (o convidado), o link para a lista filtrada. */
  onVerParcelas?: () => void
}) {
  const linhas = resumo.scheduleRows
  const n = plano.total_installments
  const lancadas = linhas?.filter((l) => l.status === "posted").length ?? 0
  const proxima = linhas?.some((l) => l.status === "pending") && plano.is_active ? plano.next_billing_date : null

  const ultima =
    linhas == null
      ? null
      : ultimaParcela({ ...plano, installment_amount: Number(plano.installment_amount) }, linhas, new Date())
  useFatiaDaManchete(
    onManchete,
    linhas == null ? null : { parcela: ultima && { ...ultima, primeira: kn?.k === 1 && n > 1 ? { n } : null } },
  )

  if (!t.installment_plan_id) return null
  if (resumo.slicesLoading || linhas == null) return <BlocoContextoEsqueleto />

  return (
    <BlocoContexto
      titulo="Compra parcelada"
      link={
        onVerParcelas
          ? { label: "ver parcelas", onClick: onVerParcelas }
          : { href: `${ROUTES.TRANSACTIONS}?plan=${encodeURIComponent(t.installment_plan_id)}`, label: "ver parcelas" }
      }
    >
      <Muted>
        <MoneyDisplay value={resumo.totalPurchase} className="font-medium text-foreground" /> em {n}×
        {resumo.remaining != null && resumo.remaining > 0 ? ` · falta ${currencyBRL(resumo.remaining)}` : ""}
      </Muted>
      <Progress value={lancadas} max={n} segments={n} aria-label={`${lancadas} de ${n} parcelas lançadas`} />
      <Caption>
        {[kn ? `${kn.k} de ${kn.n}` : null, proxima ? `próxima ${diaMesCurto(proxima)}` : null]
          .filter(Boolean)
          .join(" · ")}
      </Caption>
    </BlocoContexto>
  )
}
