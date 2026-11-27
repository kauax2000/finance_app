"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection } from "@/components/ui/page-section"
import { Progress, ProgressFooter, ProgressHeader } from "@/components/ui/progress"
import { Muted } from "@/components/ui/typography"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { labelYearMonthPt, parseYearMonth } from "@/lib/budget-month"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL, percentBR } from "@/lib/formatters"
import { diaDoMes, fraseDoFechamento, reaisInteiros } from "./regua-do-mes-contas"

/** Onde o mês está (0–100): o traço do ritmo no `Progress`. */
export function ritmoDoMes(yearMonth: string, hoje = new Date()): number {
    const { y, m } = parseYearMonth(yearMonth)
    return (hoje.getDate() / new Date(y, m, 0).getDate()) * 100
}

/** "Sobra R$ X de R$ Y" / "Passou R$ X do limite de R$ Y", e o aviso do previsto que passaria do limite. */
export function frasesDoLimite(lancado: number, previsto: number, limite: number) {
    // `forte` + `resto` é a `principal` partida: o telefone pesa a primeira metade.
    const [forte, resto] =
        lancado <= limite
            ? [`Sobra ${currencyBRL(limite - lancado)}`, ` de ${currencyBRL(limite)}`]
            : [`Passou ${currencyBRL(lancado - limite)}`, ` do limite de ${currencyBRL(limite)}`]
    const principal = forte + resto
    const aviso =
        lancado <= limite && limite < lancado + previsto
            ? `Com o previsto, passa ${currencyBRL(lancado + previsto - limite)}`
            : null
    return { principal, aviso, forte, resto }
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
    header,
    footer,
    className,
}: {
    tipo: TipoDaCategoria
    yearMonth: string
    lancado: number
    previsto: number
    limite: number | null
    pesoNoTotal: number | null
    aberto: boolean
    /** A linha de cima do `Progress` (o que a barra mede). */
    header?: React.ReactNode
    /** A linha de baixo da barra (a legenda do tracejado e do traço, no telefone). */
    footer?: React.ReactNode
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
                header={header}
                footer={footer}
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
            header={header}
                footer={footer}
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
    hojeYmd,
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
    /** Hoje (`YYYY-MM-DD`): o "dia N de M" do mês aberto, no telefone. */
    hojeYmd: string
    /** A faixa do desktop, sob o `PageHeader`: sem título, a legenda ao lado do valor. */
    destaque?: boolean
}) {
    const despesa = tipo === "expense"
    const comLimite = despesa && limite != null && limite > 0
    const frases = comLimite ? frasesDoLimite(lancado, previsto, limite) : null
    const aindaVem = previsto > 0 && !frases?.aviso ? `Ainda vem ${currencyBRL(previsto)}` : null
    const temBarra = comLimite || (!!pesoNoTotal && lancado > 0)
    const doTotal = despesa ? "do gasto da carteira" : "da receita da carteira"
    // A linha de cima da barra, só no telefone: a frase do limite e o dia, ou o peso e o total da carteira.
    const cabecalho = destaque ? undefined : frases ? (
        <ProgressHeader>
            <span>
                <span className="font-semibold">{frases.forte}</span>
                <span className="text-muted-foreground">{frases.resto}</span>
            </span>
        </ProgressHeader>
    ) : temBarra && pesoNoTotal ? (
        <ProgressHeader>
            <span>
                <span className="font-semibold">{percentBR(pesoNoTotal, { maximumFractionDigits: 0 })}</span>
                <span className="text-muted-foreground">{` ${doTotal}`}</span>
            </span>
            <span className="nums shrink-0 text-muted-foreground">{`de ${reaisInteiros(lancado / pesoNoTotal)}`}</span>
        </ProgressHeader>
    ) : null
    // A legenda sob a barra, só no telefone: o que o tracejado (o previsto) e o traço (o dia) querem dizer.
    // O tracejado existe com previsto; o traço, com limite no mês aberto (`BarraDoMes`).
    const comTraco = comLimite && aberto
    const legenda =
        destaque || !temBarra || (previsto <= 0 && !comTraco) ? undefined : (
            <ProgressFooter>
                {previsto > 0 ? (
                    <span className="flex items-center gap-1.5">
                        <span aria-hidden className="progress-projected h-2 w-3 rounded-xs" />
                        previsto
                    </span>
                ) : (
                    <span />
                )}
                {comTraco ? (
                    <span className="nums flex shrink-0 items-center gap-1.5 text-muted-foreground">
                        <span aria-hidden className="h-3 w-0.5 rounded-full bg-foreground/60" />
                        {diaDoMes(yearMonth, hojeYmd)}
                    </span>
                ) : null}
            </ProgressFooter>
        )
    const barra = (
        <BarraDoMes
            tipo={tipo}
            yearMonth={yearMonth}
            lancado={lancado}
            previsto={previsto}
            limite={limite}
            pesoNoTotal={pesoNoTotal}
            aberto={aberto}
            header={cabecalho}
            footer={legenda}
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
    // A linha de baixo é uma só: como o mês fecha (a frase do B2) e, em cinza, o aviso, o que ainda vem e o peso.
    // O fechamento de antes ("Deve fechar em R$ X · nada mais previsto / cabe no limite") com o
    // dado do B2: quanto do fechamento é previsto ("com os R$ 260 previstos").
    const fechamento = aberto
        ? fraseDoFechamento({ yearMonth, lancado, previsto, limite: comLimite ? limite : null })
        : null
    const fecha = fechamento ? (
        <>
            {"Deve fechar em "}
            <span className="nums font-semibold">{fechamento.valor}</span>
            {previsto > 0 ? ` com os ${reaisInteiros(previsto)} previstos` : null}
        </>
    ) : null
    const partes = [
        ...(fechamento?.fim ?? []),
        frases?.aviso ? <span className="text-warning">{frases.aviso}</span> : null,
        aindaVem && !aberto ? aindaVem : null,
        comLimite && pesoNoTotal != null && lancado !== 0 ? `${percentBR(pesoNoTotal, { maximumFractionDigits: 0 })} ${doTotal}` : null,
    ].filter((p) => p != null)
    if (!temBarra && !fecha && !partes.length) return null
    return (
        <PageSection aria-label={`Resumo de ${labelYearMonthPt(yearMonth).toLowerCase()}`}>
            <Card>
                <CardContent className="grid gap-3">
                    {barra}
                    {fecha || partes.length ? (
                        <p className="text-sm">
                            {fecha}
                            {partes.length ? (
                                <span className="text-muted-foreground">
                                    {partes.map((p, i) => (
                                        <span key={i}>
                                            {fecha || i > 0 ? " · " : null}
                                            {p}
                                        </span>
                                    ))}
                                </span>
                            ) : null}
                        </p>
                    ) : null}
                </CardContent>
            </Card>
        </PageSection>
    )
}
