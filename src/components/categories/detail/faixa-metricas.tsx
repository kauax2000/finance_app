"use client"

import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection } from "@/components/ui/page-section"
import { Separator } from "@/components/ui/separator"
import { StatCardDelta } from "@/components/ui/stat-card"
import { Caption } from "@/components/ui/typography"
import { parseYearMonth } from "@/lib/budget-month"
import type { Comparacao, TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL, percentBR } from "@/lib/formatters"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { Transaction } from "@/lib/supabase"
import { formatMonthLongPtBr } from "@/lib/transaction-date"
import { BarraDoMes, frasesDoLimite } from "./resumo-do-mes"

export type FaixaDoMesProps = {
    tipo: TipoDaCategoria
    yearMonth: string
    aberto: boolean
    hojeYmd: string
    lancado: number
    previsto: number
    limite: number | null
    /** Fração (0–1) do gasto ou da receita da carteira no mês. */
    pesoNoTotal: number | null
    comparacao: Comparacao
    media: number | null
    quantidade: number
    /** O maior lançamento do mês, com `payment_card` anexado. */
    maior: Transaction | null
}

export const nomeDoMes = (ym: string) => {
    const { y, m } = parseYearMonth(ym)
    return formatMonthLongPtBr(new Date(y, m - 1, 1))
}

export const legendaDoPeso = (tipo: TipoDaCategoria, pesoNoTotal: number | null, lancado: number) =>
    pesoNoTotal != null && lancado !== 0
        ? `${percentBR(pesoNoTotal, { maximumFractionDigits: 0 })} ${tipo === "expense" ? "do gasto da carteira" : "da receita da carteira"}`
        : null

/** B — a faixa como linha de métricas: o valor com a barra curta, e três números separados por fios. */
export function FaixaMetricas(props: FaixaDoMesProps) {
    const { tipo, yearMonth, lancado, previsto, limite, pesoNoTotal, comparacao, media, quantidade, maior } = props
    const despesa = tipo === "expense"
    const mes = nomeDoMes(yearMonth)
    const mesAnterior = nomeDoMes(comparacao.mesAnterior)
    const frases = despesa && limite != null && limite > 0 ? frasesDoLimite(lancado, previsto, limite) : null
    const aindaVem = previsto > 0 && !frases?.aviso ? `Ainda vem ${currencyBRL(previsto)}` : null
    const legenda = (frases ? [frases.principal, frases.aviso, aindaVem] : [aindaVem, legendaDoPeso(tipo, pesoNoTotal, lancado)])
        .filter(Boolean)
        .join(" · ")
    const contraMedia = media == null ? null : lancado - media
    const formaDoMaior = maior ? (maior.payment_card?.name ?? paymentMethodLabel(maior.payment_method)) : ""

    return (
        <PageSection aria-label={`Resumo de ${mes}`}>
            <div className="flex flex-wrap items-stretch gap-x-8 gap-y-6">
                <div className="grid w-md gap-3">
                    <div>
                        <Caption>{`${despesa ? "Gasto" : "Recebido"} em ${mes}`}</Caption>
                        <MoneyDisplay value={lancado} size="3xl" />
                    </div>
                    <BarraDoMes {...props} />
                    {legenda ? <Caption>{legenda}</Caption> : null}
                </div>
                <div className="flex flex-1 flex-wrap items-stretch gap-x-8 gap-y-6">
                    <Separator orientation="vertical" className="h-auto self-stretch" />
                    <div className="grid min-w-36 flex-1 content-center gap-1">
                        <Caption>{comparacao.mesmoPonto ? `vs mesmo dia de ${mesAnterior}` : `vs ${mesAnterior}`}</Caption>
                        <MoneyDisplay value={comparacao.anterior} size="xl" />
                        <StatCardDelta
                            className="w-fit"
                            current={comparacao.atual}
                            previous={comparacao.anterior}
                            better={despesa ? "down" : "up"}
                            context={comparacao.mesmoPonto ? `em relação ao mesmo dia de ${mesAnterior}` : `em relação a ${mesAnterior}`}
                        />
                    </div>
                    {media != null && contraMedia != null ? (
                        <>
                            <Separator orientation="vertical" className="h-auto self-stretch" />
                            <div className="grid min-w-36 flex-1 content-center gap-1">
                                <Caption>Média de 6 meses</Caption>
                                <MoneyDisplay value={media} size="xl" />
                                <Caption>
                                    {Math.abs(contraMedia) < 0.005
                                        ? "Igual à média"
                                        : `${currencyBRL(Math.abs(contraMedia))} ${contraMedia > 0 ? "acima" : "abaixo"}`}
                                </Caption>
                            </div>
                        </>
                    ) : null}
                    <Separator orientation="vertical" className="h-auto self-stretch" />
                    <div className="grid min-w-36 flex-1 content-center gap-1">
                        <Caption>Lançamentos</Caption>
                        <span className="nums text-lg font-semibold">{quantidade}</span>
                        {maior ? (
                            <Caption>
                                {`maior: ${currencyBRL(Number(maior.amount))}${formaDoMaior ? ` · ${formaDoMaior}` : ""}`}
                            </Caption>
                        ) : null}
                    </div>
                </div>
            </div>
        </PageSection>
    )
}
