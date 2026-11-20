"use client"

import { ChartBarList, type ChartConfig } from "@/components/ui/chart"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection } from "@/components/ui/page-section"
import { StatCardDelta } from "@/components/ui/stat-card"
import { Caption, Muted } from "@/components/ui/typography"
import { parseYearMonth } from "@/lib/budget-month"
import { formatMonthShortPtBr } from "@/lib/transaction-date"
import { legendaDoPeso, nomeDoMes, type FaixaDoMesProps } from "./faixa-metricas"

const maiuscula = (s: string) => s.charAt(0).toLocaleUpperCase("pt-BR") + s.slice(1)

/** F — a faixa como barras comparadas: o mês, o anterior, a média e o limite na mesma escala. */
export function FaixaBarras({
    tipo,
    yearMonth,
    lancado,
    limite,
    pesoNoTotal,
    comparacao,
    media,
    quantidade,
    hojeYmd,
}: FaixaDoMesProps) {
    const despesa = tipo === "expense"
    const mes = nomeDoMes(yearMonth)
    const anterior = parseYearMonth(comparacao.mesAnterior)
    const curtoAnterior = formatMonthShortPtBr(new Date(anterior.y, anterior.m - 1, 1))
    const mesAnterior = maiuscula(nomeDoMes(comparacao.mesAnterior))
    const diaAnterior = Math.min(Number(hojeYmd.slice(8, 10)), new Date(anterior.y, anterior.m, 0).getDate())
    const linha = [legendaDoPeso(tipo, pesoNoTotal, lancado), `${quantidade} ${quantidade === 1 ? "lançamento" : "lançamentos"}`]
        .filter(Boolean)
        .join(" · ")

    const barras = [
        { chave: "mes", valor: lancado },
        { chave: "anterior", valor: comparacao.anterior },
        ...(media != null ? [{ chave: "media", valor: media }] : []),
        ...(despesa && limite != null && limite > 0 ? [{ chave: "limite", valor: limite }] : []),
    ]
    // O mês aberto leva a cor da série; os outros ficam na tinta apagada.
    const config: ChartConfig = {
        mes: { label: maiuscula(mes) },
        anterior: {
            label: comparacao.mesmoPonto ? `${mesAnterior}, até dia ${diaAnterior}` : mesAnterior,
            color: "var(--muted-foreground)",
        },
        media: { label: "Média de 6 meses", color: "var(--muted-foreground)" },
        limite: { label: "Limite", color: "var(--muted-foreground)" },
    }

    return (
        <PageSection aria-label={`Resumo de ${mes}`}>
            <div className="grid grid-cols-5 items-center gap-6">
                <div className="col-span-3 grid gap-1">
                    <Caption>{`${despesa ? "Gasto" : "Recebido"} em ${mes}`}</Caption>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <MoneyDisplay value={lancado} size="3xl" />
                        <StatCardDelta
                            current={comparacao.atual}
                            previous={comparacao.anterior}
                            better={despesa ? "down" : "up"}
                            context={`em relação ${comparacao.mesmoPonto ? "ao mesmo dia de" : "a"} ${nomeDoMes(comparacao.mesAnterior)}`}
                        />
                        <Caption>{`vs ${curtoAnterior}`}</Caption>
                    </div>
                    {linha ? <Muted>{linha}</Muted> : null}
                </div>
                <ChartBarList
                    className="col-span-2"
                    data={barras}
                    nameKey="chave"
                    dataKey="valor"
                    config={config}
                    label={`${despesa ? "O gasto" : "A receita"} de ${mes} contra ${mesAnterior}${media != null ? ", a média" : ""}${barras.some((b) => b.chave === "limite") ? " e o limite" : ""}`}
                />
            </div>
        </PageSection>
    )
}
