"use client"

import { useMemo } from "react"
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ReferenceLine,
    XAxis,
    YAxis,
} from "recharts"
import type { BillInstance } from "@/lib/supabase"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    StatCard,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"
import { MoneyDisplay } from "@/components/ui/money-display"

const chartCfg = {
    paid: { label: "Pago", color: "var(--chart-3)" },
    avg: { label: "Média", color: "var(--muted-foreground)" },
} satisfies import("@/components/ui/chart").ChartConfig

function parseYmdToLabel(ymd: string): string {
    const [, mo, da] = ymd.split("-")
    return `${da}/${mo}`
}

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
        const yearSum = last12
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
    }, [last12])

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
                    label: parseYmdToLabel(ymd),
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
                <StatCard tone="neutral">
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
                <StatCard tone="warning">
                    <StatCardLabel>Mín / máx ({last12.length} últ.)</StatCardLabel>
                    <StatCardValue className="flex flex-wrap gap-x-2 text-xs sm:text-sm">
                        <MoneyDisplay value={averages.mn} />
                        <span className="text-muted-foreground">·</span>
                        <MoneyDisplay value={averages.mx} />
                    </StatCardValue>
                </StatCard>
                <StatCard tone="expense">
                    <StatCardLabel>Total pago este ano · {last12.length}</StatCardLabel>
                    <StatCardValue>
                        <MoneyDisplay value={averages.yearSum} />
                    </StatCardValue>
                </StatCard>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-2 sm:p-3">
                <ChartContainer config={chartCfg} className="aspect-[16/10] md:aspect-video">
                    <ComposedChart
                        accessibilityLayer={false}
                        data={chartData}
                        margin={{ left: -8, right: 8 }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            width={52}
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) =>
                                Intl.NumberFormat("pt-BR", {
                                    notation: "compact",
                                    maximumFractionDigits: 1,
                                }).format(Number(v))
                            }
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <ReferenceLine
                            y={averages.avg6}
                            stroke="var(--border)"
                            strokeDasharray="4 4"
                        />
                        <Bar
                            dataKey="paid"
                            fill="var(--color-paid)"
                            radius={[4, 4, 0, 0]}
                            name="Valor pago"
                        />
                        <Line
                            type="monotone"
                            dataKey="avg6"
                            stroke="var(--color-avg)"
                            strokeWidth={2}
                            dot={false}
                            name="Média móvel"
                        />
                    </ComposedChart>
                </ChartContainer>
            </div>
        </section>
    )
}
