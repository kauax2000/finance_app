"use client"

import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection } from "@/components/ui/page-section"
import { Progress } from "@/components/ui/progress"
import { Muted, P } from "@/components/ui/typography"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { labelYearMonthPt, parseYearMonth } from "@/lib/budget-month"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL, percentBR } from "@/lib/formatters"
import { fraseDoFechamento } from "./regua-do-mes-contas"

/** Onde o mês está (0–100): o traço do ritmo no `Progress`. */
export function ritmoDoMes(yearMonth: string, hoje = new Date()): number {
    const { y, m } = parseYearMonth(yearMonth)
    return (hoje.getDate() / new Date(y, m, 0).getDate()) * 100
}

/** "Sobra R$ X de R$ Y" / "Passou R$ X do limite de R$ Y", e o aviso do previsto que passaria do limite. */
export function frasesDoLimite(lancado: number, previsto: number, limite: number) {
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

/** "Deve fechar em R$ X · …": só no mês aberto (no fechado o valor já é o fechamento). */
export function LinhaDoFechamento(props: Parameters<typeof fraseDoFechamento>[0]) {
    const { valor, fim } = fraseDoFechamento(props)
    return (
        <p className="text-sm">
            Deve fechar em <span className="nums font-semibold">{valor}</span>
            {fim.length ? <span className="text-muted-foreground">{` · ${fim.join(" · ")}`}</span> : null}
        </p>
    )
}

/** A barra do mês: contra o limite (com o previsto e o ritmo) ou, sem limite, o peso na carteira. */
export function BarraDoMes({
    tipo,
    yearMonth,
    lancado,
    previsto,
    limite,
    pesoNoTotal,
    aberto,
    className,
}: {
    tipo: TipoDaCategoria
    yearMonth: string
    lancado: number
    previsto: number
    limite: number | null
    pesoNoTotal: number | null
    aberto: boolean
    className?: string
}) {
    if (tipo === "expense" && limite != null && limite > 0) {
        return (
            <Progress
                value={Math.max(0, lancado)}
                max={limite}
                projected={previsto}
                bands={BUDGET_BANDS}
                marker={aberto ? ritmoDoMes(yearMonth) : undefined}
                aria-label={`${currencyBRL(lancado)} de um limite de ${currencyBRL(limite)}`}
                className={className}
            />
        )
    }
    // Sem limite, a barra mede o peso na carteira, como o cartão da lista de Categorias.
    const totalDaCarteira = pesoNoTotal && lancado > 0 ? lancado / pesoNoTotal : 0
    if (totalDaCarteira <= 0) return null
    return (
        <Progress
            value={lancado}
            max={totalDaCarteira}
            projected={previsto}
            aria-label={`${currencyBRL(lancado)} de ${currencyBRL(totalDaCarteira)} da carteira no mês`}
            className={className}
        />
    )
}

/** O resumo do mês: o limite com o previsto e o peso na carteira (e, no desktop, o valor; no telefone ele mora no topo). */
export function ResumoDoMes({
    tipo,
    yearMonth,
    lancado,
    previsto,
    limite,
    pesoNoTotal,
    aberto,
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
    /** A faixa do desktop, sob o `PageHeader`: sem título, a legenda ao lado do valor. */
    destaque?: boolean
}) {
    const despesa = tipo === "expense"
    const comLimite = despesa && limite != null && limite > 0
    const frases = comLimite ? frasesDoLimite(lancado, previsto, limite) : null
    const aindaVem = previsto > 0 && !frases?.aviso ? `Ainda vem ${currencyBRL(previsto)}` : null
    const fechamento = aberto ? <LinhaDoFechamento yearMonth={yearMonth} lancado={lancado} previsto={previsto} limite={comLimite ? limite : null} /> : null
    const barra = (
        <BarraDoMes
            tipo={tipo}
            yearMonth={yearMonth}
            lancado={lancado}
            previsto={previsto}
            limite={limite}
            pesoNoTotal={pesoNoTotal}
            aberto={aberto}
        />
    )

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

    // No telefone o valor e o mês moram no topo da tela (`TopoDaCategoria`); aqui fica o que vem depois dele.
    return (
        <PageSection aria-label={`Resumo de ${labelYearMonthPt(yearMonth).toLowerCase()}`}>
            <div className="grid gap-3">
                {fechamento}
                {barra}
                {frases || (aindaVem && !fechamento) ? (
                    <div>
                        {frases ? <P>{frases.principal}</P> : null}
                        {frases?.aviso ? <Muted>{frases.aviso}</Muted> : null}
                        {aindaVem && !fechamento ? <Muted>{aindaVem}</Muted> : null}
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
