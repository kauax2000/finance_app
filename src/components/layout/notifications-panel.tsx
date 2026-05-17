"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckIcon, EllipsisHorizontalIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { NotificationsPanelEmpty } from "@/components/layout/notifications-panel-empty"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { getNotificationAction } from "@/lib/notification-actions"
import {
    clearAllNotifications,
    deleteNotification,
    listNotifications,
    markRead,
    type AppNotification,
} from "@/lib/notifications"
import { getNotificationIcon } from "@/lib/notification-visuals"
import {
    dismissPageFetchError,
    toastError,
    toastPageFetchError,
} from "@/lib/toast"
import { cn } from "@/lib/utils"

function formatRelativeTime(iso: string): string {
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return ""
    const diff = Date.now() - t
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return "agora"
    const min = Math.floor(sec / 60)
    if (min < 60) return `há ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `há ${h} h`
    const d = Math.floor(h / 24)
    if (d < 7) return `há ${d} d`
    return new Date(iso).toLocaleDateString()
}

type NotificationsPanelProps = {
    isActive: boolean
}

export function NotificationsPanel({ isActive }: NotificationsPanelProps) {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const { close, adjustUnreadCount, setUnreadCount } = useNotificationsUi()
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState<AppNotification[]>([])

    const fetchNotifications = useCallback(async () => {
        if (!user?.id || !currentWorkspaceId) return
        setLoading(true)
        try {
            const rows = await listNotifications(user.id, currentWorkspaceId)
            setNotifications(rows)
            setUnreadCount(rows.filter((n) => !n.read_at).length)
            dismissPageFetchError("notifications")
        } catch (e) {
            toastPageFetchError(
                "notifications",
                e instanceof Error ? e.message : "Erro ao carregar notificações"
            )
        } finally {
            setLoading(false)
        }
    }, [user?.id, currentWorkspaceId, setUnreadCount])

    useEffect(() => {
        if (!isActive) return
        if (authLoading || workspaceLoading) return
        if (!user?.id || !currentWorkspaceId) {
            setLoading(false)
            return
        }
        void fetchNotifications()
    }, [
        isActive,
        authLoading,
        workspaceLoading,
        user?.id,
        currentWorkspaceId,
        fetchNotifications,
    ])

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read_at).length,
        [notifications]
    )

    const onMarkAsRead = async (id: string) => {
        if (!user?.id || !currentWorkspaceId) return
        const wasUnread = notifications.some((n) => n.id === id && !n.read_at)
        if (wasUnread) adjustUnreadCount(-1)
        setNotifications((cur) =>
            cur.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        )
        try {
            await markRead(user.id, currentWorkspaceId, id)
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Erro ao marcar como lida")
            void fetchNotifications()
        }
    }

    const onDelete = async (id: string) => {
        if (!user?.id || !currentWorkspaceId) return
        const wasUnread = notifications.some((n) => n.id === id && !n.read_at)
        if (wasUnread) adjustUnreadCount(-1)
        setNotifications((cur) => cur.filter((n) => n.id !== id))
        try {
            await deleteNotification(user.id, currentWorkspaceId, id)
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Erro ao excluir")
            void fetchNotifications()
        }
    }

    const onClearAll = async () => {
        if (!window.confirm("Limpar todas as notificações desta carteira?")) return
        if (!user?.id || !currentWorkspaceId) return
        setUnreadCount(0)
        setNotifications([])
        try {
            await clearAllNotifications(user.id, currentWorkspaceId)
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Erro ao limpar")
            void fetchNotifications()
        }
    }

    const onRowActivate = async (notification: AppNotification) => {
        const action = getNotificationAction(notification)
        if (!notification.read_at) {
            await onMarkAsRead(notification.id)
        }
        if (action) {
            close()
            router.push(action.href)
        }
    }

    const skeleton = (
        <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-4 w-4 shrink-0 rounded" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border">
                <div className="flex items-center gap-3 px-4 pb-4 pt-4 md:pt-5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-heading text-base font-medium leading-tight">
                                    Notificações
                                </h2>
                                {unreadCount > 0 ? (
                                    <Badge
                                        variant="success"
                                        className="shrink-0 px-2 py-0.5 text-[11px] font-semibold leading-none"
                                    >
                                        {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 -mr-1"
                        onClick={() => close()}
                        aria-label="Fechar notificações"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                {authLoading || workspaceLoading || (loading && isActive) ? (
                    skeleton
                ) : !user ? (
                    <NotificationsPanelEmpty variant="no-auth" />
                ) : !currentWorkspaceId ? (
                    <NotificationsPanelEmpty variant="no-workspace" />
                ) : notifications.length === 0 ? (
                    <NotificationsPanelEmpty
                        variant="inbox-empty"
                        onOpenPreferences={() => {
                            close()
                            router.push("/settings")
                        }}
                    />
                ) : (
                    <ul className="divide-y divide-border">
                        {notifications.map((notification) => {
                            const unread = !notification.read_at
                            return (
                                <li key={notification.id}>
                                    <div
                                        className={cn(
                                            "flex gap-2 p-3 transition-colors duration-150",
                                            unread
                                                ? "bg-muted/40 hover:bg-muted/65 dark:hover:bg-muted/50"
                                                : "hover:bg-muted/30"
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className="flex min-w-0 flex-1 gap-3 text-left"
                                            onClick={() => void onRowActivate(notification)}
                                        >
                                            <span className="mt-0.5">{getNotificationIcon(notification)}</span>
                                            <span className="min-w-0 flex-1 space-y-1">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-sm font-medium leading-snug">
                                                        {notification.title}
                                                    </span>
                                                    {unread ? (
                                                        <span
                                                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                                            aria-hidden
                                                        />
                                                    ) : null}
                                                </span>
                                                <span className="block text-xs text-muted-foreground leading-relaxed">
                                                    {notification.body}
                                                </span>
                                            </span>
                                        </button>
                                        <div className="flex shrink-0 self-start items-center gap-2 pt-1">
                                            <span className="text-[11px] leading-none text-muted-foreground/80">
                                                {formatRelativeTime(notification.created_at)}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="shrink-0"
                                                        aria-label="Mais opções"
                                                    >
                                                        <EllipsisHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    {unread ? (
                                                        <DropdownMenuItem
                                                            onClick={() => void onMarkAsRead(notification.id)}
                                                        >
                                                            <CheckIcon className="h-4 w-4" />
                                                            Marcar como lida
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => void onDelete(notification.id)}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            {notifications.length > 0 && !loading && currentWorkspaceId ? (
                <div className="shrink-0 border-t border-border">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-12 w-full rounded-none text-destructive hover:text-destructive"
                        onClick={() => void onClearAll()}
                    >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Limpar todas
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
