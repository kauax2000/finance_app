"use client"

import { useCallback, useEffect, useState } from "react"

export function formatCooldown(seconds: number): string {
    const s = Math.max(0, Math.ceil(seconds))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/**
 * Uma contagem regressiva que começa ao montar. `restart` a recomeça (depois
 * de um reenvio que deu certo). Um intervalo de 1 s só enquanto conta.
 */
export function useCooldown(seconds: number) {
    const [remaining, setRemaining] = useState(seconds)
    const counting = remaining > 0

    useEffect(() => {
        if (!counting) return
        const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
        return () => clearInterval(id)
    }, [counting])

    const restart = useCallback(() => setRemaining(seconds), [seconds])
    return { remaining, restart }
}
