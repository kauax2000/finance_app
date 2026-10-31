"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { SyncStatusChip } from "@/components/pwa/sync-status-chip"
import { SettingsRow, SettingsSection } from "@/components/settings/settings-section"
import { useBuscaDoCabecalho, type BuscaDoCabecalho } from "@/hooks/use-busca-do-cabecalho"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import { useLancamentoInteligente } from "@/hooks/use-lancamento-inteligente"

/**
 * O que vale só neste aparelho: tema, busca do cabeçalho (só do `lg` para cima;
 * abaixo, as duas formas são a mesma lupa), lançamento inteligente e o app instalado.
 */
export function ThemeSettings() {
    const [busca, definirBusca] = useBuscaDoCabecalho()
    const [lancamentoInteligente, definirLancamentoInteligente] = useLancamentoInteligente()
    const { isStandalone } = useDisplayMode()
    const isIos = useIsIos()
    const shell = usePwaShellOptional()
    const [installOpen, setInstallOpen] = useState(false)

    const instalarNoIphone = isIos && !isStandalone
    const textoDoApp = isStandalone
        ? "O Finance está instalado e abre em modo app (sem barra do navegador)."
        : isIos
          ? "Instale na tela inicial pelo Safari para usar como app nativo no iPhone."
          : "No navegador do celular, use o menu do site para instalar o app (Adicionar à tela inicial ou Instalar app)."

    return (
        <SettingsSection titulo="Este aparelho" alcance="Vale só neste aparelho.">
            <Card padding="none">
                <SettingsRow titulo="Tema">
                    <ThemeToggle className="shrink-0" />
                </SettingsRow>
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
                <Separator />
                <div className="px-4 py-3">
                    <FormSwitch
                        label="Lançamento inteligente"
                        description="Só no celular."
                        checked={lancamentoInteligente}
                        onCheckedChange={definirLancamentoInteligente}
                    />
                </div>
                <Separator />
                <SettingsRow
                    titulo="App no celular"
                    descricao={
                        <>
                            {textoDoApp}
                            {shell && !shell.isOnline ? (
                                <span className="block">Sem conexão — alterações ficam na fila até sincronizar.</span>
                            ) : null}
                        </>
                    }
                >
                    <div className="flex shrink-0 items-center gap-2">
                        <SyncStatusChip />
                        {instalarNoIphone ? (
                            <Button type="button" variant="secondary" onClick={() => setInstallOpen(true)}>
                                Como instalar
                            </Button>
                        ) : null}
                    </div>
                </SettingsRow>
            </Card>
            <InstallPwaSheet open={installOpen} onOpenChange={setInstallOpen} />
        </SettingsSection>
    )
}
