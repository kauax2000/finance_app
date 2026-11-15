"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import { ChartBars, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Collapsible, CollapsibleContent, CollapsibleRow } from "@/components/ui/collapsible"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Table, TableBody, TableCell, TableCellMoney, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Muted } from "@/components/ui/typography"
import { labelYearMonthPt, shiftYearMonth, shortLabelYearMonthPt } from "@/lib/budget-month"
import { currencyBRL } from "@/lib/formatters"
import type { MesDaLinha, Projecao } from "@/lib/previsao/tipos"
import { formatMonthLongPtBr, formatMonthShortPtBr } from "@/lib/transaction-date"

// Só `sobra` vira barra (com `signed`, a cor segue o sinal); entra e sai moram na dica.
const CONFIG = {
    sobra: { label: "Sobra", color: "var(--foreground)" },
    entra: { label: "Entra", color: "var(--chart-income)" },
    sai: { label: "Sai", color: "var(--chart-expense)" },
} satisfies ChartConfig

const dataDoMes = (ym: string) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1)
const mesCurto = (ym: string) => formatMonthShortPtBr(dataDoMes(ym))
const mesLongo = (ym: string) => {
    const nome = formatMonthLongPtBr(dataDoMes(ym))
    return nome.charAt(0).toLocaleUpperCase("pt-BR") + nome.slice(1)
}
const lista = (nomes: string[]) => new Intl.ListFormat("pt-BR", { type: "conjunction" }).format(nomes)

type Ponto = { mes: string; ym: string; entra: number; sai: number; sobra: number }

/** A dica da barra: o mês por extenso, o que entra, o que sai e a sobra (o Recharts só manda a série desenhada). */
function DicaDoMes(props: React.ComponentProps<typeof ChartTooltipContent>) {
    const linha = props.payload?.[0]?.payload as Ponto | undefined
    const payload = linha
        ? (["entra", "sai", "sobra"] as const).map((k) => ({
              dataKey: k,
              name: k,
              value: linha[k],
              color:
                  k === "entra" || (k === "sobra" && linha.sobra >= 0) ? "var(--chart-income)" : "var(--chart-expense)",
          }))
        : props.payload
    return (
        <ChartTooltipContent
            {...props}
            payload={payload}
            format="currency"
            labelFormatter={() => (linha ? labelYearMonthPt(linha.ym) : null)}
        />
    )
}

/** "Zara e Cadeira terminam" · "A partir de dezembro, R$ X a menos por mês". */
function FimDosParcelamentos({ mes }: { mes: MesDaLinha }) {
    const nomes = mes.fimDeParcelamentos.map((f) => f.descricao)
    const valor = mes.fimDeParcelamentos.reduce((s, f) => s + f.valor, 0)
    return (
        <Item size="sm">
            <ItemContent>
                <ItemTitle>
                    {lista(nomes)} {nomes.length > 1 ? "terminam" : "termina"} em {formatMonthLongPtBr(dataDoMes(mes.ym))}
                </ItemTitle>
                <ItemDescription>
                    A partir de {formatMonthLongPtBr(dataDoMes(shiftYearMonth(mes.ym, 1)))}, {currencyBRL(valor)} a menos
                    por mês
                </ItemDescription>
            </ItemContent>
        </Item>
    )
}

/** A sobra de cada um dos próximos 6 meses, o que acontece neles e a tabela mês a mês. */
export function ProximosMeses({ projecao }: { projecao: Projecao }) {
    const { meses, primeiroMesNegativo } = projecao
    const dados = useMemo(
        (): Ponto[] => meses.map((m) => ({ mes: mesCurto(m.ym), ym: m.ym, entra: m.entra, sai: m.sai, sobra: m.sobra })),
        [meses],
    )
    const negativo = meses.find((m) => m.ym === primeiroMesNegativo)
    const comFim = meses.filter((m) => m.fimDeParcelamentos.length > 0)
    const atual = meses[0]?.ym

    return (
        <Card padding="none">
            <CardToolbar>
                <span className="min-w-0 truncate">Próximos 6 meses</span>
                {negativo ? (
                    <Badge tone="expense" size="sm">
                        {mesLongo(negativo.ym)} fica no vermelho
                    </Badge>
                ) : null}
            </CardToolbar>
            <CardContent className="grid grid-cols-1 gap-4 px-(--card-strip-px) pb-(--card-strip-py)">
                <ChartBars
                    config={CONFIG}
                    data={dados}
                    series={["sobra"]}
                    x="mes"
                    signed
                    // O mês de hoje em destaque: os outros recuam.
                    selected={atual ? mesCurto(atual) : null}
                    tooltip={false}
                    aspect="auto"
                    label="Sobra de cada um dos próximos 6 meses"
                    description="Barra para cima, sobra; para baixo, o mês fecha no vermelho. O mês atual em destaque."
                    className="h-48 w-full"
                >
                    <ChartTooltip cursor={false} content={<DicaDoMes />} />
                </ChartBars>
                {negativo || comFim.length > 0 ? (
                    <ItemGroup className="gap-3">
                        {negativo ? (
                            <Item size="sm">
                                <ItemContent>
                                    <ItemTitle>{mesLongo(negativo.ym)} é o primeiro mês no vermelho</ItemTitle>
                                    <ItemDescription>
                                        Sai {currencyBRL(negativo.sai)} e entra {currencyBRL(negativo.entra)}
                                    </ItemDescription>
                                </ItemContent>
                            </Item>
                        ) : null}
                        {comFim.map((m) => (
                            <FimDosParcelamentos key={m.ym} mes={m} />
                        ))}
                    </ItemGroup>
                ) : (
                    <Muted>Nada muda nos próximos meses</Muted>
                )}
                <Collapsible>
                    <CollapsibleRow>Ver mês a mês</CollapsibleRow>
                    <CollapsibleContent>
                        <Table size="sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mês</TableHead>
                                    <TableHead>Entra</TableHead>
                                    <TableHead>Sai</TableHead>
                                    <TableHead>Sobra</TableHead>
                                    <TableHead>Fim de parcelamentos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {meses.map((m) => (
                                    <TableRow key={m.ym}>
                                        <TableCell>{shortLabelYearMonthPt(m.ym)}</TableCell>
                                        <TableCell>
                                            <TableCellMoney value={m.entra} signed={false} tone="none" />
                                        </TableCell>
                                        <TableCell>
                                            <TableCellMoney value={m.sai} signed={false} tone="none" />
                                        </TableCell>
                                        <TableCell>
                                            <TableCellMoney value={m.sobra} />
                                        </TableCell>
                                        <TableCell>
                                            {m.fimDeParcelamentos.length > 0
                                                ? lista(m.fimDeParcelamentos.map((f) => f.descricao))
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    )
}
