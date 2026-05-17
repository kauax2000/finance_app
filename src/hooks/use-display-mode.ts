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
        setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent))
    }, [])

    return isIos
}
