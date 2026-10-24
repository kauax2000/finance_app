"use client"

import { useEffect, useState } from "react"
import { localYmdFromDate } from "@/lib/transaction-date"

/**
 * O dia local de hoje, vivo: volta a ser lido quando a janela recebe o foco,
 * quando a aba volta a ficar visível e na virada da meia-noite. Um `useMemo([])` o congelava no dia em que a tela
 * abriu.
 */
export function useHojeYmd(): string {
    const [hoje, setHoje] = useState(() => localYmdFromDate(new Date()))

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined
        const agendarVirada = () => {
            const agora = new Date()
            const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1)
            timer = setTimeout(atualizar, amanha.getTime() - agora.getTime() + 1000)
        }
        const atualizar = () => {
            clearTimeout(timer)
            setHoje(localYmdFromDate(new Date()))
            agendarVirada()
        }
        // No PWA do iOS, voltar do fundo nem sempre dispara `focus`.
        const aoMostrar = () => {
            if (document.visibilityState === "visible") atualizar()
        }
        agendarVirada()
        window.addEventListener("focus", atualizar)
        document.addEventListener("visibilitychange", aoMostrar)
        return () => {
            clearTimeout(timer)
            window.removeEventListener("focus", atualizar)
            document.removeEventListener("visibilitychange", aoMostrar)
        }
    }, [])

    return hoje
}
