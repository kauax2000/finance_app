"use client"

import { useMemo } from "react"
import { ArrowLongRightIcon, ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/16/solid"
import { oQueSeMede } from "@/components/analise-do-mes/compartilhado"
import { mesCurto, mesPorExtenso } from "@/components/analise-do-mes/rotulos"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartArea, ChartReferenceDot, ChartReferenceLine, type ChartConfig } from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { tendenciaDosMeses } from "@/lib/categoria-resumo"
import { currencyBRL, percentBR } from "@/lib/formatters"
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

/** "Últimos 6 meses": a curva com a média, o limite (quando há) e o maior mês. Tocar num mês não navega: o mês da tela muda só pelo seletor. Some sem dado. */
export function UltimosSeisMeses({
    tipo,
    cor,
    nomeDaCategoria,
    yearMonth,
    aberto,
    serie,
    media,
    limite,
}: {
    tipo: TipoDaCategoria
    /** A cor guardada da categoria (`categories.color`); resolvida por `tileColorFor`. */
    cor: string | null
    nomeDaCategoria: string
    yearMonth: string
    aberto: boolean
    serie: { yearMonth: string; total: number }[]
    media: number | null
    /** O limite do mês (só despesa); null sem ele. */
    limite: number | null
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

    const comMedia = media != null && media > 0
    const comLimite = despesa && limite != null && limite > 0
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

    if (!serie.some((p) => p.total !== 0)) return null

    const descricao = [
        "O último ponto é o mês aberto.",
        comMedia ? `A linha tracejada é a média, ${currencyBRL(media)}.` : null,
        comLimite ? `A outra linha é o limite, ${currencyBRL(limite)}.` : null,
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <Card className="min-w-0">
            {/* Sem o valor do mês: ele já está no topo da página (pedido do dono, 21/11/2026). */}
            <CardHeader>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CardTitle size="sm">Últimos 6 meses</CardTitle>
                    {selo ? (
                        // O selo (22) transborda 1px de cada lado: a linha fica com a altura do título (20), como a dos cartões vizinhos.
                        <Badge tone={selo.tom} className="-my-px max-md:hidden">
                            {mesCurto(yearMonth)} {selo.texto}
                        </Badge>
                    ) : null}
                </div>
                {/* No desktop a tendência, e não a média: a média já está rotulada na linha do gráfico. No telefone
                    a tendência sai e o selo vai para a direita, como o "+10%" da Comparação (pedido do dono, 27/11/2026). */}
                {tendencia || selo ? (
                    <CardAction>
                        {selo ? (
                            <Badge tone={selo.tom} className="-my-px md:hidden">
                                {mesCurto(yearMonth)} {selo.texto}
                            </Badge>
                        ) : null}
                        {tendencia ? (
                            <Caption className="nums inline-flex items-center gap-1 max-md:hidden">
                                <tendencia.Icone aria-hidden className="size-3.5" />
                                {tendencia.texto}
                            </Caption>
                        ) : null}
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
                    className="h-56 w-full"
                    label={`${oQue} em ${nomeDaCategoria} nos últimos 6 meses`}
                    description={descricao}
                >
                    {comMedia ? (
                        <ChartReferenceLine y={media} tone="average" ifOverflow="extendDomain" label={`média ${reaisInteiros(media)}`} />
                    ) : null}
                    {comLimite ? (
                        <ChartReferenceLine y={limite} ifOverflow="extendDomain" label={`limite ${reaisInteiros(limite)}`} />
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
    )
}
