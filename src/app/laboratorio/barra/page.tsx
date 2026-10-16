"use client"

import { notFound } from "next/navigation"
import { useRef, useState } from "react"
import { isDesignSystemEnabled } from "@/app/designsystem/enabled"
import { ArrowPathIcon, ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { H1, Muted, Small } from "@/components/ui/typography"
import { SIDEBAR_LAB_VERSIONS } from "@/lib/sidebar-lab"

const NOMES: Record<(typeof SIDEBAR_LAB_VERSIONS)[number], string> = {
    header: "1 · No topo, nos dois estados (a do app)",
    edge: "2 · Na borda da barra",
    footer: "4 · No rodapé, a linha \"Recolher\"",
    footerBar: "4b · No rodapé, a faixa no pé",
}

/**
 * O laboratório do botão de recolher da barra lateral: as versões do
 * `toggle` lado a lado, cada uma num quadro com o app de verdade. Só em
 * desenvolvimento (a mesma guarda do catálogo). Temporário: sai quando uma
 * versão vencer e virar a do app.
 *
 * Cada quadro tem o dobro da largura da coluna, desenhado a 50%: largura de
 * desktop dentro dele (a barra só existe acima de 768px), e o clique continua
 * valendo. O
 * estado aberto/recolhido mora num cookie dividido por todos; "Recarregar"
 * sincroniza. "Ampliar" mostra uma versão sozinha e em tamanho real (sem a
 * redução); as outras só se escondem, sem recarregar, e guardam o estado.
 */
export default function Page() {
    if (!isDesignSystemEnabled()) notFound()

    const quadros = useRef<(HTMLIFrameElement | null)[]>([])
    const [ampliada, setAmpliada] = useState<(typeof SIDEBAR_LAB_VERSIONS)[number] | null>(null)
    return (
        <div className="flex min-h-dvh flex-col gap-4 bg-background p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <H1>Laboratório da barra lateral</H1>
                    <Muted>O botão de recolher e abrir: a borda contra as duas do rodapé. Clique dentro de cada quadro.</Muted>
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
                {SIDEBAR_LAB_VERSIONS.map((versao, i) => {
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
                                    name={`barra:${versao}`}
                                    src="/dashboard"
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
