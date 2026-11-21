"use client"

import { createElement, useMemo } from "react"
import { ArrowLongRightIcon, ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/16/solid"
import { CreditCardBrandChip } from "@/components/credit-cards/credit-card-brand-chip"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ItemContent, ItemMedia } from "@/components/ui/item"
import {
    ChartAnnotation,
    ChartArea,
    ChartBars,
    ChartDonut,
    ChartHeatStrip,
    ChartLine,
    ChartReferenceDot,
    ChartReferenceLine,
    ChartSplit,
    ChartSwatch,
    splitPercents,
    type ChartConfig,
} from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import { shiftYearMonth } from "@/lib/budget-month"
import { diferencaPorForma, type FatiaDePagamento, type TipoDaCategoria } from "@/lib/categoria-detalhe"
import {
    diasUteisEFimDeSemana,
    resumoDoRitmo,
    tendenciaDosMeses,
    type porDiaDaSemana,
    type porFaixaDeValor,
    type ritmoDoMes,
} from "@/lib/categoria-resumo"
import { currencyBRL, percentBR } from "@/lib/formatters"
import { paymentMethodColor } from "@/lib/payment-methods"
import { paymentMethodIcon } from "@/lib/payment-method-icon"
import type { CreditCard } from "@/lib/supabase"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, tileColorFor, tileVividColor } from "@/lib/tile-palette"
import { reaisInteiros } from "../regua-do-mes-contas"
import { diaPorExtenso, mesCurto, mesPorExtenso } from "./rotulos"

// A cor da categoria no traço, na área e no destaque de barra; as outras barras no neutro (o verde da rampa leria como entrada).
const CONFIG_DIAS = { total: { label: "Total", color: "var(--muted)" } } satisfies ChartConfig
const CONFIG_FAIXAS = { quantidade: { label: "Lançamentos", color: "var(--muted)" } } satisfies ChartConfig
// A segunda forma do mesmo tipo (dois cartões de crédito) sai a 60% da cor, a terceira em diante a 35%.
const ESMAECER_A_REPETIDA = [100, 60, 35]

/** A diferença de uma forma contra o mês anterior: "+R$ 312" no tom do veredito, "igual" ou "novo" (null). */
function diferencaDaForma(diferenca: number | null, despesa: boolean) {
    if (diferenca == null) return { texto: "novo", classe: undefined }
    if (Math.round(diferenca) === 0) return { texto: "igual", classe: undefined }
    const bom = despesa ? diferenca < 0 : diferenca > 0
    return {
        texto: `${diferenca > 0 ? "+" : "−"}${reaisInteiros(Math.abs(diferenca))}`,
        classe: bom ? "text-success-muted-foreground" : "text-warning-muted-foreground",
    }
}

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

/** O nome da barra de maior valor, ou null quando tudo é zero. */
function maiorDe<T>(linhas: T[], nome: (l: T) => string, valor: (l: T) => number): string | null {
    let melhor: T | null = null
    for (const l of linhas) if (valor(l) > 0 && (!melhor || valor(l) > valor(melhor))) melhor = l
    return melhor ? nome(melhor) : null
}

function CartaoDoGrafico({ titulo, apoio, children }: { titulo: string; apoio?: React.ReactNode; children: React.ReactNode }) {
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle size="sm">{titulo}</CardTitle>
                {apoio ? (
                    <CardAction>
                        <Caption>{apoio}</Caption>
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
    porPagamentoAnterior,
    cartoes,
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
    porPagamento: FatiaDePagamento[]
    porPagamentoAnterior: FatiaDePagamento[]
    cartoes: Pick<CreditCard, "id" | "brand">[]
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
    // "Últimos 6 meses" mostra só a ponta da série (pedido do dono, 21/11/2026); o "Mês a mês" segue com todos.
    const seisMeses = useMemo(() => meses.slice(-6), [meses])
    const seisComParcial = parcial != null && seisMeses[0]?.mes === parcial[0]
    const ultimo = meses.at(-1)
    const maior = seisMeses.length >= 2 ? seisMeses.reduce((a, b) => (b.total > a.total ? b : a)) : null
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
    const contaDoRitmo = resumoDoRitmo(ritmo, { aberto })
    const hoje = contaDoRitmo.hoje
    const pontoDeHoje = ritmo[hoje - 1]
    const ultimoDoRitmo = ritmo.at(-1)
    const seloRitmo = pontoDeHoje ? seloDoRitmo(contaDoRitmo.diferenca, pontoDeHoje.anterior, mesAnterior, despesa) : null
    // Fechado, os dois pontos dividem o último dia: o rótulo do maior sobe e o do menor desce, para não se cruzarem.
    const atualEmCima = !aberto && (pontoDeHoje?.atual ?? 0) >= (contaDoRitmo.anteriorFinal ?? 0)
    const corDoVeu = seloRitmo?.tom === "success" ? "var(--success)" : seloRitmo?.tom === "warning" ? "var(--warning)" : null
    // O acumulado parte do zero antes do dia 1: as duas linhas nascem na base, como a área ao lado.
    const ritmoDesdeZero = useMemo(() => [{ dia: 0, atual: 0, anterior: 0, faixa: [0, 0] as [number, number], projecao: null }, ...ritmo], [ritmo])
    const comDias = diasDaSemana.some((d) => d.total > 0)
    const lados = diasUteisEFimDeSemana(diasDaSemana)
    const comFaixas = faixas.some((f) => f.quantidade > 0)
    const comPagamento = porPagamento.length > 0
    // O mesmo arredondamento da barra, para o destaque e a lista baterem com ela.
    const pctsPagamento = splitPercents(porPagamento.map((f) => f.valor))
    // Cada forma tem a sua cor fixa; pela chave, e não pelo nome, para a repetida esmaecer pela ordem do valor.
    const configPagamento = useMemo(() => {
        const vistas: Record<string, number> = {}
        return Object.fromEntries(
            porPagamento.map((f) => {
                const n = vistas[f.forma] ?? 0
                vistas[f.forma] = n + 1
                const pct = ESMAECER_A_REPETIDA[Math.min(n, ESMAECER_A_REPETIDA.length - 1)]
                const cor = paymentMethodColor(f.forma)
                return [f.chave, { label: f.nome, color: pct === 100 ? cor : `color-mix(in oklab, ${cor} ${pct}%, transparent)` }]
            }),
        ) satisfies ChartConfig
    }, [porPagamento])
    // O ladrilho veste a cor da forma a 18% e o ícone a cor cheia; a repetida esmaece os dois, pela cor já esmaecida.
    const ladrilhoDaForma = (chave: string) => {
        const cor = configPagamento[chave].color
        return { backgroundColor: `color-mix(in oklab, ${cor} 18%, transparent)`, color: cor }
    }
    // Sem nada no mês anterior não há contra o que comparar: nenhuma forma é "nova".
    const diferencas = porPagamentoAnterior.length > 0 ? diferencaPorForma(porPagamento, porPagamentoAnterior) : null
    const formaUnica = porPagamento.length === 1 ? porPagamento[0] : null
    const maiorForma = porPagamento[0]
    // A preposição segue a da forma única: "em dinheiro", "sem forma de pagamento", "no <nome>".
    const ondeFoiPago = (f: FatiaDePagamento) =>
        f.forma === "sem-forma" ? "sem forma de pagamento" : f.forma === "cash" ? `em ${f.nome.toLocaleLowerCase("pt-BR")}` : `no ${f.nome}`
    const diferencaUnica = formaUnica && diferencas?.[formaUnica.chave] != null ? diferencaDaForma(diferencas[formaUnica.chave], despesa) : null
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
    // A dica dos dois gráficos de meses: o mês por extenso, contra a média e contra o mês anterior.
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

    if (!comMeses && !comRitmo && !comDias && !comFaixas && !comPagamento) return null

    return (
        <div className="grid gap-3">
            {comMeses || comRitmo ? (
                <div className="grid gap-3 md:grid-cols-2">
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
                        <Card className="min-w-0">
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
                                    {aberto ? (
                                        <ChartAnnotation x={hoje} label={`hoje, dia ${hoje}`} labelPosition="bottom" />
                                    ) : null}
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
                    ) : null}
                </div>
            ) : null}
            {comPagamento || comDias || comFaixas ? (
                <div className="grid gap-3 md:grid-cols-3">
                    {comPagamento ? (
                        <CartaoDoGrafico
                            titulo="Como foi pago"
                            apoio={!formaUnica && diferencas ? `vs ${mesAnterior}${aberto ? " inteiro" : ""}` : undefined}
                        >
                            {formaUnica ? (
                                <div className="flex items-center gap-4">
                                    <ChartDonut
                                        rounded
                                        legend={false}
                                        tooltip={false}
                                        config={configPagamento}
                                        data={porPagamento}
                                        nameKey="chave"
                                        dataKey="valor"
                                        className="size-30 shrink-0"
                                        label={`${oQue} do mês por forma de pagamento: tudo no ${formaUnica.nome}`}
                                        center={
                                            <div
                                                aria-hidden
                                                className="pointer-events-none absolute inset-0 grid place-items-center"
                                                style={{ color: configPagamento[formaUnica.chave].color }}
                                            >
                                                {formaUnica.forma === "credit_card" ? (
                                                    <CreditCardBrandChip
                                                        brand={cartoes.find((c) => c.id === formaUnica.cardId)?.brand ?? null}
                                                    />
                                                ) : (
                                                    // `createElement`: o ícone vem de uma tabela, e não é um componente criado aqui.
                                                    createElement(paymentMethodIcon(formaUnica.forma, "lg"), { className: "size-6" })
                                                )}
                                            </div>
                                        }
                                    />
                                    {/* Nome, contagem e diferença são o mesmo dado em três linhas: sem `gap`. */}
                                    <div className="min-w-0 flex-1 text-sm">
                                        <p className="break-words">
                                            {formaUnica.forma === "sem-forma" ? (
                                                "Tudo sem forma de pagamento"
                                            ) : (
                                                <>
                                                    {formaUnica.forma === "cash" ? "Tudo em" : "Tudo no"}{" "}
                                                    <span className="font-semibold">{formaUnica.forma === "cash" ? formaUnica.nome.toLocaleLowerCase("pt-BR") : formaUnica.nome}</span>
                                                </>
                                            )}
                                        </p>
                                        <p className="nums text-muted-foreground">
                                            {formaUnica.compras} {despesa ? "compra" : "entrada"}
                                            {formaUnica.compras === 1 ? "" : "s"} · {currencyBRL(formaUnica.valor)}
                                        </p>
                                        {diferencaUnica ? (
                                            <p className={cn("nums text-muted-foreground", diferencaUnica.classe)}>
                                                {/* Contra o mês anterior inteiro; com o mês aberto, diz isso, porque o Ritmo ao lado compara no mesmo dia. */}
                                                {diferencaUnica.texto === "igual" ? `igual a ${mesAnterior}${aberto ? " inteiro" : ""}` : `${diferencaUnica.texto} vs ${mesAnterior}${aberto ? " inteiro" : ""}`}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="min-w-0">
                                            <span className="nums text-xl font-semibold">{pctsPagamento[0]}%</span>{" "}
                                            <span className="text-sm text-muted-foreground">{ondeFoiPago(maiorForma)}</span>
                                        </p>
                                        <Caption className="nums shrink-0">{porPagamento.length} formas</Caption>
                                    </div>
                                    <ChartSplit
                                        labels="none"
                                        config={configPagamento}
                                        data={porPagamento}
                                        nameKey="chave"
                                        dataKey="valor"
                                        label={`${oQue} do mês por forma de pagamento`}
                                    />
                                    <ul className="mt-2 grid grid-cols-1 gap-3">
                                        {porPagamento.map((f, i) => {
                                            const d = diferencas ? diferencaDaForma(diferencas[f.chave], despesa) : null
                                            return (
                                                <li key={f.chave} className="flex items-center gap-3 text-sm">
                                                    <ItemMedia variant="tile" style={ladrilhoDaForma(f.chave)}>
                                                        {createElement(paymentMethodIcon(f.forma))}
                                                    </ItemMedia>
                                                    <ItemContent>
                                                        <span className="truncate">{f.nome}</span>
                                                        <span className="nums flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <ChartSwatch color={configPagamento[f.chave].color} />
                                                            <span>
                                                                {pctsPagamento[i]}%
                                                                {d ? (
                                                                    <>
                                                                        {" · "}
                                                                        <span className={d.classe}>{d.texto}</span>
                                                                    </>
                                                                ) : null}
                                                            </span>
                                                        </span>
                                                    </ItemContent>
                                                    <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(f.valor)}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )}
                        </CartaoDoGrafico>
                    ) : null}
                    {comDias ? (
                        <CartaoDoGrafico titulo="Dias da semana">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    {(
                                        [
                                            ["dias úteis", lados.uteis, lados.uteis.total >= lados.fim.total],
                                            ["fim de semana", lados.fim, lados.fim.total > lados.uteis.total],
                                        ] as const
                                    ).map(([nome, lado, maior]) => (
                                        // O % e a legenda são o mesmo dado em duas linhas: sem `gap`.
                                        <div key={nome} className="min-w-0">
                                            <p className={cn("nums text-xl font-semibold", !maior && "text-muted-foreground")}>{lado.pct}%</p>
                                            <p className="nums text-sm text-muted-foreground">
                                                {nome} <span className="whitespace-nowrap">· {reaisInteiros(lado.total)}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <ChartHeatStrip
                                    data={diasDaSemana}
                                    nameKey="nome"
                                    dataKey="total"
                                    color={corDaSerie}
                                    labelText={diaPorExtenso}
                                    label={`${despesa ? "Gasto" : "Entradas"} do mês por dia da semana`}
                                />
                            </div>
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
                            {...dicaDosMeses}
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
