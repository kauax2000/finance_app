"use client"

import { formatTransactionDayMonthPtBr } from "@/lib/transaction-date"
import { useMemo } from "react"
import { Bar, ComposedChart, Line } from "recharts"
import type { BillInstance } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import {
    ChartContainer,
    ChartGrid,
    ChartReferenceLine,
    ChartTooltip,
    ChartTooltipContent,
    ChartXAxis,
    ChartYAxis,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    StatCard,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"
import { MoneyDisplay } from "@/components/ui/money-display"

const chartCfg = {
    paid: { label: "Valor pago", color: "var(--chart-3)" },
    avg6: { label: "Média móvel", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export function BillHistoryAnalytics({ instances }: { instances: BillInstance[] }) {
    const paidDescending = useMemo(() => {
        return [...instances]
            .filter(
                (i) =>
                    i.status === "paid" &&
                    i.paid_amount != null &&
                    Number.isFinite(Number(i.paid_amount)),
            )
            .sort((a, b) => {
                const ay = (a.due_date ?? "").slice(0, 10)
                const by = (b.due_date ?? "").slice(0, 10)
                return ay.localeCompare(by)
            })
    }, [instances])

    const last12 = useMemo(() => paidDescending.slice(-12), [paidDescending])

    const averages = useMemo(() => {
        const vals = last12.map((x) => Number(x.paid_amount))
        const n = vals.length
        const sum = vals.reduce((a, b) => a + b, 0)
        const mean = n ? sum / n : 0
        const tail = vals.slice(-6)
        const avg6 =
            tail.length === 0
                ? 0
                : tail.reduce((a, b) => a + b, 0) / tail.length
        const mn = vals.length ? Math.min(...vals) : 0
        const mx = vals.length ? Math.max(...vals) : 0
        const cy = String(new Date().getFullYear())
        // O ano inteiro, e não só os 12 últimos: uma conta semanal tem mais de
        // doze pagamentos por ano.
        const yearSum = paidDescending
            .filter((r) => r.due_date.slice(0, 4) === cy)
            .reduce((a, r) => a + Number(r.paid_amount), 0)
        return {
            avgAll: mean,
            avg6,
            mn,
            mx,
            yearSum,
            lastAmt: vals.length ? vals[vals.length - 1] : null,
            n,
        }
    }, [last12, paidDescending])

    const chartData = useMemo(
        () =>
            last12.map((row, idx, arr) => {
                const ymd = row.due_date.slice(0, 10)
                const paid = Number(row.paid_amount)
                const prev = Math.max(idx - 5, 0)
                const window = arr.slice(prev, idx + 1).map((r) => Number(r.paid_amount))
                const m6 =
                    window.length === 0
                        ? paid
                        : window.reduce((a, b) => a + b, 0) / window.length
                return {
                    id: row.id,
                    label: formatTransactionDayMonthPtBr(ymd),
                    paid,
                    avg6: m6,
                }
            }),
        [last12],
    )

    if (paidDescending.length === 0) return null

    return (
        <section className="flex flex-col gap-4" data-slot="bill-history-analytics">
            <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                    Histórico de pagamentos
                </h3>
                <p className="text-xs text-muted-foreground">
                    Últimos {last12.length} pagamentos registrados e média móvel
                    (~6 períodos).
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard tone="default">
                    <StatCardLabel>Último pago</StatCardLabel>
                    <StatCardValue>
                        <MoneyDisplay value={averages.lastAmt ?? 0} />
                    </StatCardValue>
                </StatCard>
                <StatCard tone="info">
                    <StatCardLabel>Média ({averages.n} pag.)</StatCardLabel>
                    <StatCardValue>
                        <MoneyDisplay value={averages.avgAll} />
                    </StatCardValue>
                </StatCard>
                <StatCard tone="default">
                    <StatCardLabel>Mín / máx ({last12.length} últ.)</StatCardLabel>
                    <StatCardValue className="flex flex-wrap gap-x-2 text-xs sm:text-sm">
                        <MoneyDisplay value={averages.mn} />
                        <span className="text-muted-foreground">·</span>
                        <MoneyDisplay value={averages.mx} />
                    </StatCardValue>
                </StatCard>
                <StatCard tone="expense">
                    <StatCardLabel>Pago em {new Date().getFullYear()}</StatCardLabel>
                    <StatCardValue>
                        <MoneyDisplay value={averages.yearSum} />
                    </StatCardValue>
                </StatCard>
            </div>

            <Card padding="sm">
                <ChartContainer
                    config={chartCfg}
                    label="Valor pago nos últimos pagamentos, com a média móvel"
                >
                    <ComposedChart data={chartData} accessibilityLayer>
                        <ChartGrid />
                        <ChartXAxis dataKey="label" />
                        <ChartYAxis />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent format="currency" />}
                        />
                        <ChartReferenceLine y={averages.avg6} tone="average" />
                        <Bar
                            dataKey="paid"
                            fill="var(--color-paid)"
                            radius={[4, 4, 0, 0]}
                        />
                        <Line
                            type="monotone"
                            dataKey="avg6"
                            stroke="var(--color-avg6)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </ComposedChart>
                </ChartContainer>
            </Card>
        </section>
    )
}
