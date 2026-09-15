import { tagChipDanger, tagChipNeutral, tagChipSuccess, tagChipWarning } from "@/components/ui/badge"
import type { BillInstance } from "@/lib/supabase"

/**
 * O status de uma parcela de conta. Estava escrito em quatro arquivos de
 * `components/bills`, com o mesmo corte (atrasada, hoje, pendente).
 */

export type BillStatusPill = { label: string; className: string }

/** Parcela ainda em aberto, pela data de vencimento. */
export function billDuePill(dueYmd: string, todayYmd: string): BillStatusPill {
    if (dueYmd < todayYmd) return { label: "Atrasada", className: tagChipDanger }
    if (dueYmd === todayYmd) return { label: "Hoje", className: tagChipWarning }
    return { label: "Pendente", className: tagChipNeutral }
}

/** Qualquer parcela: paga e ignorada antes, e a data só decide as em aberto. */
export function billInstancePill(
    inst: Pick<BillInstance, "status" | "due_date">,
    todayYmd: string
): BillStatusPill {
    if (inst.status === "paid") return { label: "Paga", className: tagChipSuccess }
    if (inst.status === "skipped") return { label: "Ignorada", className: tagChipNeutral }
    return billDuePill(inst.due_date.slice(0, 10), todayYmd)
}
