"use client"

import { CreditCardIcon, MinusIcon, ScaleIcon, ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline"
import type { HeroIcon } from "@/types/navigation"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { cn } from "@/lib/utils"

const pctFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
})

function DeltaBadge({
    cur,
    prev,
    invert,
}: {
    cur: number
    prev: number
    /** true when lower is better (e.g. expense) */
    invert?: boolean
}) {
    if (prev === 0 && cur === 0) {
        return null
    }
    if (prev === 0) {
        return (
            <Badge
                variant="outline"
                className="max-w-[min(100%,7.5rem)] shrink-0 gap-1 truncate px-2 py-0.5 text-[11px] font-medium tabular-nums"
                title="Sem valor no período anterior para comparar"
            >
                Sem base
            </Badge>
        )
    }

    const deltaPct = ((cur - prev) / Math.abs(prev)) * 100
    const good = invert ? deltaPct <= 0 : deltaPct >= 0
    const isFlat = deltaPct === 0

    const display = `${deltaPct >= 0 ? "+" : ""}${pctFmt.format(deltaPct)}%`

    if (isFlat) {
        return (
            <Badge
                variant="outline"
                className="shrink-0 gap-1 px-2 py-0.5 text-[11px] font-medium tabular-nums whitespace-nowrap"
                aria-label="Sem variação percentual vs. mesmo período do mês anterior"
            >
                <MinusIcon
                    className="hidden size-3 shrink-0 opacity-90 md:block"
                    aria-hidden
                />
                <span>0%</span>
            </Badge>
        )
    }

    const Icon = deltaPct > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
    const variant = good ? "success" : "destructive"

    return (
        <Badge
            variant={variant}
            className="shrink-0 gap-1 px-2 py-0.5 text-[11px] font-medium tabular-nums whitespace-nowrap"
            aria-label={`${display} vs. mesmo período do mês anterior`}
        >
            <Icon
                className="hidden size-3 shrink-0 opacity-90 md:block"
                aria-hidden
            />
            <span>{display}</span>
        </Badge>
    )
}

function KpiCard({
    label,
    icon: Icon,
    iconClassName,
    value,
    badge,
}: {
    label: string
    icon: HeroIcon
    iconClassName?: string
    value: ReactNode
    badge?: ReactNode
}) {
    return (
        <Card className="gap-0 overflow-hidden py-0 shadow-none">
            <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Icon
                        className={cn(
                            "hidden size-3.5 shrink-0 md:block",
                            iconClassName,
                        )}
                        aria-hidden
                    />
                    <p className="min-w-0 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>
                </div>
                {badge ? (
                    <div className="flex min-w-0 shrink-0 justify-end">{badge}</div>
                ) : null}
            </div>
            <CardContent className="pt-4 pb-4 md:pt-5 md:pb-5">
                <div className="leading-tight">{value}</div>
            </CardContent>
        </Card>
    )
}

export function DashboardKpiCards({
    kpiCurrent,
    kpiPrev,
    kpiPlanned,
    totalOpenInvoices,
}: {
    kpiCurrent: { income: number; expense: number; net: number }
    kpiPrev: { income: number; expense: number; net: number }
    kpiPlanned: { income: number; expense: number; net: number }
    totalOpenInvoices: number
}) {
    return (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <KpiCard
                label="Despesas"
                icon={ArrowTrendingDownIcon}
                iconClassName="text-rose-600 dark:text-rose-400"
                value={
                    <MoneyDisplay
                        value={kpiPlanned.expense}
                        tone="expense"
                        className="text-xl font-semibold leading-tight md:text-2xl"
                    />
                }
                badge={
                    <DeltaBadge
                        cur={kpiPlanned.expense}
                        prev={kpiPrev.expense}
                        invert
                    />
                }
            />

            <KpiCard
                label="Receitas"
                icon={ArrowTrendingUpIcon}
                iconClassName="text-emerald-600 dark:text-emerald-400"
                value={
                    <MoneyDisplay
                        value={kpiCurrent.income}
                        tone="income"
                        className="text-xl font-semibold leading-tight md:text-2xl"
                    />
                }
                badge={
                    <DeltaBadge cur={kpiCurrent.income} prev={kpiPrev.income} />
                }
            />

            <KpiCard
                label="Resultado"
                icon={ScaleIcon}
                iconClassName="text-muted-foreground"
                value={
                    <MoneyDisplay
                        value={kpiCurrent.net}
                        tone={
                            kpiCurrent.net >= 0 ? "income" : "expense"
                        }
                        className="text-xl font-semibold leading-tight md:text-2xl"
                    />
                }
                badge={
                    <DeltaBadge cur={kpiCurrent.net} prev={kpiPrev.net} />
                }
            />

            <KpiCard
                label="Faturas abertas"
                icon={CreditCardIcon}
                iconClassName="text-muted-foreground"
                value={
                    <MoneyDisplay
                        value={totalOpenInvoices}
                        className="text-xl font-semibold leading-tight text-foreground md:text-2xl"
                    />
                }
            />
        </div>
    )
}
