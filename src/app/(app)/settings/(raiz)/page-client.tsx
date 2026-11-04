"use client"

import * as React from "react"
import { AtalhoSecao } from "@/components/account/atalho-secao"
import { IasSecao } from "@/components/account/ias-secao"
import { ConviteDeInstalar } from "@/components/settings/convite-de-instalar"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { useAparelhoDeLancar } from "@/hooks/use-aparelho-de-lancar"
import { useIsMobile } from "@/hooks/use-mobile"

export default function SettingsPage() {
    const isMobile = useIsMobile()
    const aparelho = useAparelhoDeLancar()

    // O AdiarMontagem monta a página depois do salto do navegador: rola à âncora aqui.
    React.useEffect(() => {
        rolarAteAncora(window.location.hash, document)
    }, [])

    return (
        <div className="min-w-0 space-y-8">
            {/* No telefone o título é o da casca (`TituloDaTela`). */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitle asChild>
                        {/* O `<h1>` da página é o da barra do topo. */}
                        <p aria-hidden="true">Configurações</p>
                    </PageHeaderTitle>
                </PageHeader>
            )}
            <div className="min-w-0 space-y-5">
                <ThemeSettings />
                {aparelho === "iphone-instalado" ? <AtalhoSecao /> : null}
                {aparelho === "navegador-iphone" ? <ConviteDeInstalar iphone /> : null}
                {aparelho === "navegador-android" ? <ConviteDeInstalar iphone={false} /> : null}
                <IasSecao />
                <NotificationPreferences />
            </div>
        </div>
    )
}
