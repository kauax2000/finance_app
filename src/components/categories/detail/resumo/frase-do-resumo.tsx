"use client"

import type * as React from "react"
import { SparklesIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import { Caption } from "@/components/ui/typography"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { type fraseDoResumo, nomeDoMes } from "@/lib/categoria-resumo"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, tileColorFor } from "@/lib/tile-palette"

/**
 * A frase do mês em dois tempos: o veredito em Ledger, com o valor na tinta da
 * categoria, e a explicação menor por baixo, com o nome do lançamento que puxou
 * o mês clicável. O rodapé diz de onde a frase sai e leva aos dois fatos dela.
 */
export function FraseDoResumo({
    frase,
    tipo,
    cor,
    yearMonth,
    quantosLancamentos,
    comMedia,
    onAbrirLancamento,
    proximoMes,
    onVerProximoMes,
}: {
    frase: ReturnType<typeof fraseDoResumo>
    tipo: TipoDaCategoria
    cor: string | null
    yearMonth: string
    quantosLancamentos: number
    /** A média dos últimos 6 meses entrou na frase. */
    comMedia: boolean
    /** Abre o lançamento que puxou o mês; null sem ele. */
    onAbrirLancamento: (() => void) | null
    /** O mês seguinte, quando já tem previsto ("Dezembro"); null sem ele. */
    proximoMes: string | null
    onVerProximoMes: () => void
}) {
    // Sem cor gravada, o palpite do cabeçalho (coral na despesa, lima na receita).
    const corDaCategoria = tileColorFor(cor) ?? (tipo === "expense" ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT)
    const mes = nomeDoMes(yearMonth).toLocaleLowerCase("pt-BR")
    const temRodape = frase.explicacao.length > 0 && quantosLancamentos > 0
    return (
        <Card variant="tinted">
            <CardHeader
                // O ladrilho no alto do parágrafo, e não no meio das linhas.
                className="[&>[data-slot=card-header-media]]:self-start"
                media={
                    <ColorTile size="lg" tint="tonal" color={corDaCategoria}>
                        <SparklesIcon aria-hidden />
                    </ColorTile>
                }
            >
                <div>
                    <p
                        className="tile-tonal font-display text-xl leading-snug text-pretty text-foreground md:text-2xl"
                        style={{ "--tile-color": corDaCategoria } as React.CSSProperties}
                    >
                        {frase.veredito.map((p, i) =>
                            p.forte ? (
                                <strong key={i} className="nums font-sans font-semibold text-(--tile-ink)">
                                    {p.texto}
                                </strong>
                            ) : (
                                <span key={i}>{p.texto}</span>
                            ),
                        )}
                    </p>
                    {frase.explicacao.length > 0 ? (
                        <p className="mt-2 text-sm text-pretty text-muted-foreground md:text-base">
                            {frase.explicacao.map((p, i) =>
                                p.lancamento && onAbrirLancamento ? (
                                    <Button
                                        key={i}
                                        type="button"
                                        variant="underline"
                                        className="h-auto px-0 text-sm md:text-base"
                                        onClick={onAbrirLancamento}
                                    >
                                        {p.texto}
                                    </Button>
                                ) : p.forte ? (
                                    <strong key={i} className="nums font-semibold text-foreground">
                                        {p.texto}
                                    </strong>
                                ) : (
                                    <span key={i}>{p.texto}</span>
                                ),
                            )}
                        </p>
                    ) : null}
                </div>
            </CardHeader>
            {temRodape ? (
                <CardFooter className="justify-between">
                    <Caption>
                        Feito com {quantosLancamentos === 1 ? "1 lançamento" : `os ${quantosLancamentos} lançamentos`} de{" "}
                        {mes}
                        {comMedia ? " e os últimos 6 meses" : ""}
                    </Caption>
                    {onAbrirLancamento || proximoMes ? (
                        <div className="flex flex-wrap gap-2">
                            {onAbrirLancamento ? (
                                <Button type="button" variant="secondary" size="sm" onClick={onAbrirLancamento}>
                                    Ver o lançamento
                                </Button>
                            ) : null}
                            {proximoMes ? (
                                <Button type="button" variant="secondary" size="sm" onClick={onVerProximoMes}>
                                    {`Ver ${proximoMes.toLocaleLowerCase("pt-BR")}`}
                                </Button>
                            ) : null}
                        </div>
                    ) : null}
                </CardFooter>
            ) : null}
        </Card>
    )
}
