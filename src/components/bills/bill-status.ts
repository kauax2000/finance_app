import { tagChipDanger, tagChipNeutral, tagChipSuccess, tagChipWarning } from "@/components/ui/badge"
import type { BillInstance } from "@/lib/supabase"
import { daysBetweenYmd } from "@/lib/transaction-date"

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

/**
 * A distância até o vencimento: "vence hoje", "em 3 dias", "há 2 dias". A
 * forma `compact` ("hoje", "em 3d", "há 2d") é a do histórico, onde a linha é
 * curta. As duas estavam escritas uma em cada arquivo.
 */
export function billDaysDeltaLabel(
    dueYmd: string,
    todayYmd: string,
    { compact = false }: { compact?: boolean } = {}
): string {
    const days = daysBetweenYmd(todayYmd, dueYmd) ?? 0
    if (days === 0) return compact ? "hoje" : "vence hoje"
    const a = Math.abs(days)
    const n = compact ? `${a}d` : `${a} dia${a === 1 ? "" : "s"}`
    return days > 0 ? `em ${n}` : `há ${n}`
}
