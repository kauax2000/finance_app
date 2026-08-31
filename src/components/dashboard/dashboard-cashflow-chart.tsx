"use client"

import { useMemo } from "react"
import { WalletIcon } from "@heroicons/react/24/outline"
import {
    ResponsiveContainer,
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
    Line,
    ReferenceLine,
} from "recharts"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CashflowBucketRow } from "@/components/dashboard/dashboard-cashflow-buckets"

/**
 * `fill` e `stroke` **resolvem** `var()` em todo navegador que o app suporta.
 * O comentário que estava aqui dizia o contrário e fixava quatro hex, e o
 * cursor do `Tooltip` logo abaixo — `color-mix(in oklch, var(--muted) …)` — já
 * provava o contrário no mesmo arquivo. Com hex, o gráfico era a única parte da
 * tela que não acompanhava o tema escuro.
 */
const incomeBar = "var(--chart-income)"
const expenseBar = "var(--chart-expense)"
const lineCumulative = "var(--primary)"
const chartReferenceLineStroke = "var(--border)"

/** O que `hexToRgba` fazia, sem precisar que a cor seja hex. */
function alpha(color: string, pct: number): string {
    return `color-mix(in oklab, ${color} ${pct}%, transparent)`
}

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

type TooltipPayload = {
    dataKey?: string
    name?: string
    value?: number
    color?: string
    payload?: CashflowBucketRow
}

function CashflowTooltip({
    active,
    label,
    payload,
}: {
    active?: boolean
    label?: string
    payload?: TooltipPayload[]
}) {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload as CashflowBucketRow | undefined
    if (!row) return null

    const income = row.income
    const expense = row.expense
    const net = row.net
    const cumulative = row.cumulative

    const rows = [
        { key: "income", label: "Receitas", value: income, color: incomeBar },
        { key: "expense", label: "Despesas", value: expense, color: expenseBar },
        {
            key: "net",
            label: "Resultado do período",
            value: net,
            color: net >= 0 ? incomeBar : expenseBar,
        },
        {
            key: "cumulative",
            label: "Acumulado",
            value: cumulative,
            color: lineCumulative,
        },
    ]

    return (
        <div className="min-w-[12rem] rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="mb-1.5 border-b border-border/60 pb-1 font-medium text-foreground">
                {label ?? row.label}
            </p>
            <ul className="space-y-1.5">
                {rows.map((r) => (
                    <li
                        key={r.key}
                        className="flex items-center justify-between gap-3 tabular-nums"
                    >
                        <span className="flex min-w-0 items-center gap-1.5">
                            <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: r.color }}
                                aria-hidden
                            />
                            <span className="text-muted-foreground">{r.label}</span>
                        </span>
                        <span className="shrink-0 font-medium">
                            {r.key === "net"
                                ? `${net >= 0 ? "+" : ""}${currencyFmt.format(net)}`
                                : currencyFmt.format(r.value)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function LegendStrip() {
    return (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: alpha(incomeBar, 75) }}
                    aria-hidden
                />
                Receitas
            </span>
            <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: alpha(expenseBar, 65) }}
                    aria-hidden
                />
                Despesas
            </span>
            <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <span
                    className="h-0.5 w-4 rounded-full bg-primary"
                    aria-hidden
                />
                Acumulado
            </span>
        </div>
    )
}

export function DashboardCashflowChart({
    data,
}: {
    data: CashflowBucketRow[]
}) {
    const totals = useMemo(() => {
        let income = 0
        let expense = 0
        for (const row of data) {
            income += row.income
            expense += row.expense
        }
        const finalCumulative = data.length ? data[data.length - 1].cumulative : 0
        return { income, expense, net: finalCumulative }
    }, [data])

    const yDomain = useMemo(() => {
        let min = 0
        let max = 0
        for (const row of data) {
            const hi = Math.max(row.income, row.expense, row.cumulative)
            const lo = Math.min(0, row.income, row.expense, row.cumulative)
            max = Math.max(max, hi)
            min = Math.min(min, lo)
        }
        if (min === max) return undefined
        const pad = (max - min) * 0.06 || 1
        return [min - pad, max + pad] as [number, number]
    }, [data])

    const showZeroLine =
        yDomain != null && yDomain[0] < 0 && yDomain[1] > 0

    return (
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                        Fluxo de caixa
                    </p>
                </div>
                {data.length > 0 ? <LegendStrip /> : null}
            </div>

            <Card className="relative gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardToolbar className="py-3">
                    {data.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Resultado
                                </p>
                                <p
                                    className={cn(
                                        "mt-0.5 text-lg font-semibold tabular-nums leading-tight",
                                        totals.net >= 0
                                            ? "text-income"
                                            : "text-expense",
                                    )}
                                >
                                    {currencyFmt.format(totals.net)}
                                </p>
                            </div>
                            <div>
                                <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Receitas
                                </p>
                                <p className="mt-0.5 text-lg font-semibold tabular-nums leading-tight text-income">
                                    {currencyFmt.format(totals.income)}
                                </p>
                            </div>
                            <div>
                                <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Despesas
                                </p>
                                <p className="mt-0.5 text-lg font-semibold tabular-nums leading-tight text-expense">
                                    {currencyFmt.format(totals.expense)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Receitas, despesas e resultado acumulado no período
                            selecionado.
                        </p>
                    )}
                </CardToolbar>

                <CardContent className="relative min-h-[300px] p-4">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart
                                data={data}
                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                barCategoryGap="18%"
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-border/40"
                                />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    className="text-2xs text-muted-foreground"
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    width={48}
                                    tickLine={false}
                                    className="text-2xs text-muted-foreground"
                                    domain={yDomain}
                                    tickFormatter={(v) =>
                                        Number(v).toLocaleString("pt-BR", {
                                            notation: "compact",
                                            maximumFractionDigits: 0,
                                        })
                                    }
                                />
                                {showZeroLine ? (
                                    <ReferenceLine
                                        y={0}
                                        stroke={chartReferenceLineStroke}
                                        strokeDasharray="4 4"
                                    />
                                ) : null}
                                <Tooltip
                                    content={<CashflowTooltip />}
                                    cursor={{
                                        fill: "color-mix(in oklch, var(--muted) 35%, transparent)",
                                    }}
                                />
                                <Bar
                                    dataKey="income"
                                    name="Receitas"
                                    fill={alpha(incomeBar, 55)}
                                    radius={[3, 3, 0, 0]}
                                    activeBar={{
                                        fill: alpha(incomeBar, 75),
                                    }}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Despesas"
                                    fill={alpha(expenseBar, 50)}
                                    radius={[3, 3, 0, 0]}
                                    activeBar={{
                                        fill: alpha(expenseBar, 72),
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cumulative"
                                    name="Acumulado"
                                    stroke={lineCumulative}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] flex-col items-center justify-center gap-2 px-4 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                <WalletIcon
                                    className="h-6 w-6 text-muted-foreground"
                                    aria-hidden
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Nenhuma transação no período
                            </p>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                Quando houver receitas ou despesas, o fluxo
                                aparece aqui.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
