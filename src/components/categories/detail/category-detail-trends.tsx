"use client"

import { currencyBRL } from "@/lib/formatters"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import * as React from "react"
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
import type { Category, CreditCard } from "@/lib/supabase"
import {
    buildDailySeries,
    buildMonthlySeries,
    hexToRgba,
} from "@/components/categories/detail/category-detail-utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type SeriesRow = { date: string; amount: number | string; type: string; category_id: string | null }

type CategoryDetailTrendsProps = {
    category: Category
    categoryId: string
    yearMonth: string
    seriesSource: SeriesRow[]
    accentColor: string
    creditCards?: Pick<CreditCard, "id" | "closing_day">[]
}

export function CategoryDetailTrends({
    category,
    categoryId,
    yearMonth,
    seriesSource,
    accentColor,
    creditCards,
}: CategoryDetailTrendsProps) {
    const [tab, setTab] = React.useState<"daily" | "monthly">("daily")
    const typeFilter = category.type
    const isExpense = typeFilter === "expense"

    const dailySeries = React.useMemo(
        () => buildDailySeries(yearMonth, seriesSource as never[], categoryId, typeFilter),
        [yearMonth, seriesSource, categoryId, typeFilter],
    )
    const monthlySeries = React.useMemo(
        () =>
            buildMonthlySeries(
                yearMonth,
                seriesSource as never[],
                categoryId,
                typeFilter,
                12,
                creditCards,
            ),
        [yearMonth, seriesSource, categoryId, typeFilter, creditCards],
    )

    const dailyTitle = isExpense ? "Despesas por dia" : "Receitas por dia"
    const monthlyTitle = isExpense ? "Despesas por mês" : "Receitas por mês"

    return (
        <PageSection aria-labelledby="category-trends-heading">
            <PageSectionHeader
                actions={
                    <Tabs
                        value={tab}
                        onValueChange={(next) => setTab(next as typeof tab)}
                        className="w-auto"
                    >
                        <TabsList aria-label="Período do gráfico" className="w-auto">
                            <TabsTrigger value="daily">Dia a dia</TabsTrigger>
                            <TabsTrigger value="monthly">12 meses</TabsTrigger>
                        </TabsList>
                    </Tabs>
                }
            >
                {/* `h3`: a tendência é um bloco dentro do detalhe da categoria. */}
                <PageSectionTitle asChild>
                    <h3 id="category-trends-heading">Tendência</h3>
                </PageSectionTitle>
            </PageSectionHeader>
            <Card padding="none">
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
                                    formatter={(value) => currencyBRL(Number(value))}
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
                                <Tooltip formatter={(value) => currencyBRL(Number(value))} />
                                <Bar dataKey="total" fill={hexToRgba(accentColor, 0.85)} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </PageSection>
    )
}
