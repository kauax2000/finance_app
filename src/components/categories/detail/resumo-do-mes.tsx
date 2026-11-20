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
    destaque = false,
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
    /** A faixa do desktop, sob o `PageHeader`: sem título, a legenda ao lado do valor. */
    destaque?: boolean
}) {
    const despesa = tipo === "expense"
    const comLimite = despesa && limite != null && limite > 0
    const frases = comLimite ? frasesDoLimite(lancado, previsto, limite) : null
    const aindaVem = previsto > 0 && !frases?.aviso ? `Ainda vem ${currencyBRL(previsto)}` : null
    // Sem limite, a barra mede o peso na carteira, como o cartão da lista de Categorias.
    const totalDaCarteira = pesoNoTotal && lancado > 0 ? lancado / pesoNoTotal : 0
    const barra = comLimite ? (
        <Progress
            value={Math.max(0, lancado)}
            max={limite}
            projected={previsto}
            bands={BUDGET_BANDS}
            marker={aberto ? ritmoDoMes(yearMonth) : undefined}
            aria-label={`${currencyBRL(lancado)} de um limite de ${currencyBRL(limite)}`}
        />
    ) : totalDaCarteira > 0 ? (
        <Progress
            value={lancado}
            max={totalDaCarteira}
            projected={previsto}
            aria-label={`${currencyBRL(lancado)} de ${currencyBRL(totalDaCarteira)} da carteira no mês`}
        />
    ) : null

    if (destaque) {
        const mes = labelYearMonthPt(yearMonth).toLowerCase()
        const peso =
            pesoNoTotal != null && lancado !== 0
                ? `${percentBR(pesoNoTotal, { maximumFractionDigits: 0 })} ${despesa ? "do gasto da carteira" : "da receita da carteira"}`
                : null
        const linha = [frases?.principal, frases?.aviso, aindaVem, peso].filter(Boolean).join(" · ")
        return (
            <PageSection aria-label={`Resumo de ${mes}`}>
                <div className="grid gap-3">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                        <MoneyDisplay value={lancado} size="3xl" />
                        <Muted>{`${despesa ? "gastos" : "recebidos"} em ${mes}`}</Muted>
                    </div>
                    {barra}
                    {linha ? <Muted>{linha}</Muted> : null}
                </div>
            </PageSection>
        )
    }

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
                {barra}
                {frases || aindaVem ? (
                    <div>
                        {frases ? <P>{frases.principal}</P> : null}
                        {frases?.aviso ? <Muted>{frases.aviso}</Muted> : null}
                        {aindaVem ? <Muted>{aindaVem}</Muted> : null}
                    </div>
                ) : null}
                {pesoNoTotal != null && lancado !== 0 ? (
                    <Badge tone="neutral" size="sm" className="w-fit">
                        {percentBR(pesoNoTotal, { maximumFractionDigits: 0 })}{" "}
                        {despesa ? "do gasto da carteira" : "da receita da carteira"}
                    </Badge>
                ) : null}
            </div>
        </PageSection>
    )
}
