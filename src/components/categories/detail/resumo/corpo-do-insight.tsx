"use client"

import * as React from "react"

import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { ChartBars, ChartSplit, type ChartConfig } from "@/components/ui/chart"
import { DateTile } from "@/components/ui/date-tile"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Caption } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"
import type { CorpoDoInsight as Corpo } from "@/lib/insights-da-categoria"
import { lancamentosDaRecorrencia, type Insight } from "@/lib/insights/acoes"
import { formatMonthShortPtBr } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"

const TOM = { success: "text-success", warning: "text-warning" } as const

type Props = {
    corpo: Corpo
    /** A cor que o ladrilho da categoria desenha: o destaque dos visuais. */
    corDaSerie: string
    /** A linha da caixa do insight: a recorrência lê os lançamentos por ela. */
    linhaDaCaixa?: Insight
    numero: string
    linha: string
    tom?: "success" | "warning"
}

/** O corpo de cada insight, pelo tipo: o mini visual com o número e a linha em volta. */
export function CorpoDoInsight({ corpo, corDaSerie, linhaDaCaixa, numero, linha, tom }: Props) {
    const Numero = <p className={cn("nums font-mono text-2xl font-semibold", tom && TOM[tom])}>{numero}</p>
    const Linha = <p className="text-sm text-muted-foreground">{linha}</p>

    switch (corpo.tipo) {
        case "duplicado":
            return (
                <ul aria-label="Os dois lançamentos iguais" className="grid grid-cols-2 gap-2">
                    {corpo.lancamentos.map((l, n) => (
                        <li key={n} className="min-w-0 rounded-row bg-muted px-3 py-2">
                            <p className="truncate text-sm">{l.descricao}</p>
                            <Caption className="nums">
                                {l.forma ? `${dm(l.dataYmd)} · ${l.forma}` : dm(l.dataYmd)}
                            </Caption>
                            <p className="nums mt-0.5 font-mono text-sm font-semibold">{currencyBRL(l.valor)}</p>
                        </li>
                    ))}
                </ul>
            )
        case "conferir":
            return (
                <ul aria-label="Lançamentos para conferir" className="grid gap-2 text-sm">
                    {corpo.linhas.map((l, n) => (
                        <li key={n} className="flex items-center gap-3">
                            <span className="nums shrink-0 text-muted-foreground">{dm(l.dataYmd)}</span>
                            <span className="min-w-0 truncate">{l.descricao}</span>
                            <span className="nums ml-auto shrink-0 font-mono">{reaisInteiros(l.valor)}</span>
                        </li>
                    ))}
                    {corpo.resto > 0 ? <li className="text-muted-foreground">e mais {corpo.resto}</li> : null}
                </ul>
            )
        case "ritmo":
            return (
                <div className="grid gap-2">
                    {Numero}
                    <Progress
                        value={corpo.lancado}
                        projected={corpo.previsto}
                        max={corpo.limite}
                        aria-label={`Lançado ${reaisInteiros(corpo.lancado)} e previsto ${reaisInteiros(corpo.previsto)}, contra o limite de ${reaisInteiros(corpo.limite)}`}
                    />
                    {Linha}
                </div>
            )
        case "sazonal":
            return (
                <div className="flex items-center gap-3">
                    {/* Payload antigo vem sem a data: sem a folhinha. */}
                    {corpo.dataYmd ? <DateTile date={corpo.dataYmd} size="md" /> : null}
                    <div className="min-w-0">
                        {Numero}
                        {Linha}
                    </div>
                </div>
            )
        case "parcela":
            return (
                <div className="grid gap-2">
                    {Numero}
                    <Progress
                        value={corpo.atual}
                        max={corpo.total}
                        segments={corpo.total}
                        segmentShape="tile"
                        size="lg"
                        fillColor={corDaSerie}
                        aria-label={`${corpo.atual} de ${corpo.total} parcelas pagas`}
                    />
                    {Linha}
                </div>
            )
        case "recorrencia":
            return linhaDaCaixa ? <ColunasDaRecorrencia insight={linhaDaCaixa} cor={corDaSerie} /> : null
        case "preco":
            return (
                <div className="grid gap-1">
                    <p className="nums font-mono text-2xl font-semibold">
                        <span className="text-base text-muted-foreground line-through">{currencyBRL(corpo.de)}</span>{" "}
                        {currencyBRL(corpo.para)}
                    </p>
                    <p
                        className={cn(
                            "nums text-sm",
                            corpo.para > corpo.de ? "text-warning-muted-foreground" : "text-success-muted-foreground",
                        )}
                    >
                        {linha}
                    </p>
                </div>
            )
        case "limite":
            return (
                <div className="grid gap-2">
                    {Numero}
                    <Progress
                        value={corpo.lancado}
                        max={corpo.sugerido}
                        fillColor={corDaSerie}
                        aria-label={`Este mês ${reaisInteiros(corpo.lancado)} de ${reaisInteiros(corpo.sugerido)} sugeridos`}
                    />
                    {Linha}
                </div>
            )
        case "concentracao": {
            const config: ChartConfig = {
                a: { label: corpo.partes[0]?.nome ?? "", color: corDaSerie },
                b: { label: corpo.partes[1]?.nome ?? "", color: corDaSerie },
                resto: { label: "Resto", color: "var(--muted)" },
            }
            const data = [
                { chave: "a", valor: corpo.partes[0]?.valor ?? 0 },
                { chave: "b", valor: corpo.partes[1]?.valor ?? 0 },
                { chave: "resto", valor: corpo.resto },
            ]
            return (
                <div className="grid gap-2">
                    {Numero}
                    <ChartSplit
                        labels="none"
                        config={config}
                        data={data}
                        nameKey="chave"
                        dataKey="valor"
                        label="Os dois maiores gastos contra o resto do mês"
                    />
                    {Linha}
                </div>
            )
        }
    }
}

/** "2026-11-22" → "22/11". */
const dm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`

const CONFIG_DA_RECORRENCIA = { valor: { label: "Valor", color: "var(--muted)" } } satisfies ChartConfig

/** As colunas dos meses da recorrência, lidas ao montar; a última na cor da categoria. Com erro ou vazio, nada. */
function ColunasDaRecorrencia({ insight, cor }: { insight: Insight; cor: string }) {
    const [meses, setMeses] = React.useState<{ mes: string; valor: number }[] | null | "lendo">("lendo")
    React.useEffect(() => {
        let vivo = true
        void lancamentosDaRecorrencia(insight).then((r) => {
            if (!vivo) return
            if (!r.ok) return setMeses(null)
            const porMes = new Map<string, number>()
            for (const l of r.lancamentos) {
                const ym = l.date.slice(0, 7)
                porMes.set(ym, (porMes.get(ym) ?? 0) + Number(l.amount || 0))
            }
            setMeses(
                [...porMes]
                    .sort(([x], [y]) => x.localeCompare(y))
                    .map(([ym, valor]) => ({ mes: formatMonthShortPtBr(new Date(`${ym}-15T12:00:00`)), valor })),
            )
        }).catch(() => {
            if (vivo) setMeses(null)
        })
        return () => {
            vivo = false
        }
    }, [insight])

    if (meses === "lendo") return <Skeleton className="h-24 w-full" />
    if (!meses || meses.length === 0) return null
    const ultimo = meses.at(-1)!.mes
    return (
        <ChartBars
            config={CONFIG_DA_RECORRENCIA}
            data={meses}
            x="mes"
            selected={ultimo}
            selectedColor={cor}
            yAxis={false}
            grid={false}
            aspect="auto"
            label={`Valor de cada mês: ${meses.map((m) => `${m.mes} ${reaisInteiros(m.valor)}`).join(", ")}`}
            className="h-24 w-full"
        />
    )
}
