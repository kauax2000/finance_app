"use client"

import { useEffect, useState } from "react"

export function useDisplayMode() {
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia("(display-mode: standalone)")
        const nav = window.navigator as Navigator & { standalone?: boolean }

        const update = () => {
            setIsStandalone(mq.matches || nav.standalone === true)
        }

        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])

    return { isStandalone }
}

export function useIsIos(): boolean {
    const [isIos, setIsIos] = useState(false)

    useEffect(() => {
        const nav = window.navigator
        // Desde o iPadOS 13 o iPad se anuncia como Mac; o que o denuncia é o toque.
        setIsIos(
            /iphone|ipad|ipod/i.test(nav.userAgent) ||
                (/macintosh/i.test(nav.userAgent) && nav.maxTouchPoints > 1)
        )
    }, [])

    return isIos
}
