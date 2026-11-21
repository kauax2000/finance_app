"use client"

import { CheckIcon } from "@heroicons/react/16/solid"
import { Badge } from "@/components/ui/badge"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { DateTile } from "@/components/ui/date-tile"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Caption } from "@/components/ui/typography"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import type { Compromissos, repeticoes } from "@/lib/categoria-resumo"
import { currencyBRL } from "@/lib/formatters"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, tileColorFor, tileVividColor } from "@/lib/tile-palette"
import { mesPorExtenso } from "@/components/analise-do-mes/rotulos"

type Compromisso = Compromissos["itens"][number]

/** Pela próxima data, as que já não têm próxima por último. */
function pelaProximaData(a: Compromisso, b: Compromisso) {
    if (a.proximaYmd == null) return b.proximaYmd == null ? 0 : 1
    if (b.proximaYmd == null) return -1
    return a.proximaYmd.localeCompare(b.proximaYmd)
}

/** "parcela 4 de 6 · termina em fevereiro", com o "0 de N" e a última parcela ditos à parte. */
function detalheDaParcela(c: Compromisso, hojeYm: string): string {
    const atual = c.atual ?? 0
    const total = c.total ?? 0
    const termina =
        c.terminaYm == null ? null : c.terminaYm === hojeYm ? "termina este mês" : `termina em ${mesPorExtenso(c.terminaYm)}`
    if (c.proximaYmd == null) return [`parcela ${total} de ${total}`, "termina este mês"].join(" · ")
    const qual = atual === 0 ? `primeira de ${total} parcelas` : `parcela ${atual + 1} de ${total}`
    return [qual, termina].filter(Boolean).join(" · ")
}

function LinhaDoCompromisso({ c, hojeYm, cor }: { c: Compromisso; hojeYm: string; cor: string }) {
    const parcela = c.tipo === "parcela"
    const total = c.total ?? 0
    return (
        <Item variant="flush">
            {c.proximaYmd ? (
                <DateTile date={c.proximaYmd} caption={parcela ? "parcela" : "cobra"} />
            ) : (
                <ItemMedia variant="tile" tone="neutral">
                    <CheckIcon aria-hidden />
                </ItemMedia>
            )}
            <ItemContent>
                <ItemTitle>{c.nome}</ItemTitle>
                <ItemDescription className="nums">{parcela ? detalheDaParcela(c, hojeYm) : "assinatura"}</ItemDescription>
                {parcela && total > 1 ? (
                    <Progress
                        className="mt-2"
                        size="sm"
                        value={c.atual ?? 0}
                        max={total}
                        segments={total}
                        fillColor={cor}
                        aria-label={`${c.atual ?? 0} de ${total} parcelas pagas`}
                    />
                ) : null}
            </ItemContent>
            <ItemActions>
                <MoneyDisplay value={c.valor} />
            </ItemActions>
        </Item>
    )
}

/** As parcelas e assinaturas da categoria e as descrições que se repetem no mês, lado a lado no `md`+. Cada lado some vazio. */
export function CompromissosERepeticoes({
    tipo,
    cor,
    hojeYmd,
    compromissos,
    repetidas,
}: {
    tipo: TipoDaCategoria
    /** `categories.color`: as parcelas pagas pintam nela. */
    cor: string | null
    hojeYmd: string
    compromissos: Compromissos
    repetidas: ReturnType<typeof repeticoes>
}) {
    const itens = [...compromissos.itens].sort(pelaProximaData)
    if (itens.length === 0 && repetidas.length === 0) return null
    const hojeYm = hojeYmd.slice(0, 7)
    // As parcelas pagas têm a cor que o ladrilho desenha.
    const corDaCategoria = tileVividColor(tileColorFor(cor) ?? (tipo === "expense" ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT))
    const projecao = repetidas
        .filter((r) => (r.projecaoNoMes ?? 0) > 0)
        .sort((a, b) => (b.projecaoNoMes ?? 0) - (a.projecaoNoMes ?? 0))[0]
    const resumo = [
        compromissos.porMes > 0 ? `${currencyBRL(compromissos.porMes)} por mês` : null,
        compromissos.ateAcabar > 0 ? `${currencyBRL(compromissos.ateAcabar)} até acabar` : null,
    ]
        .filter(Boolean)
        .join(" · ")

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {itens.length > 0 ? (
                <Card padding="none" className="min-w-0">
                    <CardToolbar variant="title">
                        <span>{tipo === "expense" ? "Parcelas e assinaturas" : "Recorrente"}</span>
                        {resumo ? <Caption className="nums">{resumo}</Caption> : null}
                    </CardToolbar>
                    <ItemGroup variant="divided">
                        {itens.map((c) => (
                            <LinhaDoCompromisso key={`${c.tipo}-${c.id}`} c={c} hojeYm={hojeYm} cor={corDaCategoria} />
                        ))}
                    </ItemGroup>
                </Card>
            ) : null}
            {repetidas.length > 0 ? (
                <Card padding="none" className="min-w-0">
                    <CardToolbar variant="title">O que se repete</CardToolbar>
                    <ItemGroup variant="divided">
                        {repetidas.map((r) => (
                            <Item key={r.descricao} variant="flush">
                                <ItemContent>
                                    {/* A descrição numa pílula: é o nome que se repete, não um lançamento. */}
                                    <ItemTitle>
                                        <Badge variant="outline" tone="neutral" size="md" className="max-w-full">
                                            <span className="truncate">{r.descricao}</span>
                                        </Badge>
                                    </ItemTitle>
                                    <ItemDescription className="nums">
                                        {r.vezes}×{r.aCadaDias ? ` · a cada ~${r.aCadaDias} ${r.aCadaDias === 1 ? "dia" : "dias"}` : " no mesmo dia"}
                                    </ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                    <MoneyDisplay value={r.total} />
                                </ItemActions>
                            </Item>
                        ))}
                    </ItemGroup>
                    {projecao ? (
                        <CardNote className="nums">
                            Se seguir assim, {projecao.descricao} soma mais ~{currencyBRL(projecao.projecaoNoMes ?? 0)} até o fim do mês.
                        </CardNote>
                    ) : null}
                </Card>
            ) : null}
        </div>
    )
}
