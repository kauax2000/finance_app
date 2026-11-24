"use client"

import { CartaoDoGrafico } from "@/components/analise-do-mes/compartilhado"
import { dataDoGrupo, mesEAno } from "@/components/analise-do-mes/rotulos"
import Link from "next/link"
import { ChevronRightIcon } from "@heroicons/react/16/solid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartSplitCompare, ChartSwatch, type ChartConfig, type ChartSplitCompareRow } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { fixoEmLinhas, foraDoNormal, type ComposicaoDoMes, type GrupoVariavel, type LeituraDoMes as Leitura } from "@/lib/composicao-do-mes"
import { shiftYearMonth } from "@/lib/budget-month"
import { percentBR } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { LeituraDoMes } from "./leitura-do-mes"
import { nomeDoMes, reaisInteiros } from "./regua-do-mes-contas"

/** Até 12 parcelas o progresso vai em pontinhos; acima, só o "N/T". */
const MAX_PONTINHOS = 12
/** Os grupos que a lista mostra antes do "Outros" (o `GRUPOS_A_MOSTRAR` da conta). */
const GRUPOS_VISIVEIS = 3

/** A variação do grupo contra o normal, em reais e em %: "= normal" dentro de ±5%; o tom diz se é bom. */
/** A pílula do grupo contra o normal (C2, 24/11/2026): "↑ 68%" no tom pela régua da despesa, "novo" ou "= normal". */
function variacaoDoGrupo(g: GrupoVariavel, despesa: boolean): { texto: string; tone: "warning" | "success" | "neutral"; titulo?: string } {
    if (g.novo || g.variacao == null || g.normal == null) return { texto: "novo", tone: "warning" }
    if (!foraDoNormal(g.variacao)) return { texto: "= normal", tone: "neutral" }
    const subiu = g.variacao > 0
    return {
        texto: `${subiu ? "↑" : "↓"} ${percentBR(Math.abs(g.variacao), { maximumFractionDigits: 0 })}`,
        tone: subiu === despesa ? "warning" : "success",
        titulo: `${reaisInteiros(Math.abs(g.valor - g.normal))} ${subiu ? "acima" : "abaixo"} do seu normal`,
    }
}

/** A linha "Outros N lançamentos" da lista de gastos. */
function LinhaDeOutros({ outros, className }: { outros: { vezes: number; valor: number }; className?: string }) {
    return (
        <li className={cn("flex items-center gap-2.5 py-2.5 text-sm last:pb-0", className)}>
            <span className="min-w-0 flex-1 text-muted-foreground">
                Outros {outros.vezes} {outros.vezes === 1 ? "lançamento" : "lançamentos"}
            </span>
            <span className="nums w-20 shrink-0 text-right font-mono font-semibold">{reaisInteiros(outros.valor)}</span>
        </li>
    )
}

/**
 * "Do que é feito o mês" em três cartões: a leitura do mês (`LeituraDoMes`) em cima e, embaixo, as duas
 * listas lado a lado — as compras do mês primeiro, mais largas; as parcelas e assinaturas com o rodapé no pé. Some sem lançamento.
 */
export function DoQueEFeitoOMes({
    composicao,
    leitura,
    despesa,
    yearMonth,
    corDaSerie,
    aoLado,
    onVer,
    categoryId,
}: {
    composicao: ComposicaoDoMes
    /** A categoria da tela: os links das parcelas abrem Transações filtrada por ela. */
    categoryId: string
    leitura: Leitura
    despesa: boolean
    yearMonth: string
    /** A cor que o ladrilho da categoria desenha: o variável na barra, no cabeçalho e os pontinhos das parcelas. */
    corDaSerie: string
    /** Um cartão ao lado do gráfico (os Últimos 6 meses), na mesma linha quando há largura. */
    aoLado?: React.ReactNode
    /** O "Ver <grupo>" da leitura: filtra a lista da página. */
    onVer?: (nome: string) => void
}) {
    const { fixo, variavel } = composicao
    // Sem nada a compor, o cartão ao lado (os 6 meses) continua.
    if (fixo.itens.length === 0 && variavel.grupos.length === 0) return aoLado ?? null

    const comFixo = fixo.itens.length > 0
    const comVariavel = variavel.grupos.length > 0
    // Os nomes dizem o que tem em cada lado (23/11/2026; era "O que você controla" × "Já decidido").
    const tituloDoFixo = despesa
        ? fixo.itens.some((i) => i.tipo === "assinatura")
            ? "Parcelas e assinaturas"
            : "Parcelas"
        : "Entradas fixas"
    const config = {
        variavel: { label: despesa ? "Compras do mês" : "Entradas avulsas", color: corDaSerie },
        fixo: { label: tituloDoFixo, color: "var(--color-muted-foreground)" },
    } satisfies ChartConfig
    const nomeMes = nomeDoMes(yearMonth)
    // O gráfico compara com o mês anterior (24/11/2026; era a média, "seu normal"). A leitura segue contra a média.
    const { anterior } = composicao
    const nomeAnterior = anterior ? nomeDoMes(anterior.ym) : null
    // Variação do pedaço contra o mês anterior: some dentro de ±5% ou com o anterior zerado.
    const quanto = (valor: number, antes: number | undefined) => {
        if (!antes) return ""
        const v = (valor - antes) / antes
        return foraDoNormal(v) ? ` ${v > 0 ? "↑" : "↓"} ${percentBR(Math.abs(v), { maximumFractionDigits: 0 })}` : ""
    }
    const parte = (key: "variavel" | "fixo", valor: number, ink?: string) => ({
        key,
        value: valor,
        text: `${reaisInteiros(valor)}${quanto(valor, anterior?.[key])}`,
        shortText: reaisInteiros(valor),
        ...(ink ? { ink } : null),
    })
    const linhasDoGrafico: ChartSplitCompareRow[] = [
        ...(anterior && nomeAnterior
            ? [
                  {
                      label: nomeAnterior,
                      variant: "ghost" as const,
                      segments: (["variavel", "fixo"] as const).map((k) => ({
                          key: k,
                          value: anterior[k],
                          text: reaisInteiros(anterior[k]),
                      })),
                  },
              ]
            : []),
        {
            label: nomeMes,
            segments: [parte("variavel", Math.max(0, variavel.total)), parte("fixo", fixo.total, "var(--card)")],
        },
    ]
    // O selo é a variação do total contra o mês anterior, no tom pela régua da despesa.
    const totalAntes = anterior ? anterior.fixo + anterior.variavel : 0
    const totalAgora = Math.max(0, variavel.total) + fixo.total
    const vsAnterior = totalAntes > 0 ? (totalAgora - totalAntes) / totalAntes : null
    const selo =
        vsAnterior != null && foraDoNormal(vsAnterior) ? (
            <Badge tone={(vsAnterior > 0) === despesa ? "warning" : "success"} size="sm">
                {vsAnterior > 0 ? "+" : "−"}
                {percentBR(Math.abs(vsAnterior), { maximumFractionDigits: 0 })}
            </Badge>
        ) : null
    const maiuscula = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`
    const titulo = nomeAnterior ? "Comparação com o mês anterior" : maiuscula(nomeMes)
    const { linhas, resto } = fixoEmLinhas(fixo.itens, yearMonth)
    // As parcelas em Transações (24/11/2026), em todo o período: todas as da categoria ("Ver todas") ou as
    // de uma compra (a linha); a assinatura abre pelos lançamentos dela.
    const transacoes = (filtro: string) =>
        `/transactions?type=${despesa ? "expense" : "income"}&cats=${encodeURIComponent(categoryId)}&${filtro}`
    const hrefDoItem = (item: (typeof linhas)[number]) =>
        transacoes(item.tipo === "parcela" ? `plan=${encodeURIComponent(item.id)}` : `sub=${encodeURIComponent(item.id)}`)
    // A lista continua (24/11/2026): lado a lado com as parcelas, os grupos que foram para "Outros" se abrem
    // até a altura do cartão vizinho. Cada parcela ocupa ~1,4 linha de gasto (duas linhas de texto).
    const restoDoVariavel = variavel.resto ?? []
    const vagas = comFixo ? Math.round((linhas.length + (resto ? 1 : 0)) * 1.4) - GRUPOS_VISIVEIS : 0
    const abertos =
        restoDoVariavel.length <= Math.max(0, vagas) ? restoDoVariavel : restoDoVariavel.slice(0, Math.max(0, vagas - 1))
    const fechados = restoDoVariavel.slice(abertos.length)
    const outrosLado = fechados.length
        ? { vezes: fechados.reduce((a, g) => a + g.vezes, 0), valor: Math.round(fechados.reduce((a, g) => a + g.valor * 100, 0)) / 100 }
        : null
    const nomeDoResto = (n: number, soParcelas: boolean) =>
        despesa && soParcelas ? (n === 1 ? "parcela" : "parcelas") : despesa ? (n === 1 ? "fixo" : "fixos") : n === 1 ? "entrada fixa" : "entradas fixas"

    return (
        <div className="grid gap-(--space-block)">
            <LeituraDoMes leitura={leitura} despesa={despesa} corDaSerie={corDaSerie} onVer={onVer} />

            {/* O gráfico do mês e o dos últimos 6 meses dividem a linha; os 6 meses à esquerda e mais largos; na mesma divisão da linha de baixo (5:4); abaixo de 36rem da área, empilham. */}
            <div className="@container">
                <div className="grid gap-(--space-block) @xl:grid-cols-[5fr_4fr]">
                    {aoLado}
                    {comFixo || comVariavel ? (
                        <CartaoDoGrafico titulo={titulo} apoio={selo}>
                            {/* As barras ficam no meio da sobra que o cartão ao lado (mais alto) deixa, sem um vão só embaixo. */}
                            <div className="flex flex-1 flex-col justify-center">
                                <ChartSplitCompare
                                    label={`${despesa ? "Gasto" : "Recebido"} de ${nomeMes}${nomeAnterior ? ` comparado com ${nomeAnterior}` : ""}`}
                                    config={config}
                                    rows={linhasDoGrafico}
                                    size="xl"
                                    labelPosition="top"
                                />
                            </div>
                            {/* A legenda no pé, com o valor de cada parte: o fixo, estreito na barra, ganha o número aqui. */}
                            <div className="grid gap-1 pt-4 text-sm">
                                {[
                                    { key: "variavel", cor: corDaSerie, valor: variavel.total, novo: false },
                                    { key: "fixo", cor: config.fixo.color, valor: fixo.total, novo: composicao.caso === "novo" },
                                ]
                                    .filter((l) => l.valor > 0)
                                    .map((l) => (
                                        <span key={l.key} className="flex min-w-0 items-center justify-between gap-3">
                                            <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground">
                                                <ChartSwatch color={l.cor} />
                                                <span className="truncate">
                                                    {config[l.key as keyof typeof config].label}
                                                    {l.novo && composicao.destaque?.nome ? ` · ${composicao.destaque.nome}` : null}
                                                </span>
                                                {l.novo ? (
                                                    <Badge tone="warning" size="xs">
                                                        novo
                                                    </Badge>
                                                ) : null}
                                            </span>
                                            <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(l.valor)}</span>
                                        </span>
                                    ))}
                            </div>
                        </CartaoDoGrafico>
                    ) : null}
                </div>
            </div>

            {/* As compras do mês vêm primeiro e mais largo; abaixo de 36rem da área, empilha nessa ordem. */}
            <div className="@container">
                <div className="grid gap-(--space-block) @xl:grid-cols-[5fr_4fr]">
                    {comVariavel ? (
                        <CartaoDoGrafico
                            titulo={despesa ? "Principais gastos" : "Principais entradas"}
                            apoio="vs seu normal"
                            className={cn(!comFixo && "@xl:col-span-2")}
                        >
                        {/* Uma linha por grupo (C2): o nome com a data ou as vezes em cinza, a pílula contra o normal e o valor. */}
                        <ul className="grid grid-cols-1 divide-y divide-border">
                            {[...variavel.grupos, ...abertos].map((g, i) => {
                                const v = variacaoDoGrupo(g, despesa)
                                return (
                                    <li
                                        key={g.chave}
                                        // Os abertos só aparecem lado a lado com as parcelas; empilhado, ficam no "Outros".
                                        className={cn("flex items-center gap-2.5 py-2.5 text-sm first:pt-0", i >= variavel.grupos.length && "hidden @xl:flex")}
                                    >
                                        <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                                            <span className="truncate">{g.nome}</span>
                                            <span className="nums shrink-0 text-xs text-muted-foreground">
                                                {g.vezes > 1 ? `${g.vezes}×` : g.ultimaYmd ? dataDoGrupo(g.ultimaYmd, g.vezes, yearMonth) : null}
                                            </span>
                                        </span>
                                        <Badge tone={v.tone} size="sm" className="nums shrink-0" title={v.titulo}>
                                            {v.texto}
                                        </Badge>
                                        <span className="nums w-20 shrink-0 text-right font-mono font-semibold">{reaisInteiros(g.valor)}</span>
                                    </li>
                                )
                            })}
                            {variavel.outros ? (
                                <LinhaDeOutros outros={variavel.outros} className={abertos.length ? "@xl:hidden" : undefined} />
                            ) : null}
                            {abertos.length && outrosLado ? <LinhaDeOutros outros={outrosLado} className="hidden @xl:flex" /> : null}
                        </ul>
                        </CartaoDoGrafico>
                    ) : null}

                    {comFixo ? (
                        <CartaoDoGrafico
                            titulo={`${tituloDoFixo} · ${fixo.itens.length} ${fixo.itens.length === 1 ? "ativa" : "ativas"}`}
                            acao={
                                <Button asChild variant="tertiary" size="sm" className="-me-2">
                                    <Link href={transacoes("inst=1")}>Ver todas</Link>
                                </Button>
                            }
                            className={cn(!comVariavel && "@xl:col-span-2")}
                        >
                        {/* R4 (24/11/2026): o nome (com o "novo") e o valor em cima; embaixo, as casas na largura da linha e "3/12 · até ago/27". Uma parcela por bloco, separadas por fio. */}
                        <ul className="grid grid-cols-1 divide-y divide-border">
                            {linhas.map((item) => {
                                const parcela = item.tipo === "parcela" && item.atual != null && item.total != null
                                const restam = parcela ? Math.max(0, item.total! - item.atual!) : 0
                                const fim = parcela ? mesEAno(shiftYearMonth(item.diaYmd.slice(0, 7), restam)) : null
                                return (
                                    <li key={item.id} className="py-1 text-sm first:pt-0">
                                        {/* A linha é o link para as parcelas desta compra: o realce cobre a linha em `rounded-row`. */}
                                        <Link
                                            href={hrefDoItem(item)}
                                            className="-mx-2 grid gap-1.5 rounded-row px-2 py-1.5 outline-none transition-colors duration-(--duration-fast) focus-visible:ring-3 focus-visible:ring-ring/45 hover:bg-muted active:bg-muted"
                                        >
                                        <span className="flex items-center gap-2.5">
                                            <span className="flex min-w-0 flex-1 items-center gap-1.5">
                                                <span className="truncate">{item.nome}</span>
                                                {item.novoDesdeYm ? (
                                                    <Badge tone="warning" size="xs" className="shrink-0" title={`Começou em ${mesEAno(item.novoDesdeYm)}`}>
                                                        novo
                                                    </Badge>
                                                ) : null}
                                            </span>
                                            <span className="nums shrink-0 text-right font-mono font-semibold">{reaisInteiros(item.valor)}</span>
                                            <ChevronRightIcon aria-hidden className="-me-1 size-4 shrink-0 text-muted-foreground" />
                                        </span>
                                        <span className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
                                            {parcela && item.total! <= MAX_PONTINHOS ? (
                                                // As casas ocupam a sobra da linha: ladrilhos de 12px de altura, de cantos arredondados.
                                                <Progress
                                                    className="min-w-0 flex-1"
                                                    size="lg"
                                                    segmentShape="tile"
                                                    value={item.atual}
                                                    max={item.total}
                                                    segments={item.total}
                                                    fillColor={corDaSerie}
                                                    aria-label={`Parcela ${item.atual} de ${item.total}`}
                                                />
                                            ) : null}
                                            <span className={cn("nums shrink-0", !(parcela && item.total! <= MAX_PONTINHOS) && "flex-1")}>
                                                {parcela
                                                    ? restam > 0
                                                        ? `${item.atual}/${item.total} · até ${fim}`
                                                        : `${item.atual}/${item.total} · última`
                                                    : "todo mês"}
                                            </span>
                                        </span>
                                        </Link>
                                    </li>
                                )
                            })}
                            {resto ? (
                                <li className="flex items-baseline gap-2.5 py-2.5 text-sm">
                                    <span className="min-w-0 flex-1">
                                        + {resto.n} {nomeDoResto(resto.n, resto.soParcelas)}
                                        {resto.todosNovos ? (resto.n === 1 ? " nova este mês" : " novas este mês") : null}
                                        <span className="text-muted-foreground"> · {resto.nomes.join(", ")}</span>
                                    </span>
                                    <span className="nums shrink-0 text-right font-mono font-semibold">{reaisInteiros(resto.valor)}</span>
                                </li>
                            ) : null}
                        </ul>
                        </CartaoDoGrafico>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
