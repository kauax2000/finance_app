"use client"

import { notFound } from "next/navigation"
import { useRef, useState } from "react"
import { isDesignSystemEnabled } from "@/app/designsystem/enabled"
import { ArrowPathIcon, ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { H1, Muted, Small } from "@/components/ui/typography"
import { NOTIFICATIONS_LAB_VERSIONS, type NotificationsLabVersion } from "@/lib/notifications-lab"

const NOMES: Record<NotificationsLabVersion, string> = {
    vidro: "1 · Vidro, levemente transparente (a de agora)",
    chapada: "2 · Fundo sólido (a de antes)",
}

/**
 * O laboratório do fundo do painel de notificações: as duas versões lado a
 * lado, cada uma num quadro com o app de verdade e o painel já aberto
 * (`?notifications=1`). Só em desenvolvimento (a mesma guarda do catálogo).
 * Temporário: sai quando uma versão vencer. O mesmo molde do
 * `/laboratorio/barra`: cada quadro tem o dobro da largura da coluna, desenhado
 * a 50%; "Ampliar" mostra uma versão sozinha e em tamanho real.
 */
export default function Page() {
    if (!isDesignSystemEnabled()) notFound()

    const quadros = useRef<(HTMLIFrameElement | null)[]>([])
    const [ampliada, setAmpliada] = useState<NotificationsLabVersion | null>(null)
    return (
        <div className="flex min-h-dvh flex-col gap-4 bg-background p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <H1>Laboratório das notificações</H1>
                    <Muted>O fundo do painel: o vidro de agora contra o sólido de antes. Clique dentro de cada quadro.</Muted>
                </div>
                <Button
                    variant="secondary"
                    iconMotion="spin"
                    onClick={() =>
                        quadros.current.forEach((q) => q?.contentWindow?.location.reload())
                    }
                >
                    <ArrowPathIcon aria-hidden />
                    Recarregar todos
                </Button>
            </div>
            <div className={ampliada ? "flex flex-1 flex-col" : "grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2"}>
                {NOTIFICATIONS_LAB_VERSIONS.map((versao, i) => {
                    const sozinha = ampliada === versao
                    return (
                        <Card
                            key={versao}
                            padding="none"
                            className={ampliada && !sozinha ? "hidden" : "flex flex-1 flex-col overflow-hidden"}
                        >
                            <div className="flex items-center justify-between gap-2 py-1 pr-2 pl-4">
                                <Small>{NOMES[versao]}</Small>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    onClick={() => setAmpliada(sozinha ? null : versao)}
                                >
                                    {sozinha ? <ArrowsPointingInIcon aria-hidden /> : <ArrowsPointingOutIcon aria-hidden />}
                                    {sozinha ? "Restaurar" : "Ampliar"}
                                </Button>
                            </div>
                            <div
                                className={
                                    sozinha
                                        ? "relative min-h-[80dvh] w-full flex-1 overflow-hidden"
                                        : "relative aspect-[16/10] w-full overflow-hidden"
                                }
                            >
                                <iframe
                                    ref={(el) => {
                                        quadros.current[i] = el
                                    }}
                                    name={`notificacoes:${versao}`}
                                    src="/dashboard?notifications=1"
                                    title={NOMES[versao]}
                                    className={
                                        sozinha
                                            ? "absolute inset-0 size-full border-0"
                                            : "absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
                                    }
                                />
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
