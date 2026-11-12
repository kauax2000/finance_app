import { addMonths, format, parseISO } from "date-fns"

import type { InstallmentScheduleRow } from "@/lib/installment-schedule-rows"
import type { TransactionInstallmentPlanRef } from "@/lib/supabase"
import { transactionLocalYmd } from "@/lib/transaction-date"

export type EstadoDoPlano = "ativo" | "quitado" | "encerrado"

export function estadoDoPlano(
  p: Pick<TransactionInstallmentPlanRef, "is_active" | "generated_count" | "total_installments">
): EstadoDoPlano {
  if (p.is_active) return "ativo"
  return p.generated_count >= p.total_installments ? "quitado" : "encerrado"
}

export type LinhaDoPlano = {
  slot: number
  transactionId: string | null
  data: string | null
  valor: number
  estado: "lancada" | "prevista" | "nao-sera-lancada"
}

export function linhasDoPlano(
  p: Pick<TransactionInstallmentPlanRef, "is_active" | "generated_count" | "total_installments"> & {
    next_billing_date: string | null
  },
  rows: InstallmentScheduleRow[]
): LinhaDoPlano[] {
  const pendentes = rows.filter((r) => r.status === "pending").map((r) => r.slot)
  const primeiroPendente = pendentes.length ? Math.min(...pendentes) : 0
  return rows.map((r) => {
    const base = { slot: r.slot, transactionId: r.transactionId, valor: r.parcelAmount }
    if (r.status === "posted") {
      return { ...base, data: r.date ? transactionLocalYmd(r.date) : null, estado: "lancada" as const }
    }
    if (!p.is_active) return { ...base, data: null, estado: "nao-sera-lancada" as const }
    const data = p.next_billing_date
      ? format(addMonths(parseISO(p.next_billing_date), r.slot - primeiroPendente), "yyyy-MM-dd")
      : null
    return { ...base, data, estado: "prevista" as const }
  })
}

export function fimDoPlano(linhas: LinhaDoPlano[]): string | null {
  const ultima = [...linhas].reverse().find((l) => l.estado !== "nao-sera-lancada")
  return ultima?.data ?? null
}

/**
 * A casa deste lançamento no plano: pela linha que é ele (`transactionId`),
 * senão pelo k do "k/N" da descrição. A folha e o bloco do detalhe a acendem.
 */
export function slotDoLancamento(
  rows: { slot: number; transactionId: string | null }[] | null | undefined,
  transactionId: string,
  kn: { k: number } | null
): number | null {
  return rows?.find((r) => r.transactionId === transactionId)?.slot ?? kn?.k ?? null
}
