"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ROUTES } from "@/config/navigation"
import { useTelaLarga } from "@/hooks/use-tela-larga"
import { SECOES, secaoDaUrl } from "@/components/settings/secoes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { WorkspaceAppearanceSettings } from "@/components/settings/workspace-appearance-settings"
import { PwaSettingsSection } from "@/components/pwa/pwa-settings-section"
import { LancamentoSettings } from "@/components/settings/lancamento-settings"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { LembreteConferirWireframe } from "@/components/wireframe/a-conferir-lembrete-wireframe"
import { InsightsAvisoWireframe } from "@/components/wireframe/insights-wireframe"
import { IaConfiguracoesWireframe } from "@/components/wireframe/ia-configuracoes-wireframe"
import { DatasDaCarteiraProjetoWireframe } from "@/components/wireframe/projetos-wireframe"
import { ModoEPesosDaCarteiraWireframe } from "@/components/wireframe/divisao-wireframe"

const PAINEL = "min-w-0 flex-1 space-y-5"

export default function SettingsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const larga = useTelaLarga()

    return (
        <Tabs
            orientation={larga ? "vertical" : "horizontal"}
            value={secaoDaUrl(searchParams.get("secao"))}
            onValueChange={(id) => router.replace(`${ROUTES.SETTINGS}?secao=${id}`, { scroll: false })}
            className="min-w-0 max-w-full"
        >
            <TabsList
                aria-label="Seções de Configurações"
                scrollable={!larga}
                className={larga ? "w-52 shrink-0" : undefined}
            >
                {SECOES.map((s) => (
                    <TabsTrigger key={s.id} value={s.id}>
                        {s.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            <TabsContent value="carteira" className={PAINEL}>
                <WorkspaceAppearanceSettings>
                    <DatasDaCarteiraProjetoWireframe />
                    <ModoEPesosDaCarteiraWireframe />
                </WorkspaceAppearanceSettings>
            </TabsContent>
            <TabsContent value="notificacoes" className={PAINEL}>
                <NotificationPreferences />
                <LembreteConferirWireframe />
                <InsightsAvisoWireframe />
            </TabsContent>
            <TabsContent value="aparelho" className={PAINEL}>
                <ThemeSettings />
                <LancamentoSettings />
                <PwaSettingsSection />
            </TabsContent>
            <TabsContent value="ia" className={PAINEL}>
                <IaConfiguracoesWireframe />
            </TabsContent>
        </Tabs>
    )
}
