"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Separator } from "@/components/ui/separator"
import { Caption } from "@/components/ui/typography"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import type { WorkspaceNotificationPrefsState } from "@/hooks/use-workspace-notification-prefs"
import type { WorkspaceMemberNotificationPrefs } from "@/lib/workspace-notification-prefs"
import {
    getPushSupportState,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
} from "@/lib/push/subscribe"

/**
 * Onde as notificações chegam, a primeira peça da seção. As chaves salvam ao
 * tocar, então não há rodapé; a seção cuida do erro e do carregamento.
 */
export function NotificacoesCanais({
    prefs,
    patch,
}: {
    prefs: WorkspaceMemberNotificationPrefs
    patch: WorkspaceNotificationPrefsState["patch"]
}) {
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
            } catch (e) {
                setPushMessage(e instanceof Error ? e.message : "Não foi possível alterar o push.")
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
        <>
            <PageSection size="sm">
                <PageSectionHeader>
                    <PageSectionTitle>Canais</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    <div className="px-4 py-3">
                        <FormSwitch
                            id="pref-push"
                            label="Push neste aparelho"
                            description={descricaoDoPush}
                            checked={!!prefs.notify_push}
                            onCheckedChange={(checked) => void handlePushToggle(checked)}
                            disabled={pushBusy || pushUnsupported || pushSupport === "denied"}
                        />
                        {pushMessage || precisaInstalar ? (
                            <div className="mt-2">
                                {pushMessage ? <Caption role="status">{pushMessage}</Caption> : null}
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
                        />
                    </div>
                </Card>
            </PageSection>
            <InstallPwaSheet open={installPwaOpen} onOpenChange={setInstallPwaOpen} />
        </>
    )
}
