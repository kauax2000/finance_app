"use client"

import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselDots,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    CarouselToolbar,
} from "@/components/ui/carousel"
import { Spinner } from "@/components/ui/spinner"
import type { InsightDaCategoria } from "@/lib/insights-da-categoria"
import { cn } from "@/lib/utils"

const TOM = { success: "text-success", warning: "text-warning" } as const

/**
 * Os insights do mês num cartão só, um por vez: os pontos e as setas no pé. Os slides ficam da
 * altura do maior (o trilho estica os itens), e quando um insight resolvido sai o embla mantém o
 * índice dentro da lista nova. Sem insight, nada.
 */
export function InsightsDaCategoria({
    insights,
    onAcao,
}: {
    insights: InsightDaCategoria[]
    onAcao: (i: InsightDaCategoria) => void | Promise<void>
}) {
    const [ocupado, setOcupado] = React.useState<string | null>(null)
    if (insights.length === 0) return null

    async function agir(i: InsightDaCategoria) {
        const r = onAcao(i)
        if (!(r instanceof Promise)) return
        setOcupado(i.id)
        try {
            await r
        } finally {
            setOcupado(null)
        }
    }

    return (
        <Card>
            <Carousel
                aria-label="Insights da categoria"
                controls="none"
                fade={false}
                className="flex flex-1 flex-col gap-(--card-gap)"
            >
                {/* O viewport recorta: o respiro de 8px deixa o botão (que transborda a linha do título) e o anel de foco à vista.
                    A sobra do cartão esticado pela grade desce até o slide, para o número assentar no pé. */}
                <CarouselContent viewportClassName="-my-2 flex flex-1 flex-col py-2" className="flex-1">
                    {insights.map((i) => {
                        const parado = ocupado === i.id
                        const link = i.acao.tipo === "previsao" ? "/previsao" : i.acao.tipo === "link" ? i.acao.href : null
                        return (
                            <CarouselItem key={i.id} className="flex">
                                <div className="flex flex-1 flex-col gap-3">
                                    <CardHeader>
                                        <CardTitle size="sm">{i.titulo}</CardTitle>
                                        <CardAction>
                                            {link ? (
                                                <Button asChild variant="tertiary" size="sm">
                                                    <Link href={link}>{i.rotulo}</Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="tertiary"
                                                    size="sm"
                                                    disabled={parado}
                                                    aria-busy={parado || undefined}
                                                    onClick={() => void agir(i)}
                                                >
                                                    {parado ? <Spinner /> : null}
                                                    {i.rotulo}
                                                </Button>
                                            )}
                                        </CardAction>
                                    </CardHeader>
                                    <div className="mt-auto px-(--card-px)">
                                        <p className={cn("nums font-mono text-2xl font-semibold", i.tom && TOM[i.tom])}>{i.numero}</p>
                                        <p className="text-sm text-muted-foreground">{i.linha}</p>
                                    </div>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
                {insights.length > 1 ? (
                    <CarouselToolbar className="justify-between px-(--card-px)">
                        <CarouselDots />
                        <div className="flex items-center gap-1.5">
                            <CarouselPrevious placement="inline" />
                            <CarouselNext placement="inline" />
                        </div>
                    </CarouselToolbar>
                ) : null}
            </Carousel>
        </Card>
    )
}
