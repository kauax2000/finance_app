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
import { Caption } from "@/components/ui/typography"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { CorpoDoInsight } from "@/components/categories/detail/resumo/corpo-do-insight"
import type { InsightDaCategoria } from "@/lib/insights-da-categoria"
import type { Insight } from "@/lib/insights/acoes"
import { cn } from "@/lib/utils"

/**
 * Os insights do mês num cartão só, um por vez: os pontos e as setas no pé. Os slides ficam da
 * altura do maior (o trilho estica os itens), e quando um insight resolvido sai o embla mantém o
 * índice dentro da lista nova. Sem insight, nada. O de dado leva a ação no canto; o de ação, o
 * botão de largura toda no pé, abaixo do corpo.
 */
export function InsightsDaCategoria({
    insights,
    onAcao,
    corDaSerie,
    linhasDaCaixa,
}: {
    insights: InsightDaCategoria[]
    onAcao: (i: InsightDaCategoria) => void | Promise<void>
    /** A cor que o ladrilho da categoria desenha: o destaque dos mini visuais. */
    corDaSerie: string
    /** As linhas da caixa: a recorrência lê os lançamentos dela. */
    linhasDaCaixa?: Insight[]
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
                        // Dado: o link discreto no canto; ação: o botão secundário de largura toda, no pé.
                        const peso =
                            i.foco === "dado"
                                ? ({ variant: "tertiary", size: "sm" } as const)
                                : ({ variant: "secondary", className: "w-full" } as const)
                        const botao = link ? (
                            <Button asChild {...peso}>
                                <Link href={link}>{i.rotulo}</Link>
                            </Button>
                        ) : (
                            <Button {...peso} disabled={parado} aria-busy={parado || undefined} onClick={() => void agir(i)}>
                                {parado ? <Spinner /> : null}
                                {i.rotulo}
                            </Button>
                        )
                        // O canto do insight de ação: só o número de apoio, onde a tabela pede (a média do 6).
                        const canto = i.corpo.tipo === "recorrencia" ? `~${reaisInteiros(i.corpo.valorMedio)}` : null
                        const c = i.corpo
                        const daCaixa = c.tipo === "recorrencia" ? linhasDaCaixa?.find((l) => l.id === c.insightId) : undefined
                        return (
                            <CarouselItem key={i.id} className="flex">
                                <div className="flex flex-1 flex-col gap-3">
                                    <CardHeader>
                                        <CardTitle size="sm">{i.titulo}</CardTitle>
                                        {i.foco === "dado" ? (
                                            <CardAction>{botao}</CardAction>
                                        ) : canto ? (
                                            <CardAction>
                                                <Caption className="nums font-mono">{canto}</Caption>
                                            </CardAction>
                                        ) : null}
                                    </CardHeader>
                                    {/* A lista do "para conferir" fica no alto, logo abaixo do título: a sobra vai para antes do botão. */}
                                    <div className={cn(i.corpo.tipo !== "conferir" && "mt-auto", "px-(--card-px)")}>
                                        <CorpoDoInsight
                                            corpo={i.corpo}
                                            corDaSerie={corDaSerie}
                                            linhaDaCaixa={daCaixa}
                                            numero={i.numero}
                                            linha={i.linha}
                                            tom={i.tom}
                                        />
                                    </div>
                                    {i.foco === "acao" ? (
                                        <div className={cn(i.corpo.tipo === "conferir" && "mt-auto", "px-(--card-px)")}>{botao}</div>
                                    ) : null}
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
                {insights.length > 1 ? (
                    <CarouselToolbar className="justify-between px-(--card-px)">
                        <CarouselDots variant="pill" />
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
