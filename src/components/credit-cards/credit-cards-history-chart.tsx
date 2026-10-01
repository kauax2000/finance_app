"use client"

import {
    ChartBars,
    ChartEmpty,
    ChartTooltip,
    ChartTooltipContent,
    CHART_UPDATE_MS,
    chartSeriesColor,
    type ChartConfig,
} from "@/components/ui/chart"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { formatYearMonthShortPtBr } from "@/lib/transaction-date"
import { useMemo } from "react"

import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import type { CreditCard as CreditCardRow, WorkspaceInstallmentPlan } from "@/lib/supabase"
import type { CcTxRow } from "@/lib/credit-cards-workspace-transactions"
import {
    buildCardMonthlyInvoiceSnapshot,
    nextCloseAfter,
    previousStatementCloseBefore,
    statementCloseOnOrBefore,
} from "@/lib/credit-card-billing"

export type CreditCardHistoryRow = Record<string, string | number | boolean | undefined>

function ymFromCloseDate(close: Date): string {
    const y = close.getFullYear()
    const m = close.getMonth() + 1
    return `${y}-${String(m).padStart(2, "0")}`
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
                label: formatYearMonthShortPtBr(ym),
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
        // A fatura aberta ainda está crescendo: somada, ela vira a "menor fatura"
        // e puxa a média para baixo. Os indicadores leem só faturas fechadas, e
        // caem para todas quando ainda não há nenhuma fechada.
        const closedTotals = monthlyTotals.filter(
            (t, i) => t > 0 && !chartData[i].isOpen,
        )
        const kpiTotals = closedTotals.length > 0 ? closedTotals : positiveTotals
        const max = kpiTotals.length ? Math.max(...kpiTotals) : 0
        const min = kpiTotals.length ? Math.min(...kpiTotals) : 0
        const avg =
            kpiTotals.length > 0
                ? kpiTotals.reduce((a, b) => a + b, 0) / kpiTotals.length
                : 0

        return {
            chartData,
            kpis: { max, min, avg },
            hasAnyValue,
        }
    }, [cards, transactions, installmentPlans, today, monthsBack])

    // A chave da série é o id do cartão, e o nome entra como rótulo: um nome
    // como "Cartão Nubank" viraria token de CSS, e dois cartões com o mesmo
    // nome dividiriam a cor. A cor segue a ordem do cartão, não o ranking —
    // do sexto em diante, `--muted-foreground` em vez de repetir a primeira.
    const config = useMemo<ChartConfig>(
        () =>
            Object.fromEntries(
                cards.map((c, i) => [c.id, { label: c.name, color: chartSeriesColor(i) }])
            ),
        [cards]
    )
    const series = useMemo(() => cards.map((c) => c.id), [cards])

    if (cards.length === 0) {
        return (
            <Card padding="none">
                <ChartEmpty
                    icon={<CreditCardIcon aria-hidden />}
                    title="Nenhum cartão ativo"
                    description="Cadastre um cartão para ver o histórico de faturas."
                />
            </Card>
        )
    }

    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>Histórico de faturas</PageSectionTitle>
            </PageSectionHeader>

            <Card padding="none" className="relative">
                <CardContent className="relative flex flex-col gap-0">
                    <CardToolbar>
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
                    </CardToolbar>

                    <div className="p-4">
                        {chartData.length > 0 && hasAnyValue ? (
                            <ChartBars
                                config={config}
                                series={series}
                                data={chartData}
                                x="label"
                                label="Histórico de faturas por cartão, mês a mês"
                                // O tooltip é escrito aqui, e não o da forma, só pelo
                                // cabeçalho: ele diz qual fatura do mês ainda está
                                // aberta — o valor que ainda cresce, e que os
                                // indicadores acima deixam de fora.
                                tooltip={false}
                            >
                                <ChartTooltip
                                    animationDuration={CHART_UPDATE_MS}
                                    cursor={{ fillOpacity: 0.5 }}
                                    content={
                                        <ChartTooltipContent
                                            format="currency"
                                            labelFormatter={(rotulo, itens) => {
                                                const linha = itens[0]?.payload
                                                const abertas = cards
                                                    .filter((c) => linha?.[`${c.id}_open`] === true)
                                                    .map((c) => c.name)
                                                return abertas.length > 0 ? (
                                                    <>
                                                        {String(rotulo ?? "")}
                                                        <span className="font-normal text-muted-foreground">
                                                            {" "}
                                                            · aberta: {abertas.join(", ")}
                                                        </span>
                                                    </>
                                                ) : (
                                                    String(rotulo ?? "")
                                                )
                                            }}
                                        />
                                    }
                                />
                            </ChartBars>
                        ) : (
                            <ChartEmpty
                                icon={<CreditCardIcon aria-hidden />}
                                title="Nenhuma fatura no período"
                                description="Quando houver lançamentos no cartão, o histórico aparece aqui."
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
        </PageSection>
    )
}
