import type { TransactionInstallmentPlanRef } from "@/lib/supabase"

/** Total purchase value implied by the plan row (BRL). */
export function totalPurchaseFromPlan(plan: {
    total_installments: number
    installment_amount: number
    final_installment_amount: number
}): number {
    const n = plan.total_installments
    if (n < 2) return Number(plan.final_installment_amount)
    return (
        Number(plan.installment_amount) * (n - 1) +
        Number(plan.final_installment_amount)
    )
}

/** Matches suffix like " (3/12)" from billing SQL. */
export function parseInstallmentFromDescription(
    desc: string | null | undefined
): { k: number; n: number } | null {
    if (!desc) return null
    const m = desc.trim().match(/\((\d+)\/(\d+)\)\s*$/)
    if (!m) return null
    const k = Number.parseInt(m[1], 10)
    const n = Number.parseInt(m[2], 10)
    if (!Number.isFinite(k) || !Number.isFinite(n) || k < 1 || n < 1) {
        return null
    }
    return { k, n }
}

export function resolveInstallmentKn(
    sequence: number | null | undefined,
    description: string | null | undefined,
    plan: TransactionInstallmentPlanRef | null | undefined
): { k: number; n: number } | null {
    const nPlan = plan?.total_installments
    if (
        nPlan != null &&
        nPlan >= 1 &&
        sequence != null &&
        Number.isFinite(sequence) &&
        sequence >= 1
    ) {
        return { k: sequence, n: nPlan }
    }
    const parsed = parseInstallmentFromDescription(description)
    if (parsed && nPlan != null && nPlan >= 1) {
        return { k: parsed.k, n: nPlan }
    }
    return parsed
}
