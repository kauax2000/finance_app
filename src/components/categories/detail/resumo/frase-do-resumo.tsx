"use client"

import { SparklesIcon } from "@heroicons/react/20/solid"
import { Card, CardHeader } from "@/components/ui/card"
import { ItemMedia } from "@/components/ui/item"
import type { fraseDoResumo } from "@/lib/categoria-resumo"

/** A frase de resumo do mês, com as partes fortes (os números) em destaque. */
export function FraseDoResumo({ frase }: { frase: ReturnType<typeof fraseDoResumo> }) {
    return (
        <Card>
            <CardHeader
                media={
                    <ItemMedia variant="tile" tone="neutral" className="size-10 [&_svg]:size-5">
                        <SparklesIcon aria-hidden className="size-5" />
                    </ItemMedia>
                }
            >
                <p className="text-lg leading-snug text-pretty text-foreground">
                    {frase.partes.map((p, i) =>
                        p.forte ? (
                            <strong key={i} className="nums font-semibold">
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
