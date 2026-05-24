/// <reference types="@serwist/next/typings" />

import { pwaIconSrc } from "@/lib/pwa/icon-url"
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { NetworkOnly, Serwist } from "serwist"

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
    }
}

declare const self: WorkerGlobalScope

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        {
            matcher: ({ url }) =>
                url.hostname.includes("supabase.co") ||
                url.pathname.includes("/functions/v1/"),
            handler: new NetworkOnly(),
        },
        ...defaultCache,
    ],
})

serwist.addEventListeners()

// Service worker DOM types are not in the default Next TS program; use a narrow cast.
type SwPushEvent = {
    waitUntil(promise: Promise<unknown>): void
    data?: { json(): unknown }
}

type SwNotificationClickEvent = {
    waitUntil(promise: Promise<unknown>): void
    notification: { close(): void; data?: { href?: string } }
}

const sw = self as unknown as {
    addEventListener(
        type: string,
        listener: (event: SwPushEvent | SwNotificationClickEvent) => void
    ): void
    registration: {
        showNotification(
            title: string,
            options?: {
                body?: string
                icon?: string
                badge?: string
                tag?: string
                data?: { href?: string }
            }
        ): Promise<void>
    }
    clients: {
        matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<
            Array<{ url: string; focus(): Promise<void>; navigate?(url: string): Promise<void> }>
        >
        openWindow(url: string): Promise<unknown>
    }
    location: { origin: string }
}

type PushPayload = {
    title?: string
    body?: string
    href?: string
    notification_id?: string
}

sw.addEventListener("push", (event) => {
    const pushEvent = event as SwPushEvent
    pushEvent.waitUntil(
        (async () => {
            let payload: PushPayload = {
                title: "Finance",
                body: "Você tem uma nova notificação.",
                href: "/dashboard",
            }

            try {
                const parsed = pushEvent.data?.json() as PushPayload | undefined
                if (parsed) {
                    payload = { ...payload, ...parsed }
                }
            } catch {
                /* ignore malformed payload */
            }

            const title = payload.title?.trim() || "Finance"
            const body = payload.body?.trim() || "Você tem uma nova notificação."
            const href =
                typeof payload.href === "string" && payload.href.startsWith("/")
                    ? payload.href
                    : "/dashboard"

            await sw.registration.showNotification(title, {
                body,
                icon: pwaIconSrc("icon-192.png"),
                badge: pwaIconSrc("icon-192.png"),
                tag: payload.notification_id,
                data: { href },
            })
        })()
    )
})

sw.addEventListener("notificationclick", (event) => {
    const clickEvent = event as SwNotificationClickEvent
    clickEvent.notification.close()
    const href =
        typeof clickEvent.notification.data?.href === "string"
            ? clickEvent.notification.data.href
            : "/dashboard"

    clickEvent.waitUntil(
        (async () => {
            const url = new URL(href, sw.location.origin).href
            const clients = await sw.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            })

            for (const client of clients) {
                if (client.url.startsWith(sw.location.origin)) {
                    await client.focus()
                    if ("navigate" in client && typeof client.navigate === "function") {
                        await client.navigate(url)
                    }
                    return
                }
            }

            await sw.clients.openWindow(url)
        })()
    )
})
