"use client"

import { useCallback, useState } from "react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormSwitch } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import {
    getPushSupportState,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
} from "@/lib/push/subscribe"
import type {
    WorkspaceMemberNotificationPrefs,
    WorkspaceNotificationPrefsPatch,
} from "@/lib/workspace-notification-prefs"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    prefs: WorkspaceMemberNotificationPrefs
    patch: (p: WorkspaceNotificationPrefsPatch) => Promise<void>
    disabled: boolean
    error: string | null
}

/** Onde as notificações chegam. As chaves salvam ao tocar, então o diálogo não tem rodapé. */
export function NotificacoesCanaisDialog({ open, onOpenChange, prefs, patch, disabled, error }: Props) {
    const { isStandalone } = useDisplayMode()
    const isIos = useIsIos()
    const [installPwaOpen, setInstallPwaOpen] = useState(false)
    const [pushBusy, setPushBusy] = useState(false)
    const [pushMessage, setPushMessage] = useState<string | null>(null)

    const pushSupport = getPushSupportState()
    const pushUnsupported = !isPushSupported()
    const precisaInstalar = isIos && !isStandalone

    const handlePushToggle = useCallback(
        async (checked: boolean) => {
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
        [pushUnsupported, isIos, isStandalone, patch]
    )

    // No iPhone sem o app instalado o navegador não oferece push: o motivo vale mais que "indisponível".
    const descricaoDoPush = precisaInstalar
        ? "No iPhone, o push pede o app instalado."
        : pushUnsupported
          ? "Não disponível neste navegador"
          : pushSupport === "denied"
            ? isIos
                ? "Abra Ajustes › Notificações › Finance e permita os avisos."
                : "Abra as configurações do site no navegador e permita as notificações."
            : "Desligar remove este aparelho de todas as carteiras."

    return (
        <Dialog surface="auto" pending={pushBusy} open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Onde chega</DialogTitle>
                </DialogHeader>
                <DialogBody className="flex flex-col gap-4">
                    {error ? (
                        <Alert tone="destructive" size="sm">
                            <AlertTitle>{error}</AlertTitle>
                        </Alert>
                    ) : null}
                    <Card padding="none">
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-push"
                                label="Push neste aparelho"
                                description={descricaoDoPush}
                                checked={!!prefs.notify_push}
                                onCheckedChange={(checked) => void handlePushToggle(checked)}
                                disabled={disabled || pushBusy || pushUnsupported || pushSupport === "denied"}
                            />
                            {pushMessage || precisaInstalar ? (
                                <div className="mt-2">
                                    {pushMessage ? (
                                        <p className="text-xs text-muted-foreground">{pushMessage}</p>
                                    ) : null}
                                    {precisaInstalar ? (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto px-0 text-xs"
                                            onClick={() => setInstallPwaOpen(true)}
                                        >
                                            Como instalar
                                        </Button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-email"
                                label="Email"
                                checked={!!prefs.notify_email}
                                onCheckedChange={(checked) => void patch({ notify_email: checked })}
                                disabled={disabled}
                            />
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            <FormSwitch
                                id="pref-inapp"
                                label="No app"
                                description="No sino do Finance."
                                checked={!!prefs.notify_in_app}
                                onCheckedChange={(checked) => void patch({ notify_in_app: checked })}
                                disabled={disabled}
                            />
                        </div>
                    </Card>
                </DialogBody>
            </DialogContent>
            <InstallPwaSheet open={installPwaOpen} onOpenChange={setInstallPwaOpen} />
        </Dialog>
    )
}
