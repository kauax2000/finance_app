"use client"

import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    CreditCardIcon,
    ScaleIcon,
} from "@heroicons/react/16/solid"

import { MoneyDisplay } from "@/components/ui/money-display"
import {
    StatCard,
    StatCardDelta,
    StatCardFooter,
    StatCardGroup,
    StatCardHeader,
    StatCardIcon,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"

const CONTEXTO_DELTA = "em relação ao mesmo período do mês anterior"

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
        <StatCardGroup variant="separate" columns={4}>
            <StatCard tone="expense">
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon>
                            <ArrowTrendingDownIcon />
                        </StatCardIcon>
                        Despesas
                    </StatCardLabel>
                    <StatCardDelta
                        current={kpiCurrent.expense}
                        previous={kpiPrev.expense}
                        better="down"
                        context={CONTEXTO_DELTA}
                    />
                </StatCardHeader>
                <StatCardValue value={kpiCurrent.expense} format="currency" />
                {/* Os três cards são lançados, para Receitas − Despesas = Resultado.
                    O previsto do mês fica como leitura secundária. */}
                {kpiPlanned.expense > kpiCurrent.expense ? (
                    <StatCardFooter>
                        Previsto no mês <MoneyDisplay value={kpiPlanned.expense} tone="muted" />
                    </StatCardFooter>
                ) : null}
            </StatCard>

            <StatCard tone="income">
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon>
                            <ArrowTrendingUpIcon />
                        </StatCardIcon>
                        Receitas
                    </StatCardLabel>
                    <StatCardDelta
                        current={kpiCurrent.income}
                        previous={kpiPrev.income}
                        better="up"
                        context={CONTEXTO_DELTA}
                    />
                </StatCardHeader>
                <StatCardValue value={kpiCurrent.income} format="currency" />
            </StatCard>

            <StatCard tone={kpiCurrent.net >= 0 ? "income" : "expense"}>
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon>
                            <ScaleIcon />
                        </StatCardIcon>
                        Resultado
                    </StatCardLabel>
                    <StatCardDelta
                        current={kpiCurrent.net}
                        previous={kpiPrev.net}
                        better="up"
                        context={CONTEXTO_DELTA}
                    />
                </StatCardHeader>
                <StatCardValue value={kpiCurrent.net} format="currency" />
            </StatCard>

            <StatCard tone="default">
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon>
                            <CreditCardIcon />
                        </StatCardIcon>
                        Faturas abertas
                    </StatCardLabel>
                </StatCardHeader>
                <StatCardValue value={totalOpenInvoices} format="currency" />
            </StatCard>
        </StatCardGroup>
    )
}
