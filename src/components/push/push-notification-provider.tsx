"use client"

import { supabase } from "@/lib/supabase"
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
                    // A inscrição é do aparelho, não da carteira: só sai quando
                    // nenhuma carteira da pessoa quer push.
                    const { count, error } = await supabase
                        .from("workspace_member_notification_prefs")
                        .select("workspace_id", { count: "exact", head: true })
                        .eq("user_id", user.id)
                        .eq("notify_push", true)
                    if (!error && (count ?? 0) === 0) {
                        await unsubscribeFromPush()
                    }
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
