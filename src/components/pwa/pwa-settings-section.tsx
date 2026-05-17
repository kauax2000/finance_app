"use client"

import { useState } from "react"
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Muted, P } from "@/components/ui/typography"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { SyncStatusChip } from "@/components/pwa/sync-status-chip"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"

export function PwaSettingsSection() {
    const { isStandalone } = useDisplayMode()
    const isIos = useIsIos()
    const shell = usePwaShellOptional()
    const [installOpen, setInstallOpen] = useState(false)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <DevicePhoneMobileIcon className="size-5" aria-hidden />
                    App no celular
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isStandalone ? (
                    <P className="text-sm">
                        O Finance está instalado e abre em modo app (sem barra do navegador).
                    </P>
                ) : isIos ? (
                    <>
                        <P className="text-sm">
                            Instale na tela inicial pelo Safari para usar como app nativo no iPhone.
                        </P>
                        <Button type="button" onClick={() => setInstallOpen(true)}>
                            Como instalar no iPhone
                        </Button>
                    </>
                ) : (
                    <Muted className="text-sm">
                        No navegador do celular, use o menu do site para instalar o app (Adicionar à
                        tela inicial ou Instalar app).
                    </Muted>
                )}

                <SyncStatusChip />

                {shell && !shell.isOnline ? (
                    <Muted className="text-sm">Sem conexão — alterações ficam na fila até sincronizar.</Muted>
                ) : null}
            </CardContent>

            <InstallPwaSheet open={installOpen} onOpenChange={setInstallOpen} />
        </Card>
    )
}
