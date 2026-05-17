/**
 * Pure analytics for a single credit card invoice windows (open vs last closed).
 * Uses the same calendar windows as {@link buildCardCycleSnapshot}.
 */

import type { CcTxAnalyticsRow } from "@/lib/credit-cards-workspace-transactions"
import type { CardCycleSnapshot } from "@/lib/credit-card-billing"
import {
    compareCalendarDates,
    localNoonDate,
    shouldCountCreditCardExpenseForInvoiceSum,
} from "@/lib/credit-card-billing"
import { localYmdFromDate, parseYmdLocal, transactionCalendarParts } from "@/lib/transaction-date"
import { parseInstallmentFromDescription } from "@/lib/transaction-installment"
import type { WorkspaceInstallmentPlan } from "@/lib/supabase"
import {
    forecastCreditCardInstallmentsForWindow,
    type InstallmentDedupeTx,
} from "@/lib/credit-card-installment-projection"

export const DEFAULT_LARGE_EXPENSE_THRESHOLD_BRL = 500

/** Days before closing used for “fechamento” heuristic. */
export const CLOSING_WINDOW_DAYS = 5

/** Category share above this in open invoice + growth triggers savings hint. */
const SAVINGS_SHARE_MIN = 0.12
const SAVINGS_GROWTH_MIN = 0.18

export type InvoiceSliceKey = "installments_recurring" | "one_off"

export function isInstallmentsRecurringSlice(tx: CcTxAnalyticsRow): boolean {
    if (tx.subscription_id) return true
    if (tx.installment_plan_id) return true
    if (tx.installment_sequence != null && tx.installment_sequence >= 1) {
        return parseInstallmentFromDescription(tx.description) != null
    }
    return false
}

function sliceKeyFor(tx: CcTxAnalyticsRow): InvoiceSliceKey {
    return isInstallmentsRecurringSlice(tx) ? "installments_recurring" : "one_off"
}

function transactionLocalNoon(isoOrString: string): Date | null {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return null
    return localNoonDate(p.y, p.mo - 1, p.d)
}

function isExpenseInWindow(
    tx: CcTxAnalyticsRow,
    cardId: string,
    start: Date,
    end: Date,
    allRows: CcTxAnalyticsRow[]
): boolean {
    if (tx.type !== "expense") return false
    if (tx.payment_method !== "credit_card") return false
    if (tx.payment_credit_card_id !== cardId) return false
    if (!shouldCountCreditCardExpenseForInvoiceSum(tx, cardId, allRows)) {
        return false
    }
    const td = transactionLocalNoon(tx.date)
    if (!td) return false
    return (
        compareCalendarDates(td, start) >= 0 && compareCalendarDates(td, end) <= 0
    )
}

export function filterCardExpensesInWindow(
    rows: CcTxAnalyticsRow[],
    cardId: string,
    start: Date,
    end: Date
): CcTxAnalyticsRow[] {
    return rows.filter((t) => isExpenseInWindow(t, cardId, start, end, rows))
}

function categoryEmbedByIdFromRows(
    rows: CcTxAnalyticsRow[]
): Map<string, NonNullable<CcTxAnalyticsRow["category"]>> {
    const map = new Map<string, NonNullable<CcTxAnalyticsRow["category"]>>()
    for (const r of rows) {
        if (!r.category_id) continue
        const c = r.category
        if (c && !map.has(r.category_id)) {
            map.set(r.category_id, c)
        }
    }
    return map
}

export function buildVirtualProjectedRowsForWindow(
    plans: WorkspaceInstallmentPlan[],
    cardId: string,
    start: Date,
    end: Date,
    allRows: CcTxAnalyticsRow[]
): CcTxAnalyticsRow[] {
    const catById = categoryEmbedByIdFromRows(allRows)
    const { projectedRows } = forecastCreditCardInstallmentsForWindow(
        cardId,
        start,
        end,
        plans,
        allRows as unknown as InstallmentDedupeTx[]
    )

    return projectedRows.map((c) => {
        const plan = plans.find((p) => p.id === c.planId) ?? null
        const ymd = localYmdFromDate(c.chargeDate)
        const iso = `${ymd}T12:00:00.000Z`
        const category_id = plan?.category_id ?? null
        const category = category_id ? catById.get(category_id) ?? null : null
        return {
            id: `__projected:${c.planId}:${c.installmentSequence}:${ymd}`,
            type: "expense",
            amount: c.amount,
            date: iso,
            description: plan?.description ?? null,
            payment_method: "credit_card",
            payment_credit_card_id: cardId,
            installment_sequence: c.installmentSequence,
            category_id,
            subscription_id: null,
            installment_plan_id: c.planId,
            category,
        }
    })
}

export type SliceTotals = Record<InvoiceSliceKey, number>

export function sumByInvoiceSlice(rows: CcTxAnalyticsRow[]): SliceTotals {
    const out: SliceTotals = { installments_recurring: 0, one_off: 0 }
    for (const tx of rows) {
        if (tx.type !== "expense") continue
        out[sliceKeyFor(tx)] += Number(tx.amount)
    }
    return out
}

export type CategoryAggregate = {
    categoryId: string | null
    name: string
    color: string | null
    icon: string | null
    total: number
}

function categoryMetaFromTx(tx: CcTxAnalyticsRow): {
    categoryId: string | null
    name: string
    color: string | null
    icon: string | null
} {
    const c = tx.category
    return {
        categoryId: tx.category_id,
        name: c?.name?.trim() || "Sem categoria",
        color: c?.color ?? null,
        icon: c?.icon ?? null,
    }
}

export function aggregateByCategory(rows: CcTxAnalyticsRow[]): CategoryAggregate[] {
    const map = new Map<string, CategoryAggregate>()
    for (const tx of rows) {
        if (tx.type !== "expense") continue
        const mapKey = tx.category_id ?? "__none__"
        const meta = categoryMetaFromTx(tx)
        const cur = map.get(mapKey)
        const amt = Number(tx.amount)
        if (!cur) {
            map.set(mapKey, {
                categoryId: tx.category_id,
                name: meta.name,
                color: meta.color,
                icon: meta.icon,
                total: amt,
            })
        } else {
            cur.total += amt
        }
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
}

export type CategoryComparisonRow = CategoryAggregate & {
    shareOpenPct: number
    shareLastClosedPct: number
    deltaVsPriorPct: number | null
}

/** Aligns categories across open vs last-closed cycles for MoM-style comparison. */
export function buildCategoryComparisonRows(
    open: CategoryAggregate[],
    lastClosed: CategoryAggregate[],
    openTotal: number,
    lastClosedTotal: number
): CategoryComparisonRow[] {
    const prevById = new Map<string | null, number>()
    for (const c of lastClosed) {
        prevById.set(c.categoryId, c.total)
    }
    return open.map((c) => {
        const prev = c.categoryId != null ? (prevById.get(c.categoryId) ?? 0) : (prevById.get(null) ?? 0)
        const shareOpenPct = openTotal > 0 ? (c.total / openTotal) * 100 : 0
        const shareLastClosedPct =
            lastClosedTotal > 0 ? (prev / lastClosedTotal) * 100 : 0
        const deltaVsPriorPct =
            prev > 0 ? ((c.total - prev) / prev) * 100 : c.total > 0 ? null : 0
        return {
            ...c,
            shareOpenPct,
            shareLastClosedPct,
            deltaVsPriorPct,
        }
    })
}

export function median(values: number[]): number | null {
    if (values.length === 0) return null
    const s = [...values].sort((a, b) => a - b)
    const mid = Math.floor(s.length / 2)
    if (s.length % 2 === 1) return s[mid]
    return (s[mid - 1]! + s[mid]!) / 2
}

export function mean(values: number[]): number | null {
    if (values.length === 0) return null
    let sum = 0
    for (const v of values) sum += v
    return sum / values.length
}

export type WeekdayWeekendSplit = {
    weekdayTotal: number
    weekendTotal: number
    weekdayPct: number
    weekendPct: number
}

/** Weekend = Saturday and Sunday (local). */
export function splitWeekdayWeekend(rows: CcTxAnalyticsRow[]): WeekdayWeekendSplit {
    let weekdayTotal = 0
    let weekendTotal = 0
    for (const tx of rows) {
        if (tx.type !== "expense") continue
        const p = transactionCalendarParts(tx.date)
        if (!p) continue
        const d = new Date(p.y, p.mo - 1, p.d)
        const dow = d.getDay()
        const isWeekend = dow === 0 || dow === 6
        const amt = Number(tx.amount)
        if (isWeekend) weekendTotal += amt
        else weekdayTotal += amt
    }
    const total = weekdayTotal + weekendTotal
    const weekdayPct = total > 0 ? (weekdayTotal / total) * 100 : 0
    const weekendPct = total > 0 ? (weekendTotal / total) * 100 : 0
    return { weekdayTotal, weekendTotal, weekdayPct, weekendPct }
}

/** 1-based week index from cycle start (7-day chunks). */
export function weekIndexInCycle(txDateIso: string, cycleStart: Date): number | null {
    const p = transactionCalendarParts(txDateIso)
    if (!p) return null
    const d = localNoonDate(p.y, p.mo - 1, p.d)
    const diffMs = d.getTime() - cycleStart.getTime()
    const dayDiff = Math.floor(diffMs / 86_400_000)
    if (dayDiff < 0) return null
    return Math.floor(dayDiff / 7) + 1
}

export type WeeklyPatternResult = {
    /** 1-based week index with highest spend */
    strongestWeek: number | null
    totalsByWeek: Map<number, number>
}

export function weeklySpendPattern(
    rows: CcTxAnalyticsRow[],
    cycleStart: Date
): WeeklyPatternResult {
    const totalsByWeek = new Map<number, number>()
    for (const tx of rows) {
        if (tx.type !== "expense") continue
        const w = weekIndexInCycle(tx.date, cycleStart)
        if (w == null) continue
        totalsByWeek.set(w, (totalsByWeek.get(w) ?? 0) + Number(tx.amount))
    }
    let strongestWeek: number | null = null
    let best = -1
    for (const [w, t] of totalsByWeek) {
        if (t > best) {
            best = t
            strongestWeek = w
        }
    }
    return { strongestWeek, totalsByWeek }
}

export type ClosingDiagnosis = "lighter_near_close" | "heavier_near_close" | "neutral"

export function diagnoseClosingWindow(
    rows: CcTxAnalyticsRow[],
    openStart: Date,
    nextClose: Date,
    daysBeforeClose: number = CLOSING_WINDOW_DAYS
): ClosingDiagnosis {
    const closeMs = nextClose.getTime()
    const tailStartMs = closeMs - daysBeforeClose * 86_400_000
    const tailStart = new Date(tailStartMs)

    let tail = 0
    let head = 0
    for (const tx of rows) {
        if (tx.type !== "expense") continue
        const td = transactionLocalNoon(tx.date)
        if (!td) continue
        if (compareCalendarDates(td, openStart) < 0) continue
        if (compareCalendarDates(td, nextClose) > 0) continue
        const amt = Number(tx.amount)
        if (compareCalendarDates(td, tailStart) >= 0) tail += amt
        else head += amt
    }
    const headW = Math.max(1, daysBeforeClose)
    const cycleLenDays = Math.max(
        1,
        Math.round((nextClose.getTime() - openStart.getTime()) / 86_400_000)
    )
    const headPart = cycleLenDays - daysBeforeClose
    const headNorm = headPart > 0 ? head / headPart : head
    const tailNorm = tail / headW
    if (tailNorm < headNorm * 0.85) return "lighter_near_close"
    if (tailNorm > headNorm * 1.15) return "heavier_near_close"
    return "neutral"
}

export type SpendingProfileLabel =
    | "few_large"
    | "many_small"
    | "balanced"
    | "empty"

export function classifySpendingProfile(
    expenseAmounts: number[]
): SpendingProfileLabel {
    if (expenseAmounts.length === 0) return "empty"
    const med = median(expenseAmounts)
    const mx = Math.max(...expenseAmounts)
    if (med != null && expenseAmounts.length >= 8 && med < 80) return "many_small"
    if (med != null && mx > med * 3 && expenseAmounts.length <= 12) return "few_large"
    return "balanced"
}

export function largeExpensesOverThreshold(
    rows: CcTxAnalyticsRow[],
    thresholdBrl: number
): { count: number; total: number } {
    let count = 0
    let total = 0
    for (const tx of rows) {
        if (tx.type !== "expense") continue
        const a = Number(tx.amount)
        if (a >= thresholdBrl) {
            count += 1
            total += a
        }
    }
    return { count, total }
}

export type SavingsOpportunity = {
    categoryName: string
    message: string
}

export function savingsOpportunitiesFromCategories(
    openRows: CcTxAnalyticsRow[],
    lastClosedRows: CcTxAnalyticsRow[],
    openTotal: number,
    lastClosedTotal: number
): SavingsOpportunity[] {
    if (openTotal <= 0) return []
    const openAgg = aggregateByCategory(openRows)
    const lastMap = new Map<string | null, number>()
    for (const c of aggregateByCategory(lastClosedRows)) {
        lastMap.set(c.categoryId, c.total)
    }
    const out: SavingsOpportunity[] = []
    for (const c of openAgg) {
        const share = c.total / openTotal
        if (share < SAVINGS_SHARE_MIN) continue
        const prev = c.categoryId != null ? (lastMap.get(c.categoryId) ?? 0) : 0
        const prevShare = lastClosedTotal > 0 ? prev / lastClosedTotal : 0
        if (prevShare < 0.05) continue
        const growth = prev > 0 ? (c.total - prev) / prev : 1
        if (growth < SAVINGS_GROWTH_MIN) continue
        out.push({
            categoryName: c.name,
            message: `${c.name} concentra ${(share * 100).toFixed(0)}% da fatura e subiu em relação à fatura anterior — vale revisar.`,
        })
    }
    return out.slice(0, 3)
}

export type InstallmentEndingSoon = {
    planId: string
    label: string
    remainingCount: number
    totalInstallments: number
    monthlyAmount: number
    nextBilling: string
}

export function findInstallmentPlansEndingSoon(
    plans: WorkspaceInstallmentPlan[],
    opts?: { maxRemaining?: number; withinDays?: number }
): InstallmentEndingSoon[] {
    const maxRemaining = opts?.maxRemaining ?? 2
    const withinDays = opts?.withinDays ?? 50
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const horizon = today.getTime() + withinDays * 86_400_000

    const out: InstallmentEndingSoon[] = []
    for (const p of plans) {
        if (!p.is_active) continue
        const remaining = p.total_installments - p.generated_count
        if (remaining <= 0) continue
        const nb = parseYmdToDate(p.next_billing_date)
        const soonByDate = nb != null && nb.getTime() <= horizon
        if (remaining > maxRemaining && !soonByDate) continue
        const monthlyAmount =
            remaining === 1 ? Number(p.final_installment_amount) : Number(p.installment_amount)
        out.push({
            planId: p.id,
            label: p.description?.trim() || "Compra parcelada",
            remainingCount: remaining,
            totalInstallments: p.total_installments,
            monthlyAmount,
            nextBilling: p.next_billing_date,
        })
    }
    return out
}

/**
 * Month key YYYY-MM -> BRL “liberados” quando parcelamentos encerram (última parcela naquele mês).
 */
export function projectBudgetReleaseByMonth(
    plans: WorkspaceInstallmentPlan[],
    monthsAhead: number = 6
): { monthKey: string; amount: number }[] {
    const byMonth = new Map<string, number>()
    const today = new Date()
    const startY = today.getFullYear()
    const startM0 = today.getMonth()

    for (const p of plans) {
        if (!p.is_active) continue
        const remaining = p.total_installments - p.generated_count
        if (remaining <= 0) continue
        const charge = parseYmdToDate(p.next_billing_date)
        if (!charge) continue
        let lastCharge = charge
        for (let i = 1; i < remaining; i++) {
            lastCharge = addMonths(lastCharge, 1)
        }
        const y = lastCharge.getFullYear()
        const m0 = lastCharge.getMonth()
        const monthsFromNow = (y - startY) * 12 + (m0 - startM0)
        if (monthsFromNow < 0 || monthsFromNow >= monthsAhead) continue
        const key = `${y}-${String(m0 + 1).padStart(2, "0")}`
        const freed =
            remaining === 1 ? Number(p.final_installment_amount) : Number(p.installment_amount)
        byMonth.set(key, (byMonth.get(key) ?? 0) + freed)
    }

    return [...byMonth.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, amount]) => ({ monthKey, amount }))
}

function parseYmdToDate(ymd: string): Date | null {
    const d = parseYmdLocal(ymd)
    if (!d) return null
    return localNoonDate(d.getFullYear(), d.getMonth(), d.getDate())
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

export type InstallmentPlanRowAnalytics = {
    plan: WorkspaceInstallmentPlan
    paid: number
    total: number
    remaining: number
    pctDone: number
    /** Estimated last charge date */
    endDate: Date | null
    monthlyCharge: number
}

export function analyzeInstallmentPlans(
    plans: WorkspaceInstallmentPlan[]
): InstallmentPlanRowAnalytics[] {
    const rows: InstallmentPlanRowAnalytics[] = []
    for (const p of plans) {
        if (!p.is_active) continue
        const total = p.total_installments
        const paid = p.generated_count
        const remaining = total - paid
        if (remaining <= 0) continue
        const pctDone = total > 0 ? (paid / total) * 100 : 0
        const endDate = estimatePlanEndDate(p)
        const monthlyCharge =
            remaining === 1 ? Number(p.final_installment_amount) : Number(p.installment_amount)
        rows.push({
            plan: p,
            paid,
            total,
            remaining,
            pctDone,
            endDate,
            monthlyCharge,
        })
    }
    return rows.sort((a, b) => {
        const ae = a.endDate?.getTime() ?? 0
        const be = b.endDate?.getTime() ?? 0
        return ae - be
    })
}

function estimatePlanEndDate(plan: WorkspaceInstallmentPlan): Date | null {
    const remaining = plan.total_installments - plan.generated_count
    if (remaining <= 0) return null
    let d = parseYmdToDate(plan.next_billing_date)
    if (!d) return null
    for (let i = 1; i < remaining; i++) {
        d = addMonths(d, 1)
    }
    return d
}

export type CreditCardInvoiceAnalytics = {
    openRows: CcTxAnalyticsRow[]
    lastClosedRows: CcTxAnalyticsRow[]
    openTotal: number
    lastClosedTotal: number
    sliceOpen: SliceTotals
    sliceLastClosed: SliceTotals
    minimumCommittedOpen: number
    categoryOpen: CategoryAggregate[]
    categoryLastClosed: CategoryAggregate[]
    weekdayWeekend: WeekdayWeekendSplit
    weeklyPattern: WeeklyPatternResult
    closingDiagnosis: ClosingDiagnosis
    spendingProfile: SpendingProfileLabel
    meanTicket: number | null
    medianTicket: number | null
    largeExpenses: { count: number; total: number }
    summaryText: string
    closingCopy: string
    profileCopy: string
    savingsOpportunities: SavingsOpportunity[]
    installmentRows: InstallmentPlanRowAnalytics[]
    endingSoon: InstallmentEndingSoon[]
    budgetReleaseByMonth: { monthKey: string; amount: number }[]
}

const invoiceInsightPctFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
})

export function buildInvoiceSummaryText(
    openTotal: number,
    topCategory: { name: string; total: number } | null
): string {
    if (openTotal <= 0) {
        return "Nenhum gasto registrado na fatura aberta neste período."
    }
    if (!topCategory) {
        return "Veja o detalhe por categoria abaixo."
    }
    const sharePct = (topCategory.total / openTotal) * 100
    const pct = invoiceInsightPctFmt.format(sharePct)
    return `A maior parte dos gastos está em ${topCategory.name} (${pct}% da fatura).`
}

export function buildClosingCopy(diagnosis: ClosingDiagnosis): string {
    switch (diagnosis) {
        case "lighter_near_close":
            return "Houve bom controle perto do fechamento, com menos gastos nos últimos dias do período."
        case "heavier_near_close":
            return "Os gastos se concentraram perto do fechamento; vale revisar compras feitas nos últimos dias da fatura."
        default:
            return "Os gastos ficaram distribuídos ao longo do período da fatura."
    }
}

export function buildProfileCopy(
    profile: SpendingProfileLabel,
    meanTicket: number | null,
    medianTicket: number | null
): string {
    const fmt = (n: number) =>
        n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    switch (profile) {
        case "few_large":
            return `Perfil com poucos gastos altos — ticket mediano ${medianTicket != null ? fmt(medianTicket) : "—"}.`
        case "many_small":
            return `Perfil com muitos gastos pequenos — ticket médio ${meanTicket != null ? fmt(meanTicket) : "—"}.`
        case "empty":
            return "Sem despesas na fatura aberta para perfilar."
        default:
            return `Ticket médio ${meanTicket != null ? fmt(meanTicket) : "—"}, mediano ${medianTicket != null ? fmt(medianTicket) : "—"}.`
    }
}

export function buildCreditCardInvoiceAnalytics(
    snapshot: CardCycleSnapshot,
    cardId: string,
    allRows: CcTxAnalyticsRow[],
    plans: WorkspaceInstallmentPlan[],
    opts?: { largeExpenseThresholdBrl?: number }
): CreditCardInvoiceAnalytics {
    const threshold = opts?.largeExpenseThresholdBrl ?? DEFAULT_LARGE_EXPENSE_THRESHOLD_BRL

    const openRowsPosted = filterCardExpensesInWindow(
        allRows,
        cardId,
        snapshot.openWindow.start,
        snapshot.openWindow.end
    )
    const lastClosedRowsPosted = filterCardExpensesInWindow(
        allRows,
        cardId,
        snapshot.lastClosedWindow.start,
        snapshot.lastClosedWindow.end
    )
    const openProjected = buildVirtualProjectedRowsForWindow(
        plans,
        cardId,
        snapshot.openWindow.start,
        snapshot.openWindow.end,
        allRows
    )
    const lastClosedProjected = buildVirtualProjectedRowsForWindow(
        plans,
        cardId,
        snapshot.lastClosedWindow.start,
        snapshot.lastClosedWindow.end,
        allRows
    )
    const openRows = [...openRowsPosted, ...openProjected]
    const lastClosedRows = [...lastClosedRowsPosted, ...lastClosedProjected]

    let openTotal = 0
    for (const tx of openRows) {
        if (tx.type === "expense") openTotal += Number(tx.amount)
    }
    let lastClosedTotal = 0
    for (const tx of lastClosedRows) {
        if (tx.type === "expense") lastClosedTotal += Number(tx.amount)
    }

    const sliceOpen = sumByInvoiceSlice(openRows)
    const sliceLastClosed = sumByInvoiceSlice(lastClosedRows)

    let minimumCommittedOpen = 0
    for (const tx of openRows) {
        if (tx.type !== "expense") continue
        if (isInstallmentsRecurringSlice(tx)) minimumCommittedOpen += Number(tx.amount)
    }

    const categoryOpen = aggregateByCategory(openRows)
    const categoryLastClosed = aggregateByCategory(lastClosedRows)

    const amounts = openRows
        .filter((t) => t.type === "expense")
        .map((t) => Number(t.amount))
    const spendingProfile = classifySpendingProfile(amounts)
    const meanTicket = mean(amounts)
    const medianTicket = median(amounts)
    const largeExpenses = largeExpensesOverThreshold(openRows, threshold)

    const weekdayWeekend = splitWeekdayWeekend(openRows)
    const weeklyPattern = weeklySpendPattern(openRows, snapshot.openWindow.start)
    const closingDiagnosis = diagnoseClosingWindow(
        openRows,
        snapshot.openWindow.start,
        snapshot.nextClose
    )

    const topAggregate = categoryOpen[0]
    const summaryText = buildInvoiceSummaryText(
        openTotal,
        topAggregate
            ? { name: topAggregate.name, total: topAggregate.total }
            : null
    )

    const savingsOpportunities = savingsOpportunitiesFromCategories(
        openRows,
        lastClosedRows,
        openTotal,
        lastClosedTotal
    )

    const installmentRows = analyzeInstallmentPlans(plans)
    const endingSoon = findInstallmentPlansEndingSoon(plans)
    const budgetReleaseByMonth = projectBudgetReleaseByMonth(plans, 6)

    return {
        openRows,
        lastClosedRows,
        openTotal,
        lastClosedTotal,
        sliceOpen,
        sliceLastClosed,
        minimumCommittedOpen,
        categoryOpen,
        categoryLastClosed,
        weekdayWeekend,
        weeklyPattern,
        closingDiagnosis,
        spendingProfile,
        meanTicket,
        medianTicket,
        largeExpenses,
        summaryText,
        closingCopy: buildClosingCopy(closingDiagnosis),
        profileCopy: buildProfileCopy(spendingProfile, meanTicket, medianTicket),
        savingsOpportunities,
        installmentRows,
        endingSoon,
        budgetReleaseByMonth,
    }
}
