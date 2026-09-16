"use client"

import { useSyncExternalStore } from "react"

const STANDALONE = "(display-mode: standalone)"

function subscribeStandalone(onChange: () => void) {
    const mq = window.matchMedia(STANDALONE)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
}

function getStandalone() {
    const nav = window.navigator as Navigator & { standalone?: boolean }
    return window.matchMedia(STANDALONE).matches || nav.standalone === true
}

export function useDisplayMode() {
    const isStandalone = useSyncExternalStore(subscribeStandalone, getStandalone, () => false)
    return { isStandalone }
}

const nada = () => () => {}

function getIsIos() {
    const nav = window.navigator
    // Desde o iPadOS 13 o iPad se anuncia como Mac; o que o denuncia é o toque.
    return (
        /iphone|ipad|ipod/i.test(nav.userAgent) ||
        (/macintosh/i.test(nav.userAgent) && nav.maxTouchPoints > 1)
    )
}

/** O aparelho não muda durante a sessão: sem assinatura, e `false` no servidor. */
export function useIsIos(): boolean {
    return useSyncExternalStore(nada, getIsIos, () => false)
}
