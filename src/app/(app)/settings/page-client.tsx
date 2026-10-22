"use client"

import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { WorkspaceAppearanceSettings } from "@/components/settings/workspace-appearance-settings"
import { PwaSettingsSection } from "@/components/pwa/pwa-settings-section"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { LembreteConferirWireframe } from "@/components/wireframe/a-conferir-lembrete-wireframe"
import { IaConfiguracoesWireframe } from "@/components/wireframe/ia-configuracoes-wireframe"

export default function SettingsPage() {
    return (
        <div className="min-w-0 max-w-full space-y-5">
            <WorkspaceAppearanceSettings />
            <ThemeSettings />
            <PwaSettingsSection />
            <NotificationPreferences />
            <LembreteConferirWireframe />
            <IaConfiguracoesWireframe />
        </div>
    )
}
