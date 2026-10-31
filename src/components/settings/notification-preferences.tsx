"use client"

import { useCallback, useState } from "react"
import { FormSwitch } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { SettingsSection } from "@/components/settings/settings-section"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardToolbar } from "@/components/ui/card"
import { useAuth } from "@/components/providers"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"
import { useWorkspace } from "@/components/workspace-provider"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import {
    getPushSupportState,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
} from "@/lib/push/subscribe"

function PrefRowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-6 w-11 shrink-0" />
        </div>
    )
}

function NotificationPreferencesSkeleton() {
    return (
        <>
            <CardToolbar variant="label">Como avisar</CardToolbar>
            <PrefRowSkeleton />
            <Separator />
            <PrefRowSkeleton />
            <Separator />
            <PrefRowSkeleton />
            <CardToolbar variant="label">Sobre o quê</CardToolbar>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i}>
                    {i > 1 ? <Separator /> : null}
                    <PrefRowSkeleton />
                </div>
            ))}
        </>
    )
}

export function NotificationPreferences() {
    const { loading: authLoading } = useAuth()
    const { currentWorkspace, currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const { prefs, loading, updating, error, patch } = useWorkspaceNotificationPrefs()
    const { open: openNotifications } = useNotificationsUi()
    const { isStandalone } = useDisplayMode()
    const isIos = useIsIos()
    const [installPwaOpen, setInstallPwaOpen] = useState(false)
    const [pushBusy, setPushBusy] = useState(false)
    const [pushMessage, setPushMessage] = useState<string | null>(null)

    const pushSupport = getPushSupportState()
    const pushUnsupported = !isPushSupported()

    const handlePushToggle = useCallback(
        async (checked: boolean) => {
            if (!prefs) return
            setPushMessage(null)
            setPushBusy(true)
            try {
                if (checked) {
                    if (pushUnsupported) {
                        setPushMessage(
                            "Push não é suportado neste navegador. No iPhone, instale o app pela Tela de Início."
                        )
                        return
                    }
                    if (isIos && !isStandalone) {
                        setPushMessage(
                            "No iPhone, adicione o Finance à Tela de Início antes de ativar push."
                        )
                        setInstallPwaOpen(true)
                        return
                    }
                    const result = await subscribeToPush()
                    if (!result.ok) {
                        setPushMessage(result.error)
                        return
                    }
                    await patch({ notify_push: true })
                } else {
                    await unsubscribeFromPush()
                    await patch({ notify_push: false })
                }
            } finally {
                setPushBusy(false)
            }
        },
        [prefs, pushUnsupported, isIos, isStandalone, patch]
    )

    const disabled = loading || updating || !prefs || !currentWorkspaceId || pushBusy

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
                        <CardToolbar variant="label">Como avisar</CardToolbar>
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-email"
                                label="Notificações por email"
                                checked={!!prefs?.notify_email}
                                onCheckedChange={(checked) => void patch({ notify_email: checked })}
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-inapp"
                                label="Central do app"
                                checked={!!prefs?.notify_in_app}
                                onCheckedChange={(checked) =>
                                    void patch({ notify_in_app: checked })
                                }
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-push"
                                label="Push no dispositivo"
                                description={
                                    pushUnsupported
                                        ? "Não disponível neste navegador"
                                        : pushSupport === "denied"
                                          ? "Permissão bloqueada — abra Ajustes do sistema e permita notificações"
                                          : "Desligar remove este aparelho de todas as carteiras."
                                }
                                checked={!!prefs?.notify_push}
                                onCheckedChange={(checked) => void handlePushToggle(checked)}
                                disabled={disabled || pushUnsupported || pushSupport === "denied"}
                            />
                        </div>
                        {pushMessage ? (
                            <div className="px-4 pb-3">
                                <p className="text-xs text-muted-foreground">{pushMessage}</p>
                                {isIos && !isStandalone ? (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto px-0 text-xs"
                                        onClick={() => setInstallPwaOpen(true)}
                                    >
                                        Como instalar no iPhone
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}
                        <InstallPwaSheet open={installPwaOpen} onOpenChange={setInstallPwaOpen} />
                        <CardToolbar variant="label">Sobre o quê</CardToolbar>
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-tx"
                                label="Despesas de outros membros"
                                checked={!!prefs?.notify_transactions}
                                onCheckedChange={(checked) =>
                                    void patch({ notify_transactions: checked })
                                }
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-budget"
                                label="Alertas de orçamento"
                                checked={!!prefs?.notify_budget}
                                onCheckedChange={(checked) =>
                                    void patch({ notify_budget: checked })
                                }
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-cc-spend"
                                label="Cartões: limite e categorias"
                                checked={prefs?.notify_credit_cards !== false}
                                onCheckedChange={(checked) =>
                                    void patch({ notify_credit_cards: checked })
                                }
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-cc-cal"
                                label="Cartões: fatura e vencimento"
                                checked={prefs?.notify_credit_card_calendar !== false}
                                onCheckedChange={(checked) =>
                                    void patch({ notify_credit_card_calendar: checked })
                                }
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-bills"
                                label="Contas a pagar"
                                checked={prefs?.notify_bills !== false}
                                onCheckedChange={(checked) => void patch({ notify_bills: checked })}
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-review"
                                label="Lembrete de itens a conferir"
                                description="Às 20h."
                                checked={prefs?.notify_review !== false}
                                onCheckedChange={(checked) =>
                                    void patch({ notify_review: checked })
                                }
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-insights"
                                label="Insights"
                                description="No máximo 3 push por semana."
                                checked={prefs?.notify_insights !== false}
                                onCheckedChange={(checked) =>
                                    void patch({ notify_insights: checked })
                                }
                                disabled={disabled}
                            />
                        </div>
                        {/* "Promoções e ofertas" saiu: nada envia promoção. O
                        `notify_promotions` continua no banco e volta aqui
                        junto com o primeiro produtor. */}
                    </>
                ) : null}
            </Card>
            ) : null}
        </SettingsSection>
    )
}
