"use client"

import { SparklesIcon } from "@heroicons/react/16/solid"
import { Card, CardHeader } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import type { fraseDoResumo } from "@/lib/categoria-resumo"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, tileColorFor } from "@/lib/tile-palette"

/** A frase de resumo do mês, com o ladrilho na cor da categoria (o vivo, o do cabeçalho; o suave quase some no escuro) e as partes fortes (os números) em destaque. */
export function FraseDoResumo({
    frase,
    tipo,
    cor,
}: {
    frase: ReturnType<typeof fraseDoResumo>
    tipo: TipoDaCategoria
    cor: string | null
}) {
    // Sem cor gravada, o palpite do cabeçalho (coral na despesa, lima na receita).
    const corDaCategoria = tileColorFor(cor) ?? (tipo === "expense" ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT)
    return (
        <Card variant="tinted">
            <CardHeader
                media={
                    <ColorTile size="lg" color={corDaCategoria}>
                        <SparklesIcon aria-hidden />
                    </ColorTile>
                }
            >
                <p className="text-base leading-snug text-pretty text-muted-foreground md:text-xl">
                    {frase.partes.map((p, i) =>
                        p.forte ? (
                            <strong key={i} className="nums font-semibold text-foreground">
                                {p.texto}
                            </strong>
                        ) : (
                            <span key={i}>{p.texto}</span>
                        ),
                    )}
                </p>
            </CardHeader>
        </Card>
    )
}
