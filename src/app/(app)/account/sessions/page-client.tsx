"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowRightStartOnRectangleIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    CheckCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline"
import { describeEdgeInvokeClientFailure } from "@/lib/edge-errors"
import { Session, getSessions, revokeSession, revokeAllSessions } from "@/lib/sessions"
import { formatRelativeTime } from "@/lib/sessions"
import { useHideMobileFab } from "@/components/layout/mobile-fab-provider"
import { useAuth } from "@/components/providers"
import {
    dismissPageFetchError,
    toastError,
    toastPageFetchError,
} from "@/lib/toast"
import { cn } from "@/lib/utils"

function SessionsPageSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-5" role="status" aria-busy="true">
            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-md sm:h-7 sm:w-32 sm:shrink-0 sm:self-auto" />
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex min-h-10 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-4 py-2.5">
                            <Skeleton className="h-3 w-24 shrink-0" />
                        </div>
                        <ul
                            className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                            role="list"
                        >
                            {[1, 2, 3].map((i) => (
                                <li key={i} className="min-w-0">
                                    <div className="rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-3.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-4 w-36 max-w-full" />
                                                        <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
                                                    </div>
                                                    <Skeleton className="h-3 w-32 max-w-full" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div
                            className="shrink-0 border-t border-border bg-muted/15 px-4 py-3 dark:bg-muted/25"
                            aria-hidden
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function SessionsPage() {
    const router = useRouter()
    const { loading: authLoading, session: authSession } = useAuth()
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState<Session[]>([])
    const [revoking, setRevoking] = useState<string | null>(null)

    const fetchSessions = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSessions()
            setSessions(data)
            dismissPageFetchError("sessions")
        } catch (err) {
            toastPageFetchError("sessions", describeEdgeInvokeClientFailure(err))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (authLoading) return
        if (!authSession) {
            router.replace("/login")
            return
        }
        void fetchSessions()
    }, [authLoading, authSession, fetchSessions, router])

    useHideMobileFab()

    const handleRevokeSession = async (sessionId: string) => {
        setRevoking(sessionId)
        try {
            await revokeSession(sessionId)
            setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        } catch (err) {
            console.error("Error revoking session:", err)
            toastError(err instanceof Error ? err.message : "Erro ao encerrar sessão")
        } finally {
            setRevoking(null)
        }
    }

    const handleRevokeAll = async () => {
        setRevoking("all")
        try {
            await revokeAllSessions()
            setSessions((prev) => prev.filter((s) => s.is_current))
        } catch (err) {
            console.error("Error revoking all sessions:", err)
            toastError(err instanceof Error ? err.message : "Erro ao encerrar sessões")
        } finally {
            setRevoking(null)
        }
    }

    const DeviceIcon = ({
        deviceType,
        className,
    }: {
        deviceType: string
        className?: string
    }) => {
        if (deviceType === "mobile" || deviceType === "tablet") {
            return <DevicePhoneMobileIcon className={className} />
        }
        return <ComputerDesktopIcon className={className} />
    }

    if (authLoading) {
        return <SessionsPageSkeleton />
    }

    if (!authSession) {
        return null
    }

    if (loading) {
        return <SessionsPageSkeleton />
    }

    const activeSessionCount = sessions.filter((s) => s.is_current).length
    const otherSessionsCount = sessions.filter((s) => !s.is_current).length

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Sessões ativas
                        </p>
                    </div>
                    {otherSessionsCount > 0 ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 w-full gap-1.5 border-dashed text-sm sm:h-7 sm:w-fit sm:shrink-0 sm:self-auto sm:text-[0.8rem]"
                            onClick={() => void handleRevokeAll()}
                            disabled={revoking === "all"}
                        >
                            {revoking === "all" ? (
                                <ArrowPathIcon className="size-4 animate-spin sm:size-3.5" />
                            ) : (
                                <ArrowRightStartOnRectangleIcon className="size-4 opacity-70 sm:size-3.5" />
                            )}
                            Encerrar todas
                        </Button>
                    ) : null}
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex min-h-10 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-4 py-2.5">
                            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {activeSessionCount} sessão
                                {activeSessionCount !== 1 ? "s" : ""} ativa
                                {activeSessionCount !== 1 ? "s" : ""}
                            </p>
                        </div>
                        {sessions.length > 0 ? (
                            <ul
                                className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                                role="list"
                            >
                                {sessions.map((session) => (
                                    <li key={session.id} className="min-w-0">
                                        <div
                                            className={cn(
                                                "rounded-lg border p-3 transition-colors sm:p-3.5",
                                                session.is_current
                                                    ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                                                    : "border-border/80 bg-muted/20 hover:bg-muted/30",
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
                                                        <DeviceIcon
                                                            deviceType={session.device_type}
                                                            className="h-4 w-4 text-muted-foreground"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-sm font-medium">
                                                                {session.device_name}
                                                            </span>
                                                            {session.is_current ? (
                                                                <Badge
                                                                    variant="success"
                                                                    className="px-1.5 py-0 text-[0.6rem]"
                                                                >
                                                                    Atual
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <GlobeAltIcon className="h-3 w-3 shrink-0" />
                                                                <span className="font-mono">
                                                                    {session.ip_address ||
                                                                        "Desconhecido"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!session.is_current ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            void handleRevokeSession(session.id)
                                                        }
                                                        disabled={revoking === session.id}
                                                        className="shrink-0 text-muted-foreground hover:text-destructive md:size-icon-xs"
                                                    >
                                                        {revoking === session.id ? (
                                                            <ArrowPathIcon className="h-4 w-4 animate-spin md:h-3.5 md:w-3.5" />
                                                        ) : (
                                                            <ArrowRightStartOnRectangleIcon className="h-4 w-4 md:h-3.5 md:w-3.5" />
                                                        )}
                                                    </Button>
                                                ) : null}
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[0.65rem] text-muted-foreground">
                                                <span>Última atividade</span>
                                                <span>
                                                    {formatRelativeTime(session.last_active_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                                role="status"
                                aria-live="polite"
                            >
                                <div
                                    className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                                    aria-hidden
                                >
                                    <CheckCircleIcon className="size-7 text-green-600" />
                                </div>
                                <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                                    Todas as sessões foram encerradas
                                </h2>
                                <p className="max-w-md text-center text-sm text-muted-foreground">
                                    Você só verá esta sessão ativa neste dispositivo.
                                </p>
                            </div>
                        )}
                        <div
                            className="shrink-0 border-t border-border bg-muted/15 px-4 py-3 dark:bg-muted/25"
                            aria-hidden
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
