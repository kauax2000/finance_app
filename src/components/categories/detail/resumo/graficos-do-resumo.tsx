"use client"

import { useMemo } from "react"
import { ArrowLongRightIcon, ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/16/solid"
import { ComoFoiPago } from "@/components/analise-do-mes/como-foi-pago"
import { oQueSeMede } from "@/components/analise-do-mes/compartilhado"
import { DiasDaSemana } from "@/components/analise-do-mes/dias-da-semana"
import { RitmoDoMes } from "@/components/analise-do-mes/ritmo-do-mes"
import { mesCurto, mesPorExtenso } from "@/components/analise-do-mes/rotulos"
import { TamanhoDasCompras } from "@/components/analise-do-mes/tamanho-das-compras"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartArea, ChartReferenceDot, ChartReferenceLine, type ChartConfig } from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import type { FatiaDePagamento, TipoDaCategoria } from "@/lib/categoria-detalhe"
import {
    tendenciaDosMeses,
    type concentracaoDasCompras,
    type porDiaDaSemana,
    type ritmoDoMes,
} from "@/lib/categoria-resumo"
import { currencyBRL, percentBR } from "@/lib/formatters"
import type { CreditCard } from "@/lib/supabase"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, tileColorFor, tileVividColor } from "@/lib/tile-palette"
import { reaisInteiros } from "../regua-do-mes-contas"

/** O selo do mês contra a média: a mesma faixa de ±2% da `vereditoDaMedia`; o tom diz se é bom (gastar menos, receber mais). */
function seloDaMedia(valor: number, media: number | null, despesa: boolean) {
    if (media == null || media <= 0) return null
    const delta = (valor - media) / media
    if (Math.abs(delta) < 0.02) return { texto: "na média", tom: "neutral" as const }
    const bom = despesa ? delta < 0 : delta > 0
    return {
        texto: `${delta > 0 ? "+" : "−"}${percentBR(Math.abs(delta), { maximumFractionDigits: 0 })} vs média`,
        tom: bom ? ("success" as const) : ("warning" as const),
    }
}

/** Os gráficos do mês: últimos meses e ritmo em cima; forma de pagamento, dias da semana e tamanho das compras embaixo. Cada um some sem dado. */
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
    porPagamentoAnterior,
    cartoes,
    diasDaSemana,
    concentracao,
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
    porPagamento: FatiaDePagamento[]
    porPagamentoAnterior: FatiaDePagamento[]
    cartoes: Pick<CreditCard, "id" | "brand">[]
    diasDaSemana: ReturnType<typeof porDiaDaSemana>
    concentracao: ReturnType<typeof concentracaoDasCompras>
    /** Abre esta tela noutro mês (`YYYY-MM`): o toque numa barra do "Mês a mês". */
}) {
    const despesa = tipo === "expense"
    // A série tem a cor que o ladrilho desenha, e não a parada crua da paleta.
    const corDaSerie = tileVividColor(tileColorFor(cor) ?? (despesa ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT))
    const oQue = oQueSeMede(despesa)

    // Os meses zerados do começo achatariam a curva: ela abre no primeiro mês com valor, com no mínimo 3 pontos.
    const { meses, parcial } = useMemo(() => {
        const primeiro = serie.findIndex((p) => p.total !== 0)
        const inicio = primeiro < 0 ? 0 : Math.max(0, Math.min(primeiro, serie.length - 3))
        const meses = serie.slice(inicio).map((p) => ({ mes: mesCurto(p.yearMonth), yearMonth: p.yearMonth, total: p.total }))
        // O primeiro mês com valor depois do começo da janela é o mês em que a categoria começou: pela metade.
        const parcial = inicio > 0 && inicio === primeiro ? [meses[0].mes] : undefined
        return { meses, parcial }
    }, [serie])
    // "Últimos 6 meses" mostra só a ponta da série (pedido do dono, 21/11/2026).
    const seisMeses = useMemo(() => meses.slice(-6), [meses])
    const seisComParcial = parcial != null && seisMeses[0]?.mes === parcial[0]
    const ultimo = meses.at(-1)
    const maior = seisMeses.length >= 2 ? seisMeses.reduce((a, b) => (b.total > a.total ? b : a)) : null
    const marcaDoMaior = maior && maior.total > 0 && maior.yearMonth !== yearMonth ? maior : null
    const configMeses = useMemo(
        () => ({ total: { label: nomeDaCategoria, color: corDaSerie } }) satisfies ChartConfig,
        [nomeDaCategoria, corDaSerie],
    )

    const comMeses = serie.some((p) => p.total !== 0)
    const comRitmo = ritmo.some((d) => (d.atual ?? 0) !== 0 || d.anterior !== 0)
    const comDias = diasDaSemana.some((d) => d.total > 0)
    const comCompras = concentracao.quantidade > 0
    const comPagamento = porPagamento.length > 0
    const comMedia = media != null && media > 0
    const selo = ultimo ? seloDaMedia(ultimo.total, media, despesa) : null
    const tendencia = useMemo(() => {
        const t = tendenciaDosMeses(seisMeses, { aberto, primeiroPelaMetade: seisComParcial })
        if (!t) return null
        const desde = `desde ${mesCurto(t.desde)}`
        // Dentro de ±2% a categoria está parada: a mesma faixa do selo da média.
        if (Math.abs(t.variacao) < 0.02) return { Icone: ArrowLongRightIcon, texto: `estável ${desde}` }
        const pct = percentBR(Math.abs(t.variacao), { maximumFractionDigits: 0 })
        return t.variacao > 0
            ? { Icone: ArrowTrendingUpIcon, texto: `+${pct} ${desde}` }
            : { Icone: ArrowTrendingDownIcon, texto: `−${pct} ${desde}` }
    }, [seisMeses, aberto, seisComParcial])
    const legendaDaMedia = comMedia ? `média ${reaisInteiros(media)}` : undefined
    // A dica do gráfico de meses: o mês por extenso, contra a média e contra o mês anterior.
    const dicaDosMeses = {
        delta: true,
        tooltipReference: comMedia
            ? { value: media, label: "média", better: despesa ? ("lower" as const) : ("higher" as const) }
            : undefined,
        tooltipLabel: (x: unknown) => {
            const ponto = meses.find((m) => m.mes === x)
            return ponto ? mesPorExtenso(ponto.yearMonth) : String(x)
        },
    }

    if (!comMeses && !comRitmo && !comDias && !comCompras && !comPagamento) return null

    return (
        <div className="grid gap-3">
            {comMeses || comRitmo ? (
                // Pela largura da seção, no mesmo degrau da trinca de baixo (@5xl): enquanto a trinca está em duas colunas, com o terceiro cartão na linha inteira, os dois de cima também ocupam a linha inteira, para não ficarem menores que ele.
                <div className="@container/par">
                <div className="grid gap-3 @5xl/par:grid-cols-2">
                    {comMeses ? (
                        <Card className="min-w-0">
                            {/* Sem o valor do mês: ele já está no topo da página (pedido do dono, 21/11/2026). */}
                            <CardHeader>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <CardTitle size="sm">Últimos 6 meses</CardTitle>
                                    {selo ? (
                                        <Badge tone={selo.tom}>
                                            {mesCurto(yearMonth)} {selo.texto}
                                        </Badge>
                                    ) : null}
                                </div>
                                {/* A tendência, e não a média: a média já está rotulada na linha do gráfico. */}
                                {tendencia ? (
                                    <CardAction>
                                        <Caption className="nums inline-flex items-center gap-1">
                                            <tendencia.Icone aria-hidden className="size-3.5" />
                                            {tendencia.texto}
                                        </Caption>
                                    </CardAction>
                                ) : null}
                            </CardHeader>
                            <CardContent>
                                <ChartArea
                                    grid={false}
                                    variant="gradient"
                                    marker="last"
                                    yAxis={false}
                                    config={configMeses}
                                    data={seisMeses}
                                    x="mes"
                                    {...dicaDosMeses}
                                    aspect="auto"
                                    className="h-44 w-full"
                                    label={`${oQue} em ${nomeDaCategoria} nos últimos 6 meses`}
                                    description={
                                        comMedia
                                            ? `O último ponto é o mês aberto. A linha tracejada é a média, ${currencyBRL(media)}.`
                                            : "O último ponto é o mês aberto."
                                    }
                                >
                                    {comMedia ? (
                                        <ChartReferenceLine y={media} tone="average" ifOverflow="extendDomain" label={legendaDaMedia} />
                                    ) : null}
                                    {marcaDoMaior ? (
                                        <ChartReferenceDot
                                            x={marcaDoMaior.mes}
                                            y={marcaDoMaior.total}
                                            color={corDaSerie}
                                            label={`${marcaDoMaior.mes} · ${reaisInteiros(marcaDoMaior.total)} (maior)`}
                                        />
                                    ) : null}
                                </ChartArea>
                            </CardContent>
                        </Card>
                    ) : null}
                    {comRitmo ? (
                        <RitmoDoMes ritmo={ritmo} aberto={aberto} yearMonth={yearMonth} corDaSerie={corDaSerie} despesa={despesa} oQue={oQue} />
                    ) : null}
                </div>
                </div>
            ) : null}
            {comPagamento || comDias || comCompras ? (
                // Pela largura da seção, não da janela: com a barra lateral aberta, três colunas a 768px davam cartões de ~220px e tudo se encavalava.
                <div className="@container/trio">
                <div className="grid gap-3 @2xl/trio:grid-cols-2 @5xl/trio:grid-cols-3">
                    {comPagamento ? (
                        <ComoFoiPago
                            porPagamento={porPagamento}
                            porPagamentoAnterior={porPagamentoAnterior}
                            cartoes={cartoes}
                            aberto={aberto}
                            yearMonth={yearMonth}
                            despesa={despesa}
                        />
                    ) : null}
                    {comDias ? <DiasDaSemana diasDaSemana={diasDaSemana} corDaSerie={corDaSerie} despesa={despesa} /> : null}
                    {comCompras ? (
                        <TamanhoDasCompras
                            concentracao={concentracao}
                            corDaSerie={corDaSerie}
                            despesa={despesa}
                            // Em duas colunas, o terceiro cartão ficaria sozinho na metade da linha: ocupa a linha inteira.
                            className={comPagamento && comDias ? "@2xl/trio:col-span-2 @5xl/trio:col-span-1" : undefined}
                        />
                    ) : null}
                </div>
                </div>
            ) : null}
        </div>
    )
}
