"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * `setTimeout` que morre junto com o componente.
 *
 * Um redirect "em 3 segundos" ou o "Copiado" que volta ao normal disparavam
 * depois de a tela sair — navegando por cima da tela seguinte. Cada agendamento
 * é guardado e limpo no desmonte.
 */
export function useTimeout() {
    const ids = useRef(new Set<ReturnType<typeof setTimeout>>())

    useEffect(() => {
        const pendentes = ids.current
        return () => {
            pendentes.forEach(clearTimeout)
            pendentes.clear()
        }
    }, [])

    return useCallback((fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            ids.current.delete(id)
            fn()
        }, ms)
        ids.current.add(id)
    }, [])
}
