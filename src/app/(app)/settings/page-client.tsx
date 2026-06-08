"use client"

import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { WorkspaceAppearanceSettings } from "@/components/settings/workspace-appearance-settings"
import { PwaSettingsSection } from "@/components/pwa/pwa-settings-section"

export default function SettingsPage() {
    return (
        <div className="min-w-0 max-w-full space-y-5">
            <WorkspaceAppearanceSettings />
            <PwaSettingsSection />
            <NotificationPreferences />
        </div>
    )
}
