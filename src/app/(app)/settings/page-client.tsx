"use client"

import * as React from "react"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { WorkspaceAppearanceSettings } from "@/components/settings/workspace-appearance-settings"
import { IaPrivacidadeSettings } from "@/components/settings/ia-privacidade-settings"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { LembreteConferirWireframe } from "@/components/wireframe/a-conferir-lembrete-wireframe"
import { InsightsAvisoWireframe } from "@/components/wireframe/insights-wireframe"
import { DatasDaCarteiraProjetoWireframe } from "@/components/wireframe/projetos-wireframe"
import { ModoEPesosDaCarteiraWireframe } from "@/components/wireframe/divisao-wireframe"

export default function SettingsPage() {
    // O AdiarMontagem monta a página depois do salto do navegador: rola à âncora aqui.
    React.useEffect(() => {
        rolarAteAncora(window.location.hash, document)
    }, [])

    return (
        <div className="min-w-0 space-y-5">
            <ThemeSettings />
            <NotificationPreferences />
            <LembreteConferirWireframe />
            <InsightsAvisoWireframe />
            <WorkspaceAppearanceSettings>
                <DatasDaCarteiraProjetoWireframe />
                <ModoEPesosDaCarteiraWireframe />
            </WorkspaceAppearanceSettings>
            <IaPrivacidadeSettings />
        </div>
    )
}
