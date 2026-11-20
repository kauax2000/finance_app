"use client"

import { useMemo } from "react"
import { ChartBarIcon } from "@heroicons/react/16/solid"
import { Card } from "@/components/ui/card"
import { ChartBars, ChartReferenceLine, type ChartConfig } from "@/components/ui/chart"
import { EmptyState, EmptyStateIcon, EmptyStateTitle } from "@/components/ui/empty-state"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { shortLabelYearMonthPt } from "@/lib/budget-month"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL } from "@/lib/formatters"

// A rampa neutra: a cor da categoria vale só para traço e área da faísca, não para barras.
const CONFIG_DESPESA = { total: { label: "Gasto", color: "var(--chart-1)" } } satisfies ChartConfig
const CONFIG_RECEITA = { total: { label: "Recebido", color: "var(--chart-1)" } } satisfies ChartConfig

/** Os últimos 12 meses em barras, o mês aberto aceso e a linha do limite atual. */
export function HistoricoDosMeses({
    tipo,
    serie,
    limite,
}: {
    tipo: TipoDaCategoria
    serie: { yearMonth: string; total: number }[]
    limite: number | null
}) {
    const dados = useMemo(
        () => serie.map((p) => ({ mes: shortLabelYearMonthPt(p.yearMonth), total: p.total })),
        [serie],
    )
    const aberto = dados.at(-1)?.mes ?? null
    const vazio = serie.every((p) => p.total === 0)
    const comLimite = limite != null && limite > 0

    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>Últimos 12 meses</PageSectionTitle>
            </PageSectionHeader>
            <Card>
                {vazio ? (
                    <EmptyState variant="plain" layout="inline">
                        <EmptyStateIcon>
                            <ChartBarIcon aria-hidden />
                        </EmptyStateIcon>
                        <EmptyStateTitle>Sem movimento nos últimos 12 meses</EmptyStateTitle>
                    </EmptyState>
                ) : (
                    <ChartBars
                        config={tipo === "expense" ? CONFIG_DESPESA : CONFIG_RECEITA}
                        data={dados}
                        x="mes"
                        selected={aberto}
                        aspect="auto"
                        label={tipo === "expense" ? "Gasto de cada um dos últimos 12 meses" : "Receita de cada um dos últimos 12 meses"}
                        description={
                            comLimite
                                ? `O mês aberto em destaque. A linha tracejada é o limite atual, ${currencyBRL(limite)}.`
                                : "O mês aberto em destaque."
                        }
                        className="h-48 w-full"
                    >
                        {comLimite ? (
                            <ChartReferenceLine
                                y={limite}
                                tone="average"
                                ifOverflow="extendDomain"
                                label={{ value: "Limite atual", position: "insideTopRight", className: "fill-muted-foreground" }}
                            />
                        ) : null}
                    </ChartBars>
                )}
            </Card>
        </PageSection>
    )
}
