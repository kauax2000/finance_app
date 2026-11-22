"use client"

import { CartaoDoGrafico } from "@/components/analise-do-mes/compartilhado"
import { dataDoGrupo, mesCurto } from "@/components/analise-do-mes/rotulos"
import { Badge } from "@/components/ui/badge"
import { CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from "@heroicons/react/16/solid"
import { ChartSplitCompare, ChartSwatch, type ChartConfig, type ChartSplitCompareRow } from "@/components/ui/chart"
import { Item, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { fixoEmLinhas, foraDoNormal, tomDoInsight, type ComposicaoDoMes, type GrupoVariavel, type ParteDaFrase } from "@/lib/composicao-do-mes"
import { shiftYearMonth } from "@/lib/budget-month"
import { percentBR } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { nomeDoMes, reaisInteiros } from "./regua-do-mes-contas"

/** "ago/27", a partir de `YYYY-MM`. */
const mesEAno = (ym: string) => `${mesCurto(ym)}/${ym.slice(2, 4)}`

const ICONE = { success: CheckCircleIcon, warning: ExclamationTriangleIcon, info: LightBulbIcon } as const

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

/**
 * "Do que é feito o mês" em três cartões: o resumo (frase, barra e os dois totais) em cima e, embaixo, as duas
 * listas lado a lado — o que você controla primeiro, mais largo; o já decidido com o rodapé no pé. Some sem lançamento.
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
    const config = {
        variavel: { label: despesa ? "O que você controla" : "Avulsas", color: corDaSerie },
        fixo: { label: "Já decidido", color: "var(--color-muted-foreground)" },
    } satisfies ChartConfig
    const IconeDoInsight = ICONE[tomDoInsight(composicao, despesa)]
    const nomeMes = nomeDoMes(yearMonth)
    const { normais, variacaoTotal, direcao } = composicao
    // Variação do pedaço contra o normal: some dentro de ±5%, quando não há normal ou quando o normal é zero.
    const quanto = (valor: number, normal: number | null) => {
        if (!normal) return ""
        const v = (valor - normal) / normal
        return foraDoNormal(v) ? ` ${v > 0 ? "↑" : "↓"} ${percentBR(Math.abs(v), { maximumFractionDigits: 0 })}` : ""
    }
    const parte = (key: "variavel" | "fixo", valor: number, ink?: string) => ({
        key,
        value: valor,
        text: `${reaisInteiros(valor)}${quanto(valor, normais[key])}`,
        shortText: reaisInteiros(valor),
        ...(ink ? { ink } : null),
    })
    const linhasDoGrafico: ChartSplitCompareRow[] = [
        ...(normais.variavel != null || normais.fixo != null
            ? [
                  {
                      label: "seu normal",
                      variant: "ghost" as const,
                      segments: (["variavel", "fixo"] as const).map((k) => ({
                          key: k,
                          value: normais[k] ?? 0,
                          text: reaisInteiros(normais[k] ?? 0),
                      })),
                  },
              ]
            : []),
        {
            label: nomeMes,
            segments: [parte("variavel", Math.max(0, variavel.total)), parte("fixo", fixo.total, "var(--card)")],
        },
    ]
    const selo =
        variacaoTotal != null && direcao != null ? (
            <Badge tone={(direcao === "acima") === despesa ? "warning" : "success"} size="sm">
                {direcao === "acima" ? "+" : "−"}
                {percentBR(Math.abs(variacaoTotal), { maximumFractionDigits: 0 })}
            </Badge>
        ) : null
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
        <div className="grid gap-(--space-block)">
            <Item variant="outline" className="items-start">
                <ItemMedia variant="tile" tone={tomDoInsight(composicao, despesa)}>
                    <IconeDoInsight aria-hidden />
                </ItemMedia>
                <ItemContent>
                    <ItemDescription className="line-clamp-none text-base text-foreground">
                        {frase.map((p, i) => (
                            <span key={i} className={cn(p.forte && "nums font-semibold", p.tom && TOM[p.tom])}>
                                {p.texto}
                            </span>
                        ))}
                    </ItemDescription>
                </ItemContent>
            </Item>

            {comFixo || comVariavel ? (
                <CartaoDoGrafico titulo="Do que é feito o mês" apoio={selo}>
                    <ChartSplitCompare
                        label={`${despesa ? "Gasto" : "Recebido"} do mês contra o seu normal`}
                        config={config}
                        rows={linhasDoGrafico}
                    />
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                            <ChartSwatch color={corDaSerie} />
                            {config.variavel.label}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <ChartSwatch color={config.fixo.color} />
                            {config.fixo.label}
                            {composicao.caso === "novo" && composicao.destaque?.nome ? ` · ${composicao.destaque.nome}` : null}
                            {composicao.caso === "novo" ? (
                                <Badge tone="warning" size="xs">
                                    novo
                                </Badge>
                            ) : null}
                        </span>
                    </div>
                </CartaoDoGrafico>
            ) : null}

            {/* O que se controla vem primeiro e mais largo; abaixo de 36rem da área, empilha nessa ordem. */}
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
                                    {fixo.proximoMes > 0 ? (
                                        <span className="flex justify-between gap-3">
                                            Em {nomeDoMes(shiftYearMonth(yearMonth, 1))} já entram
                                            <span className="nums font-semibold text-foreground">{reaisInteiros(fixo.proximoMes)}</span>
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
