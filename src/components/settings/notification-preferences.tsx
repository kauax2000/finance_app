"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SettingsLink, SettingsSection } from "@/components/settings/settings-section"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertAction, AlertActions, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/providers"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { resumoDosCanais, resumoDosTemas, semCanal } from "@/lib/notificacoes-resumo"
import { getPushSupportState } from "@/lib/push/subscribe"

function PrefRowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-4 w-24 shrink-0" />
        </div>
    )
}

function NotificationPreferencesSkeleton() {
    return (
        <>
            <PrefRowSkeleton />
            <Separator />
            <PrefRowSkeleton />
        </>
    )
}

export function NotificationPreferences() {
    const { loading: authLoading } = useAuth()
    const { currentWorkspace, currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const { prefs, loading, error } = useWorkspaceNotificationPrefs()
    const { open: openNotifications } = useNotificationsUi()

    const showSkeleton = authLoading || workspaceLoading || (Boolean(currentWorkspaceId) && loading)

    return (
        <SettingsSection
            id="notificacoes"
            className="scroll-mt-(--top-bar-bottom)"
            titulo="Notificações"
            alcance={
                currentWorkspace
                    ? `Vale para você em ${currentWorkspace.name}.`
                    : "Selecione uma carteira."
            }
            actions={
                <Button type="button" variant="tertiary" onClick={() => openNotifications()}>
                    Ver histórico
                </Button>
            }
        >
            {showSkeleton || currentWorkspaceId ? (
                <>
                    <Card padding="none">
                        {error ? (
                            <div className="px-4 py-3">
                                <Alert tone="destructive" size="sm">
                                    <AlertTitle>{error}</AlertTitle>
                                </Alert>
                            </div>
                        ) : null}
                        {showSkeleton ? <NotificationPreferencesSkeleton /> : null}
                        {!loading && currentWorkspaceId && prefs ? (
                            <>
                                <SettingsLink
                                    titulo="Onde chega"
                                    valor={resumoDosCanais(prefs)}
                                    aria-label={`Onde chega: ${resumoDosCanais(prefs)}. Escolher onde os avisos chegam`}
                                    href={ROUTES.SETTINGS_NOTIFICACOES_CANAIS}
                                />
                                <Separator />
                                <SettingsLink
                                    titulo="Sobre o quê"
                                    valor={resumoDosTemas(prefs)}
                                    aria-label={`Sobre o quê: ${resumoDosTemas(prefs)}. Escolher sobre o que avisar`}
                                    href={ROUTES.SETTINGS_NOTIFICACOES_TEMAS}
                                />
                            </>
                        ) : null}
                    </Card>
                    {!loading && currentWorkspaceId && prefs ? (
                        <>
                            {semCanal(prefs) ? (
                                <Alert tone="warning" size="sm">
                                    <AlertTitle>
                                        Nenhum canal ligado. Os avisos da carteira não vão chegar.
                                    </AlertTitle>
                                    <AlertActions placement="inline">
                                        <AlertAction asChild>
                                            <Link href={ROUTES.SETTINGS_NOTIFICACOES_CANAIS}>Escolher canais</Link>
                                        </AlertAction>
                                    </AlertActions>
                                </Alert>
                            ) : getPushSupportState() === "denied" ? (
                                <Alert tone="warning" size="sm" storageKey="push-bloqueado">
                                    <AlertTitle>Este aparelho bloqueou os avisos.</AlertTitle>
                                    <AlertActions placement="inline">
                                        <AlertAction asChild>
                                            <Link href={ROUTES.SETTINGS_NOTIFICACOES_CANAIS}>Como liberar</Link>
                                        </AlertAction>
                                    </AlertActions>
                                </Alert>
                            ) : null}
                        </>
                    ) : null}
                </>
            ) : null}
        </SettingsSection>
    )
}
