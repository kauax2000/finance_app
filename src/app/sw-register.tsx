"use client"

import { useEffect } from "react"

function shouldRegisterSw(): boolean {
    if (typeof window === "undefined") return false
    if (!("serviceWorker" in navigator)) return false
    if (process.env.NODE_ENV === "development") {
        return process.env.NEXT_PUBLIC_PWA_ENABLED === "true"
    }
    return true
}

export function SwRegister() {
    useEffect(() => {
        if (!shouldRegisterSw()) return

        void navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .catch((err) => {
                console.warn("[PWA] Service worker registration failed:", err)
            })
    }, [])

    return null
}
