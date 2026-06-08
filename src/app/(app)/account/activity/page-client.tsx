"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    UserIcon,
    KeyIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    UserGroupIcon,
    UserPlusIcon,
    UserMinusIcon,
    ShieldExclamationIcon,
} from "@heroicons/react/24/outline"
import { Activity, UserCog } from "lucide-react"
import {
    tagChipDanger,
    tagChipFilterIdle,
    tagChipFilterSelected,
    tagChipInfo,
    tagChipNeutral,
    tagChipSuccess,
    tagChipWarning,
} from "@/lib/tag-chip-classes"
import { cn } from "@/lib/utils"
import { getActivities, type ActivityLog } from "@/lib/activity"
import { useAuth } from "@/components/providers"
import {
    dismissPageFetchError,
    toastPageFetchError,
} from "@/lib/toast"

const getActivityIcon = (type: string) => {
    switch (type) {
        case "family_member_invited":
            return UserPlusIcon
        case "family_member_joined":
            return UserGroupIcon
        case "family_member_removed":
            return UserMinusIcon
        case "family_permission_changed":
            return ShieldExclamationIcon
        case "family_role_changed":
            return UserCog
        case "password_change":
            return KeyIcon
        case "profile_update":
            return UserIcon
        case "security_settings":
            return ShieldCheckIcon
        case "device_added":
            return CheckCircleIcon
        case "device_removed":
            return ExclamationTriangleIcon
        default:
            return Activity
    }
}

const getActivityLabel = (type: string) => {
    switch (type) {
        case "family_member_invited":
            return "Convite familiar"
        case "family_member_joined":
            return "Membro entrou"
        case "family_member_removed":
            return "Membro removido"
        case "family_permission_changed":
            return "Permissões alteradas"
        case "family_role_changed":
            return "Papel alterado"
        case "password_change":
            return "Senha alterada"
        case "profile_update":
            return "Perfil atualizado"
        case "security_settings":
            return "Segurança"
        case "device_added":
            return "Dispositivo adicionado"
        case "device_removed":
            return "Dispositivo removido"
        default:
            return "Atividade"
    }
}

const getActivityColor = (type: string, status: string) => {
    if (status === "failed") return tagChipDanger
    if (status === "pending") return tagChipNeutral

    switch (type) {
        case "device_added":
        case "family_member_joined":
            return tagChipSuccess
        case "family_member_invited":
        case "profile_update":
            return tagChipInfo
        case "password_change":
        case "security_settings":
        case "family_permission_changed":
        case "family_role_changed":
        case "device_removed":
        case "family_member_removed":
            return tagChipWarning
        default:
            return tagChipNeutral
    }
}

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Agora"
    if (minutes < 60) return `Há ${minutes}m`
    if (hours < 24) return `Há ${hours}h`
    if (days < 7) return `Há ${days}d`

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    })
}

const FAMILY_TYPES = [
    "family_member_invited",
    "family_member_joined",
    "family_member_removed",
    "family_permission_changed",
    "family_role_changed",
] as const

const SECURITY_TYPES = [
    "password_change",
    "security_settings",
    "device_added",
    "device_removed",
] as const

const filters = [
    { key: "all", label: "Todas" },
    { key: "family", label: "Família" },
    { key: "security", label: "Segurança" },
    { key: "profile", label: "Perfil" },
] as const

function ActivityPageSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-5" role="status" aria-busy="true">
            <div className="min-w-0 space-y-2">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className="h-3 w-36" />
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex min-h-10 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-4 py-2.5">
                            <Skeleton className="h-3 w-28 shrink-0" />
                        </div>
                        <div className="border-b border-border bg-muted/20 px-4 py-2.5">
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
                                ))}
                            </div>
                        </div>
                        <ul className="divide-y divide-border" role="list">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <li key={i}>
                                    <div className="flex items-start gap-3 px-4 py-2.5">
                                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Skeleton className="h-4 min-w-0 max-w-[12rem] flex-1" />
                                                <Skeleton className="h-3 w-10 shrink-0 rounded" />
                                            </div>
                                            <Skeleton className="h-3 w-full max-w-md" />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 dark:bg-muted/25">
                            <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
                            <Skeleton className="h-3 w-full max-w-md" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function ActivityPage() {
    const router = useRouter()
    const { loading: authLoading, session: authSession } = useAuth()
    const [loading, setLoading] = useState(true)
    const [activities, setActivities] = useState<ActivityLog[]>([])
    const [filter, setFilter] = useState<"all" | "family" | "security" | "profile">("all")

    const fetchActivities = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getActivities("all")
            setActivities(data)
            dismissPageFetchError("activity")
        } catch (err) {
            toastPageFetchError(
                "activity",
                err instanceof Error ? err.message : "Erro ao carregar atividades",
            )
            console.error("Error fetching activities:", err)
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
        void fetchActivities()
    }, [authLoading, authSession, fetchActivities, router])

    const getFilteredActivities = () => {
        if (filter === "all") return activities
        if (filter === "family")
            return activities.filter((a) => (FAMILY_TYPES as readonly string[]).includes(a.type))
        if (filter === "security")
            return activities.filter((a) => (SECURITY_TYPES as readonly string[]).includes(a.type))
        if (filter === "profile") return activities.filter((a) => a.type === "profile_update")
        return activities
    }

    const filteredActivities = getFilteredActivities()

    const activityCounts = {
        all: activities.length,
        family: activities.filter((a) => (FAMILY_TYPES as readonly string[]).includes(a.type))
            .length,
        security: activities.filter((a) => (SECURITY_TYPES as readonly string[]).includes(a.type))
            .length,
        profile: activities.filter((a) => a.type === "profile_update").length,
    }

    if (authLoading) {
        return <ActivityPageSkeleton />
    }

    if (!authSession) {
        return null
    }

    if (loading) {
        return <ActivityPageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Histórico de atividades
                        </p>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex min-h-10 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-4 py-2.5">
                            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {filteredActivities.length} registro
                                {filteredActivities.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div className="border-b border-border bg-muted/20 px-4 py-2.5">
                            <div className="flex flex-wrap gap-2">
                                {filters.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFilter(key)}
                                        className={cn(
                                            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                                            filter === key
                                                ? tagChipFilterSelected
                                                : tagChipFilterIdle,
                                        )}
                                    >
                                        {label} ({activityCounts[key]})
                                    </button>
                                ))}
                            </div>
                        </div>
                        {filteredActivities.length > 0 ? (
                            <ul className="divide-y divide-border" role="list">
                                {filteredActivities.map((activity) => {
                                    const ActivityIcon = getActivityIcon(activity.type)
                                    const ipDisplay = activity.ip_address?.trim() || "—"
                                    const deviceTrim = activity.device?.trim()
                                    const metaParts = [
                                        activity.description?.trim(),
                                        ipDisplay !== "—" ? ipDisplay : null,
                                        deviceTrim || null,
                                    ].filter((x): x is string => Boolean(x))
                                    const metaLine = metaParts.join(" · ")
                                    return (
                                        <li key={activity.id}>
                                            <div
                                                className={cn(
                                                    "flex items-start gap-3 px-4 py-2.5 transition-colors",
                                                    activity.status === "failed"
                                                        ? "bg-destructive/5 hover:bg-destructive/10"
                                                        : "hover:bg-muted/30",
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                                        getActivityColor(activity.type, activity.status),
                                                    )}
                                                >
                                                    <ActivityIcon className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                                                            <span className="truncate text-sm font-medium leading-snug">
                                                                {getActivityLabel(activity.type)}
                                                            </span>
                                                            {activity.status === "failed" ? (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="shrink-0 px-1.5 py-0 text-[0.6rem]"
                                                                >
                                                                    Falha
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        <span className="shrink-0 text-[0.65rem] tabular-nums text-muted-foreground">
                                                            {formatRelativeTime(activity.created_at)}
                                                        </span>
                                                    </div>
                                                    {metaLine ? (
                                                        <p className="text-pretty text-xs leading-relaxed break-words text-muted-foreground">
                                                            {metaLine}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })}
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
                                    <Activity className="size-7 text-muted-foreground" />
                                </div>
                                <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                                    Nenhuma atividade encontrada
                                </h2>
                                <p className="max-w-md text-center text-sm text-muted-foreground">
                                    {filter === "all"
                                        ? "Suas atividades aparecerão aqui."
                                        : "Tente selecionar outro filtro."}
                                </p>
                            </div>
                        )}
                        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-muted/25">
                            <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <p className="min-w-0 break-words">
                                O histórico de atividades é mantido por 90 dias para sua segurança.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
