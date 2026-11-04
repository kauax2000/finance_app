"use client"

import { useSyncExternalStore } from "react"

import { useDisplayMode } from "@/hooks/use-display-mode"
import { useIsMobile } from "@/hooks/use-mobile"

export type AparelhoDeLancar =
    | "sabendo"
    | "computador"
    | "navegador-iphone"
    | "navegador-android"
    | "iphone-instalado"
    | "android-instalado"

/** iPad e Mac não contam: só o iPhone. */
export function ehIphone(userAgent: string): boolean {
    return /iphone/i.test(userAgent)
}

export function aparelhoDeLancar(s: {
    celular: boolean
    instalado: boolean
    iphone: boolean
}): Exclude<AparelhoDeLancar, "sabendo"> {
    if (s.instalado) return s.iphone ? "iphone-instalado" : "android-instalado"
    if (s.celular) return s.iphone ? "navegador-iphone" : "navegador-android"
    return "computador"
}

const nada = () => () => {}

/** Qual aparelho é este: `"sabendo"` no servidor e na hidratação. */
export function useAparelhoDeLancar(): AparelhoDeLancar {
    const celular = useIsMobile()
    const { isStandalone } = useDisplayMode()
    const montado = useSyncExternalStore(nada, () => true, () => false)
    if (!montado) return "sabendo"
    return aparelhoDeLancar({
        celular,
        instalado: isStandalone,
        iphone: ehIphone(navigator.userAgent),
    })
}
