/// <reference types="react/canary" />
"use client"

import { useEffect, useState, ViewTransition } from "react"
import { defaultMobileBackHref } from "@/components/layout/app-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { direcaoDaTela, type DirecaoDaTela } from "@/lib/direcao-da-tela"

// `--duration-slow` (300ms) mais uma folga: as barras precisam do nome até o retrato novo.
const TEMPO_DO_NOME_MS = 400

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
        const proxima = isMobile ? direcaoDaTela(atual, pathname, defaultMobileBackHref) : null
        setAtual(pathname)
        // O WebKit resolve os quadros antes do `onUpdate`, e a tela nova sempre começa do topo.
        document.documentElement.style.setProperty("--subpagina-desvio", `${-window.scrollY}px`)
        // eslint-disable-next-line react-hooks/immutability -- precisa estar no `<html>` antes do retrato da tela velha
        if (proxima) document.documentElement.dataset.subpagina = proxima
        setDirecao(proxima)
    }

    // O nome faz da barra uma raiz de fundo, e o borrão some em repouso.
    useEffect(() => {
        const raiz = document.documentElement
        if (!raiz.dataset.subpagina) return
        const timer = setTimeout(() => delete raiz.dataset.subpagina, TEMPO_DO_NOME_MS)
        return () => clearTimeout(timer)
    }, [atual])

    // Limpa depois da troca: a montagem adiada é outra transição e não pode repetir o gesto.
    useEffect(() => {
        if (direcao) setDirecao(null)
    }, [direcao])

    return (
        <ViewTransition default="none" update={direcao ? `subpagina-${direcao}` : "none"}>
            {children}
        </ViewTransition>
    )
}
