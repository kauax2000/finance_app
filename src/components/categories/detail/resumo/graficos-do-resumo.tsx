"use client"

import { useMemo } from "react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartArea, ChartBars, ChartDonut, ChartLine, ChartReferenceLine, type ChartConfig } from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import { shiftYearMonth, shortLabelYearMonthPt } from "@/lib/budget-month"
import type { Fatia, TipoDaCategoria } from "@/lib/categoria-detalhe"
import type { porDiaDaSemana, porFaixaDeValor, ritmoDoMes } from "@/lib/categoria-resumo"
import { currencyBRL } from "@/lib/formatters"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, tileColorFor } from "@/lib/tile-palette"
import { mesPorExtenso } from "./rotulos"

// A cor da categoria só no traço e na área (12 meses e ritmo); barras e rosca na rampa neutra.
const CONFIG_DIAS = { total: { label: "Total", color: "var(--chart-1)" } } satisfies ChartConfig
const CONFIG_FAIXAS = { quantidade: { label: "Lançamentos", color: "var(--chart-1)" } } satisfies ChartConfig
const CONFIG_PAGAMENTO = {} satisfies ChartConfig

/** O nome da barra de maior valor, ou null quando tudo é zero. */
function maiorDe<T>(linhas: T[], nome: (l: T) => string, valor: (l: T) => number): string | null {
    let melhor: T | null = null
    for (const l of linhas) if (valor(l) > 0 && (!melhor || valor(l) > valor(melhor))) melhor = l
    return melhor ? nome(melhor) : null
}

function CartaoDoGrafico({ titulo, apoio, children }: { titulo: string; apoio?: string; children: React.ReactNode }) {
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle size="sm">{titulo}</CardTitle>
                {apoio ? (
                    <CardAction>
                        <Caption className="nums">{apoio}</Caption>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}

/** Os gráficos do mês: 12 meses e ritmo em cima; forma de pagamento, dias da semana e tamanho das compras embaixo. Cada um some sem dado. */
export function GraficosDoResumo({
    tipo,
    cor,
    nomeDaCategoria,
    yearMonth,
    aberto,
    serie,
    media,
    ritmo,
    porPagamento,
    diasDaSemana,
    faixas,
}: {
    tipo: TipoDaCategoria
    /** A cor guardada da categoria (`categories.color`); resolvida por `tileColorFor`. */
    cor: string | null
    nomeDaCategoria: string
    yearMonth: string
    aberto: boolean
    serie: { yearMonth: string; total: number }[]
    media: number | null
    ritmo: ReturnType<typeof ritmoDoMes>
    porPagamento: Fatia[]
    diasDaSemana: ReturnType<typeof porDiaDaSemana>
    faixas: ReturnType<typeof porFaixaDeValor>
}) {
    const despesa = tipo === "expense"
    const corDaSerie = tileColorFor(cor) ?? (despesa ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT)
    const oQue = despesa ? "Gasto" : "Entrada"

    const meses = useMemo(
        () => serie.map((p) => ({ mes: shortLabelYearMonthPt(p.yearMonth), total: p.total })),
        [serie],
    )
    const configMeses = useMemo(
        () => ({ total: { label: nomeDaCategoria, color: corDaSerie } }) satisfies ChartConfig,
        [nomeDaCategoria, corDaSerie],
    )
    const mesAtual = mesPorExtenso(yearMonth)
    const mesAnterior = mesPorExtenso(shiftYearMonth(yearMonth, -1))
    const configRitmo = useMemo(
        () =>
            ({
                atual: { label: mesAtual, color: corDaSerie },
                anterior: { label: mesAnterior, color: "var(--muted-foreground)", dashed: true },
            }) satisfies ChartConfig,
        [mesAtual, mesAnterior, corDaSerie],
    )

    const comMeses = serie.some((p) => p.total !== 0)
    const comRitmo = ritmo.some((d) => (d.atual ?? 0) !== 0 || d.anterior !== 0)
    const hoje = ritmo.filter((d) => d.atual != null).at(-1)?.dia ?? null
    const comDias = diasDaSemana.some((d) => d.total > 0)
    const comFaixas = faixas.some((f) => f.quantidade > 0)
    const comPagamento = porPagamento.length > 0
    const comMedia = media != null && media > 0

    if (!comMeses && !comRitmo && !comDias && !comFaixas && !comPagamento) return null

    return (
        <div className="grid gap-3">
            {comMeses || comRitmo ? (
                <div className="grid gap-3 md:grid-cols-[3fr_2fr]">
                    {comMeses ? (
                        <CartaoDoGrafico titulo="Últimos 12 meses" apoio={comMedia ? `média ${currencyBRL(media)}` : undefined}>
                            <ChartArea
                                variant="gradient"
                                marker="last"
                                config={configMeses}
                                data={meses}
                                x="mes"
                                aspect="auto"
                                className="h-44 w-full"
                                label={`${oQue} em ${nomeDaCategoria} em cada um dos últimos 12 meses`}
                                description={
                                    comMedia
                                        ? `O último ponto é o mês aberto. A linha tracejada é a média, ${currencyBRL(media)}.`
                                        : "O último ponto é o mês aberto."
                                }
                            >
                                {comMedia ? <ChartReferenceLine y={media} tone="average" ifOverflow="extendDomain" /> : null}
                            </ChartArea>
                        </CartaoDoGrafico>
                    ) : null}
                    {comRitmo ? (
                        <CartaoDoGrafico
                            titulo="Ritmo do mês"
                            apoio={aberto && hoje != null ? `até dia ${hoje}` : "mês inteiro"}
                        >
                            <ChartLine
                                config={configRitmo}
                                data={ritmo}
                                x="dia"
                                aspect="auto"
                                className="h-44 w-full"
                                label={`${oQue} acumulado dia a dia em ${mesAtual}, contra ${mesAnterior}`}
                                description={`A linha cheia é ${mesAtual}; a tracejada, ${mesAnterior}.`}
                            />
                        </CartaoDoGrafico>
                    ) : null}
                </div>
            ) : null}
            {comPagamento || comDias || comFaixas ? (
                <div className="grid gap-3 md:grid-cols-3">
                    {comPagamento ? (
                        <CartaoDoGrafico titulo="Como foi pago">
                            <ChartDonut
                                config={CONFIG_PAGAMENTO}
                                data={porPagamento}
                                nameKey="nome"
                                dataKey="valor"
                                className="h-32"
                                label={`${oQue} do mês por forma de pagamento`}
                            />
                        </CartaoDoGrafico>
                    ) : null}
                    {comDias ? (
                        <CartaoDoGrafico titulo="Dias da semana">
                            <ChartBars
                                config={CONFIG_DIAS}
                                data={diasDaSemana}
                                x="nome"
                                selected={maiorDe(diasDaSemana, (d) => d.nome, (d) => d.total)}
                                aspect="auto"
                                className="h-32 w-full"
                                label={`${oQue} do mês por dia da semana`}
                                description="O dia de maior valor em destaque."
                            />
                        </CartaoDoGrafico>
                    ) : null}
                    {comFaixas ? (
                        <CartaoDoGrafico titulo={despesa ? "Tamanho das compras" : "Tamanho das entradas"}>
                            <ChartBars
                                config={CONFIG_FAIXAS}
                                data={faixas}
                                x="faixa"
                                format="number"
                                selected={maiorDe(faixas, (f) => f.faixa, (f) => f.quantidade)}
                                aspect="auto"
                                className="h-32 w-full"
                                label={despesa ? "Quantas compras em cada faixa de valor" : "Quantas entradas em cada faixa de valor"}
                                description="A faixa mais comum em destaque."
                            />
                        </CartaoDoGrafico>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
