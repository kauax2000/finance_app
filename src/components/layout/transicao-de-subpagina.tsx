/// <reference types="react/canary" />
"use client"

import { useEffect, useState, ViewTransition } from "react"
import { defaultMobileBackHref } from "@/components/layout/app-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { direcaoDaTela, type DirecaoDaTela } from "@/lib/direcao-da-tela"

/**
 * A direção sai da troca de rota, e não do link: nenhuma tela marca nada.
 * shortcut: o gesto de voltar do Safari, fora do app instalado, soma a própria animação à daqui, rever se esse uso pesar.
 */
export function TransicaoDeSubpagina({
    pathname,
    children,
}: {
    pathname: string
    children: React.ReactElement
}) {
    const isMobile = useIsMobile()
    const [atual, setAtual] = useState(pathname)
    const [direcao, setDirecao] = useState<DirecaoDaTela | null>(null)
    if (pathname !== atual) {
        setAtual(pathname)
        // O WebKit resolve os quadros antes do `onUpdate`, e a tela nova sempre começa do topo.
        document.documentElement.style.setProperty("--subpagina-desvio", `${-window.scrollY}px`)
        setDirecao(isMobile ? direcaoDaTela(atual, pathname, defaultMobileBackHref) : null)
    }

    // Limpa depois da troca: a montagem adiada é outra transição e não pode repetir o gesto.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- a classe vale para um commit só
        if (direcao) setDirecao(null)
    }, [direcao])

    return (
        <ViewTransition default="none" update={direcao ? `subpagina-${direcao}` : "none"}>
            {children}
        </ViewTransition>
    )
}
