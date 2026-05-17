"use client"

import {
    createContext,
    Suspense,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type NotificationsUiContextValue = {
    open: () => void
    close: () => void
    toggle: () => void
    isOpen: boolean
    unreadCount: number
    setUnreadCount: (n: number) => void
    adjustUnreadCount: (delta: number) => void
    /** Increment to trigger unread badge refresh in the bell. */
    invalidateUnreadBadge: () => void
    badgeNonce: number
}

const NotificationsUiContext = createContext<NotificationsUiContextValue | null>(null)

function NotificationsQuerySyncInner() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const { open } = useNotificationsUi()

    useEffect(() => {
        if (searchParams.get("notifications") !== "1") return
        open()
        const next = new URLSearchParams(searchParams.toString())
        next.delete("notifications")
        const q = next.toString()
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    }, [searchParams, pathname, router, open])

    return null
}

export function NotificationsUiProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [badgeNonce, setBadgeNonce] = useState(0)

    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggle = useCallback(() => setIsOpen((o) => !o), [])
    const adjustUnreadCount = useCallback((delta: number) => {
        setUnreadCount((cur) => Math.max(0, cur + delta))
    }, [])
    const invalidateUnreadBadge = useCallback(() => setBadgeNonce((n) => n + 1), [])

    const value = useMemo<NotificationsUiContextValue>(
        () => ({
            open,
            close,
            toggle,
            isOpen,
            unreadCount,
            setUnreadCount,
            adjustUnreadCount,
            invalidateUnreadBadge,
            badgeNonce,
        }),
        [
            open,
            close,
            toggle,
            isOpen,
            unreadCount,
            setUnreadCount,
            adjustUnreadCount,
            invalidateUnreadBadge,
            badgeNonce,
        ]
    )

    return (
        <NotificationsUiContext.Provider value={value}>
            <Suspense fallback={null}>
                <NotificationsQuerySyncInner />
            </Suspense>
            {children}
        </NotificationsUiContext.Provider>
    )
}

export function useNotificationsUi(): NotificationsUiContextValue {
    const ctx = useContext(NotificationsUiContext)
    if (!ctx) {
        throw new Error("useNotificationsUi must be used within NotificationsUiProvider")
    }
    return ctx
}
