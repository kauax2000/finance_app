"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import type { Category } from "@/lib/supabase"
import {
    buildDailySeries,
    buildMonthlySeries,
    formatCurrencyBRL,
    hexToRgba,
} from "@/components/categories/detail/category-detail-utils"
import {
    transactionSegmentContainerClassName,
    transactionSegmentTabClassName,
} from "@/components/transactions/transaction-type-segment"
import { cn } from "@/lib/utils"

type SeriesRow = { date: string; amount: number | string; type: string; category_id: string | null }

type CategoryDetailTrendsProps = {
    category: Category
    categoryId: string
    yearMonth: string
    seriesSource: SeriesRow[]
    accentColor: string
}

export function CategoryDetailTrends({
    category,
    categoryId,
    yearMonth,
    seriesSource,
    accentColor,
}: CategoryDetailTrendsProps) {
    const [tab, setTab] = React.useState<"daily" | "monthly">("daily")
    const typeFilter = category.type
    const isExpense = typeFilter === "expense"

    const dailySeries = React.useMemo(
        () => buildDailySeries(yearMonth, seriesSource as never[], categoryId, typeFilter),
        [yearMonth, seriesSource, categoryId, typeFilter],
    )
    const monthlySeries = React.useMemo(
        () => buildMonthlySeries(yearMonth, seriesSource as never[], categoryId, typeFilter, 12),
        [yearMonth, seriesSource, categoryId, typeFilter],
    )

    const dailyTitle = isExpense ? "Despesas por dia" : "Receitas por dia"
    const monthlyTitle = isExpense ? "Despesas por mês" : "Receitas por mês"

    return (
        <section className="min-w-0 space-y-3" aria-labelledby="category-trends-heading">
            <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div className="flex h-8 min-w-0 items-end gap-2">
                    <h3
                        id="category-trends-heading"
                        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                        Tendência
                    </h3>
                </div>
                <div
                    className={cn(
                        transactionSegmentContainerClassName,
                        "w-full max-w-full shrink-0 md:w-auto",
                    )}
                    role="tablist"
                    aria-label="Período do gráfico"
                >
                    <ButtonGroup className="h-full min-h-0 w-full gap-0.5 md:w-auto">
                        <Button
                            type="button"
                            role="tab"
                            aria-selected={tab === "daily"}
                            size="sm"
                            variant="ghost"
                            className={transactionSegmentTabClassName(tab === "daily")}
                            onClick={() => setTab("daily")}
                        >
                            Dia a dia
                        </Button>
                        <Button
                            type="button"
                            role="tab"
                            aria-selected={tab === "monthly"}
                            size="sm"
                            variant="ghost"
                            className={transactionSegmentTabClassName(tab === "monthly")}
                            onClick={() => setTab("monthly")}
                        >
                            12 meses
                        </Button>
                    </ButtonGroup>
                </div>
            </div>
            <Card size="sm">
                <CardContent className="p-3">
                    <p className="mb-2 w-full text-xs font-medium text-muted-foreground md:min-w-0 md:truncate">
                        {tab === "daily" ? dailyTitle : monthlyTitle}
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                        {tab === "daily" ? (
                            <AreaChart data={dailySeries}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis width={44} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => formatCurrencyBRL(Number(value))}
                                    labelFormatter={(_, payload) =>
                                        payload?.[0]?.payload
                                            ? `Dia ${(payload[0].payload as { day: string }).day}`
                                            : ""
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke={hexToRgba(accentColor, 0.95)}
                                    fill={hexToRgba(accentColor, 0.18)}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart data={monthlySeries}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10 }}
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    height={52}
                                />
                                <YAxis width={44} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value) => formatCurrencyBRL(Number(value))} />
                                <Bar dataKey="total" fill={hexToRgba(accentColor, 0.85)} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </section>
    )
}
