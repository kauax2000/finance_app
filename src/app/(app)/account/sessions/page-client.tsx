"use client"

import {
    EmptyState,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { SessionsPageSkeleton } from "@/components/account/sessions-page-skeleton"
import {
    Item,
} from "@/components/ui/item"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { ROUTES } from "@/config/navigation"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardNote, CardToolbar } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightStartOnRectangleIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, GlobeAltIcon } from "@heroicons/react/16/solid"
import { CheckCircleIcon } from "@heroicons/react/24/outline"
import { describeEdgeInvokeClientFailure } from "@/lib/edge-errors"
import { Session, getSessions, revokeSession, revokeAllSessions } from "@/lib/sessions"
import { formatRelativeTime } from "@/lib/sessions"
import { useAuth } from "@/components/providers"
import {
    dismissPageFetchError,
    toastError,
    toastPageFetchError,
} from "@/lib/toast"
import { cn } from "@/lib/utils"

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
            router.replace(ROUTES.LOGIN)
            return
        }
        void fetchSessions()
    }, [authLoading, authSession, fetchSessions, router])

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

    // A lista já é só de sessões ativas; contar `is_current` dava sempre 1.
    const activeSessionCount = sessions.length
    const otherSessionsCount = sessions.filter((s) => !s.is_current).length

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <PageSection>
                <PageSectionHeader
                    actions={
                        otherSessionsCount > 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 border-dashed text-xs pointer-coarse:h-10"
                                onClick={() => void handleRevokeAll()}
                                disabled={revoking === "all"}
                            >
                                {revoking === "all" ? (
                                    <Spinner className="size-3.5" />
                                ) : (
                                    <ArrowRightStartOnRectangleIcon className="size-3.5 opacity-70" />
                                )}
                                Encerrar todas
                            </Button>
                        ) : null
                    }
                >
                    <PageSectionTitle>Sessões ativas</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    <CardContent className="flex flex-col p-0">
                        <CardToolbar className="justify-end">
                            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {activeSessionCount === 1
                                    ? "1 sessão ativa"
                                    : `${activeSessionCount} sessões ativas`}
                            </p>
                        </CardToolbar>
                        {sessions.length > 0 ? (
                            <ul
                                className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                                role="list"
                            >
                                {sessions.map((session) => (
                                    <li key={session.id} className="min-w-0">
                                        {/* A linha não é clicável: o realce de `hover:` que
                                            ela tinha não respondia a nada, e saiu. */}
                                        <Item
                                            variant="outline"
                                            className={cn(
                                                "block p-3 sm:p-3.5",
                                                session.is_current
                                                    ? "border-primary-accent/30 bg-primary/5"
                                                    : "border-border/80",
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
                                                                    tone="success"
                                                                    className="px-1.5 py-0 text-2xs"
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
                                                        variant="tertiary"
                                                        size="icon-sm"
                                                        aria-label={`Encerrar sessão em ${session.device_name || "outro aparelho"}`}
                                                        onClick={() =>
                                                            void handleRevokeSession(session.id)
                                                        }
                                                        disabled={revoking === session.id}
                                                        className="shrink-0 text-muted-foreground hover:text-destructive active:text-destructive md:size-icon-xs"
                                                    >
                                                        {revoking === session.id ? (
                                                            <Spinner className="md:h-3.5 md:w-3.5" />
                                                        ) : (
                                                            <ArrowRightStartOnRectangleIcon className="h-4 w-4 md:h-3.5 md:w-3.5" />
                                                        )}
                                                    </Button>
                                                ) : null}
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-2xs text-muted-foreground">
                                                <span>Última atividade</span>
                                                <span>
                                                    {formatRelativeTime(session.last_active_at)}
                                                </span>
                                            </div>
                                        </Item>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div
                                className="px-4 py-12 md:py-14"
                                role="status"
                                aria-live="polite"
                            >
                                <EmptyState variant="plain" size="lg">
                                    <EmptyStateIcon><CheckCircleIcon className="size-7 text-success" /></EmptyStateIcon>
                                    <EmptyStateTitle>Todas as sessões foram encerradas</EmptyStateTitle>
                                    <EmptyStateDescription>
                                        Você só verá esta sessão ativa neste dispositivo.
                                    </EmptyStateDescription>
                                </EmptyState>
                            </div>
                        )}
                        <CardNote
                            aria-hidden
                        />
                    </CardContent>
                </Card>
            </PageSection>
        </div>
    )
}
