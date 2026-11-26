"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

/**
 * Toda troca de tela abre no topo, também ao voltar e ao recarregar. O Next só rola quando o
 * começo da página nova está fora da vista, e o esqueleto curto prende a
 * rolagem perto do topo: vindo de uma tela rolada, a página nova abria no meio.
 * Um link com âncora (`#`) fica com o Next.
 */
export function TopoAoTrocarDeTela() {
    const pathname = usePathname()
    const anterior = React.useRef(pathname)

    // Senão, ao voltar, o navegador devolve a rolagem velha por cima do topo.
    React.useEffect(() => {
        window.history.scrollRestoration = "manual"
    }, [])

    React.useLayoutEffect(() => {
        if (anterior.current === pathname) return
        anterior.current = pathname
        if (window.location.hash) return
        window.scrollTo({ top: 0, behavior: "instant" })
    }, [pathname])

    return null
}
