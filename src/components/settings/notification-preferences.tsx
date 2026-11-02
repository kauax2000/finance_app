"use client"

import { useState } from "react"
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
import { NotificacoesCanaisDialog } from "@/components/settings/notificacoes-canais-dialog"
import { NotificacoesTemasDialog } from "@/components/settings/notificacoes-temas-dialog"
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
    const { prefs, loading, error, patch } = useWorkspaceNotificationPrefs()
    const { open: openNotifications } = useNotificationsUi()
    const [canaisOpen, setCanaisOpen] = useState(false)
    const [temasOpen, setTemasOpen] = useState(false)

    const disabled = loading || !prefs || !currentWorkspaceId

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
                                    onClick={() => setCanaisOpen(true)}
                                />
                                <Separator />
                                <SettingsLink
                                    titulo="Sobre o quê"
                                    valor={resumoDosTemas(prefs)}
                                    aria-label={`Sobre o quê: ${resumoDosTemas(prefs)}. Escolher sobre o que avisar`}
                                    onClick={() => setTemasOpen(true)}
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
                                        <AlertAction onClick={() => setCanaisOpen(true)}>
                                            Escolher canais
                                        </AlertAction>
                                    </AlertActions>
                                </Alert>
                            ) : getPushSupportState() === "denied" ? (
                                <Alert tone="warning" size="sm">
                                    <AlertTitle>Este aparelho bloqueou os avisos.</AlertTitle>
                                    <AlertActions placement="inline">
                                        <AlertAction onClick={() => setCanaisOpen(true)}>
                                            Como liberar
                                        </AlertAction>
                                    </AlertActions>
                                </Alert>
                            ) : null}
                            <NotificacoesCanaisDialog
                                open={canaisOpen}
                                onOpenChange={setCanaisOpen}
                                prefs={prefs}
                                patch={patch}
                                disabled={disabled}
                                error={error}
                            />
                            <NotificacoesTemasDialog
                                open={temasOpen}
                                onOpenChange={setTemasOpen}
                                prefs={prefs}
                                patch={patch}
                                disabled={disabled}
                                error={error}
                            />
                        </>
                    ) : null}
                </>
            ) : null}
        </SettingsSection>
    )
}
