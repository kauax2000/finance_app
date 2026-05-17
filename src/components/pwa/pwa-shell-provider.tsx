"use client"

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import { PwaShellContext } from "@/components/pwa/pwa-shell-context"
import { ThemeColorSync } from "@/components/pwa/theme-color-sync"
import { OfflineBanner } from "@/components/pwa/offline-banner"
import { InstallPwaSheetAuto } from "@/components/pwa/install-pwa-sheet"
import { useDisplayMode } from "@/hooks/use-display-mode"
import { subscribeOnlineStatus } from "@/lib/offline/connectivity"
import { getPendingCount, subscribeOutbox } from "@/lib/offline/outbox"
import { processOutbox } from "@/lib/offline/sync-engine"

type PwaShellProviderProps = {
    children: ReactNode
}

export function PwaShellProvider({ children }: PwaShellProviderProps) {
    const { isStandalone } = useDisplayMode()
    const [isOnline, setIsOnline] = useState(true)
    const [pendingSyncCount, setPendingSyncCount] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)
    useEffect(() => {
        setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true)
        return subscribeOnlineStatus(setIsOnline)
    }, [])

    useEffect(() => {
        void getPendingCount().then(setPendingSyncCount)
        return subscribeOutbox(() => {
            void getPendingCount().then(setPendingSyncCount)
        })
    }, [])

    const syncNow = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return
        setIsSyncing(true)
        try {
            await processOutbox()
        } finally {
            setIsSyncing(false)
            const count = await getPendingCount()
            setPendingSyncCount(count)
        }
    }, [isSyncing])

    useEffect(() => {
        if (!isOnline) return
        void syncNow()
    }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps -- sync when back online

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible" && navigator.onLine) {
                void syncNow()
            }
        }
        document.addEventListener("visibilitychange", onVisible)
        return () => document.removeEventListener("visibilitychange", onVisible)
    }, [syncNow])

    useEffect(() => {
        if (!isOnline || pendingSyncCount === 0) return
        const id = window.setInterval(() => {
            void syncNow()
        }, 30_000)
        return () => window.clearInterval(id)
    }, [isOnline, pendingSyncCount, syncNow])

    const value = useMemo(
        () => ({
            isOnline,
            isStandalone,
            pendingSyncCount,
            isSyncing,
            syncNow,
            openInstallSheet: () => {
                /* Settings uses its own InstallPwaSheet */
            },
        }),
        [isOnline, isStandalone, pendingSyncCount, isSyncing, syncNow]
    )

    return (
        <PwaShellContext.Provider value={value}>
            <ThemeColorSync />
            <OfflineBanner />
            <InstallPwaSheetAuto />
            {children}
        </PwaShellContext.Provider>
    )
}
