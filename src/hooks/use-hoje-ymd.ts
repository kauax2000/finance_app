"use client"

import { useEffect, useState } from "react"
import { localYmdFromDate } from "@/lib/transaction-date"

/**
 * O dia local de hoje, vivo: volta a ser lido quando a janela recebe o foco e
 * na virada da meia-noite. Um `useMemo([])` o congelava no dia em que a tela
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
        agendarVirada()
        window.addEventListener("focus", atualizar)
        return () => {
            clearTimeout(timer)
            window.removeEventListener("focus", atualizar)
        }
    }, [])

    return hoje
}
