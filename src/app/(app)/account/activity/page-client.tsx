"use client"

import {
    EmptyState,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { ActivityPageSkeleton } from "@/components/account/activity-page-skeleton"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import {
    formatDateTimeShortPtBr,
    formatDayHeadingPtBr,
    groupByLocalDay,
} from "@/lib/transaction-date"
import { ROUTES } from "@/config/navigation"
import { Fragment, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardNote, CardToolbar } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    TIMELINE_TONES,
    Timeline,
    TimelineDescription,
    TimelineHeader,
    TimelineItem,
    TimelineSeparator,
    TimelineTime,
    TimelineTitle,
} from "@/components/ui/timeline"
import { ChartBarIcon, CheckCircleIcon, Cog6ToothIcon, ExclamationTriangleIcon, InformationCircleIcon, KeyIcon, ShieldCheckIcon, ShieldExclamationIcon, UserGroupIcon, UserIcon, UserMinusIcon, UserPlusIcon } from "@heroicons/react/16/solid"
import {
    ChartBarIcon as ChartBarIconLg,
    KeyIcon as KeyIconLg,
    ShieldCheckIcon as ShieldCheckIconLg,
} from "@heroicons/react/24/outline"
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
            return Cog6ToothIcon
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
            return ChartBarIcon
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

const getActivityTone = (type: string, status: string): (typeof TIMELINE_TONES)[number] => {
    if (status === "failed") return "destructive"
    if (status === "pending") return "default"

    switch (type) {
        case "device_added":
        case "family_member_joined":
            return "success"
        case "password_change":
        case "security_settings":
        case "family_permission_changed":
        case "family_role_changed":
        case "device_removed":
        case "family_member_removed":
            return "warning"
        default:
            return "default"
    }
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
            router.replace(ROUTES.LOGIN)
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
            <PageSection>
                <PageSectionHeader>
                    <PageSectionTitle>Histórico de atividades</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    <CardContent className="flex flex-col">
                        <CardToolbar className="justify-end">
                            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {filteredActivities.length} registro
                                {filteredActivities.length !== 1 ? "s" : ""}
                            </p>
                        </CardToolbar>
                        <CardToolbar>
                            {/* Escolha única entre filtros: `ToggleGroup`, que não deixa
                                desmarcar tudo e anuncia o item ativo como marcado. */}
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                shape="pill"
                                size="sm"
                                value={filter}
                                onValueChange={(next) => setFilter(next as typeof filter)}
                                aria-label="Filtrar atividades"
                                className="flex-wrap gap-2"
                            >
                                {filters.map(({ key, label }) => (
                                    <ToggleGroupItem
                                        key={key}
                                        value={key}
                                        count={activityCounts[key]}
                                    >
                                        {label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </CardToolbar>
                        {filteredActivities.length > 0 ? (
                            <Timeline marker="icon" reveal className="px-4 py-3">
                                {groupByLocalDay(filteredActivities, (a) => a.created_at).map((dia) => (
                                    <Fragment key={dia.chave}>
                                        <TimelineSeparator>{formatDayHeadingPtBr(dia.data)}</TimelineSeparator>
                                        {dia.itens.map((activity) => {
                                            const ActivityIcon = getActivityIcon(activity.type)
                                            const metaLine = [
                                                activity.description?.trim(),
                                                activity.ip_address?.trim(),
                                                activity.device?.trim(),
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")
                                            return (
                                                <TimelineItem
                                                    key={activity.id}
                                                    tone={getActivityTone(activity.type, activity.status)}
                                                    icon={<ActivityIcon />}
                                                >
                                                    <TimelineHeader
                                                        end={
                                                            <TimelineTime dateTime={activity.created_at} relative>
                                                                {formatDateTimeShortPtBr(activity.created_at)}
                                                            </TimelineTime>
                                                        }
                                                    >
                                                        <TimelineTitle className="truncate">
                                                            {getActivityLabel(activity.type)}
                                                        </TimelineTitle>
                                                        {activity.status === "failed" ? (
                                                            <Badge tone="destructive" size="xs">
                                                                Falha
                                                            </Badge>
                                                        ) : null}
                                                    </TimelineHeader>
                                                    {metaLine ? (
                                                        <TimelineDescription className="break-words">
                                                            {metaLine}
                                                        </TimelineDescription>
                                                    ) : null}
                                                </TimelineItem>
                                            )
                                        })}
                                    </Fragment>
                                ))}
                            </Timeline>
                        ) : (
                            <div
                                className="px-4 py-12 md:py-14"
                                role="status"
                                aria-live="polite"
                            >
                                <EmptyState variant="plain" size="lg">
                                    <EmptyStateIcon variant="stack">
                                        <ShieldCheckIconLg aria-hidden />
                                        <ChartBarIconLg aria-hidden />
                                        <KeyIconLg aria-hidden />
                                    </EmptyStateIcon>
                                    <EmptyStateTitle>Nenhuma atividade encontrada</EmptyStateTitle>
                                    <EmptyStateDescription>
                                        {filter === "all"
                                        ? "Suas atividades aparecerão aqui."
                                        : "Tente selecionar outro filtro."}
                                    </EmptyStateDescription>
                                </EmptyState>
                            </div>
                        )}
                        <CardNote>
                            <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <p className="min-w-0 break-words">
                                O histórico de atividades é mantido por 90 dias para sua segurança.
                            </p>
                        </CardNote>
                    </CardContent>
                </Card>
            </PageSection>
        </div>
    )
}
