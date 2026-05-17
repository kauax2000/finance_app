"use client"

import { useMemo } from "react"
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
} from "recharts"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import { Card, CardContent } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import type { CreditCard as CreditCardRow, WorkspaceInstallmentPlan } from "@/lib/supabase"
import type { CcTxRow } from "@/lib/credit-cards-workspace-transactions"
import {
    buildCardMonthlyInvoiceSnapshot,
    nextCloseAfter,
    previousStatementCloseBefore,
    statementCloseOnOrBefore,
} from "@/lib/credit-card-billing"
import { hexToRgba } from "@/components/categories/detail/category-detail-utils"

const BAR_COLORS = ["#10B981", "#6366F1", "#F59E0B", "#E11D48", "#06B6D4", "#A855F7"]

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export type CreditCardHistoryRow = Record<string, string | number | boolean | undefined>

function ymFromCloseDate(close: Date): string {
    const y = close.getFullYear()
    const m = close.getMonth() + 1
    return `${y}-${String(m).padStart(2, "0")}`
}

function labelFromYm(ym: string): string {
    const [ys, ms] = ym.split("-")
    const y = Number(ys)
    const m = Number(ms)
    if (!Number.isFinite(y) || !Number.isFinite(m)) return ym
    const d = new Date(y, m - 1, 1)
    const short = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    return short.replace(/\.$/, "")
}

type CellMeta = {
    value: number
    isOpen: boolean
}

function buildCardInvoiceSeries(
    card: Pick<CreditCardRow, "id" | "closing_day" | "due_day">,
    transactions: CcTxRow[],
    installmentPlans: WorkspaceInstallmentPlan[],
    today: Date,
    monthsBack: number
): Map<string, CellMeta> {
    const out = new Map<string, CellMeta>()
    const cd = card.closing_day
    const lastClose = statementCloseOnOrBefore(today, cd)
    let close = nextCloseAfter(lastClose, cd)

    for (let i = 0; i < monthsBack; i++) {
        const ym = ymFromCloseDate(close)
        const snap = buildCardMonthlyInvoiceSnapshot(card, transactions, ym, today, {
            installmentPlans,
        })
        out.set(ym, {
            value: snap.committedTotal,
            isOpen: snap.status === "open",
        })
        close = previousStatementCloseBefore(close, cd)
    }

    return out
}

function CreditCardsHistoryTooltip({
    active,
    label,
    payload,
    cards,
}: {
    active?: boolean
    label?: string
    payload?: { dataKey?: string; value?: number; payload?: CreditCardHistoryRow }[]
    cards: CreditCardRow[]
}) {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload as CreditCardHistoryRow | undefined
    if (!row) return null

    return (
        <div className="min-w-[12rem] rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="mb-1.5 border-b border-border/60 pb-1 font-medium text-foreground">
                {label ?? (typeof row.label === "string" ? row.label : "")}
            </p>
            <ul className="space-y-1.5">
                {cards.map((c, idx) => {
                    const v = row[c.id]
                    const num = typeof v === "number" ? v : 0
                    const openKey = `${c.id}_open`
                    const isOpen = row[openKey] === true
                    const color = BAR_COLORS[idx % BAR_COLORS.length]
                    return (
                        <li
                            key={c.id}
                            className="flex items-center justify-between gap-3 tabular-nums"
                        >
                            <span className="flex min-w-0 items-center gap-1.5">
                                <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: hexToRgba(color, 0.75) }}
                                    aria-hidden
                                />
                                <span className="truncate text-muted-foreground">
                                    {c.name}
                                    {isOpen ? (
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                            {" "}
                                            (aberta)
                                        </span>
                                    ) : null}
                                </span>
                            </span>
                            <span className="shrink-0 font-medium">
                                {currencyFmt.format(num)}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

function LegendStrip({ cards }: { cards: CreditCardRow[] }) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {cards.map((c, idx) => {
                const color = BAR_COLORS[idx % BAR_COLORS.length]
                return (
                    <span
                        key={c.id}
                        className="flex max-w-[10rem] items-center gap-1.5 text-[10px] text-muted-foreground"
                    >
                        <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: hexToRgba(color, 0.75) }}
                            aria-hidden
                        />
                        <span className="truncate">{c.name}</span>
                    </span>
                )
            })}
        </div>
    )
}

export function CreditCardsHistoryChart({
    cards,
    transactions,
    installmentPlans,
    monthsBack = 12,
}: {
    cards: CreditCardRow[]
    transactions: CcTxRow[]
    installmentPlans: WorkspaceInstallmentPlan[]
    monthsBack?: number
}) {
    const today = useMemo(() => new Date(), [])

    const { chartData, kpis, hasAnyValue } = useMemo(() => {
        if (cards.length === 0) {
            return {
                chartData: [] as CreditCardHistoryRow[],
                kpis: { max: 0, min: 0, avg: 0 },
                hasAnyValue: false,
            }
        }

        const perCard = cards.map((c) =>
            buildCardInvoiceSeries(c, transactions, installmentPlans, today, monthsBack)
        )

        const ymSet = new Set<string>()
        for (const m of perCard) {
            for (const ym of m.keys()) ymSet.add(ym)
        }

        const sortedYm = Array.from(ymSet).sort()

        const chartData: CreditCardHistoryRow[] = sortedYm.map((ym) => {
            const row: CreditCardHistoryRow = {
                ym,
                label: labelFromYm(ym),
            }
            let anyOpen = false
            for (let i = 0; i < cards.length; i++) {
                const cell = perCard[i].get(ym)
                const id = cards[i].id
                const value = cell?.value ?? 0
                row[id] = value
                row[`${id}_open`] = cell?.isOpen ?? false
                if (cell?.isOpen) anyOpen = true
            }
            row.isOpen = anyOpen
            return row
        })

        const monthlyTotals = chartData.map((row) =>
            cards.reduce((acc, c) => {
                const v = row[c.id]
                return acc + (typeof v === "number" ? v : 0)
            }, 0)
        )

        const positiveTotals = monthlyTotals.filter((t) => t > 0)
        const hasAnyValue = positiveTotals.length > 0
        const max = positiveTotals.length ? Math.max(...positiveTotals) : 0
        const min = positiveTotals.length ? Math.min(...positiveTotals) : 0
        const avg =
            positiveTotals.length > 0
                ? positiveTotals.reduce((a, b) => a + b, 0) / positiveTotals.length
                : 0

        return {
            chartData,
            kpis: { max, min, avg },
            hasAnyValue,
        }
    }, [cards, transactions, installmentPlans, today, monthsBack])

    const yDomain = useMemo(() => {
        let max = 0
        for (const row of chartData) {
            for (const c of cards) {
                const v = row[c.id]
                if (typeof v === "number") max = Math.max(max, v)
            }
        }
        if (max <= 0) return undefined
        const pad = max * 0.06 || 1
        return [0, max + pad] as [number, number]
    }, [chartData, cards])

    if (cards.length === 0) {
        return (
            <Card className="relative gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                        <CreditCardIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhum cartão ativo</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        Cadastre um cartão para ver o histórico de faturas.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-row items-center justify-between gap-x-3 gap-y-1">
                <div className="flex min-h-8 min-w-0 shrink-0 items-center">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Histórico de faturas
                    </p>
                </div>
                {chartData.length > 0 && hasAnyValue ? (
                    <div className="min-w-0 flex-1">
                        <LegendStrip cards={cards} />
                    </div>
                ) : null}
            </div>

            <Card className="relative gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="relative flex flex-col gap-0 p-0">
                    <div className="shrink-0 border-b border-border bg-muted/10 px-3 py-2.5 dark:bg-muted/20">
                        {chartData.length > 0 && hasAnyValue ? (
                            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                                <div className="flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start">
                                    <dt className="min-w-0 shrink text-muted-foreground">
                                        Maior fatura (mês)
                                    </dt>
                                    <dd className="shrink-0 font-semibold tabular-nums text-foreground sm:shrink sm:text-sm">
                                        <MoneyDisplay
                                            value={kpis.max}
                                            className="text-xs font-semibold sm:text-sm"
                                        />
                                    </dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start">
                                    <dt className="min-w-0 shrink text-muted-foreground">
                                        Menor fatura (mês)
                                    </dt>
                                    <dd className="shrink-0 font-semibold tabular-nums text-foreground sm:shrink sm:text-sm">
                                        <MoneyDisplay
                                            value={kpis.min}
                                            className="text-xs font-semibold sm:text-sm"
                                        />
                                    </dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start">
                                    <dt className="min-w-0 shrink text-muted-foreground">
                                        Média mensal
                                    </dt>
                                    <dd className="shrink-0 font-semibold tabular-nums text-foreground sm:shrink sm:text-sm">
                                        <MoneyDisplay
                                            value={kpis.avg}
                                            className="text-xs font-semibold sm:text-sm"
                                        />
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Valores por fatura de fechamento (posted + parcelas projetadas).
                                Barras agrupadas por cartão.
                            </p>
                        )}
                    </div>

                    <div className="relative min-h-[300px] p-4">
                        {chartData.length > 0 && hasAnyValue ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={chartData}
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
                                        className="text-[10px] text-muted-foreground"
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        width={48}
                                        tickLine={false}
                                        className="text-[10px] text-muted-foreground"
                                        domain={yDomain}
                                        tickFormatter={(v) =>
                                            Number(v).toLocaleString("pt-BR", {
                                                notation: "compact",
                                                maximumFractionDigits: 0,
                                            })
                                        }
                                    />
                                    <Tooltip
                                        content={
                                            <CreditCardsHistoryTooltip cards={cards} />
                                        }
                                        cursor={{
                                            fill: "color-mix(in oklch, var(--muted) 35%, transparent)",
                                        }}
                                    />
                                    {cards.map((c, idx) => {
                                        const color = BAR_COLORS[idx % BAR_COLORS.length]
                                        return (
                                            <Bar
                                                key={c.id}
                                                dataKey={c.id}
                                                name={c.name}
                                                fill={hexToRgba(color, 0.65)}
                                                radius={[3, 3, 0, 0]}
                                                activeBar={{
                                                    fill: hexToRgba(color, 0.85),
                                                }}
                                            />
                                        )
                                    })}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[300px] flex-col items-center justify-center gap-2 px-4 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                    <CreditCardIcon
                                        className="h-6 w-6 text-muted-foreground"
                                        aria-hidden
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma fatura no período
                                </p>
                                <p className="max-w-sm text-xs text-muted-foreground">
                                    Quando houver lançamentos no cartão, o histórico aparece aqui.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
