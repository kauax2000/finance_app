"use client"

import * as React from "react"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { WorkspaceAppearanceSettings } from "@/components/settings/workspace-appearance-settings"
import { IaPrivacidadeSettings } from "@/components/settings/ia-privacidade-settings"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { ThemeSettings } from "@/components/settings/theme-settings"

export default function SettingsPage() {
    // O AdiarMontagem monta a página depois do salto do navegador: rola à âncora aqui.
    React.useEffect(() => {
        rolarAteAncora(window.location.hash, document)
    }, [])

    return (
        <div className="min-w-0 space-y-8">
            <PageHeader>
                <PageHeaderTitle asChild>
                    {/* O `<h1>` da página é o da barra do topo. */}
                    <p aria-hidden="true">Configurações</p>
                </PageHeaderTitle>
            </PageHeader>
            <div className="min-w-0 space-y-5">
                <WorkspaceAppearanceSettings />
                <ThemeSettings />
                <NotificationPreferences />
                <IaPrivacidadeSettings />
            </div>
        </div>
    )
}
