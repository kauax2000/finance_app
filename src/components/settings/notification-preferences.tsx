"use client"

import { useCallback, useState, type ReactNode } from "react"
import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

function PrefSubheaderBar({
    children,
    withTopBorder,
}: {
    children: ReactNode
    withTopBorder?: boolean
}) {
    return (
        <div
            className={
                withTopBorder
                    ? "flex min-h-10 shrink-0 items-center border-t border-b border-border bg-muted/30 px-4 py-2.5"
                    : "flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5"
            }
        >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {children}
            </p>
        </div>
    )
}

function PrefRowSkeleton() {
    return (
        <div className="flex items-start justify-between gap-5 rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-3.5">
            <div className="min-w-0 flex-1 space-y-1.5 pr-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-[min(100%,14rem)]" />
            </div>
            <Skeleton className="mt-0.5 h-6 w-11 shrink-0 rounded-full" />
        </div>
    )
}

function NotificationPreferencesSkeleton() {
    return (
        <>
            <PrefSubheaderBar>Canais de entrega</PrefSubheaderBar>
            <ul className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4" role="list">
                <li>
                    <PrefRowSkeleton />
                </li>
                <li>
                    <PrefRowSkeleton />
                </li>
                <li>
                    <PrefRowSkeleton />
                </li>
            </ul>
            <PrefSubheaderBar withTopBorder>Tipos de notificação</PrefSubheaderBar>
            <ul className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4" role="list">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <li key={i}>
                        <PrefRowSkeleton />
                    </li>
                ))}
            </ul>
        </>
    )
}

function PrefRow({
    id,
    title,
    description,
    checked,
    onCheckedChange,
    disabled,
}: {
    id: string
    title: string
    description: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
}) {
    return (
        <div className="flex items-start justify-between gap-5 rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-3.5 transition-colors hover:bg-muted/30">
            <div className="min-w-0 space-y-0.5 pr-2">
                <Label htmlFor={id} className="text-sm font-medium">
                    {title}
                </Label>
                <p className="text-xs leading-snug text-muted-foreground">
                    {description}
                </p>
            </div>
            <Switch
                id={id}
                className="mt-0.5 shrink-0"
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </div>
    )
}

export function NotificationPreferences() {
    const { loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
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

    const showSkeleton =
        authLoading || workspaceLoading || (Boolean(currentWorkspaceId) && loading)

    const showNoWorkspaceMessage =
        !authLoading && !workspaceLoading && !currentWorkspaceId

    return (
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Notificações desta carteira
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-full gap-1.5 border-dashed text-sm sm:h-7 sm:w-fit sm:shrink-0 sm:self-auto sm:text-[0.8rem]"
                    onClick={() => openNotifications()}
                >
                    Ver histórico
                    <ArrowRightIcon className="size-4 opacity-70 sm:size-3.5" />
                </Button>
            </div>
            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="flex flex-col p-0">
                    {showNoWorkspaceMessage ? (
                        <div className="px-4 py-4">
                            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                                Selecione uma carteira na barra lateral para ajustar notificações
                                desse espaço.
                            </div>
                        </div>
                    ) : null}
                    {error ? (
                        <div className="border-b border-border px-4 py-3">
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                {error}
                            </div>
                        </div>
                    ) : null}
                    {showSkeleton ? (
                        <NotificationPreferencesSkeleton />
                    ) : null}
                    {!loading && currentWorkspaceId ? (
                        <>
                            <PrefSubheaderBar>Canais de entrega</PrefSubheaderBar>
                            <ul
                                className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                                role="list"
                            >
                                <li>
                                    <PrefRow
                                        id="pref-email"
                                        title="Notificações por email"
                                        description="Avisos na sua caixa de email"
                                        checked={!!prefs?.notify_email}
                                        onCheckedChange={(checked) =>
                                            void patch({ notify_email: checked })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                                <li>
                                    <PrefRow
                                        id="pref-inapp"
                                        title="Central do app"
                                        description="Lista de notificações dentro do app"
                                        checked={!!prefs?.notify_in_app}
                                        onCheckedChange={(checked) =>
                                            void patch({ notify_in_app: checked })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                                <li>
                                    <PrefRow
                                        id="pref-push"
                                        title="Push no dispositivo"
                                        description={
                                            pushUnsupported
                                                ? "Não disponível neste navegador"
                                                : pushSupport === "denied"
                                                  ? "Permissão bloqueada — abra Ajustes do sistema e permita notificações"
                                                  : "Alertas na bandeja do celular ou desktop (requer app instalado no iPhone)"
                                        }
                                        checked={!!prefs?.notify_push}
                                        onCheckedChange={(checked) => void handlePushToggle(checked)}
                                        disabled={
                                            disabled || pushUnsupported || pushSupport === "denied"
                                        }
                                    />
                                </li>
                            </ul>
                            {pushMessage ? (
                                <div className="border-t border-border px-4 pb-3">
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
                            <PrefSubheaderBar withTopBorder>
                                Tipos de notificação
                            </PrefSubheaderBar>
                            <ul
                                className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                                role="list"
                            >
                                <li>
                                    <PrefRow
                                        id="pref-tx"
                                        title="Alertas financeiros importantes"
                                        description="Sem spam: alertas realmente relevantes"
                                        checked={!!prefs?.notify_transactions}
                                        onCheckedChange={(checked) =>
                                            void patch({ notify_transactions: checked })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                                <li>
                                    <PrefRow
                                        id="pref-budget"
                                        title="Alertas de orçamento"
                                        description="Ao se aproximar ou atingir limites"
                                        checked={!!prefs?.notify_budget}
                                        onCheckedChange={(checked) =>
                                            void patch({ notify_budget: checked })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                                <li>
                                    <PrefRow
                                        id="pref-cc-spend"
                                        title="Cartões: limite e categorias"
                                        description="Fatura aberta — limite do cartão e alertas por categoria"
                                        checked={prefs?.notify_credit_cards !== false}
                                        onCheckedChange={(checked) =>
                                            void patch({ notify_credit_cards: checked })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                                <li>
                                    <PrefRow
                                        id="pref-cc-cal"
                                        title="Cartões: fatura e vencimento"
                                        description="Lembretes de fechamento e vencimento estimado (agendado)"
                                        checked={
                                            prefs?.notify_credit_card_calendar !== false
                                        }
                                        onCheckedChange={(checked) =>
                                            void patch({
                                                notify_credit_card_calendar: checked,
                                            })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                                <li>
                                    <PrefRow
                                        id="pref-bills"
                                        title="Contas a pagar"
                                        description="Vencimento e lembretes de contas cadastradas"
                                        checked={prefs?.notify_bills !== false}
                                        onCheckedChange={(checked) =>
                                            void patch({ notify_bills: checked })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                                <li>
                                    <PrefRow
                                        id="pref-promo"
                                        title="Promoções e ofertas"
                                        description="Novidades e conteúdo comercial"
                                        checked={!!prefs?.notify_promotions}
                                        onCheckedChange={(checked) =>
                                            void patch({ notify_promotions: checked })
                                        }
                                        disabled={disabled}
                                    />
                                </li>
                            </ul>
                        </>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
