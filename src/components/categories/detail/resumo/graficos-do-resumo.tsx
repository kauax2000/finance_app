"use client"

import { useMemo } from "react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ChartArea,
    ChartBars,
    ChartDonut,
    ChartLine,
    ChartReferenceDot,
    ChartReferenceLine,
    type ChartConfig,
} from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import { shiftYearMonth } from "@/lib/budget-month"
import type { Fatia, TipoDaCategoria } from "@/lib/categoria-detalhe"
import type { porDiaDaSemana, porFaixaDeValor, ritmoDoMes } from "@/lib/categoria-resumo"
import { currencyBRL, percentBR } from "@/lib/formatters"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, tileColorFor, tileVividColor } from "@/lib/tile-palette"
import { reaisInteiros } from "../regua-do-mes-contas"
import { mesCurto, mesPorExtenso } from "./rotulos"

// A cor da categoria no traço, na área e no destaque de barra; as outras barras no neutro (o verde da rampa leria como entrada).
const CONFIG_DIAS = { total: { label: "Total", color: "var(--muted)" } } satisfies ChartConfig
const CONFIG_FAIXAS = { quantidade: { label: "Lançamentos", color: "var(--muted)" } } satisfies ChartConfig
// A rosca pula o `--chart-1`: é verde, e verde lê como entrada.
const RAMPA_DO_PAGAMENTO = ["var(--chart-2)", "var(--chart-3)", "var(--chart-5)", "var(--chart-4)"]

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

/** Os gráficos do mês: últimos meses e ritmo em cima; forma de pagamento, dias da semana e tamanho das compras no meio; mês a mês embaixo. Cada um some sem dado. */
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
    onAbrirMes,
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
    /** Abre esta tela noutro mês (`YYYY-MM`): o toque numa barra do "Mês a mês". */
    onAbrirMes: (yearMonth: string) => void
}) {
    const despesa = tipo === "expense"
    // A série tem a cor que o ladrilho desenha, e não a parada crua da paleta.
    const corDaSerie = tileVividColor(tileColorFor(cor) ?? (despesa ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT))
    const oQue = despesa ? "Gasto" : "Entrada"

    // Os meses zerados do começo achatariam a curva: ela abre no primeiro mês com valor, com no mínimo 3 pontos.
    const { meses, parcial } = useMemo(() => {
        const primeiro = serie.findIndex((p) => p.total !== 0)
        const inicio = primeiro < 0 ? 0 : Math.max(0, Math.min(primeiro, serie.length - 3))
        const meses = serie.slice(inicio).map((p) => ({ mes: mesCurto(p.yearMonth), yearMonth: p.yearMonth, total: p.total }))
        // O primeiro mês com valor depois do começo da janela é o mês em que a categoria começou: pela metade.
        const parcial = inicio > 0 && inicio === primeiro ? [meses[0].mes] : undefined
        return { meses, parcial }
    }, [serie])
    const mesAberto = mesCurto(yearMonth)
    const ultimo = meses.at(-1)
    const maior = meses.length >= 2 ? meses.reduce((a, b) => (b.total > a.total ? b : a)) : null
    const marcaDoMaior = maior && maior.total > 0 && maior.yearMonth !== yearMonth ? maior : null
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
    const totalPago = porPagamento.reduce((acc, f) => acc + f.valor, 0)
    const configPagamento = Object.fromEntries(
        porPagamento.map((f, i) => [f.nome, { label: f.nome, color: RAMPA_DO_PAGAMENTO[i % RAMPA_DO_PAGAMENTO.length] }]),
    ) satisfies ChartConfig
    const comMedia = media != null && media > 0
    const selo = ultimo ? seloDaMedia(ultimo.total, media, despesa) : null
    const legendaDaMedia = comMedia ? `média ${reaisInteiros(media)}` : undefined

    if (!comMeses && !comRitmo && !comDias && !comFaixas && !comPagamento) return null

    return (
        <div className="grid gap-3">
            {comMeses || comRitmo ? (
                <div className="grid gap-3 md:grid-cols-[3fr_2fr]">
                    {comMeses ? (
                        <Card className="min-w-0">
                            {/* Sem o valor do mês: ele já está no topo da página (pedido do dono, 21/11/2026). */}
                            <CardHeader>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <CardTitle size="sm">Últimos meses</CardTitle>
                                    {selo ? (
                                        <Badge tone={selo.tom}>
                                            {mesCurto(yearMonth)} {selo.texto}
                                        </Badge>
                                    ) : null}
                                </div>
                                {comMedia ? (
                                    <CardAction>
                                        <Caption className="nums">média {currencyBRL(media)}</Caption>
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
                                    data={meses}
                                    x="mes"
                                    aspect="auto"
                                    className="h-44 w-full"
                                    label={`${oQue} em ${nomeDaCategoria} mês a mês, até 12 meses`}
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
                        <CartaoDoGrafico
                            titulo="Ritmo do mês"
                            apoio={aberto && hoje != null ? `até dia ${hoje}` : "mês inteiro"}
                        >
                            <ChartLine
                                    grid={false}
                                marker="last"
                                yAxis={false}
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
                        // O total vai no cabeçalho: no miolo de uma rosca de 96px ele sairia abaixo da escala.
                        <CartaoDoGrafico titulo="Como foi pago" apoio={currencyBRL(totalPago)}>
                            <ChartDonut
                                config={configPagamento}
                                data={porPagamento}
                                nameKey="nome"
                                dataKey="valor"
                                legend="list"
                                className="size-24"
                                label={`${oQue} do mês por forma de pagamento`}
                            />
                        </CartaoDoGrafico>
                    ) : null}
                    {comDias ? (
                        <CartaoDoGrafico titulo="Dias da semana">
                            <ChartBars
                                    grid={false}
                                config={CONFIG_DIAS}
                                data={diasDaSemana}
                                x="nome"
                                selected={maiorDe(diasDaSemana, (d) => d.nome, (d) => d.total)}
                                selectedColor={corDaSerie}
                                yAxis={false}
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
                                    grid={false}
                                config={CONFIG_FAIXAS}
                                data={faixas}
                                x="faixa"
                                format="number"
                                selected={maiorDe(faixas, (f) => f.faixa, (f) => f.quantidade)}
                                selectedColor={corDaSerie}
                                yAxis={false}
                                aspect="auto"
                                className="h-32 w-full"
                                label={despesa ? "Quantas compras em cada faixa de valor" : "Quantas entradas em cada faixa de valor"}
                                description="A faixa mais comum em destaque."
                            />
                        </CartaoDoGrafico>
                    ) : null}
                </div>
            ) : null}
            {comMeses ? (
                <Card className="min-w-0">
                    <CardHeader>
                        <div className="flex items-baseline gap-2">
                            <CardTitle size="sm">Mês a mês</CardTitle>
                            <Caption>{`desde ${meses[0].mes}`}</Caption>
                        </div>
                        <CardAction>
                            <Caption>toque num mês para abrir</Caption>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <ChartBars
                                    grid={false}
                            config={CONFIG_DIAS}
                            data={meses}
                            x="mes"
                            selected={mesAberto}
                            selectedColor={corDaSerie}
                            valueLabels="selected"
                            barMax={56}
                            partial={parcial}
                            yAxis={false}
                            onSelect={(x) => {
                                const alvo = x && x !== mesAberto ? meses.find((m) => m.mes === x) : null
                                if (alvo) onAbrirMes(alvo.yearMonth)
                            }}
                            aspect="auto"
                            className="h-44 w-full"
                            label={`${oQue} em ${nomeDaCategoria} por mês; escolha um mês para abri-lo`}
                            description={`O mês aberto em destaque.${comMedia ? ` A linha tracejada é a média, ${currencyBRL(media)}.` : ""}`}
                        >
                            {comMedia ? (
                                <ChartReferenceLine y={media} tone="average" ifOverflow="extendDomain" label={legendaDaMedia} />
                            ) : null}
                        </ChartBars>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    )
}
