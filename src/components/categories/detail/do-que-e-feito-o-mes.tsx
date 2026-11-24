"use client"

import { CartaoDoGrafico } from "@/components/analise-do-mes/compartilhado"
import { dataDoGrupo, mesCurto } from "@/components/analise-do-mes/rotulos"
import { Badge } from "@/components/ui/badge"
import { ChartSplitCompare, ChartSwatch, type ChartConfig, type ChartSplitCompareRow } from "@/components/ui/chart"
import { ItemContent } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { fixoEmLinhas, foraDoNormal, type ComposicaoDoMes, type GrupoVariavel, type LeituraDoMes as Leitura } from "@/lib/composicao-do-mes"
import { shiftYearMonth } from "@/lib/budget-month"
import { percentBR } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { LeituraDoMes } from "./leitura-do-mes"
import { nomeDoMes, reaisInteiros } from "./regua-do-mes-contas"

/** "ago/27", a partir de `YYYY-MM`. */
const mesEAno = (ym: string) => `${mesCurto(ym)}/${ym.slice(2, 4)}`

/** Até 12 parcelas o progresso vai em pontinhos; acima, só o "N/T". */
const MAX_PONTINHOS = 12

/** A variação do grupo contra o normal, em reais e em %: "= normal" dentro de ±5%; o tom diz se é bom. */
function variacaoDoGrupo(g: GrupoVariavel, despesa: boolean) {
    if (g.novo || g.variacao == null || g.normal == null) return { texto: "não tinha antes", classe: "text-muted-foreground" }
    if (!foraDoNormal(g.variacao)) return { texto: "= normal", classe: "text-muted-foreground" }
    const subiu = g.variacao > 0
    return {
        texto: `${reaisInteiros(Math.abs(g.valor - g.normal))} ${subiu ? "acima" : "abaixo"} · ${subiu ? "↑" : "↓"} ${percentBR(Math.abs(g.variacao), { maximumFractionDigits: 0 })}`,
        classe: subiu === despesa ? "text-warning" : "text-success",
    }
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
}: {
    composicao: ComposicaoDoMes
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
    const nomeDoResto = (n: number, soParcelas: boolean) =>
        despesa && soParcelas ? (n === 1 ? "parcela" : "parcelas") : despesa ? (n === 1 ? "fixo" : "fixos") : n === 1 ? "entrada fixa" : "entradas fixas"
    // O "Em <mês> já entram" mora no pé do gráfico; aqui fica só quando a última parcela acaba.
    const comRodape = comFixo && fixo.ultimaTerminaYm != null

    return (
        <div className="grid gap-(--space-block)">
            <LeituraDoMes leitura={leitura} despesa={despesa} corDaSerie={corDaSerie} onVer={onVer} />

            {/* O gráfico do mês e o dos últimos 6 meses dividem a linha; os 6 meses à esquerda e mais largos; abaixo de 42rem da área, empilham. */}
            <div className="@container">
                <div className="grid gap-(--space-block) @2xl:grid-cols-[3fr_2fr]">
                    {aoLado}
                    {comFixo || comVariavel ? (
                        <CartaoDoGrafico titulo={titulo} apoio={selo}>
                            <ChartSplitCompare
                                label={`${despesa ? "Gasto" : "Recebido"} de ${nomeMes}${nomeAnterior ? ` comparado com ${nomeAnterior}` : ""}`}
                                config={config}
                                rows={linhasDoGrafico}
                                size="lg"
                            />
                            {/* A legenda no pé, com o valor de cada parte: o fixo, estreito na barra, ganha o número aqui. */}
                            <div className="mt-auto grid gap-1 pt-4 text-sm">
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
                            {fixo.proximoMes > 0 ? (
                                <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                                    <Separator />
                                    <span className="flex justify-between gap-3">
                                        Em {nomeDoMes(shiftYearMonth(yearMonth, 1))} já entram
                                        <span className="nums font-mono font-semibold text-foreground">{reaisInteiros(fixo.proximoMes)}</span>
                                    </span>
                                </div>
                            ) : null}
                        </CartaoDoGrafico>
                    ) : null}
                </div>
            </div>

            {/* As compras do mês vêm primeiro e mais largo; abaixo de 36rem da área, empilha nessa ordem. */}
            <div className="@container">
                <div className="grid gap-(--space-block) @xl:grid-cols-[5fr_4fr]">
                    {comVariavel ? (
                        <CartaoDoGrafico
                            titulo={config.variavel.label}
                            apoio="vs seu normal"
                            className={cn(!comFixo && "@xl:col-span-2")}
                        >
                        <ul className="grid grid-cols-1 gap-3">
                            {variavel.grupos.map((g) => {
                                const v = variacaoDoGrupo(g, despesa)
                                return (
                                    <li key={g.chave} className="flex items-center gap-3 text-sm">
                                        <ItemContent>
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <span className="truncate">{g.nome}</span>
                                                {g.novo ? (
                                                    <Badge tone="warning" size="xs" className="shrink-0">
                                                        novo
                                                    </Badge>
                                                ) : null}
                                            </span>
                                            <span className="nums text-muted-foreground">
                                                {g.ultimaYmd ? dataDoGrupo(g.ultimaYmd, g.vezes, yearMonth) : null}
                                                {/* Empilhado (telefone), a variação desce para a linha da data; lado a lado, tem coluna. */}
                                                <span className="@xl:hidden">
                                                    {g.ultimaYmd ? " · " : null}
                                                    <span className={v.classe}>{v.texto}</span>
                                                </span>
                                            </span>
                                        </ItemContent>
                                        <span className={cn("nums hidden shrink-0 whitespace-nowrap text-right text-xs @xl:inline", v.classe)}>{v.texto}</span>
                                        <span className="nums w-20 shrink-0 text-right font-mono font-semibold">{reaisInteiros(g.valor)}</span>
                                    </li>
                                )
                            })}
                            {variavel.outros ? (
                                <li className="flex items-center gap-3 text-sm">
                                    <span className="min-w-0 flex-1 text-muted-foreground">
                                        Outros {variavel.outros.vezes} {variavel.outros.vezes === 1 ? "lançamento" : "lançamentos"}
                                    </span>
                                    <span className="nums w-20 shrink-0 text-right font-mono font-semibold">{reaisInteiros(variavel.outros.valor)}</span>
                                </li>
                            ) : null}
                        </ul>
                        </CartaoDoGrafico>
                    ) : null}

                    {comFixo ? (
                        <CartaoDoGrafico
                            titulo={tituloDoFixo}
                            apoio={`${fixo.itens.length} ${fixo.itens.length === 1 ? "ativa" : "ativas"}`}
                            className={cn(!comVariavel && "@xl:col-span-2")}
                        >
                        <ul className="grid grid-cols-1 gap-2.5">
                            {linhas.map((item) => {
                                const parcela = item.tipo === "parcela" && item.atual != null && item.total != null
                                return (
                                    <li key={item.id} className="flex items-center gap-3 text-sm">
                                        <span className="flex min-w-0 flex-1 items-center gap-2">
                                            <span className="truncate">{item.nome}</span>
                                            <span className="nums shrink-0 text-muted-foreground">
                                                {parcela ? `${item.atual}/${item.total}` : "todo mês"}
                                            </span>
                                            {parcela && item.total! <= MAX_PONTINHOS ? (
                                                // Cada casa com 6px e 2px de fresta: lê como pontinho, qualquer que seja o total.
                                                <span className="shrink-0" style={{ width: `calc(${item.total} * 0.5rem - 0.125rem)` }}>
                                                    <Progress
                                                        size="sm"
                                                        value={item.atual}
                                                        max={item.total}
                                                        segments={item.total}
                                                        fillColor={corDaSerie}
                                                        aria-label={`Parcela ${item.atual} de ${item.total}`}
                                                    />
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(item.valor)}</span>
                                    </li>
                                )
                            })}
                            {resto ? (
                                <li className="flex items-baseline gap-3 text-sm">
                                    <span className="min-w-0 flex-1">
                                        + {resto.n} {nomeDoResto(resto.n, resto.soParcelas)}
                                        {resto.todosNovos ? (resto.n === 1 ? " nova este mês" : " novas este mês") : null}
                                        <span className="text-muted-foreground"> · {resto.nomes.join(", ")}</span>
                                    </span>
                                    <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(resto.valor)}</span>
                                </li>
                            ) : null}
                        </ul>
                            {comRodape ? (
                                <div className="mt-auto grid gap-1 pt-4 text-sm text-muted-foreground">
                                    {fixo.ultimaTerminaYm ? (
                                        <span className="flex justify-between gap-3">
                                            {despesa ? "A última parcela acaba em" : "A última entrada fixa acaba em"}
                                            <span className="nums font-semibold text-foreground">{mesEAno(fixo.ultimaTerminaYm)}</span>
                                        </span>
                                    ) : null}
                                </div>
                            ) : null}
                        </CartaoDoGrafico>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
