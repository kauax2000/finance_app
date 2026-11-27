"use client"

import * as React from "react"
import {
    ArrowPathIcon,
    ChatBubbleLeftEllipsisIcon,
    DevicePhoneMobileIcon,
    DocumentTextIcon,
    SparklesIcon,
} from "@heroicons/react/16/solid"

import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { ChartBars, ChartSplit, type ChartConfig } from "@/components/ui/chart"
import { DateTile } from "@/components/ui/date-tile"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Caption } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"
import type { CorpoDoInsight as Corpo } from "@/lib/insights-da-categoria"
import { lancamentosDaRecorrencia, type Insight } from "@/lib/insights/acoes"
import { ROTULO_DA_ORIGEM } from "@/lib/piloto/piloto"
import { formatMonthShortPtBr, parseYmdLocal } from "@/lib/transaction-date"
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
            // A linha das notificações, sem caixa: o ladrilho da origem, a descrição sobre o dia e a origem, o valor no fim.
            return (
                <div className="grid gap-2.5">
                    <ItemGroup role="list" aria-label="Lançamentos para conferir">
                        {corpo.linhas.map((l, n) => {
                            const Icone = ICONE_DA_ORIGEM[l.origem] ?? SparklesIcon
                            return (
                                <Item key={n} role="listitem" size="sm" className="p-0">
                                    <ItemMedia variant="tile" tone="info">
                                        <Icone />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="w-auto min-w-0">
                                            <span className="min-w-0 truncate">{l.descricao || "Sem descrição"}</span>
                                        </ItemTitle>
                                        <ItemDescription className="nums">
                                            {`${diaDoMes(l.dataYmd)} · ${ROTULO_DA_ORIGEM[l.origem] ?? "pelo app"}`}
                                        </ItemDescription>
                                    </ItemContent>
                                    <ItemActions>
                                        <span className="nums font-mono text-sm">{reaisInteiros(l.valor)}</span>
                                    </ItemActions>
                                </Item>
                            )
                        })}
                    </ItemGroup>
                    {corpo.resto > 0 ? <p className="text-sm text-muted-foreground">e mais {corpo.resto}</p> : null}
                </div>
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

/** "2026-11-25" → "25 de nov". */
function diaDoMes(ymd: string) {
    const d = parseYmdLocal(ymd)
    return d ? `${d.getDate()} de ${formatMonthShortPtBr(d)}` : dm(ymd)
}

/** O ícone do ladrilho pela origem do lançamento; o resto cai no ✦. */
const ICONE_DA_ORIGEM: Record<string, typeof SparklesIcon> = {
    shortcut: DevicePhoneMobileIcon,
    apple_pay: DevicePhoneMobileIcon,
    quick_text: ChatBubbleLeftEllipsisIcon,
    whatsapp: ChatBubbleLeftEllipsisIcon,
    import_pdf: DocumentTextIcon,
    import_sheet: DocumentTextIcon,
    import_statement: DocumentTextIcon,
    recurring: ArrowPathIcon,
}

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
