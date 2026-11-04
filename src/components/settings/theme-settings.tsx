"use client"

import { useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { SyncStatusChip } from "@/components/pwa/sync-status-chip"
import { SEM_CONEXAO, SeletorDeTema, useInstalarApp } from "@/components/settings/neste-celular-grupo"
import { NoCelularCartao } from "@/components/settings/no-celular-cartao"
import { SettingsRow, SettingsSection } from "@/components/settings/settings-section"
import { ROUTES } from "@/config/navigation"
import { useBuscaDoCabecalho, type BuscaDoCabecalho } from "@/hooks/use-busca-do-cabecalho"
import { useAparelhoDeLancar } from "@/hooks/use-aparelho-de-lancar"
import { useIsMobile } from "@/hooks/use-mobile"

const semAssinatura = () => () => {}

/**
 * O que vale só neste aparelho, do `md` para cima: tema, busca do cabeçalho (só do
 * `lg` para cima; abaixo, as duas formas são a mesma lupa) e o QR que leva ao
 * telefone. No telefone não há nada aqui: tudo isso mora em Você (`NesteCelularGrupo`).
 */
export function ThemeSettings() {
    const [busca, definirBusca] = useBuscaDoCabecalho()
    const isMobile = useIsMobile()
    const noComputador = useAparelhoDeLancar() === "computador"
    const { instalarNoIphone, descricaoDoApp } = useInstalarApp()
    const shell = usePwaShellOptional()
    const [installOpen, setInstallOpen] = useState(false)
    const origem = useSyncExternalStore(semAssinatura, () => window.location.origin, () => "")
    const noTelefone = origem ? `${origem}${ROUTES.ME}#no-celular` : ""

    const linhaDoApp = (
        <SettingsRow titulo="Instalar o app" descricao={descricaoDoApp}>
            <div className="flex shrink-0 items-center gap-2">
                <SyncStatusChip />
                {instalarNoIphone ? (
                    <Button type="button" variant="secondary" onClick={() => setInstallOpen(true)}>
                        Como instalar
                    </Button>
                ) : null}
            </div>
        </SettingsRow>
    )

    if (isMobile) return null

    return (
        <>
            <SettingsSection titulo="Aparência">
                <Card padding="none">
                    <SettingsRow titulo="Tema"><SeletorDeTema labels /></SettingsRow>
                    <div className="max-lg:hidden">
                        <Separator />
                        <SettingsRow
                            titulo="Busca no cabeçalho"
                            descricao="A barra no centro ou um botão ao lado das notificações."
                        >
                            <Tabs
                                value={busca}
                                onValueChange={(proxima) => definirBusca(proxima as BuscaDoCabecalho)}
                                className="shrink-0"
                            >
                                <TabsList aria-label="Busca no cabeçalho">
                                    <TabsTrigger value="barra">Barra</TabsTrigger>
                                    <TabsTrigger value="botao">Botão</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </SettingsRow>
                    </div>
                </Card>
            </SettingsSection>
            {noComputador ? (
            <SettingsSection titulo="No celular" alcance="Instale no celular: é lá que você lança.">
                <NoCelularCartao value={noTelefone} />
                {instalarNoIphone ? (
                    <Card padding="none">
                        {linhaDoApp}
                    </Card>
                ) : shell && shell.pendingSyncCount > 0 ? (
                    <Card padding="none">
                        <SettingsRow
                            titulo="Sincronização"
                            descricao={!shell.isOnline ? SEM_CONEXAO : undefined}
                        >
                            <SyncStatusChip />
                        </SettingsRow>
                    </Card>
                ) : null}
            </SettingsSection>
            ) : null}
            <InstallPwaSheet open={installOpen} onOpenChange={setInstallOpen} />
        </>
    )
}
