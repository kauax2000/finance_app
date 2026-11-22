"use client"

import { CartaoDoGrafico } from "@/components/analise-do-mes/compartilhado"
import { dataDoGrupo, mesCurto } from "@/components/analise-do-mes/rotulos"
import { Badge } from "@/components/ui/badge"
import { ChartSplit, ChartSwatch, splitPercents, type ChartConfig } from "@/components/ui/chart"
import { ItemContent } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { fixoEmLinhas, foraDoNormal, type ComposicaoDoMes, type GrupoVariavel, type ParteDaFrase } from "@/lib/composicao-do-mes"
import { shiftYearMonth } from "@/lib/budget-month"
import { percentBR } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { nomeDoMes, reaisInteiros } from "./regua-do-mes-contas"

/** "ago/27", a partir de `YYYY-MM`. */
const mesEAno = (ym: string) => `${mesCurto(ym)}/${ym.slice(2, 4)}`

/** Até 12 parcelas o progresso vai em pontinhos; acima, só o "N/T". */
const MAX_PONTINHOS = 12

const TOM: Record<NonNullable<ParteDaFrase["tom"]>, string> = { success: "text-success", warning: "text-warning" }

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

/** O cabeçalho da coluna: "● Título · R$ X · N%". */
function CabecalhoDaColuna({ titulo, cor, valor, pct }: { titulo: string; cor: string; valor: number; pct?: number }) {
    return (
        <div className="grid gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                    <ChartSwatch color={cor} />
                    {titulo}
                </h3>
                <span className="nums shrink-0 text-sm">
                    <span className="font-mono font-semibold">{reaisInteiros(valor)}</span>
                    {pct != null ? <span className="text-muted-foreground"> · {pct}%</span> : null}
                </span>
            </div>
            <Separator />
        </div>
    )
}

/**
 * "Do que é feito o mês": a frase do porquê, a barra variável × fixo e as duas colunas — o que você
 * controla primeiro, mais largo e na cor da categoria; o já decidido compacto, em cinza. Some sem lançamento.
 */
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
    /** A cor que o ladrilho da categoria desenha: o variável na barra, no cabeçalho e os pontinhos das parcelas. */
    corDaSerie: string
}) {
    const { fixo, variavel } = composicao
    if (fixo.itens.length === 0 && variavel.grupos.length === 0) return null

    const comFixo = fixo.itens.length > 0
    const comVariavel = variavel.grupos.length > 0
    const [pctVariavel, pctFixo] = splitPercents([Math.max(0, variavel.total), fixo.total])
    const config = {
        variavel: { label: despesa ? "O que você controla" : "Avulsas", color: corDaSerie },
        fixo: { label: "Já decidido", color: "var(--color-muted-foreground)" },
    } satisfies ChartConfig
    const { linhas, resto } = fixoEmLinhas(fixo.itens, yearMonth)
    const tituloDoFixo = despesa
        ? fixo.itens.some((i) => i.tipo === "assinatura")
            ? "Já decidido · parcelas e assinaturas"
            : "Já decidido · parcelas"
        : "Já decidido · entradas fixas"
    const nomeDoResto = (n: number, soParcelas: boolean) =>
        despesa && soParcelas ? (n === 1 ? "parcela" : "parcelas") : despesa ? (n === 1 ? "fixo" : "fixos") : n === 1 ? "entrada fixa" : "entradas fixas"
    const comRodape = comFixo && (fixo.ultimaTerminaYm != null || fixo.proximoMes > 0)

    return (
        <CartaoDoGrafico titulo="Do que é feito o mês">
            <p className="text-base">
                {frase.map((p, i) => (
                    <span key={i} className={cn(p.forte && "font-semibold", p.tom && TOM[p.tom])}>
                        {p.texto}
                    </span>
                ))}
            </p>

            {comFixo && comVariavel ? (
                <ChartSplit
                    className="mt-4"
                    labels="none"
                    config={config}
                    data={[
                        { parte: "variavel", valor: Math.max(0, variavel.total) },
                        { parte: "fixo", valor: fixo.total },
                    ]}
                    nameKey="parte"
                    dataKey="valor"
                    label={`${despesa ? "Gasto" : "Recebido"} do mês, o que você controla e o já decidido`}
                />
            ) : null}

            <div className="@container mt-5">
                {/* O que se controla vem primeiro e mais largo; abaixo de 36rem do bloco, empilha nessa ordem. */}
                <div className="grid gap-6 @xl:grid-cols-[5fr_4fr] @xl:gap-9">
                    {comVariavel ? (
                        <section
                            aria-label={despesa ? "O que você controla" : "Avulsas"}
                            className={cn("min-w-0", !comFixo && "@xl:col-span-2")}
                        >
                            <CabecalhoDaColuna
                                titulo={config.variavel.label}
                                cor={corDaSerie}
                                valor={variavel.total}
                                pct={comFixo ? pctVariavel : undefined}
                            />
                            <ul className="mt-3 grid grid-cols-1 gap-3">
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
                        </section>
                    ) : null}

                    {comFixo ? (
                        <section aria-label={tituloDoFixo} className={cn("min-w-0", !comVariavel && "@xl:col-span-2")}>
                            <CabecalhoDaColuna
                                titulo={tituloDoFixo}
                                cor={config.fixo.color}
                                valor={fixo.total}
                                pct={comVariavel ? pctFixo : undefined}
                            />
                            <ul className="mt-3 grid grid-cols-1 gap-2.5">
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
                        </section>
                    ) : null}
                </div>
            </div>

            {comRodape ? (
                <div className="mt-4 grid gap-3">
                    <Separator />
                    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        {fixo.ultimaTerminaYm ? (
                            <span>
                                {despesa ? "A última parcela acaba em " : "A última entrada fixa acaba em "}
                                <span className="nums font-semibold text-foreground">{mesEAno(fixo.ultimaTerminaYm)}</span>
                            </span>
                        ) : null}
                        {fixo.proximoMes > 0 ? (
                            <span>
                                Em {nomeDoMes(shiftYearMonth(yearMonth, 1))} já entram{" "}
                                <span className="nums font-semibold text-foreground">{reaisInteiros(fixo.proximoMes)}</span>
                            </span>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </CartaoDoGrafico>
    )
}
