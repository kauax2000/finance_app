"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/providers"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"
import { useWorkspace } from "@/components/workspace-provider"
import {
    getPushSupportState,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
} from "@/lib/push/subscribe"

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const { currentWorkspaceId } = useWorkspace()
    const { prefs, loading } = useWorkspaceNotificationPrefs()
    const syncingRef = useRef(false)

    useEffect(() => {
        if (!user || loading || !prefs) return
        if (syncingRef.current) return
        if (!isPushSupported()) return

        const run = async () => {
            syncingRef.current = true
            try {
                if (prefs.notify_push) {
                    const state = getPushSupportState()
                    if (state === "granted") {
                        await subscribeToPush()
                    }
                } else {
                    await unsubscribeFromPush()
                }
            } catch (err) {
                console.warn("[push] sync failed", err)
            } finally {
                syncingRef.current = false
            }
        }

        void run()
    }, [user, loading, prefs?.notify_push, currentWorkspaceId])

    return <>{children}</>
}
