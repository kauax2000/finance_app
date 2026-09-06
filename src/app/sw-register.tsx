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
        if (!shouldRegisterSw()) {
            // **Não registrar não é o mesmo que não estar registrado.**
            //
            // `shouldRegisterSw()` decide se o app *instala* um service worker.
            // Um que já esteja instalado — de um `next build` local, ou de
            // quando `NEXT_PUBLIC_PWA_ENABLED` esteve ligado — **continua
            // controlando a página**, servindo o casco do precache. Em
            // desenvolvimento isso torna toda mudança invisível, e a falha é
            // silenciosa: a rota responde 200, o HTML do servidor está certo, e
            // a tela mostra o catálogo de ontem.
            //
            // Foi assim que quatro componentes novos "não apareceram" com tudo
            // no lugar. O ramo passa a se auto-curar em vez de só sair.
            if ("serviceWorker" in navigator) {
                void navigator.serviceWorker
                    .getRegistrations()
                    .then((registros) => {
                        for (const registro of registros) void registro.unregister()
                    })
                    .catch(() => {})
            }
            return
        }

        let refreshing = false
        let registration: ServiceWorkerRegistration | null = null

        const onControllerChange = () => {
            // Reload only when an existing SW is replaced (deploy update), not first install.
            if (!navigator.serviceWorker.controller || refreshing) return
            refreshing = true
            window.location.reload()
        }

        const onVisible = () => {
            if (document.visibilityState === "visible" && registration) {
                void registration.update().catch(() => {})
            }
        }

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            onControllerChange,
        )
        document.addEventListener("visibilitychange", onVisible)

        void navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .then((reg) => {
                registration = reg
                void reg.update().catch(() => {})
            })
            .catch((err) => {
                console.warn("[PWA] Service worker registration failed:", err)
            })

        return () => {
            navigator.serviceWorker.removeEventListener(
                "controllerchange",
                onControllerChange,
            )
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [])

    return null
}
