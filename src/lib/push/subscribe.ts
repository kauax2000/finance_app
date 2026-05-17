"use client"

import { invokeEdgeJson } from "@/lib/edge-invoke"

export type PushSupportState = "unsupported" | "denied" | "default" | "granted"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const raw = atob(base64)
    const output = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i += 1) {
        output[i] = raw.charCodeAt(i)
    }
    return output
}

export function isPushSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    )
}

export function getPushSupportState(): PushSupportState {
    if (!isPushSupported()) return "unsupported"
    const perm = Notification.permission
    if (perm === "granted") return "granted"
    if (perm === "denied") return "denied"
    return "default"
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) return "denied"
    return Notification.requestPermission()
}

export async function subscribeToPush(): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isPushSupported()) {
        return { ok: false, error: "Push não é suportado neste navegador." }
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
    if (!publicKey) {
        return { ok: false, error: "Chave VAPID pública não configurada." }
    }

    const permission = await requestNotificationPermission()
    if (permission !== "granted") {
        return { ok: false, error: "Permissão de notificações negada." }
    }

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()

    const subscription =
        existing ??
        (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        }))

    const json = subscription.toJSON()
    const endpoint = json.endpoint
    const p256dh = json.keys?.p256dh
    const auth = json.keys?.auth

    if (!endpoint || !p256dh || !auth) {
        return { ok: false, error: "Subscription inválida." }
    }

    await invokeEdgeJson("push-subscribe", {
        body: {
            endpoint,
            keys: { p256dh, auth },
            user_agent: navigator.userAgent,
        },
    })

    return { ok: true }
}

export async function unsubscribeFromPush(): Promise<void> {
    if (!isPushSupported()) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
        const endpoint = subscription.endpoint
        try {
            await invokeEdgeJson("push-unsubscribe", {
                body: { endpoint },
            })
        } catch {
            /* best effort */
        }
        await subscription.unsubscribe()
    } else {
        try {
            await invokeEdgeJson("push-unsubscribe", { body: {} })
        } catch {
            /* best effort */
        }
    }
}
