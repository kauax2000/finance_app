import type { Transaction } from "@/lib/supabase"
import {
    localYmdFromDate,
    monthYearKeyFromTransactionDate,
    parseYmdLocal,
    transactionCalendarParts,
} from "@/lib/transaction-date"
import { labelYearMonthPt } from "@/lib/budget-month"

export type CashflowBucketRow = {
    key: string
    label: string
    income: number
    expense: number
    net: number
    cumulative: number
}

function mondayWeekKey(isoOrString: string): string {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return isoOrString.slice(0, 10)
    const d = new Date(p.y, p.mo - 1, p.d)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const mon = new Date(d)
    mon.setDate(d.getDate() + diff)
    return localYmdFromDate(mon)
}

function dayLabel(isoOrString: string): string {
    const p = transactionCalendarParts(isoOrString)
    if (!p) return isoOrString.slice(0, 10)
    return `${String(p.d).padStart(2, "0")}/${String(p.mo).padStart(2, "0")}`
}

function weekLabelFromKey(weekStartYmd: string): string {
    const d = parseYmdLocal(weekStartYmd)
    if (!d) return weekStartYmd
    const end = new Date(d)
    end.setDate(end.getDate() + 6)
    return `${dayLabel(weekStartYmd)}–${String(end.getDate()).padStart(2, "0")}/${String(end.getMonth() + 1).padStart(2, "0")}`
}

/** Adaptive buckets for Recharts: daily / weekly / monthly by inclusive day span. */
export function buildCashflowSeries(
    transactions: Transaction[],
    fromYmd: string,
    toYmd: string
): CashflowBucketRow[] {
    const from = parseYmdLocal(fromYmd)
    const to = parseYmdLocal(toYmd)
    if (!from || !to) return []
    const ms = strip(to).getTime() - strip(from).getTime()
    const days = Math.round(ms / 86_400_000) + 1

    const mode: "day" | "week" | "month" =
        days <= 31 ? "day" : days <= 120 ? "week" : "month"

    type Acc = { income: number; expense: number; sort: string }
    const map = new Map<string, Acc>()

    for (const t of transactions) {
        let key: string
        let sort: string
        if (mode === "day") {
            const p = transactionCalendarParts(t.date)
            if (!p) continue
            key = `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
            sort = key
        } else if (mode === "week") {
            key = mondayWeekKey(t.date)
            sort = key
        } else {
            key = monthYearKeyFromTransactionDate(t.date)
            sort = key
        }
        const cur = map.get(key) ?? { income: 0, expense: 0, sort }
        cur.sort = sort
        const amt = Number(t.amount)
        if (t.type === "income") cur.income += amt
        else cur.expense += amt
        map.set(key, cur)
    }

    const sortedKeys = [...map.keys()].sort((a, b) =>
        (map.get(a)!.sort).localeCompare(map.get(b)!.sort)
    )

    let cumulative = 0
    const rows: CashflowBucketRow[] = []
    for (const key of sortedKeys) {
        const v = map.get(key)!
        const net = v.income - v.expense
        cumulative += net
        let label = key
        if (mode === "day") {
            label = dayLabel(`${key}T12:00:00.000Z`)
        } else if (mode === "week") {
            label = weekLabelFromKey(key)
        } else {
            label = labelYearMonthPt(key)
        }
        rows.push({
            key,
            label,
            income: v.income,
            expense: v.expense,
            net,
            cumulative,
        })
    }
    return rows
}

function strip(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
