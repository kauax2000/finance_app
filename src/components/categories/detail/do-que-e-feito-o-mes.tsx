"use client"

import { CartaoDoGrafico } from "@/components/analise-do-mes/compartilhado"
import { mesCurto } from "@/components/analise-do-mes/rotulos"
import { Badge } from "@/components/ui/badge"
import { ChartSplit, ChartSwatch, splitPercents, type ChartConfig } from "@/components/ui/chart"
import { DateTile } from "@/components/ui/date-tile"
import { ItemContent } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Caption } from "@/components/ui/typography"
import type { ComposicaoDoMes, ParteDaFrase } from "@/lib/composicao-do-mes"
import { shiftYearMonth } from "@/lib/budget-month"
import { percentBR } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { nomeDoMes, reaisInteiros } from "./regua-do-mes-contas"

/** "ago/27", a partir de `YYYY-MM`. */
const mesEAno = (ym: string) => `${mesCurto(ym)}/${ym.slice(2, 4)}`

const TOM: Record<NonNullable<ParteDaFrase["tom"]>, string> = { success: "text-success", warning: "text-warning" }

/** A variação do grupo contra o normal: "= normal" dentro de ±5%, "novo" sem histórico; o tom diz se é bom. */
function variacaoDoGrupo(variacao: number | null, novo: boolean, despesa: boolean) {
    if (novo || variacao == null) return { texto: "novo", classe: "text-muted-foreground" }
    if (Math.abs(variacao) < 0.05) return { texto: "= normal", classe: "text-muted-foreground" }
    const subiu = variacao > 0
    return {
        texto: `${subiu ? "↑" : "↓"} ${percentBR(Math.abs(variacao), { maximumFractionDigits: 0 })}`,
        classe: subiu === despesa ? "text-warning" : "text-success",
    }
}

/** "Do que é feito o mês": a frase do porquê, a barra fixo × variável e as duas listas. Some sem lançamento. */
export function DoQueEFeitoOMes({
    composicao,
    frase,
    despesa,
    yearMonth,
    corDaSerie,
}: {
    composicao: ComposicaoDoMes
    frase: ParteDaFrase[]
    despesa: boolean
    yearMonth: string
    /** A cor que o ladrilho da categoria desenha: o fixo na barra e nas parcelas. */
    corDaSerie: string
}) {
    const { fixo, variavel } = composicao
    if (fixo.itens.length === 0 && variavel.grupos.length === 0) return null

    const comFixo = fixo.itens.length > 0
    const [pctFixo, pctVariavel] = splitPercents([fixo.total, variavel.total])
    const config = {
        fixo: { label: "Fixo", color: corDaSerie },
        variavel: { label: "Variável", color: "var(--color-muted-foreground)" },
    } satisfies ChartConfig

    return (
        <CartaoDoGrafico titulo="Do que é feito o mês" apoio={nomeDoMes(yearMonth)}>
            <p className="text-base">
                {frase.map((p, i) => (
                    <span key={i} className={cn(p.forte && "font-semibold", p.tom && TOM[p.tom])}>
                        {p.texto}
                    </span>
                ))}
            </p>

            {comFixo ? (
                <div className="mt-4 grid gap-2">
                    <ChartSplit
                        labels="none"
                        config={config}
                        data={[
                            { parte: "fixo", valor: fixo.total },
                            { parte: "variavel", valor: Math.max(0, variavel.total) },
                        ]}
                        nameKey="parte"
                        dataKey="valor"
                        label={`${despesa ? "Gasto" : "Recebido"} do mês, fixo e variável`}
                    />
                    <div className="nums flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            <ChartSwatch color={config.fixo.color} />
                            Fixo · <span className="font-mono font-semibold">{reaisInteiros(fixo.total)}</span>
                            <span className="text-muted-foreground">{pctFixo}%</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <ChartSwatch color={config.variavel.color} />
                            Variável · <span className="font-mono font-semibold">{reaisInteiros(variavel.total)}</span>
                            <span className="text-muted-foreground">{pctVariavel}%</span>
                        </span>
                    </div>
                </div>
            ) : null}

            <div className="@container mt-6">
                <div className="grid gap-6 @xl:grid-cols-2 @xl:gap-8">
                    {comFixo ? (
                        <section aria-label={despesa ? "Fixo, parcelas e assinaturas" : "Fixo, entradas fixas"} className="min-w-0">
                            <div className="mb-3 flex items-baseline justify-between gap-3">
                                <h3 className="text-sm font-semibold">{despesa ? "Fixo · parcelas e assinaturas" : "Fixo · entradas fixas"}</h3>
                                {fixo.ultimaTerminaYm ? <Caption className="shrink-0">a última acaba em {mesEAno(fixo.ultimaTerminaYm)}</Caption> : null}
                            </div>
                            <ul className="grid gap-3">
                                {fixo.itens.map((item) => (
                                    <li key={item.id} className="flex items-center gap-3 text-sm">
                                        <DateTile date={item.diaYmd} />
                                        <ItemContent>
                                            <span className="truncate">{item.nome}</span>
                                            <span className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                                                <span className="nums">
                                                    {item.tipo === "parcela" && item.atual != null && item.total != null
                                                        ? `${item.atual} de ${item.total}`
                                                        : "todo mês"}
                                                </span>
                                                {item.novoDesdeYm ? (
                                                    <Badge tone="warning" size="xs">
                                                        novo desde {mesCurto(item.novoDesdeYm)}
                                                    </Badge>
                                                ) : null}
                                            </span>
                                            {item.tipo === "parcela" && item.atual != null && item.total ? (
                                                <Progress
                                                    size="sm"
                                                    value={item.atual}
                                                    max={item.total}
                                                    fillColor={corDaSerie}
                                                    aria-label={`Parcela ${item.atual} de ${item.total}`}
                                                    className="mt-1.5"
                                                />
                                            ) : null}
                                        </ItemContent>
                                        <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(item.valor)}</span>
                                    </li>
                                ))}
                            </ul>
                            {fixo.proximoMes > 0 ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Em {nomeDoMes(shiftYearMonth(yearMonth, 1))} já entram{" "}
                                    <span className="nums font-semibold text-foreground">{reaisInteiros(fixo.proximoMes)}</span>
                                </p>
                            ) : null}
                        </section>
                    ) : null}

                    {variavel.grupos.length > 0 ? (
                        <section
                            aria-label={despesa ? "Variável, o que você controla" : "Variável, avulsas"}
                            className={cn("min-w-0", !comFixo && "@xl:col-span-2")}
                        >
                            <div className="mb-3 flex items-baseline justify-between gap-3">
                                <h3 className="text-sm font-semibold">{despesa ? "Variável · o que você controla" : "Variável · avulsas"}</h3>
                                <Caption className="shrink-0">vs seu normal</Caption>
                            </div>
                            <ul className="grid gap-3">
                                {variavel.grupos.map((g) => {
                                    const v = variacaoDoGrupo(g.variacao, g.novo, despesa)
                                    return (
                                        <li key={g.chave} className="flex items-center gap-3 text-sm">
                                            <ItemContent>
                                                <span className="truncate">{g.nome}</span>
                                                <span className="nums text-muted-foreground">
                                                    {g.vezes} {g.vezes === 1 ? "vez" : "vezes"}
                                                </span>
                                            </ItemContent>
                                            <span className={cn("nums shrink-0 text-xs", v.classe)}>{v.texto}</span>
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
                        </section>
                    ) : null}
                </div>
            </div>
        </CartaoDoGrafico>
    )
}
