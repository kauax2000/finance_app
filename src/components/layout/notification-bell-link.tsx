"use client"

import { useCallback, useEffect } from "react"
import { BellIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { countUnreadNotifications } from "@/lib/notifications"
import { tagChipUnreadCount } from "@/lib/tag-chip-classes"
import { cn } from "@/lib/utils"

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
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notificações"
            aria-expanded={isOpen}
            onClick={() => toggle()}
        >
            <BellIcon className="h-4 w-4" />
            {unreadCount > 0 ? (
                <span
                    className={cn(
                        "absolute top-0 right-0 z-10 flex h-4 min-w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-0 px-1 text-[10px] font-semibold leading-none ring-2 ring-background",
                        tagChipUnreadCount
                    )}
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            ) : null}
        </Button>
    )
}
