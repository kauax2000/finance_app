"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Progress } from "@/components/ui/progress"
import { Caption, Muted, P } from "@/components/ui/typography"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { labelYearMonthPt, parseYearMonth } from "@/lib/budget-month"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL, percentBR } from "@/lib/formatters"

/** Onde o mês está (0–100): o traço do ritmo no `Progress`. */
function ritmoDoMes(yearMonth: string, hoje = new Date()): number {
    const { y, m } = parseYearMonth(yearMonth)
    return (hoje.getDate() / new Date(y, m, 0).getDate()) * 100
}

/** "Sobra R$ X de R$ Y" / "Passou R$ X do limite de R$ Y", e o aviso do previsto que passaria do limite. */
function frasesDoLimite(lancado: number, previsto: number, limite: number) {
    const principal =
        lancado <= limite
            ? `Sobra ${currencyBRL(limite - lancado)} de ${currencyBRL(limite)}`
            : `Passou ${currencyBRL(lancado - limite)} do limite de ${currencyBRL(limite)}`
    const aviso =
        lancado <= limite && limite < lancado + previsto
            ? `Com o previsto, passa ${currencyBRL(lancado + previsto - limite)}`
            : null
    return { principal, aviso }
}

/** O topo do detalhe: quanto foi no mês, o limite com o previsto e o peso na carteira. */
export function ResumoDoMes({
    tipo,
    yearMonth,
    lancado,
    previsto,
    limite,
    pesoNoTotal,
    aberto,
    acoes,
}: {
    tipo: TipoDaCategoria
    yearMonth: string
    lancado: number
    previsto: number
    limite: number | null
    /** Fração (0–1) do gasto ou da receita da carteira no mês. */
    pesoNoTotal: number | null
    /** O mês corrente: desenha o traço do ritmo. */
    aberto: boolean
    /** O ⋯ da categoria, quando não há `PageHeader` (o telefone). */
    acoes?: ReactNode
}) {
    const despesa = tipo === "expense"
    const comLimite = despesa && limite != null && limite > 0
    const frases = comLimite ? frasesDoLimite(lancado, previsto, limite) : null
    const aindaVem = previsto > 0 && !frases?.aviso ? `Ainda vem ${currencyBRL(previsto)}` : null

    return (
        <PageSection>
            <PageSectionHeader actions={acoes}>
                <PageSectionTitle>{aberto ? "Este mês" : labelYearMonthPt(yearMonth)}</PageSectionTitle>
            </PageSectionHeader>
            <div className="grid gap-3">
                <div>
                    <Caption>{despesa ? "Gasto" : "Entrou"}</Caption>
                    <MoneyDisplay value={lancado} size="3xl" />
                </div>
                {comLimite ? (
                    <Progress
                        value={lancado}
                        max={limite}
                        projected={previsto}
                        bands={BUDGET_BANDS}
                        marker={aberto ? ritmoDoMes(yearMonth) : undefined}
                        aria-label={`${currencyBRL(lancado)} de um limite de ${currencyBRL(limite)}`}
                    />
                ) : null}
                {frases || aindaVem ? (
                    <div>
                        {frases ? <P>{frases.principal}</P> : null}
                        {frases?.aviso ? <Muted>{frases.aviso}</Muted> : null}
                        {aindaVem ? <Muted>{aindaVem}</Muted> : null}
                    </div>
                ) : null}
                {pesoNoTotal != null ? (
                    <Badge tone="neutral" size="sm" className="w-fit">
                        {percentBR(pesoNoTotal, { maximumFractionDigits: 0 })}{" "}
                        {despesa ? "do gasto da carteira" : "da receita da carteira"}
                    </Badge>
                ) : null}
            </div>
        </PageSection>
    )
}
