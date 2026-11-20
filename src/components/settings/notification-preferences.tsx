"use client"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { SettingsSection } from "@/components/settings/settings-section"
import { NotificacoesCanais } from "@/components/settings/notificacoes-canais"
import { NotificacoesTemas } from "@/components/settings/notificacoes-temas"
import { useAuth } from "@/components/providers"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"
import { useWorkspace } from "@/components/workspace-provider"
import { getPushSupportState } from "@/lib/push/subscribe"

/** Uma linha de chave esperando: o rótulo e o trilho do `Switch`. */
function ChaveSkeleton() {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Skeleton shape="text" className="w-40 max-w-full text-sm" />
            <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
        </div>
    )
}

/** Os dois cartões da seção, com as 3 chaves dos canais e as 7 dos temas. */
function NotificationPreferencesSkeleton() {
    return (
        <SkeletonGroup className="flex min-w-0 max-w-full flex-col gap-3" label="Carregando as notificações…" delay>
            {[3, 7].map((linhas) => (
                <Card key={linhas} padding="none">
                    {Array.from({ length: linhas }, (_, i) => (
                        <div key={i}>
                            {i > 0 ? <Separator /> : null}
                            <ChaveSkeleton />
                        </div>
                    ))}
                </Card>
            ))}
        </SkeletonGroup>
    )
}

/**
 * Notificações em Configurações: os avisos, "Canais" e "O que receber". As
 * chaves salvam ao tocar, então a seção não tem rodapé; o erro e o
 * carregamento são dela, e as peças só desenham as chaves.
 */
export function NotificationPreferences() {
    const { loading: authLoading } = useAuth()
    const { currentWorkspace, currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const { prefs, loading, error, patch } = useWorkspaceNotificationPrefs()

    const showSkeleton = authLoading || workspaceLoading || (Boolean(currentWorkspaceId) && loading)

    return (
        <SettingsSection
            id="notificacoes"
            className="scroll-mt-(--top-bar-bottom)"
            titulo="Notificações"
            alcance={currentWorkspace ? undefined : "Selecione uma carteira."}
        >
            {showSkeleton ? <NotificationPreferencesSkeleton /> : null}
            {!showSkeleton && currentWorkspaceId ? (
                <>
                    {error ? (
                        <Alert tone="destructive" size="sm">
                            <AlertTitle>{error}</AlertTitle>
                        </Alert>
                    ) : null}
                    {prefs ? (
                        <>
                            {getPushSupportState() === "denied" ? (
                                <Alert tone="warning" size="sm" storageKey="push-bloqueado">
                                    <AlertTitle>Este aparelho bloqueou os avisos.</AlertTitle>
                                </Alert>
                            ) : null}
                            <NotificacoesCanais prefs={prefs} patch={patch} />
                            <NotificacoesTemas prefs={prefs} patch={patch} />
                        </>
                    ) : null}
                </>
            ) : null}
        </SettingsSection>
    )
}
