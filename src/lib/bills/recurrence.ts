import type { Bill, BillFrequency } from "@/lib/supabase"
import {
    primeiroVencimento,
    proximoVencimento,
    proximoVencimentoDaConta,
} from "../../../supabase/functions/_shared/recorrencia-conta"

export * from "../../../supabase/functions/_shared/recorrencia-conta"

/** First due date ≥ start matching `due_day_of_month` (clamped within month). */
export function computeFirstDueYmd(params: {
    startYmd: string
    dueDayOfMonth: number
}): string {
    return primeiroVencimento(params.startYmd, params.dueDayOfMonth)
}

export function computeNextDueYmd(params: {
    afterDueYmd: string
    frequency: BillFrequency
    dueDayOfMonth: number
}): string | null {
    return proximoVencimento(params.afterDueYmd, params.frequency, params.dueDayOfMonth)
}

/** When creating the next occurrence after paying `paidDueYmd`. */
export function computeNextBillInstanceDueYmd(
    bill: Pick<Bill, "frequency" | "due_day_of_month" | "end_date" | "is_active">,
    paidDueYmd: string
): string | null {
    return proximoVencimentoDaConta(bill, paidDueYmd)
}

export function billStartYmd(bill: Pick<Bill, "start_date">): string {
    return bill.start_date.slice(0, 10)
}
