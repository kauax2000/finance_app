"use client"

import { useCallback, useEffect } from "react"
import { BellIcon } from "@heroicons/react/16/solid"
import { TopBarAction } from "@/components/ui/top-bar"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { countUnreadNotifications } from "@/lib/notifications"

export function NotificationBellLink() {
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const { toggle, isOpen, unreadCount, setUnreadCount } = useNotificationsUi()

    const refresh = useCallback(async () => {
        if (!user?.id || !currentWorkspaceId) {
            setUnreadCount(0)
            return
        }
        try {
            const n = await countUnreadNotifications(user.id, currentWorkspaceId)
            setUnreadCount(n)
        } catch {
            setUnreadCount(0)
        }
    }, [user, currentWorkspaceId, setUnreadCount])

    useEffect(() => {
        if (authLoading || workspaceLoading) return
        void refresh()
    }, [authLoading, workspaceLoading, refresh])

    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "visible") void refresh()
        }
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
    }, [refresh])

    return (
        <TopBarAction
            type="button"
            label="Notificações"
            count={unreadCount}
            countLabel={`${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`}
            aria-expanded={isOpen}
            onClick={() => toggle()}
        >
            {/* `24/outline` a 16px, por decisão: não existe `16/outline`, e o
                traço é o do sol do `ThemeToggle`. Exceção nomeada no auditor. */}
            <BellIcon className="size-4" />
        </TopBarAction>
    )
}
