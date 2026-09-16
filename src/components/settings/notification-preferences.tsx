"use client"

import { useCallback, useState, type ReactNode } from "react"
import {
    Field,
    FieldContent,
    FieldControl,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { ArrowRightIcon } from "@heroicons/react/16/solid"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
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
        <CardToolbar>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {children}
            </p>
        </CardToolbar>
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
        // `Field` horizontal: o rótulo segue ligado ao interruptor, e a descrição
        // passa a ser anunciada com ele por `aria-describedby`. A caixa pintada
        // fica à mão de propósito: é a linha de uma preferência, e o `Field` é
        // quem ela é — `Card` ou `Item` trocariam a semântica do campo pela de
        // uma superfície.
        <Field
            orientation="horizontal"
            className="justify-between gap-5 rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-3.5"
        >
            <FieldContent className="min-w-0 gap-0.5 pr-2">
                <FieldLabel className="text-sm font-medium">{title}</FieldLabel>
                <FieldDescription className="text-xs leading-snug">
                    {description}
                </FieldDescription>
            </FieldContent>
            <FieldControl>
                <Switch
                    id={id}
                    className="mt-0.5 shrink-0"
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    disabled={disabled}
                />
            </FieldControl>
        </Field>
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
        <PageSection>
            <PageSectionHeader
                actions={
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 border-dashed text-xs pointer-coarse:h-10"
                        onClick={() => openNotifications()}
                    >
                        Ver histórico
                        <ArrowRightIcon className="size-3.5 opacity-70" />
                    </Button>
                }
            >
                <PageSectionTitle>Notificações desta carteira</PageSectionTitle>
            </PageSectionHeader>
            <Card padding="none">
                <CardContent className="flex flex-col p-0">
                    {showNoWorkspaceMessage ? (
                        <div className="px-4 py-4">
                            <Alert>
                                <AlertDescription>
                                    Selecione uma carteira na barra lateral para ajustar notificações
                                    desse espaço.
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : null}
                    {error ? (
                        <div className="border-b border-border px-4 py-3">
                            <Alert tone="destructive" size="sm">
                                <AlertTitle>{error}</AlertTitle>
                            </Alert>
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
                                        title="Despesas de outros membros"
                                        description="Quando outro membro adiciona uma despesa na carteira compartilhada"
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
        </PageSection>
    )
}
