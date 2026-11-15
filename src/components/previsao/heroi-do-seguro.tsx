"use client"

import { useMemo } from "react"

import { useQuickCreateSubscription } from "@/components/layout/quick-actions"
import { Button } from "@/components/ui/button"
import { ChartAnnotation, ChartLine, type ChartConfig } from "@/components/ui/chart"
import { MoneyDisplay } from "@/components/ui/money-display"
import { StatCard, StatCardFooter, StatCardHeader, StatCardLabel, StatCardValue } from "@/components/ui/stat-card"
import { Caption, Muted } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"
import { metaDoRitmo } from "@/lib/previsao/gasto-acumulado"
import type { Seguro } from "@/lib/previsao/tipos"
import { formatMonthLongPtBr } from "@/lib/transaction-date"

// O gasto na tinta do texto e o ritmo tracejado neutro: nenhum dos dois é entrada ou saída de estado.
const CONFIG = {
    gasto: { label: "Gasto pela data da compra", color: "var(--foreground)" },
    ritmo: { label: "Ritmo até o fim do mês", color: "var(--muted-foreground)", dashed: true },
} satisfies ChartConfig

/** O seguro do mês, o valor por dia e o gasto acumulado contra a reta do ritmo. */
export function HeroiDoSeguro({
    seguro,
    gasto,
    temReceitaRecorrente,
}: {
    seguro: Seguro
    /** `gastoAcumuladoDoMes(dados, seguro.ym)`: um ponto por dia até hoje. */
    gasto: Array<{ dia: number; acumulado: number }>
    temReceitaRecorrente: boolean
}) {
    const criarAssinatura = useQuickCreateSubscription()
    const [y, m] = seguro.ym.split("-").map(Number)
    const mes = formatMonthLongPtBr(new Date(y, m - 1, 1))
    const ultimoDia = new Date(y, m, 0).getDate()
    const hoje = gasto.at(-1)?.dia ?? 1
    const meta = metaDoRitmo(seguro)
    const comRitmo = meta > 0

    const dados = useMemo(() => {
        const porDia = new Map(gasto.map((p) => [p.dia, p.acumulado]))
        return Array.from({ length: ultimoDia }, (_, i) => {
            const dia = i + 1
            return {
                dia,
                // Os dias depois de hoje ficam sem valor: a linha para em hoje.
                gasto: porDia.get(dia) ?? null,
                // De 0 no dia 1 à meta no último dia.
                ritmo: comRitmo ? (ultimoDia > 1 ? (meta * i) / (ultimoDia - 1) : meta) : null,
            }
        })
    }, [gasto, ultimoDia, comRitmo, meta])

    const gastoHoje = gasto.at(-1)?.acumulado ?? 0
    const ritmoHoje = dados[hoje - 1]?.ritmo
    const descricao =
        `Hoje é dia ${hoje}. Gasto até hoje: ${currencyBRL(gastoHoje)}.` +
        (ritmoHoje != null ? ` O ritmo para hoje é ${currencyBRL(ritmoHoje)}.` : " Sem receita prevista neste mês.")

    return (
        <StatCard size="lg" tone={seguro.seguro < 0 ? "expense" : "default"}>
            <StatCardHeader>
                {/* Uma string só: o rótulo embrulha cada texto num `span` de um flex com `gap`. */}
                <StatCardLabel>{`Seguro para gastar em ${mes}`}</StatCardLabel>
            </StatCardHeader>
            <StatCardValue>
                <MoneyDisplay value={seguro.seguro} tone={seguro.seguro < 0 ? "expense" : "default"} />
            </StatCardValue>
            <StatCardFooter>
                {seguro.seguro > 0
                    ? `${currencyBRL(seguro.porDia)} por dia · ${seguro.diasRestantes === 1 ? "1 dia" : `${seguro.diasRestantes} dias`}, contando hoje`
                    : "Sem folga até o fim do mês"}
            </StatCardFooter>
            <div className="mt-5 grid gap-1">
                <ChartLine
                    config={CONFIG}
                    data={dados}
                    series={comRitmo ? ["gasto", "ritmo"] : ["gasto"]}
                    x="dia"
                    legend
                    aspect="auto"
                    // Um ponto só (dia 1) não traça linha: o marcador do último ponto o mostra.
                    marker={gasto.length === 1 ? "last" : undefined}
                    label={`Gasto de ${mes} pela data da compra contra o ritmo até o fim do mês`}
                    description={descricao}
                    className="h-48 w-full"
                >
                    <ChartAnnotation x={hoje} label="hoje" />
                </ChartLine>
                {comRitmo ? null : <Caption>Sem receita prevista neste mês</Caption>}
            </div>
            {temReceitaRecorrente ? null : (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Muted>Cadastre o salário para prever os próximos meses</Muted>
                    <Button type="button" variant="secondary" onClick={() => criarAssinatura("income")}>
                        Adicionar receita recorrente
                    </Button>
                </div>
            )}
        </StatCard>
    )
}
