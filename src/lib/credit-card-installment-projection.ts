/**
 * Project remaining compra parcelada charges from `workspace_installment_plans`
 * onto calendar dates, aligned with dashboard `payment-events.ts` logic.
 * Used for credit-card invoice commitment totals and calendar deduplication.
 */

import type { Transaction, WorkspaceInstallmentPlan } from "@/lib/supabase"
import {
    localYmdFromDate,
    parseYmdLocal,
    transactionCalendarParts,
} from "@/lib/transaction-date"

export type ProjectedInstallmentCharge = {
    planId: string
    chargeDate: Date
    amount: number
    /** 1-based parcel index (matches `transactions.installment_sequence` when posted). */
    installmentSequence: number
}

function addMonths(d: Date, n: number): Date {
    const y = d.getFullYear()
    const m0 = d.getMonth()
    const day = d.getDate()
    const t = new Date(y, m0 + n, 1, 12, 0, 0, 0)
    const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
    t.setDate(Math.min(day, dim))
    return t
}

function compareCalendarDatesOnly(a: Date, b: Date): number {
    const Ay = a.getFullYear()
    const By = b.getFullYear()
    if (Ay !== By) return Ay - By
    const Am = a.getMonth()
    const Bm = b.getMonth()
    if (Am !== Bm) return Am - Bm
    return a.getDate() - b.getDate()
}

function isDateInInclusiveRange(d: Date, start: Date, end: Date): boolean {
    return (
        compareCalendarDatesOnly(d, start) >= 0 &&
        compareCalendarDatesOnly(d, end) <= 0
    )
}

function transactionLocalYmd(iso: string): string | null {
    const p = transactionCalendarParts(iso)
    if (!p) return null
    return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
}

/**
 * Remaining charges for one plan (same stepping as `payment-events` / billing RPC).
 */
export function expandRemainingInstallmentCharges(
    plan: WorkspaceInstallmentPlan
): ProjectedInstallmentCharge[] {
    if (!plan.is_active) return []
    const remaining = plan.total_installments - plan.generated_count
    if (remaining <= 0) return []

    const start = parseYmdLocal(plan.next_billing_date.slice(0, 10))
    if (!start) return []

    const out: ProjectedInstallmentCharge[] = []
    let cur = new Date(start.getTime())
    for (let i = 0; i < remaining; i++) {
        const installmentSequence = plan.generated_count + i + 1
        const amt =
            remaining - i === 1
                ? Number(plan.final_installment_amount)
                : Number(plan.installment_amount)
        out.push({
            planId: plan.id,
            chargeDate: new Date(cur.getTime()),
            amount: amt,
            installmentSequence,
        })
        cur = addMonths(cur, 1)
    }
    return out
}

/**
 * Full charge schedule for one plan (seq 1..total_installments).
 *
 * Anchor reconstruction:
 * - DB stores `next_billing_date` for the NEXT ungenerated charge and `generated_count` already posted/generated.
 * - To allow backfill (missed/removed posted rows), rebuild the full schedule by stepping backwards
 *   `generated_count` months from `next_billing_date` to get the expected date for seq=1.
 */
export function expandAllPlanCharges(
    plan: WorkspaceInstallmentPlan
): ProjectedInstallmentCharge[] {
    if (!plan.is_active) return []
    const total = plan.total_installments
    if (!Number.isFinite(total) || total <= 0) return []

    const next = parseYmdLocal(plan.next_billing_date.slice(0, 10))
    if (!next) return []

    // Expected charge date for sequence 1.
    const firstCharge = addMonths(next, -Number(plan.generated_count) || 0)
    const out: ProjectedInstallmentCharge[] = []
    for (let seq = 1; seq <= total; seq++) {
        const chargeDate = addMonths(firstCharge, seq - 1)
        const amount =
            seq === total
                ? Number(plan.final_installment_amount)
                : Number(plan.installment_amount)
        out.push({
            planId: plan.id,
            chargeDate,
            amount,
            installmentSequence: seq,
        })
    }
    return out
}

export function filterCreditCardPlansForCard(
    plans: WorkspaceInstallmentPlan[],
    cardId: string
): WorkspaceInstallmentPlan[] {
    return plans.filter(
        (p) =>
            p.is_active &&
            p.payment_method === "credit_card" &&
            p.payment_credit_card_id === cardId
    )
}

export type InstallmentDedupeTx = Pick<
    Transaction,
    | "type"
    | "date"
    | "payment_method"
    | "payment_credit_card_id"
    | "installment_plan_id"
    | "installment_sequence"
>

/**
 * Keys for charges already represented by posted transactions (do not double-count in projections).
 */
/**
 * All posted installment-tied expenses (any payment method) — for calendar deduplication.
 */
export function buildGlobalInstallmentDedupeKeys(
    transactions: InstallmentDedupeTx[]
): { bySequence: Set<string>; byPlanDate: Set<string> } {
    const bySequence = new Set<string>()
    const byPlanDate = new Set<string>()
    for (const t of transactions) {
        if (t.type !== "expense") continue
        const pid = t.installment_plan_id
        if (!pid) continue
        const ymd = transactionLocalYmd(t.date)
        if (ymd) byPlanDate.add(`${pid}:${ymd}`)
        if (t.installment_sequence != null && t.installment_sequence >= 1) {
            bySequence.add(`${pid}:${t.installment_sequence}`)
        }
    }
    return { bySequence, byPlanDate }
}

export function buildPostedInstallmentDedupeKeys(
    cardId: string,
    transactions: InstallmentDedupeTx[]
): { bySequence: Set<string>; byPlanDate: Set<string> } {
    const bySequence = new Set<string>()
    const byPlanDate = new Set<string>()
    for (const t of transactions) {
        if (t.type !== "expense") continue
        if (t.payment_method !== "credit_card") continue
        if (t.payment_credit_card_id !== cardId) continue
        const pid = t.installment_plan_id
        if (!pid) continue
        const ymd = transactionLocalYmd(t.date)
        if (ymd) byPlanDate.add(`${pid}:${ymd}`)
        if (t.installment_sequence != null && t.installment_sequence >= 1) {
            bySequence.add(`${pid}:${t.installment_sequence}`)
        }
    }
    return { bySequence, byPlanDate }
}

export function isProjectedChargeAlreadyPosted(
    charge: ProjectedInstallmentCharge,
    dedupe: { bySequence: Set<string>; byPlanDate: Set<string> }
): boolean {
    const ymd = localYmdFromDate(charge.chargeDate)
    if (dedupe.bySequence.has(`${charge.planId}:${charge.installmentSequence}`)) {
        return true
    }
    if (dedupe.byPlanDate.has(`${charge.planId}:${ymd}`)) {
        return true
    }
    return false
}

export function forecastCreditCardInstallmentsForWindow(
    cardId: string,
    windowStart: Date,
    windowEnd: Date,
    plans: WorkspaceInstallmentPlan[],
    transactions: InstallmentDedupeTx[]
): { projectedTotal: number; projectedRows: ProjectedInstallmentCharge[] } {
    const dedupe = buildPostedInstallmentDedupeKeys(cardId, transactions)
    const inferredPlanIdsForCard = new Set<string>()
    for (const t of transactions) {
        if (t.type !== "expense") continue
        if (t.payment_method !== "credit_card") continue
        if (t.payment_credit_card_id !== cardId) continue
        if (!t.installment_plan_id) continue
        inferredPlanIdsForCard.add(t.installment_plan_id)
    }

    const ccPlans = plans.filter((p) => {
        if (!p.is_active) return false
        if (p.payment_method !== "credit_card") return false
        if (p.payment_credit_card_id === cardId) return true
        // Back-compat: older rows may have null card id; infer from posted txs on this card.
        if (p.payment_credit_card_id == null && inferredPlanIdsForCard.has(p.id)) {
            return true
        }
        return false
    })
    const projectedRows: ProjectedInstallmentCharge[] = []
    let projectedTotal = 0

    for (const plan of ccPlans) {
        for (const charge of expandAllPlanCharges(plan)) {
            if (!isDateInInclusiveRange(charge.chargeDate, windowStart, windowEnd)) {
                continue
            }
            if (isProjectedChargeAlreadyPosted(charge, dedupe)) continue
            projectedRows.push(charge)
            projectedTotal += charge.amount
        }
    }

    projectedRows.sort((a, b) => {
        const da = localYmdFromDate(a.chargeDate)
        const db = localYmdFromDate(b.chargeDate)
        const d = da.localeCompare(db)
        if (d !== 0) return d
        return a.installmentSequence - b.installmentSequence
    })
    return { projectedTotal, projectedRows }
}

/**
 * Sum of projected parcela amounts for this card whose charge calendar date falls in [windowStart, windowEnd],
 * excluding charges already covered by posted transactions.
 */
export function sumProjectedCreditCardInstallmentsInWindow(
    cardId: string,
    windowStart: Date,
    windowEnd: Date,
    plans: WorkspaceInstallmentPlan[],
    transactions: InstallmentDedupeTx[]
): number {
    return forecastCreditCardInstallmentsForWindow(
        cardId,
        windowStart,
        windowEnd,
        plans,
        transactions
    ).projectedTotal
}
