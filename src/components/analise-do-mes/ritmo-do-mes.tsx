"use client"

import { useMemo } from "react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartAnnotation, ChartLine, ChartReferenceDot, type ChartConfig } from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { shiftYearMonth } from "@/lib/budget-month"
import { resumoDoRitmo, type ritmoDoMes } from "@/lib/categoria-resumo"
import { currencyBRL } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { mesPorExtenso } from "./rotulos"

/** O selo do ritmo: a diferença em reais contra o mês anterior no mesmo dia, com a faixa de ±2% do selo da média. */
function seloDoRitmo(diferenca: number | null, anteriorHoje: number, mesAnterior: string, despesa: boolean) {
    if (diferenca == null) return null
    if (Math.abs(diferenca) <= Math.abs(anteriorHoje) * 0.02) return { texto: `igual a ${mesAnterior}`, tom: "neutral" as const }
    const bom = despesa ? diferenca < 0 : diferenca > 0
    return {
        texto: `${reaisInteiros(Math.abs(diferenca))} a ${diferenca < 0 ? "menos" : "mais"} que ${mesAnterior}`,
        tom: bom ? ("success" as const) : ("warning" as const),
    }
}

/** O acumulado do mês dia a dia contra o mês anterior, com o previsto até o fim; some sem dado. */
export function RitmoDoMes({
    ritmo,
    aberto,
    yearMonth,
    corDaSerie,
    despesa,
    oQue,
    className,
}: {
    ritmo: ReturnType<typeof ritmoDoMes>
    aberto: boolean
    yearMonth: string
    /** A cor da linha do mês (a do ladrilho, já resolvida). */
    corDaSerie: string
    despesa: boolean
    /** O que se mede, no nome do gráfico: "Gasto", "Entrada", "Gasto em Carro"… */
    oQue: string
    className?: string
}) {
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
    // O acumulado parte do zero antes do dia 1: as duas linhas nascem na base, como a área ao lado.
    const ritmoDesdeZero = useMemo(() => [{ dia: 0, atual: 0, anterior: 0, faixa: [0, 0] as [number, number], projecao: null }, ...ritmo], [ritmo])

    if (!ritmo.some((d) => (d.atual ?? 0) !== 0 || d.anterior !== 0)) return null

    const contaDoRitmo = resumoDoRitmo(ritmo, { aberto })
    const hoje = contaDoRitmo.hoje
    const pontoDeHoje = ritmo[hoje - 1]
    const ultimoDoRitmo = ritmo.at(-1)
    const seloRitmo = pontoDeHoje ? seloDoRitmo(contaDoRitmo.diferenca, pontoDeHoje.anterior, mesAnterior, despesa) : null
    // Fechado, os dois pontos dividem o último dia: o rótulo do maior sobe e o do menor desce, para não se cruzarem.
    const atualEmCima = !aberto && (pontoDeHoje?.atual ?? 0) >= (contaDoRitmo.anteriorFinal ?? 0)
    const corDoVeu = seloRitmo?.tom === "success" ? "var(--success)" : seloRitmo?.tom === "warning" ? "var(--warning)" : null

    return (
        <Card className={cn("min-w-0", className)}>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CardTitle size="sm">Ritmo do mês</CardTitle>
                    {seloRitmo ? (
                        <Badge tone={seloRitmo.tom} className="whitespace-nowrap">
                            {seloRitmo.texto}
                        </Badge>
                    ) : null}
                </div>
                <CardAction>
                    <Caption className="nums">
                        {aberto ? "deve fechar em " : "fechou em "}
                        <span className="font-semibold text-foreground">{reaisInteiros(contaDoRitmo.fechamento)}</span>
                    </Caption>
                </CardAction>
            </CardHeader>
            <CardContent>
                <ChartLine
                    grid={false}
                    legend={false}
                    yAxis={false}
                    config={configRitmo}
                    data={ritmoDesdeZero}
                    x="dia"
                    xTicks={[1, 8, 15, 22, ritmo.length]}
                    band={corDoVeu ? { dataKey: "faixa", color: corDoVeu } : undefined}
                    ghost={aberto ? { dataKey: "projecao", color: corDaSerie, label: "previsto" } : undefined}
                    tooltipDifference={{ better: despesa ? "lower" : "higher" }}
                    tooltipLabel={(d) => (Number(d) === 0 ? "início do mês" : `${d} de ${mesAtual}`)}
                    aspect="auto"
                    className="h-44 w-full"
                    label={`${oQue} acumulado dia a dia em ${mesAtual}, contra ${mesAnterior}`}
                    description={[
                        `A linha cheia é ${mesAtual}; a tracejada, ${mesAnterior}.`,
                        pontoDeHoje?.atual != null ? `${aberto ? `Até o dia ${hoje}` : "No mês inteiro"}, ${currencyBRL(pontoDeHoje.atual)}${seloRitmo ? `, ${seloRitmo.texto}${aberto ? " no mesmo dia" : ""}` : ""}.` : null,
                        contaDoRitmo.anteriorFinal != null ? `${mesAnterior.charAt(0).toUpperCase()}${mesAnterior.slice(1)} fechou em ${currencyBRL(contaDoRitmo.anteriorFinal)}.` : null,
                        `${aberto ? "Com o previsto, deve fechar em" : "Fechou em"} ${currencyBRL(contaDoRitmo.fechamento)}.`,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    {aberto ? <ChartAnnotation x={hoje} label={`hoje, dia ${hoje}`} labelPosition="bottom" /> : null}
                    {pontoDeHoje?.atual != null ? (
                        <ChartReferenceDot
                            x={hoje}
                            y={pontoDeHoje.atual}
                            color={corDaSerie}
                            hollow={false}
                            label={`${mesAtual} · ${reaisInteiros(pontoDeHoje.atual)}`}
                            labelPosition={atualEmCima ? "top" : "bottom"}
                            labelAlign="end"
                        />
                    ) : null}
                    {contaDoRitmo.anteriorFinal != null && ultimoDoRitmo ? (
                        <ChartReferenceDot
                            x={ultimoDoRitmo.dia}
                            y={contaDoRitmo.anteriorFinal}
                            label={`${mesAnterior} · ${reaisInteiros(contaDoRitmo.anteriorFinal)}`}
                            labelPosition={aberto || !atualEmCima ? "top" : "bottom"}
                        />
                    ) : null}
                    {/* Sem previsto a reta é plana: o ponto repetiria o de hoje, e no telefone os dois rótulos se cruzavam. */}
                    {aberto && ultimoDoRitmo?.projecao != null && ultimoDoRitmo.projecao !== pontoDeHoje?.atual ? (
                        <ChartReferenceDot
                            x={ultimoDoRitmo.dia}
                            y={ultimoDoRitmo.projecao}
                            color={corDaSerie}
                            labelTone="series"
                            label={`previsto · ${reaisInteiros(ultimoDoRitmo.projecao)}`}
                            labelPosition="bottom"
                        />
                    ) : null}
                </ChartLine>
            </CardContent>
        </Card>
    )
}
